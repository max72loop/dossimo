/**
 * Accroches de prospection par domaine RGE (plan de lancement v3, section 10).
 *
 * Le fichier `prospects_dossimo` porte, pour chaque artisan, un tableau
 * `rge_domaines` de libellés ADEME hétérogènes (16 valeurs distinctes relevées).
 * On les mappe vers 7 accroches : citer SA fiche et SA mention piège fait le
 * taux de réponse, là où une accroche générique passe pour du publipostage.
 *
 * Un artisan a le plus souvent PLUSIEURS domaines. Règle retenue (« bucket
 * prioritaire ») : parmi ses domaines, on prend le plus prioritaire selon
 * `PRIORITE`. L'accroche reste toujours vraie (c'est un de ses vrais domaines),
 * jamais une accroche fausse. La page admin affiche tous ses domaines pour
 * permettre un changement manuel avant l'envoi.
 */

export type Bucket =
  | "isolation"
  | "pac"
  | "cet"
  | "menuiseries"
  | "bois"
  | "ventilation"
  | "generique";

/**
 * Ordre de priorité quand un artisan couvre plusieurs buckets. Éditable : il ne
 * change que l'accroche choisie par défaut, jamais sa véracité. `generique` est
 * le dernier recours (aucun domaine reconnu, ou uniquement des domaines hors
 * dispositif : gaz/fioul, radiateurs électriques, photovoltaïque).
 */
export const PRIORITE: Bucket[] = [
  "isolation",
  "pac",
  "cet",
  "menuiseries",
  "bois",
  "ventilation",
  "generique",
];

export type Accroche = {
  /** Phrase d'accroche insérée dans le message (mention piège du domaine). */
  texte: string;
  /** Fiches CEE concernées, pour référence interne (non envoyées). */
  fiches: string;
  /** Libellé humain du métier, pour la 1re ligne WhatsApp « (ville, domaine) ». */
  metier: string;
  /** Objet d'e-mail adapté au domaine. */
  objet: string;
};

export const ACCROCHES: Record<Bucket, Accroche> = {
  isolation: {
    texte:
      "Sur un devis d'isolation, une résistance thermique ou une certification ACERMI absente, et la prime saute.",
    fiches: "BAR-EN-101/102/103",
    metier: "isolation",
    objet: "Devis isolation : la relecture qui évite un refus",
  },
  pac: {
    texte:
      "Sur un dossier PAC, une efficacité saisonnière (ETAS) absente du devis ou une fiche mal choisie, et c'est le refus.",
    fiches: "BAR-TH-171/172",
    metier: "pompe à chaleur",
    objet: "Devis PAC : la mention qui fait refuser la prime",
  },
  cet: {
    texte:
      "Sur un chauffe-eau, le COP ou la productivité absents du devis, et le dossier bloque à l'instruction.",
    fiches: "BAR-TH-148/101",
    metier: "chauffe-eau / solaire",
    objet: "Devis chauffe-eau : la mention qui bloque la prime",
  },
  menuiseries: {
    texte:
      "Sur des fenêtres, les coefficients Uw et Sw manquent souvent sur le devis : motif de refus classique.",
    fiches: "BAR-EN-104",
    metier: "menuiseries",
    objet: "Devis fenêtres : la mention qui fait refuser la prime",
  },
  bois: {
    texte:
      "Sur un poêle ou une chaudière bois, rendement et émissions doivent figurer noir sur blanc sur le devis, sinon refus.",
    fiches: "BAR-TH-112",
    metier: "chauffage bois",
    objet: "Devis poêle ou chaudière bois : la mention qui bloque la prime",
  },
  ventilation: {
    texte:
      "Sur une VMC, le type exact et les caractéristiques doivent être sur le devis, sinon le dossier bloque.",
    fiches: "BAR-TH-127",
    metier: "ventilation",
    objet: "Devis VMC : la mention qui bloque le dossier",
  },
  generique: {
    texte:
      "Une mention obligatoire absente du devis (performance, certification, RGE), et la prime saute.",
    fiches: "générique",
    metier: "rénovation énergétique",
    objet: "Devis rénovation : la relecture qui évite un refus",
  },
};

/** Normalise un libellé ADEME pour un appariement robuste (espaces, casse). */
function normaliser(s: string): string {
  return s.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Mapping des 16 libellés réels `rge_domaines` (normalisés) vers les buckets.
 * Vérifié une fois contre les valeurs distinctes de la base (aucun inconnu au
 * 16/07/2026). Un libellé non listé n'est jamais deviné : il est signalé et le
 * contact retombe sur l'accroche générique.
 */
const MAP_LIBELLES: Record<string, Bucket> = {
  [normaliser("Pompe à chaleur : chauffage")]: "pac",
  [normaliser("Chauffe-Eau Thermodynamique")]: "cet",
  [normaliser("Chauffage et/ou eau chaude solaire")]: "cet",
  [normaliser("Fenêtres, volets, portes donnant sur l'extérieur")]: "menuiseries",
  [normaliser("Fenêtres de toit")]: "menuiseries",
  [normaliser("Isolation par l'intérieur des murs ou rampants de toitures ou plafonds")]: "isolation",
  [normaliser("Isolation des murs par l'extérieur")]: "isolation",
  [normaliser("Isolation des combles perdus")]: "isolation",
  [normaliser("Isolation des toitures terrasses ou des toitures par l'extérieur")]: "isolation",
  [normaliser("Isolation des planchers bas")]: "isolation",
  [normaliser("Ventilation mécanique")]: "ventilation",
  [normaliser("Poêle ou insert bois")]: "bois",
  [normaliser("Chaudière bois")]: "bois",
  [normaliser("Chaudière condensation ou micro-cogénération gaz ou fioul")]: "generique",
  [normaliser("Radiateurs électriques, dont régulation.")]: "generique",
  [normaliser("Panneaux solaires photovoltaïques")]: "generique",
};

export type ChoixAccroche = {
  bucket: Bucket;
  accroche: Accroche;
  /** Libellés non reconnus rencontrés sur ce contact (à signaler, pas deviner). */
  inconnus: string[];
};

/**
 * Choisit l'accroche d'un contact à partir de ses `rge_domaines`. Applique la
 * règle du bucket prioritaire. Remonte les libellés inconnus pour qu'ils soient
 * corrigés dans le mapping plutôt que noyés dans du générique silencieux.
 */
export function choisirAccroche(rgeDomaines: readonly string[] | null | undefined): ChoixAccroche {
  const buckets = new Set<Bucket>();
  const inconnus: string[] = [];
  for (const brut of rgeDomaines ?? []) {
    const bucket = MAP_LIBELLES[normaliser(brut ?? "")];
    if (bucket) buckets.add(bucket);
    else if ((brut ?? "").trim()) inconnus.push(brut.trim());
  }
  const bucket = PRIORITE.find((b) => buckets.has(b)) ?? "generique";
  return { bucket, accroche: ACCROCHES[bucket], inconnus };
}
