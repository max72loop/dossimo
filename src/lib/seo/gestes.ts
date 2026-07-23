import type { Dispositif, RegleMetier } from "@/lib/database.types";
import { formatEuros } from "@/lib/format/montant";
import type { CategorieRevenus } from "@/lib/rules/plafonds";
import type { SeoGuide } from "@/lib/seo/guides";

/**
 * Pages SEO « par geste », dérivées de `regles_metier`.
 *
 * Pourquoi cette couche existe : les guides éditoriaux (`guides.ts`) expliquent
 * la méthode, mais l'artisan cherche d'abord son geste (« conditions
 * BAR-TH-171 », « pièces PAC air/eau »). Ces pages répondent à cette intention
 * en n'affichant QUE ce que la table dit déjà : conditions, pièces exigées,
 * mentions obligatoires, version de fiche en vigueur, barème par profil.
 *
 * Règle absolue (AGENTS.md, CLAUDE.md §8) : aucune valeur réglementaire n'est
 * écrite ici. La configuration ci-dessous ne porte que de l'éditorial non
 * réglementaire (titres, accroches, prose). Les montants, seuils, pièces,
 * mentions et versions viennent tous de `regles_metier`. Le jour où la fiche
 * change, la page change avec elle, sans toucher au code : c'est exactement ce
 * qui évite que Dossimo publie un contenu périmé et fabrique lui-même le motif
 * de refus qu'il prétend prévenir.
 */

/** Éditorial non réglementaire d'un geste. Jamais de chiffre ni de condition ici. */
export interface GesteConfig {
  slug: string;
  /** Clé de jointure avec `regles_metier.type_travaux`. */
  typeTravaux: string;
  eyebrow: string;
  metaTitle: string;
  title: string;
  description: string;
  intro: string;
  /** Nom du geste tel qu'on l'écrit dans une phrase (« une pompe à chaleur air/eau »). */
  gesteAvecArticle: string;
  /** Liens de citation vers les textes officiels. Pointeurs, pas des valeurs. */
  sources: SeoGuide["sources"];
}

/**
 * Gestes dont la configuration éditoriale est prête. Être dans ce catalogue ne
 * suffit pas à être publié : c'est `GESTES`, plus bas, qui pilote la mise en
 * ligne.
 */
export const GESTES_CATALOGUE: GesteConfig[] = [
  {
    slug: "pompe-a-chaleur-air-eau",
    typeTravaux: "pac_air_eau",
    eyebrow: "Guide artisan RGE · Par geste",
    metaTitle: "PAC air/eau : conditions, pièces et montants CEE et MaPrimeRénov'",
    title: "Pompe à chaleur air/eau : le dossier qui passe",
    description:
      "Conditions d'éligibilité, pièces exigées, mentions obligatoires du devis et barème par profil de revenus pour une pompe à chaleur air/eau, en CEE comme en MaPrimeRénov'.",
    intro:
      "La pompe à chaleur air/eau concentre le plus gros des refus hors isolation : une note de dimensionnement absente, un ETAS non repris sur le devis ou une fiche citée dans une version périmée suffisent à bloquer le dossier. Cette page liste ce que le contrôle attend réellement, geste par geste, dans la version en vigueur aujourd'hui.",
    gesteAvecArticle: "une pompe à chaleur air/eau",
    sources: [
      {
        label: "Fiche CEE BAR-TH-171 (ministère de la Transition écologique)",
        href: "https://www.ecologie.gouv.fr/sites/default/files/documents/BAR-TH-171%20vA78.4%20%C3%A0%20compter%20du%2001-01-2026_1.pdf",
      },
      {
        label: "Mode d'emploi MaPrimeRénov' 2026 — Anah",
        href: "https://www.anah.gouv.fr/",
      },
    ],
  },
];

/**
 * Gestes RÉELLEMENT publiés : route `[slug]`, sitemap et hub `/guides` ne
 * connaissent que cette liste.
 *
 * Volontairement VIDE aujourd'hui. Ce qui bloque n'est pas le code mais la
 * donnée : les libellés de `regles_metier` sont dépourvus d'accents sur tous
 * les gestes (« Efficacite energetique saisonniere », « modele », « a compter
 * du » — migrations 0004, 0005, 0009, 0010, 0011, 0042). C'est sans
 * conséquence en interne, mais impubliable sur une page indexée.
 *
 * Ce garde-fou existe parce que l'absence de base masquait le problème en
 * local (aucune page geste rendue) alors qu'un déploiement, lui, a bien accès
 * à Supabase et publierait le texte tel quel.
 *
 * Pour publier une fois les accents corrigés en base : remplacer par
 * `GESTES_CATALOGUE`. Rien d'autre à toucher.
 */
export const GESTES: GesteConfig[] = [];

/** Forme utile d'une ligne `regles_metier`, une fois le JSONB lu. */
interface PieceRequise {
  id: string;
  label: string;
  description?: string;
  obligatoire?: boolean;
}

interface ConditionJson {
  tva_taux?: number;
  anciennete_min_ans?: number;
  prime?: {
    forfait?: Partial<Record<CategorieRevenus, number>>;
    par_m2?: Partial<Record<CategorieRevenus, number>>;
    plafond?: number;
  };
}

/** Ligne de règle réduite aux colonnes dont la page a besoin. */
export type RegleSeo = Pick<
  RegleMetier,
  | "dispositif"
  | "type_travaux"
  | "condition_json"
  | "pieces_requises_json"
  | "points_vigilance_json"
  | "version_formulaire"
  | "created_at"
>;

/**
 * Les quatre profils de l'Anah, dans l'ordre des barèmes. Les libellés couleur
 * sont ceux employés côté métier (`src/lib/rules/plafonds.ts`) : l'artisan les
 * reconnaît, ils ne sont pas inventés pour la vitrine.
 */
const PROFILS: Array<{ cle: CategorieRevenus; label: string }> = [
  { cle: "grande_precarite", label: "très modestes (bleu)" },
  { cle: "precaire", label: "modestes (jaune)" },
  { cle: "intermediaire", label: "intermédiaires (violet)" },
  { cle: "superieur", label: "supérieurs (rose)" },
];

const NOM_DISPOSITIF: Record<Dispositif, string> = {
  cee: "CEE",
  maprimerenov: "MaPrimeRénov'",
};

function lireCondition(regle: RegleSeo): ConditionJson {
  return (regle.condition_json ?? {}) as ConditionJson;
}

function lirePieces(regle: RegleSeo): PieceRequise[] {
  const brut = regle.pieces_requises_json;
  return Array.isArray(brut) ? (brut as unknown as PieceRequise[]) : [];
}

function lireMentions(regle: RegleSeo): string[] {
  const brut = regle.points_vigilance_json;
  return Array.isArray(brut) ? (brut as unknown as string[]).filter((m) => typeof m === "string") : [];
}

/** « 4 500 € pour les ménages très modestes (bleu), … » à partir d'un forfait. */
function phraseBareme(forfait: Partial<Record<CategorieRevenus, number>>): string {
  const parts = PROFILS.filter(({ cle }) => forfait[cle] != null).map(
    ({ cle, label }) => `${formatEuros(forfait[cle])} pour les ménages ${label}`,
  );
  return parts.join(", ");
}

/**
 * Projette les règles actives d'un geste (une ligne par dispositif) vers la
 * forme `SeoGuide`, celle que `SeoGuidePage` sait déjà rendre. Fonction pure :
 * elle ne lit ni la base ni l'environnement, ce qui la rend testable telle
 * quelle. Renvoie `null` si aucune règle n'est fournie, pour qu'un geste non
 * seedé ne produise jamais une page vide.
 */
export function regleToGeste(config: GesteConfig, regles: RegleSeo[]): SeoGuide | null {
  if (regles.length === 0) return null;

  const cee = regles.find((r) => r.dispositif === "cee");
  const mpr = regles.find((r) => r.dispositif === "maprimerenov");
  const reference = cee ?? regles[0];

  // --- Pièces : union des deux dispositifs, dédoublonnée par identifiant. Une
  // pièce exigée par un seul dispositif reste due dès qu'on vise ce dispositif.
  const piecesParId = new Map<string, PieceRequise>();
  for (const regle of regles) {
    for (const piece of lirePieces(regle)) {
      if (piece.obligatoire === false) continue;
      if (!piecesParId.has(piece.id)) piecesParId.set(piece.id, piece);
    }
  }
  const checklist = [...piecesParId.values()].map((piece) => ({
    title: piece.label,
    text: piece.description ?? "Pièce exigée au dossier pour ce geste.",
  }));

  // --- Mentions obligatoires du devis, telles que portées par la règle.
  const mentions = [...new Set(regles.flatMap(lireMentions))];

  // --- Erreurs : chaque mention manquante est un motif de refus, plus les
  // conditions chiffrées que le contrôle vérifie en premier.
  // Les mentions sont reprises VERBATIM : les passer en minuscules casserait les
  // sigles réglementaires (ETAS, RGE, la classe « IV à VIII »), qui sont
  // précisément ce que l'artisan cherche et ce que le contrôle oppose.
  const errors: string[] = mentions.map(
    (mention) => `Mention absente du devis : ${mention}.`,
  );
  const conditionRef = lireCondition(reference);
  if (conditionRef.anciennete_min_ans != null) {
    errors.push(
      `Le logement a moins de ${conditionRef.anciennete_min_ans} ans à la date d'engagement : le geste n'est pas éligible.`,
    );
  }
  if (reference.version_formulaire) {
    errors.push(
      `Le dossier cite une version de fiche autre que celle en vigueur (${reference.version_formulaire}).`,
    );
  }

  // --- Sections : le « pourquoi » que la checklist ne donne pas. Chaque
  // paragraphe est construit sur une valeur de la table, jamais sur une
  // constante de code.
  const sections: NonNullable<SeoGuide["sections"]> = [];

  const paragraphesVersion: string[] = [];
  for (const regle of regles) {
    if (!regle.version_formulaire) continue;
    paragraphesVersion.push(
      `${NOM_DISPOSITIF[regle.dispositif]} : la référence en vigueur est « ${regle.version_formulaire} ». C'est cette version que le contrôle oppose au dossier, et c'est elle qui doit être citée dans les pièces.`,
    );
  }
  if (paragraphesVersion.length > 0) {
    sections.push({ heading: "La version qui fait foi aujourd'hui", paragraphs: paragraphesVersion });
  }

  const paragraphesConditions: string[] = [];
  for (const regle of regles) {
    const condition = lireCondition(regle);
    const bouts: string[] = [];
    if (condition.anciennete_min_ans != null) {
      bouts.push(`le logement doit avoir au moins ${condition.anciennete_min_ans} ans`);
    }
    if (condition.tva_taux != null) {
      bouts.push(
        `la TVA applicable au geste est de ${(condition.tva_taux * 100).toLocaleString("fr-FR")} %`,
      );
    }
    if (bouts.length > 0) {
      paragraphesConditions.push(
        `En ${NOM_DISPOSITIF[regle.dispositif]}, ${bouts.join(" et ")}.`,
      );
    }
  }
  if (paragraphesConditions.length > 0) {
    sections.push({ heading: "Les conditions vérifiées avant tout", paragraphs: paragraphesConditions });
  }

  // --- FAQ : réponses entièrement dérivées du barème porté par la règle.
  const faq: NonNullable<SeoGuide["faq"]> = [];

  const baremes = regles
    .map((regle) => ({ regle, forfait: lireCondition(regle).prime?.forfait }))
    .filter((entry): entry is { regle: RegleSeo; forfait: Partial<Record<CategorieRevenus, number>> } =>
      entry.forfait != null && Object.keys(entry.forfait).length > 0,
    );

  if (baremes.length > 0) {
    faq.push({
      question: `Quel montant d'aide pour ${config.gesteAvecArticle} ?`,
      answer: `${baremes
        .map(
          ({ regle, forfait }) =>
            `En ${NOM_DISPOSITIF[regle.dispositif]}, le barème est un forfait : ${phraseBareme(forfait)}`,
        )
        .join(". ")}. Ces montants sont indicatifs et dépendent du profil de revenus du bénéficiaire.`,
    });
  }

  // Le rose (revenus supérieurs) absent du forfait MaPrimeRénov' n'est pas un
  // trou de données : c'est une non-éligibilité, et c'est une question que
  // l'artisan se pose vraiment. On la traite explicitement.
  const forfaitMpr = mpr ? lireCondition(mpr).prime?.forfait : undefined;
  if (forfaitMpr && forfaitMpr.superieur == null && forfaitMpr.intermediaire != null) {
    faq.push({
      question: "Un ménage aux revenus supérieurs (rose) est-il éligible à MaPrimeRénov' pour ce geste ?",
      answer:
        "Non. Le barème MaPrimeRénov' par geste ne prévoit pas de forfait pour le profil supérieur (rose). Le geste reste finançable en CEE, qui ne distingue pas le violet du rose.",
    });
  }

  if (reference.version_formulaire) {
    faq.push({
      question: "Quelle version de la fiche faut-il citer ?",
      answer: `La version en vigueur retenue par Dossimo est « ${reference.version_formulaire} ». Une pièce qui cite une version antérieure expose le dossier à un refus, même si le geste est par ailleurs conforme.`,
    });
  }

  if (mentions.length > 0) {
    faq.push({
      question: "Quelles mentions doivent figurer sur le devis ?",
      answer: `${mentions.length} mentions sont attendues : ${mentions.join(" ; ")}.`,
    });
  }

  // --- Exemple avant / après, ancré sur la première mention exigée.
  const mentionPhare = mentions[0] ?? "les caractéristiques techniques de l'appareil";
  const example = {
    before: `Le devis décrit ${config.gesteAvecArticle} sans faire apparaître la mention « ${mentionPhare} » : le contrôle ne peut pas rattacher l'appareil posé au geste financé.`,
    after: `Le devis reprend « ${mentionPhare} » à l'identique de la fiche technique et de la facture, dans la version de fiche en vigueur : le dossier est opposable en l'état.`,
  };

  // --- Date de vérification : la plus récente des règles du geste. Elle
  // alimente l'affichage, le `dateModified` JSON-LD et le sitemap.
  const updated = regles
    .map((regle) => regle.created_at.slice(0, 10))
    .sort()
    .at(-1)!;

  return {
    slug: config.slug,
    title: config.title,
    metaTitle: config.metaTitle,
    description: config.description,
    eyebrow: config.eyebrow,
    category: "Par geste",
    updated,
    intro: config.intro,
    sections: sections.length > 0 ? sections : undefined,
    checklist,
    errors,
    example,
    faq: faq.length > 0 ? faq : undefined,
    sources: config.sources,
  };
}
