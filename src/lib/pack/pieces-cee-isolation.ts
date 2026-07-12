import {
  BOIS_COMBUSTIBLES,
  PAC_TEMPERATURES,
  familleDeGeste,
  type Famille,
} from "@/lib/dossier/cee-isolation";
import type {
  CeeIsolationCaracteristiques,
  DossierComplet,
} from "@/lib/dossier/get-dossier";

/**
 * Bordereau des pièces d'un dossier CEE isolation.
 *
 * Référence statique pour l'étape 1 (§9). À terme, cette liste sera pilotée par
 * `regles_metier.pieces_requises_json` (table éditable, versionnée) — le code ne
 * fera que lire la règle active. Voir CLAUDE.md §7/§9.
 */
export interface PieceRequise {
  id: string;
  label: string;
  description: string;
  obligatoire: boolean;
}

export interface MentionObligatoire {
  document: "Devis" | "Facture";
  mention: string;
}

/**
 * Templates de mentions par défaut, PAR FAMILLE DE GESTE — repli si aucune règle
 * métier active.
 *
 * Une mention exigée qui ne figure pas sur un document lisible vaut refus
 * (`controle-pieces.ts`). Servir les mentions de l'isolation à un dossier PAC
 * reviendrait donc à exiger une certification ACERMI sur un devis de pompe à
 * chaleur, et à bloquer un dossier parfaitement conforme : les mentions se lisent
 * toujours dans la famille du geste.
 */
const MENTIONS_DEFAUT: Record<Famille, string[]> = {
  isolation: [
    "Fiche CEE : {fiche}",
    "Marque et référence de l'isolant posé",
    "Surface isolée : {surface} m²",
    "Résistance thermique R = {r} m²·K/W",
    "Certification de l'isolant (ACERMI ou équivalent)",
    "Mention de la qualification RGE (n° et domaine)",
  ],
  pac_air_eau: [
    "Fiche CEE : {fiche}",
    "Marque et référence de la pompe à chaleur",
    "Efficacité énergétique saisonnière (ETAS) : {etas} %",
    "Puissance thermique : {puissance} kW",
    "Régime de température : {temperature}",
    "Mention de la qualification RGE (n° et domaine)",
  ],
  cet: [
    "Fiche CEE : {fiche}",
    "Marque et référence du chauffe-eau thermodynamique",
    "COP (norme EN 16147) : {cop}",
    "Profil de soutirage : {soutirage}",
    "Volume du ballon : {volume} L",
    "Mention de la qualification RGE (n° et domaine)",
  ],
  bois: [
    "Fiche CEE : {fiche}",
    "Marque et référence de l'appareil",
    "Rendement énergétique : {rendement} %",
    "Combustible : {combustible}",
    "Émissions de monoxyde de carbone : {co} mg/Nm³",
    "Mention de la qualification RGE (n° et domaine)",
  ],
};

/** Valeurs interpolables du dossier, lues dans le bloc technique de sa famille. */
function valeursMention(c: CeeIsolationCaracteristiques): Record<string, string> {
  const famille = familleDeGeste(c.geste ?? "isolation");

  if (famille === "pac_air_eau" && c.pac) {
    return {
      fiche: c.pac.fiche || c.fiche,
      etas: String(c.pac.etas),
      puissance: String(c.pac.puissance_kw),
      temperature: PAC_TEMPERATURES[c.pac.temperature],
    };
  }
  if (famille === "cet" && c.cet) {
    return {
      fiche: c.cet.fiche || c.fiche,
      cop: String(c.cet.cop),
      soutirage: c.cet.profil_soutirage,
      volume: String(c.cet.volume_l),
    };
  }
  if (famille === "bois" && c.bois) {
    return {
      fiche: c.bois.fiche || c.fiche,
      rendement: String(c.bois.rendement),
      combustible: BOIS_COMBUSTIBLES[c.bois.combustible],
      co: c.bois.emissions_co != null ? String(c.bois.emissions_co) : "",
    };
  }
  return {
    fiche: c.travaux?.fiche ?? c.fiche,
    surface: c.travaux ? String(c.travaux.surface_isolee_m2) : "",
    r: c.travaux ? String(c.travaux.resistance_thermique_r) : "",
  };
}

/**
 * Interpole un template. Renvoie null si l'une des valeurs citées manque au
 * dossier : mieux vaut ne pas exiger une mention que d'en exiger une amputée
 * (« Émissions de CO :  mg/Nm³ »), qu'aucun document ne pourra jamais porter et
 * qui se solderait par un refus fabriqué. Protège aussi des règles métier en base
 * dont les placeholders ne correspondraient pas au geste du dossier.
 */
function interpolerMention(
  tpl: string,
  vals: Record<string, string>,
): string | null {
  let manquante = false;
  const out = tpl.replace(/\{(\w+)\}/g, (_, cle: string) => {
    const v = vals[cle];
    if (!v) {
      manquante = true;
      return "";
    }
    return v;
  });
  return manquante ? null : out;
}

/**
 * Mentions exigées, interpolées aux valeurs du dossier — la liste UNE fois, sans
 * la redite Devis/Facture. C'est la référence que le contrôle des pièces confronte
 * au document réel : chaque entrée est le texte qui doit figurer noir sur blanc.
 */
export function mentionsTemplates(data: DossierComplet): string[] {
  const c = data.caracteristiques;
  const vals = valeursMention(c);
  const templates = data.regle?.mentions?.length
    ? data.regle.mentions
    : MENTIONS_DEFAUT[familleDeGeste(c.geste ?? "isolation")];
  return templates
    .map((tpl) => interpolerMention(tpl, vals))
    .filter((m): m is string => m !== null);
}

/**
 * Mentions qui DOIVENT figurer sur le devis ET la facture (fiches BAR-EN).
 * Templates pilotés par la règle métier éditable (§7/§9.4), avec repli codé.
 */
export function mentionsObligatoires(
  data: DossierComplet,
): MentionObligatoire[] {
  const communes: MentionObligatoire[] = mentionsTemplates(data).map((mention) => ({
    document: "Devis" as const,
    mention,
  }));
  // Les mêmes mentions sont exigées à l'identique sur la facture.
  const surFacture = communes.map((m) => ({ ...m, document: "Facture" as const }));
  return [...communes, ...surFacture];
}

/** Liste de base codée — repli si aucune règle métier active (§7/§9.4). */
const PIECES_BASE_DEFAUT: PieceRequise[] = [
  {
    id: "cadre_contribution",
    label: "Cadre contribution / preuve du rôle actif et incitatif",
    description:
      "Document prouvant que l'offre CEE (le « coup de pouce ») a été proposée AVANT la signature du devis. Sans antériorité, le dossier est refusé.",
    obligatoire: true,
  },
  {
    id: "devis_signe",
    label: "Devis signé et daté",
    description:
      "Signé par le bénéficiaire, portant toutes les mentions obligatoires CEE et daté avant le début des travaux.",
    obligatoire: true,
  },
  {
    id: "facture",
    label: "Facture",
    description:
      "Reprenant à l'identique les mentions techniques (marque, référence, surface, R) et cohérente avec le devis.",
    obligatoire: true,
  },
  {
    id: "attestation_honneur",
    label: "Attestation sur l'honneur (AH)",
    description:
      "Signée par le bénéficiaire ET le professionnel, datée après la fin des travaux.",
    obligatoire: true,
  },
  {
    id: "qualification_rge",
    label: "Justificatif de qualification RGE",
    description:
      "Certificat RGE valide à la date de signature du devis, couvrant le domaine des travaux réalisés.",
    obligatoire: true,
  },
  {
    id: "fiche_technique",
    label: "Fiche technique de l'isolant",
    description:
      "Fiche produit mentionnant la marque, la référence, la résistance thermique et la certification ACERMI.",
    obligatoire: true,
  },
  {
    id: "photos",
    label: "Photographies avant / après travaux",
    description:
      "Preuves visuelles de l'état initial et des travaux réalisés (souvent exigées au contrôle).",
    obligatoire: true,
  },
];

/** Liste des pièces à réunir, adaptée au dossier (dispositif, occupation, revenus). */
export function piecesCeeIsolation(data: DossierComplet): PieceRequise[] {
  const { beneficiaire } = data.caracteristiques;
  const isMpr = data.dossier.dispositif === "maprimerenov";

  // Base pilotée par la règle métier éditable (§7/§9.4), avec repli codé. Les
  // ajustements conditionnels ci-dessous restent du ressort du code (ils
  // dépendent des données du dossier).
  const pieces: PieceRequise[] = data.regle?.pieces?.length
    ? data.regle.pieces.map((p) => ({
        id: p.id,
        label: p.label,
        description: p.description,
        obligatoire: p.obligatoire,
      }))
    : [...PIECES_BASE_DEFAUT];

  // Pièces du bénéficiaire (particulier). Requises pour MaPrimeRénov' (dépôt en
  // ligne par le particulier) ; côté CEE, l'obligé exige surtout l'AH et le
  // technique, donc on ne les ajoute pas systématiquement.
  if (isMpr) {
    pieces.push(
      {
        id: "piece_identite",
        label: "Pièce d'identité du bénéficiaire",
        description:
          "CNI ou passeport en cours de validité du demandeur (et de chaque membre du foyer fiscal).",
        obligatoire: true,
      },
      {
        id: "titre_propriete",
        label: "Titre de propriété ou justificatif d'occupation",
        description:
          "Prouve la propriété et l'occupation en résidence principale (acte notarié, avis de taxe foncière).",
        obligatoire: true,
      },
      {
        id: "rib",
        label: "RIB du bénéficiaire",
        description:
          "Compte, au nom du bénéficiaire, sur lequel MaPrimeRénov' sera versée.",
        obligatoire: true,
      },
    );
  }

  // Avis d'imposition : toujours pour MaPrimeRénov' (détermine le profil de
  // revenus et le montant), sinon côté CEE seulement en cas de bonification.
  if (isMpr || beneficiaire.precarite !== "classique") {
    pieces.push({
      id: "avis_imposition",
      label: "Avis d'imposition du ménage",
      description: isMpr
        ? "Détermine le profil de revenus MaPrimeRénov' (couleur) et le montant de l'aide."
        : "Justifie la catégorie de revenus (précaire / grande précarité) ouvrant droit à la bonification.",
      obligatoire: true,
    });
  }

  // Cas bailleur : attestation d'engagement de location.
  if (beneficiaire.occupation === "proprietaire_bailleur") {
    pieces.push({
      id: "attestation_bailleur",
      label: "Attestation d'engagement du bailleur",
      description:
        "Engagement de location du logement à titre de résidence principale.",
      obligatoire: true,
    });
  }

  return pieces;
}
