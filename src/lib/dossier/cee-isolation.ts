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

// ---------------------------------------------------------------------------
// Référentiel chauffage (première famille hors isolation)
// ---------------------------------------------------------------------------
export const TYPES_PAC = {
  air_eau: { label: "Pompe à chaleur air/eau", fiche: "BAR-TH-171" },
} as const;
export type TypePac = keyof typeof TYPES_PAC;

export const TYPES_CET = {
  accumulation: {
    label: "Chauffe-eau thermodynamique",
    fiche: "BAR-TH-148",
  },
} as const;
export type TypeCet = keyof typeof TYPES_CET;

export const TYPES_BOIS = {
  appareil: {
    label: "Appareil de chauffage au bois",
    fiche: "BAR-TH-112",
  },
} as const;
export type TypeBois = keyof typeof TYPES_BOIS;

/** Combustible bois — conditionne le rendement minimal (granulés vs bûches). */
export const BOIS_COMBUSTIBLES = {
  granules: "Granulés (pellets)",
  buches: "Bûches",
} as const;
export type BoisCombustible = keyof typeof BOIS_COMBUSTIBLES;

/** Profils de soutirage (norme EN 16147) — conditionnent le COP minimal. */
export const SOUTIRAGE_PROFILS = {
  M: "Profil M",
  L: "Profil L",
  XL: "Profil XL",
} as const;
export type SoutirageProfil = keyof typeof SOUTIRAGE_PROFILS;

/** Familles de gestes couvertes. Chaque dossier appartient à une famille. */
export const FAMILLES = {
  isolation: "Isolation",
  pac_air_eau: "Pompe à chaleur air/eau",
  cet: "Chauffe-eau thermodynamique",
  bois: "Appareil de chauffage au bois",
} as const;
export type Famille = keyof typeof FAMILLES;

/** type_travaux -> famille de geste. */
export function familleDeGeste(typeTravaux: string): Famille {
  if (typeTravaux === "pac_air_eau") return "pac_air_eau";
  if (typeTravaux === "cet") return "cet";
  if (typeTravaux === "bois") return "bois";
  return "isolation";
}

/**
 * Libellé du poste de travaux, quel que soit le geste. Point unique de lecture
 * du référentiel (isolation vs PAC) pour les documents et l'UI : un dossier PAC
 * n'a pas de bloc `travaux`, un accès direct à `TYPES_ISOLATION[...]` planterait.
 */
export function posteLabel(c: {
  geste?: string;
  travaux?: { type_isolation?: TypeIsolation };
  pac?: { type_pac?: TypePac };
  cet?: { type_cet?: TypeCet };
  bois?: { type_bois?: TypeBois };
}): string {
  const geste = c.geste ?? "isolation";
  if (geste === "pac_air_eau") return TYPES_PAC[c.pac?.type_pac ?? "air_eau"].label;
  if (geste === "cet") return TYPES_CET[c.cet?.type_cet ?? "accumulation"].label;
  if (geste === "bois") return TYPES_BOIS[c.bois?.type_bois ?? "appareil"].label;
  const ti = c.travaux?.type_isolation;
  return ti ? TYPES_ISOLATION[ti].label : "Travaux";
}

/** Régime de température PAC en clair. */
export const PAC_TEMPERATURES = {
  basse: "Basse température",
  moyenne_haute: "Moyenne / haute température",
} as const;

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

  // --- Famille de geste (isolation ou chauffage) ---
  geste: z.enum(["isolation", "pac_air_eau", "cet", "bois"]).default("isolation"),

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

  // --- Travaux : isolation (requis si geste = isolation, cf. superRefine) ---
  type_isolation: z
    .enum(Object.keys(TYPES_ISOLATION) as [keyof typeof TYPES_ISOLATION])
    .optional(),
  surface_isolee_m2: nombreOptionnel,
  isolant_type: z.string().optional().default(""),
  isolant_marque: z.string().optional().default(""),
  isolant_reference: z.string().optional().default(""),
  resistance_thermique_r: nombreOptionnel,
  epaisseur_mm: nombreOptionnel,

  // --- Travaux : pompe à chaleur air/eau (requis si geste = pac_air_eau) ---
  pac_etas: nombreOptionnel,
  pac_puissance_kw: nombreOptionnel,
  pac_temperature: z.enum(["basse", "moyenne_haute"]).optional(),
  pac_marque: z.string().optional().default(""),
  pac_reference: z.string().optional().default(""),
  pac_regulateur_classe: z.string().optional().default(""),

  // --- Travaux : chauffe-eau thermodynamique (requis si geste = cet) ---
  cet_cop: nombreOptionnel,
  cet_profil_soutirage: z.enum(["M", "L", "XL"]).optional(),
  cet_volume_l: nombreOptionnel,
  cet_marque: z.string().optional().default(""),
  cet_reference: z.string().optional().default(""),

  // --- Travaux : appareil de chauffage au bois (requis si geste = bois) ---
  bois_combustible: z.enum(["granules", "buches"]).optional(),
  bois_rendement: nombreOptionnel,
  bois_emissions_co: nombreOptionnel,
  bois_marque: z.string().optional().default(""),
  bois_reference: z.string().optional().default(""),

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
}).superRefine((v, ctx) => {
  const requisSi = (champ: string, valeur: unknown, msg = requis) => {
    if (valeur == null || valeur === "") {
      ctx.addIssue({ code: "custom", path: [champ], message: msg });
    }
  };
  if (v.geste === "pac_air_eau") {
    requisSi("pac_etas", v.pac_etas, "ETAS requis (%)");
    requisSi("pac_puissance_kw", v.pac_puissance_kw, "Puissance requise (kW)");
    requisSi("pac_temperature", v.pac_temperature);
    requisSi("pac_marque", v.pac_marque);
  } else if (v.geste === "cet") {
    requisSi("cet_cop", v.cet_cop, "COP requis");
    requisSi("cet_profil_soutirage", v.cet_profil_soutirage);
    requisSi("cet_volume_l", v.cet_volume_l, "Volume requis (L)");
    requisSi("cet_marque", v.cet_marque);
  } else if (v.geste === "bois") {
    requisSi("bois_combustible", v.bois_combustible);
    requisSi("bois_rendement", v.bois_rendement, "Rendement requis (%)");
    requisSi("bois_marque", v.bois_marque);
  } else {
    requisSi("type_isolation", v.type_isolation);
    requisSi("surface_isolee_m2", v.surface_isolee_m2, "Surface requise");
    requisSi("isolant_type", v.isolant_type);
    requisSi("resistance_thermique_r", v.resistance_thermique_r, "Résistance R requise");
  }
});

export type CeeIsolationInput = z.input<typeof ceeIsolationSchema>;
export type CeeIsolationData = z.output<typeof ceeIsolationSchema>;

/** Valeurs par défaut du formulaire (tous les champs contrôlés). */
export const ceeIsolationDefaults: CeeIsolationInput = {
  dispositif: "cee",
  geste: "isolation",
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
  surface_isolee_m2: "",
  isolant_type: "",
  isolant_marque: "",
  isolant_reference: "",
  resistance_thermique_r: "",
  epaisseur_mm: "",
  pac_etas: "",
  pac_puissance_kw: "",
  pac_temperature: undefined as unknown as "basse" | "moyenne_haute",
  pac_marque: "",
  pac_reference: "",
  pac_regulateur_classe: "",
  cet_cop: "",
  cet_profil_soutirage: undefined as unknown as "M" | "L" | "XL",
  cet_volume_l: "",
  cet_marque: "",
  cet_reference: "",
  bois_combustible: undefined as unknown as "granules" | "buches",
  bois_rendement: "",
  bois_emissions_co: "",
  bois_marque: "",
  bois_reference: "",
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
