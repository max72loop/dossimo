import type { Famille } from "@/lib/dossier/cee-isolation";
import type { Comparaison } from "@/lib/piece/compare";
import type { ExtractedPiece } from "@/lib/piece/extract";
import type { MentionVerifiee } from "@/lib/piece/mentions";
import type { TypePiece } from "@/lib/database.types";
import type { Finding, RapportControle } from "@/lib/rules/types";

/**
 * Contrôle anti-refus des PIÈCES RÉELLES (devis, facture) — règles dures.
 *
 * `controlerDossier` ne juge que la SAISIE. Ce module juge les documents que
 * l'artisan déposera vraiment, et produit des `Finding` de même nature : ils
 * rejoignent le rapport, donc le rapport.pdf, le verdict et la complétude, sans
 * qu'aucune vue n'ait à connaître les pièces.
 *
 * Trois familles de refus sont couvertes :
 *  1. la pièce contredit la saisie (surface, montants, dates…) ;
 *  2. la pièce ne porte pas une mention exigée par la fiche ;
 *  3. le devis et la facture se contredisent entre eux.
 *
 * Pur et synchrone : l'IA a constaté en amont, ici on ne fait que juger.
 */

/** En dessous de ce seuil, on impute le silence du document à une lecture douteuse. */
const CONFIANCE_MIN = 0.6;

/**
 * Champs dont l'écart avec la saisie vaut refus : identité, montants, dates, et les
 * critères techniques qui conditionnent l'éligibilité du geste (R, ETAS, COP,
 * rendement). Les autres (marque, référence, émissions) sont comparés par
 * rapprochement de texte ou portent une donnée facultative : un écart y signale un
 * doute à lever, pas une contradiction établie.
 *
 * Les libellés sont ceux produits par `comparerPiece` — les deux listes se lisent
 * ensemble.
 */
const CHAMPS_CRITIQUES = new Set([
  // Communs
  "Bénéficiaire",
  "Code postal",
  "Montant HT",
  "Montant TTC",
  "Date devis",
  "Date facture",
  "N° RGE",
  // Isolation
  "Surface isolée",
  "Résistance R",
  // Pompe à chaleur air/eau
  "ETAS",
  "Puissance",
  // Chauffe-eau thermodynamique
  "COP",
  "Volume du ballon",
  // Appareil de chauffage au bois
  "Rendement",
]);

const NOM: Record<TypePiece, string> = {
  devis: "le devis",
  facture: "la facture",
  autre: "la pièce",
};

const TITRE: Record<TypePiece, string> = {
  devis: "Devis",
  facture: "Facture",
  autre: "Pièce",
};

/** Vue d'une pièce réelle, suffisante pour la juger. Découplée de la base. */
export interface PieceControlee {
  type: TypePiece;
  /** L'extraction automatique a abouti. */
  lue: boolean;
  comparaisons: Comparaison[];
  /** null = mentions non vérifiées (pièce antérieure au contrôle, ou lecture en échec). */
  mentions: MentionVerifiee[] | null;
  /** Valeurs brutes lues sur la pièce, pour la confrontation devis ↔ facture. */
  extraction: ExtractedPiece | null;
}

/* ------------------------------------------------------------------ Mentions */

function findingsMentions(p: PieceControlee): Finding[] {
  if (!p.mentions || p.mentions.length === 0) return [];
  const out: Finding[] = [];
  const nom = NOM[p.type];

  const absentesSures = p.mentions.filter(
    (m) => m.statut === "absente" && m.confiance >= CONFIANCE_MIN,
  );
  const absentesDouteuses = p.mentions.filter(
    (m) => m.statut === "absente" && m.confiance < CONFIANCE_MIN,
  );
  const divergentes = p.mentions.filter((m) => m.statut === "divergente");
  const presentes = p.mentions.filter((m) => m.statut === "presente");

  // Mention exigée absente d'un document lisible : le refus est acquis, pas probable.
  for (const m of absentesSures) {
    out.push({
      code: "piece_mention_absente",
      categorie: "pieces",
      severite: "bloquant",
      titre: `Mention obligatoire absente ${
        p.type === "facture" ? "de la facture" : "du devis"
      }`,
      detail: `${nom.charAt(0).toUpperCase()}${nom.slice(1)} ne porte pas la mention « ${m.mention} », exigée par la fiche. Son absence est un motif de refus, même si le reste du dossier est juste.`,
    });
  }

  // Le document porte la mention, mais pas la même valeur que le dossier déposé.
  for (const m of divergentes) {
    out.push({
      code: "piece_mention_divergente",
      categorie: "pieces",
      severite: "bloquant",
      titre: "Mention obligatoire divergente",
      detail: `Sur ${nom}, la mention « ${m.mention} » est contredite par le document${
        m.verbatim ? ` (« ${m.verbatim} »)` : ""
      }. Faites concorder le document et le dossier avant le dépôt.`,
    });
  }

  // Lecture douteuse : on ne conclut pas au refus, on demande un document lisible.
  if (absentesDouteuses.length > 0) {
    out.push({
      code: "piece_mention_illisible",
      categorie: "pieces",
      severite: "avertissement",
      titre: `${absentesDouteuses.length} mention${absentesDouteuses.length > 1 ? "s" : ""} non vérifiable${absentesDouteuses.length > 1 ? "s" : ""}`,
      detail: `Sur ${nom}, ${absentesDouteuses.length} mention${absentesDouteuses.length > 1 ? "s n'ont" : " n'a"} pas pu être ${absentesDouteuses.length > 1 ? "lues" : "lue"} de façon fiable (document peu lisible) : ${absentesDouteuses
        .map((m) => `« ${m.mention} »`)
        .join(", ")}. Vérifiez-${absentesDouteuses.length > 1 ? "les" : "la"} à l'œil, ou déposez un scan plus net.`,
    });
  }

  if (presentes.length > 0 && absentesSures.length === 0 && divergentes.length === 0) {
    out.push({
      code: "piece_mentions",
      categorie: "pieces",
      severite: "ok",
      titre: `Mentions obligatoires présentes sur ${nom}`,
      detail: `Les ${presentes.length} mentions exigées par la fiche ont été relevées sur ${nom}.`,
    });
  }

  return out;
}

/* -------------------------------------------------------------------- Écarts */

function findingsEcarts(p: PieceControlee): Finding[] {
  if (!p.lue) {
    return [
      {
        code: "piece_illisible",
        categorie: "pieces",
        severite: "avertissement",
        titre: `Lecture automatique ${p.type === "facture" ? "de la facture" : "du devis"} impossible`,
        detail: `La cohérence entre ${NOM[p.type]} et votre saisie n'a pas pu être vérifiée. Déposez un scan plus lisible pour que le contrôle s'applique.`,
      },
    ];
  }

  const ecarts = p.comparaisons.filter((c) => c.statut === "ecart");
  if (ecarts.length === 0) {
    if (p.comparaisons.length === 0) return [];
    return [
      {
        code: "piece_coherence",
        categorie: "pieces",
        severite: "ok",
        titre: `${TITRE[p.type]} cohérent${p.type === "facture" ? "e" : ""} avec la saisie`,
        detail: `Aucun écart relevé entre ${NOM[p.type]} et les données du dossier.`,
      },
    ];
  }

  return ecarts.map((e) => ({
    code: "piece_ecart",
    categorie: "pieces",
    severite: CHAMPS_CRITIQUES.has(e.champ)
      ? ("bloquant" as const)
      : ("avertissement" as const),
    titre: `${e.champ} : ${NOM[p.type]} contredit la saisie`,
    detail: `Dossier : ${e.saisie}. ${TITRE[p.type]} : ${e.piece}. Une incohérence entre la pièce déposée et le dossier est l'un des premiers motifs de refus.`,
  }));
}

/* --------------------------------------------------------- Devis ↔ facture */

interface ChampCroise {
  cle: keyof ExtractedPiece;
  label: string;
  tolerance?: number;
}

/** Repris à l'identique quel que soit le geste. */
const CROISES_COMMUNS: ChampCroise[] = [
  { cle: "montant_ht", label: "Montant HT", tolerance: 1 },
  { cle: "montant_ttc", label: "Montant TTC", tolerance: 1 },
];

/** Caractéristiques techniques à reprendre à l'identique, par famille de geste. */
const CROISES: Record<Famille, ChampCroise[]> = {
  isolation: [
    { cle: "surface_isolee_m2", label: "Surface isolée", tolerance: 0.5 },
    { cle: "resistance_thermique_r", label: "Résistance R", tolerance: 0.05 },
    { cle: "isolant_marque", label: "Marque de l'isolant" },
    { cle: "isolant_reference", label: "Référence de l'isolant" },
  ],
  pac_air_eau: [
    { cle: "pac_etas", label: "ETAS", tolerance: 0.5 },
    { cle: "pac_puissance_kw", label: "Puissance", tolerance: 0.1 },
    { cle: "pac_marque", label: "Marque de la pompe à chaleur" },
    { cle: "pac_reference", label: "Référence de la pompe à chaleur" },
  ],
  cet: [
    { cle: "cet_cop", label: "COP", tolerance: 0.05 },
    { cle: "cet_volume_l", label: "Volume du ballon", tolerance: 1 },
    { cle: "cet_marque", label: "Marque du chauffe-eau" },
    { cle: "cet_reference", label: "Référence du chauffe-eau" },
  ],
  bois: [
    { cle: "bois_rendement", label: "Rendement", tolerance: 0.5 },
    { cle: "bois_emissions_co", label: "Émissions de CO", tolerance: 1 },
    { cle: "bois_marque", label: "Marque de l'appareil" },
    { cle: "bois_reference", label: "Référence de l'appareil" },
  ],
};

const normTexte = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "");

/**
 * Confronte le devis et la facture entre eux. C'est le motif de refus n° 1 : la
 * facture ne reprend pas à l'identique ce que le devis annonçait. Les deux pièces
 * sont déjà comparées à la saisie, mais deux documents peuvent diverger l'un de
 * l'autre sur un champ que la saisie ne porte pas.
 */
function findingsCroises(pieces: PieceControlee[], famille: Famille): Finding[] {
  const devis = pieces.find((p) => p.type === "devis" && p.extraction);
  const facture = pieces.find((p) => p.type === "facture" && p.extraction);
  if (!devis?.extraction || !facture?.extraction) return [];

  const d = devis.extraction;
  const f = facture.extraction;
  const divergents: string[] = [];

  for (const { cle, label, tolerance } of [
    ...CROISES_COMMUNS,
    ...CROISES[famille],
  ]) {
    const vd = d[cle];
    const vf = f[cle];
    if (vd == null || vf == null) continue; // non lu d'un côté : rien à conclure.

    const identique =
      typeof vd === "number" && typeof vf === "number"
        ? Math.abs(vd - vf) <= (tolerance ?? 0)
        : normTexte(String(vd)) === normTexte(String(vf));

    if (!identique) divergents.push(`${label} (devis : ${vd} · facture : ${vf})`);
  }

  if (divergents.length === 0) {
    return [
      {
        code: "piece_devis_facture",
        categorie: "pieces",
        severite: "ok",
        titre: "Devis et facture concordent",
        detail:
          "Les caractéristiques techniques et les montants sont repris à l'identique de l'un à l'autre.",
      },
    ];
  }

  return [
    {
      code: "piece_devis_facture",
      categorie: "pieces",
      severite: "bloquant",
      titre: "La facture ne reprend pas le devis",
      detail: `Divergences entre le devis et la facture : ${divergents.join(" ; ")}. La facture doit reprendre le devis à l'identique — c'est le premier motif de refus contrôlé à l'instruction.`,
    },
  ];
}

/* ------------------------------------------------------------------ Assemblage */

/**
 * Findings issus des pièces réelles. Vide si aucune pièce n'a été déposée.
 * `famille` détermine les caractéristiques techniques confrontées entre le devis et
 * la facture : celles du geste du dossier, jamais celles d'un autre.
 */
export function controlerPieces(
  pieces: readonly PieceControlee[],
  famille: Famille,
): Finding[] {
  const liste = pieces.filter((p) => p.type !== "autre");
  return [
    ...liste.flatMap(findingsEcarts),
    ...liste.flatMap(findingsMentions),
    ...findingsCroises([...liste], famille),
  ];
}

/**
 * Fusionne les findings des pièces dans le rapport de la saisie et recalcule les
 * compteurs. Point d'entrée unique : la page et le rapport.pdf appellent celui-ci,
 * jamais `controlerDossier` seul — sans quoi le document livré à l'artisan ignorerait
 * les pièces qu'il s'apprête à déposer.
 */
export function fusionnerRapport(
  base: RapportControle,
  findingsPieces: readonly Finding[],
): RapportControle {
  const findings = [...base.findings, ...findingsPieces];
  const nbBloquants = findings.filter((f) => f.severite === "bloquant").length;
  return {
    findings,
    nbBloquants,
    nbAvertissements: findings.filter((f) => f.severite === "avertissement").length,
    nbConformes: findings.filter((f) => f.severite === "ok").length,
    conforme: nbBloquants === 0,
  };
}
