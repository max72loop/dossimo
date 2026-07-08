import { z } from "zod";

/**
 * Saisie unique — couple CEE / Isolation (CLAUDE.md §9, étape 1).
 *
 * Ce schéma est la SOURCE DE VÉRITÉ de la saisie. Tout le pack documentaire et
 * le contrôle anti-refus dérivent de ces mêmes données → l'incohérence
 * devis/facture devient structurellement impossible (§4).
 */

// ---------------------------------------------------------------------------
// Référentiel isolation → fiche CEE (BAR-EN)
// ---------------------------------------------------------------------------
export const TYPES_ISOLATION = {
  combles_perdus: {
    label: "Combles perdus",
    fiche: "BAR-EN-101",
    // R minimal réglementaire indicatif (contrôle réel = moteur de règles, §9 étape 1).
    r_min: 7,
  },
  rampants_toiture: {
    label: "Rampants de toiture",
    fiche: "BAR-EN-101",
    r_min: 6,
  },
  murs: {
    label: "Murs (intérieur / extérieur)",
    fiche: "BAR-EN-102",
    r_min: 3.7,
  },
  plancher_bas: {
    label: "Plancher bas",
    fiche: "BAR-EN-103",
    r_min: 3,
  },
} as const;

export type TypeIsolation = keyof typeof TYPES_ISOLATION;

export const OCCUPATIONS = {
  proprietaire_occupant: "Propriétaire occupant",
  proprietaire_bailleur: "Propriétaire bailleur",
  locataire: "Locataire",
} as const;

export const PRECARITES = {
  classique: "Revenus classiques (standard)",
  precaire: "Ménage modeste (précaire)",
  grande_precarite: "Ménage très modeste (grande précarité)",
} as const;

export const LOGEMENT_TYPES = {
  maison: "Maison individuelle",
  appartement: "Appartement",
} as const;

export const RESIDENCES = {
  principale: "Résidence principale",
  secondaire: "Résidence secondaire",
} as const;

// ---------------------------------------------------------------------------
// Helpers de validation
// ---------------------------------------------------------------------------
const requis = "Ce champ est requis";

/** Nombre requis strictement positif (les <input> renvoient des strings). */
const nombrePositif = (msg = "Valeur invalide") =>
  z.coerce.number({ error: msg }).positive(msg);

/** Nombre optionnel : "" → undefined. */
const nombreOptionnel = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().nonnegative().optional(),
);

const dateISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (AAAA-MM-JJ)");

const dateISOOptionnelle = z.preprocess(
  (v) => (v === "" || v === null ? undefined : v),
  dateISO.optional(),
);

// ---------------------------------------------------------------------------
// Schéma
// ---------------------------------------------------------------------------
export const ceeIsolationSchema = z.object({
  // --- Dispositif visé ---
  dispositif: z.enum(["cee", "maprimerenov"]).default("cee"),

  // --- Entreprise (artisan RGE) ---
  entreprise: z.string().min(1, requis),
  siret: z
    .string()
    .regex(/^\d{14}$/, "Le SIRET doit comporter 14 chiffres"),
  rge_numero: z.string().min(1, requis),
  rge_domaine: z.string().min(1, requis),
  rge_date_debut: dateISOOptionnelle,
  rge_date_fin: dateISO,
  signataire_nom: z.string().min(1, requis),
  signataire_prenom: z.string().min(1, requis),
  email: z.email("Email invalide"),
  telephone: z.string().optional().default(""),

  // --- Bénéficiaire (client) ---
  client_nom: z.string().min(1, requis),
  client_prenom: z.string().min(1, requis),
  client_adresse: z.string().min(1, requis),
  client_code_postal: z
    .string()
    .regex(/^\d{5}$/, "Code postal invalide (5 chiffres)"),
  client_commune: z.string().min(1, requis),
  client_email: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.email("Email invalide").optional(),
  ),
  client_telephone: z.string().optional().default(""),
  occupation: z.enum(
    Object.keys(OCCUPATIONS) as [keyof typeof OCCUPATIONS],
    { error: requis },
  ),
  precarite: z.enum(
    Object.keys(PRECARITES) as [keyof typeof PRECARITES],
    { error: requis },
  ),

  // --- Logement ---
  logement_type: z.enum(
    Object.keys(LOGEMENT_TYPES) as [keyof typeof LOGEMENT_TYPES],
    { error: requis },
  ),
  logement_annee_construction: z.coerce
    .number({ error: "Année invalide" })
    .int()
    .gte(1800, "Année invalide")
    .lte(2100, "Année invalide"),
  logement_residence: z.enum(
    Object.keys(RESIDENCES) as [keyof typeof RESIDENCES],
    { error: requis },
  ),
  logement_surface_habitable: nombreOptionnel,

  // --- Travaux (isolation) ---
  type_isolation: z.enum(
    Object.keys(TYPES_ISOLATION) as [keyof typeof TYPES_ISOLATION],
    { error: requis },
  ),
  surface_isolee_m2: nombrePositif("Surface invalide"),
  isolant_type: z.string().min(1, requis),
  isolant_marque: z.string().optional().default(""),
  isolant_reference: z.string().optional().default(""),
  resistance_thermique_r: nombrePositif("Résistance R invalide"),
  epaisseur_mm: nombreOptionnel,

  // --- Chronologie (dates_json) — clé du contrôle anti-refus ---
  date_visite_technique: dateISOOptionnelle,
  date_devis: dateISO,
  date_debut_travaux: dateISOOptionnelle,
  date_fin_travaux: dateISOOptionnelle,
  date_facture: dateISOOptionnelle,

  // --- Montants ---
  montant_ht: nombrePositif("Montant HT invalide"),
  montant_ttc: nombrePositif("Montant TTC invalide"),
  montant_prime_estime: nombreOptionnel,
  // Aides publiques perçues hors CEE (ex. MaPrimeRénov') — obligatoire sur l'AH
  // depuis la 6e période (01/04/2026). Laisser vide = aucune aide.
  montant_aides_publiques: nombreOptionnel,
});

export type CeeIsolationInput = z.input<typeof ceeIsolationSchema>;
export type CeeIsolationData = z.output<typeof ceeIsolationSchema>;

/** Valeurs par défaut du formulaire (tous les champs contrôlés). */
export const ceeIsolationDefaults: CeeIsolationInput = {
  dispositif: "cee",
  entreprise: "",
  siret: "",
  rge_numero: "",
  rge_domaine: "",
  rge_date_debut: "",
  rge_date_fin: "",
  signataire_nom: "",
  signataire_prenom: "",
  email: "",
  telephone: "",
  client_nom: "",
  client_prenom: "",
  client_adresse: "",
  client_code_postal: "",
  client_commune: "",
  client_email: "",
  client_telephone: "",
  occupation: undefined as unknown as keyof typeof OCCUPATIONS,
  precarite: undefined as unknown as keyof typeof PRECARITES,
  logement_type: undefined as unknown as keyof typeof LOGEMENT_TYPES,
  logement_annee_construction: "" as unknown as number,
  logement_residence: undefined as unknown as keyof typeof RESIDENCES,
  logement_surface_habitable: "",
  type_isolation: undefined as unknown as TypeIsolation,
  surface_isolee_m2: "" as unknown as number,
  isolant_type: "",
  isolant_marque: "",
  isolant_reference: "",
  resistance_thermique_r: "" as unknown as number,
  epaisseur_mm: "",
  date_visite_technique: "",
  date_devis: "",
  date_debut_travaux: "",
  date_fin_travaux: "",
  date_facture: "",
  montant_ht: "" as unknown as number,
  montant_ttc: "" as unknown as number,
  montant_prime_estime: "",
  montant_aides_publiques: "",
};
