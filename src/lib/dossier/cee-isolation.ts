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
//
// PAS DE SEUIL ICI. Les `r_min` ont vécu dans cet objet en même temps que dans
// `regles_metier.condition_json` (migration 0004), qui est leur source de vérité
// et que `/admin/regles` permet d'éditer. Deux sources pour un seuil
// réglementaire, c'est la garantie qu'elles divergeront : après un arrêté, la
// base est corrigée, le formulaire continue d'afficher l'ancien seuil, et le
// moteur refuse sur le nouveau. Les seuils se lisent désormais avec
// `fetchSeuilsIsolation` (src/lib/rules/regles-metier.ts).
//
// Ce qui reste ici est du référentiel de SAISIE (libellé affiché, fiche CEE
// associée) : rien qu'un arrêté ne change sans changer aussi le code.
// ---------------------------------------------------------------------------
export const TYPES_ISOLATION = {
  combles_perdus: {
    label: "Combles perdus",
    fiche: "BAR-EN-101",
  },
  rampants_toiture: {
    label: "Rampants de toiture",
    fiche: "BAR-EN-101",
  },
  murs: {
    label: "Murs (intérieur / extérieur)",
    fiche: "BAR-EN-102",
  },
  plancher_bas: {
    label: "Plancher bas",
    fiche: "BAR-EN-103",
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

// BAR-TH-101 = chauffe-eau solaire individuel. À NE PAS confondre avec :
//  - BAR-TH-143 : système solaire combiné (chauffage + ECS), critères tout
//    autres (productivité >= 600 W/m², capteurs >= 8 m², ballon > 400 L) ;
//  - BAR-TH-168 : dispositif solaire sur appoint séparé (puissance de sortie).
// Seul le CESI est couvert ici. Le photovoltaïque ne relève ni du CEE ni de
// MaPrimeRénov' (prime à l'autoconsommation, circuit EDF OA) : hors périmètre.
export const TYPES_SOLAIRE_THERMIQUE = {
  cesi: {
    label: "Chauffe-eau solaire individuel",
    fiche: "BAR-TH-101",
  },
} as const;
export type TypeSolaireThermique = keyof typeof TYPES_SOLAIRE_THERMIQUE;

/** Énergie de l'appoint du CESI — conditionne le seuil d'efficacité ECS. */
export const SOLAIRE_APPOINTS = {
  electrique_joule: "Électrique à effet Joule",
  autre: "Autre énergie (gaz, bois, PAC…)",
} as const;
export type SolaireAppoint = keyof typeof SOLAIRE_APPOINTS;

/** Fluide caloporteur des capteurs — mention obligatoire sur la facture. */
export const SOLAIRE_FLUIDES = {
  eau: "Eau",
  eau_glycolee: "Eau glycolée",
} as const;
export type SolaireFluide = keyof typeof SOLAIRE_FLUIDES;

/** Certification des capteurs exigée par le BAR-TH-101. */
export const SOLAIRE_CERTIFICATIONS = {
  cstbat: "CSTBat",
  solar_keymark: "Solar Keymark",
  equivalence: "Équivalence (organisme accrédité EEE)",
} as const;
export type SolaireCertification = keyof typeof SOLAIRE_CERTIFICATIONS;

/** Combustible bois — conditionne le rendement minimal (granulés vs bûches). */
export const BOIS_COMBUSTIBLES = {
  granules: "Granulés (pellets)",
  buches: "Bûches",
} as const;
export type BoisCombustible = keyof typeof BOIS_COMBUSTIBLES;

/**
 * Profils de soutirage du chauffe-eau thermodynamique. Ils conditionnent le
 * plancher d'EFFICACITÉ ÉNERGÉTIQUE ECS (95 / 100 / 110 %), et non plus un COP :
 * le BAR-TH-148 ne mentionne plus le COP depuis la vA78-4 (01/01/2026).
 */
export const SOUTIRAGE_PROFILS = {
  M: "Profil M",
  L: "Profil L",
  XL: "Profil XL",
} as const;
export type SoutirageProfil = keyof typeof SOUTIRAGE_PROFILS;

/**
 * Profils de soutirage du CESI (règlement UE 814/2013). Volontairement DISTINCT
 * de `SOUTIRAGE_PROFILS` : le BAR-TH-101 admet XXL, que la fiche CET ne connaît
 * pas. Fusionner les deux ferait accepter un XXL sur un chauffe-eau
 * thermodynamique, où il n'a pas de seuil défini.
 */
export const SOLAIRE_SOUTIRAGE_PROFILS = {
  M: "Profil M",
  L: "Profil L",
  XL: "Profil XL",
  XXL: "Profil XXL",
} as const;
export type SolaireSoutirageProfil = keyof typeof SOLAIRE_SOUTIRAGE_PROFILS;

/** Familles de gestes couvertes. Chaque dossier appartient à une famille. */
export const FAMILLES = {
  isolation: "Isolation",
  pac_air_eau: "Pompe à chaleur air/eau",
  cet: "Chauffe-eau thermodynamique",
  bois: "Appareil de chauffage au bois",
  solaire_thermique: "Chauffe-eau solaire individuel",
} as const;
export type Famille = keyof typeof FAMILLES;

/**
 * type_travaux -> famille de geste. Le repli `isolation` couvre les postes
 * d'isolation, qui portent leur propre slug (`combles_perdus`, `murs`…), et les
 * dossiers antérieurs au multi-geste.
 */
export function familleDeGeste(typeTravaux: string): Famille {
  if (typeTravaux === "pac_air_eau") return "pac_air_eau";
  if (typeTravaux === "cet") return "cet";
  if (typeTravaux === "bois") return "bois";
  if (typeTravaux === "solaire_thermique") return "solaire_thermique";
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
  solaire?: { type_solaire?: TypeSolaireThermique };
}): string {
  const geste = c.geste ?? "isolation";
  if (geste === "pac_air_eau") return TYPES_PAC[c.pac?.type_pac ?? "air_eau"].label;
  if (geste === "cet") return TYPES_CET[c.cet?.type_cet ?? "accumulation"].label;
  if (geste === "bois") return TYPES_BOIS[c.bois?.type_bois ?? "appareil"].label;
  if (geste === "solaire_thermique") {
    return TYPES_SOLAIRE_THERMIQUE[c.solaire?.type_solaire ?? "cesi"].label;
  }
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

// Les quatre profils de revenus de l'Anah, dans l'ordre croissant affiché au
// select. Le CEE ne distingue pas l'intermédiaire (violet) du supérieur (rose) ;
// MaPrimeRénov' par geste, si : le rose n'y est pas éligible en 2026. Voir
// `CategorieRevenus` (`src/lib/rules/plafonds.ts`).
export const PRECARITES = {
  grande_precarite: "Ménage très modeste (bleu)",
  precaire: "Ménage modeste (jaune)",
  intermediaire: "Revenus intermédiaires (violet)",
  superieur: "Revenus supérieurs (rose)",
} as const;

export const LOGEMENT_TYPES = {
  maison: "Maison individuelle",
  appartement: "Appartement",
} as const;

export const RESIDENCES = {
  principale: "Résidence principale",
  secondaire: "Résidence secondaire",
} as const;

/**
 * Usage couvert par la PAC. Exigé au cadre A de l'attestation sur l'honneur par
 * l'annexe 1 de la fiche BAR-TH-171 (vA78.4, en vigueur au 01/01/2026), qui
 * définit mot pour mot le contenu de cette partie. Cf. CHANGELOG-cerfa.md.
 */
export const USAGES_PAC = {
  chauffage: "Chauffage seul",
  chauffage_ecs: "Chauffage et eau chaude sanitaire",
} as const;

/** Réponse binaire déclarée sur l'attestation (cases OUI / NON à cocher). */
export const OUI_NON = {
  oui: "Oui",
  non: "Non",
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

// Message calé sur ce que l'utilisateur voit : l'<input type="date"> affiche
// jj/mm/aaaa (et non le format ISO stocké en interne).
const dateISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (jj/mm/aaaa)");

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
  geste: z
    .enum(["isolation", "pac_air_eau", "cet", "bois", "solaire_thermique"])
    .default("isolation"),

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
  // Cadre A des BAR-EN-101 et 103 uniquement : « L'isolation thermique réalisée
  // a nécessité la mise en place d'un pare-vapeur ou tout autre dispositif
  // permettant d'atteindre un résultat équivalent ». Absent du BAR-EN-102
  // (murs), et SANS astérisque : attendu, pas bloquant.
  isolation_pare_vapeur: z
    .enum(Object.keys(OUI_NON) as [keyof typeof OUI_NON])
    .optional(),

  // --- Travaux : pompe à chaleur air/eau (requis si geste = pac_air_eau) ---
  pac_etas: nombreOptionnel,
  pac_puissance_kw: nombreOptionnel,
  pac_temperature: z.enum(["basse", "moyenne_haute"]).optional(),
  pac_marque: z.string().optional().default(""),
  pac_reference: z.string().optional().default(""),
  // « *La PAC est équipée d'un régulateur : OUI / NON », puis « *Classe du
  // régulateur ». Les deux à astérisque : la classe seule ne suffit pas, et la
  // déduire d'une case remplie reviendrait à répondre à la place de l'artisan.
  pac_regulateur: z
    .enum(Object.keys(OUI_NON) as [keyof typeof OUI_NON])
    .optional(),
  pac_regulateur_classe: z.string().optional().default(""),
  /**
   * « *[…] le système déporté consomme de l'énergie pour la production de l'eau
   * chaude sanitaire, hors systèmes déportés intégrant une résistance électrique
   * à des fins de secours ou de cycle anti-légionelle […] ». À astérisque, mais
   * sans objet quand il n'y a pas de système déporté.
   */
  pac_deporte_consomme_energie: z
    .enum(Object.keys(OUI_NON) as [keyof typeof OUI_NON])
    .optional(),
  /**
   * « *Une note de dimensionnement a été remise au bénéficiaire : OUI / NON ».
   * Distinct de la pièce « note de dimensionnement » de la checklist : celle-ci
   * suit le document que Dossimo détient, celle-là déclare sa remise au client.
   */
  pac_note_dimensionnement: z
    .enum(Object.keys(OUI_NON) as [keyof typeof OUI_NON])
    .optional(),
  // Exigés au cadre A de l'AH par l'annexe 1 de la fiche BAR-TH-171 (vA78.4),
  // qui en définit le contenu champ par champ. Leur absence laissait l'artisan
  // devant des cases à remplir de tête au moment de signer (CHANGELOG-cerfa.md).
  pac_surface_chauffee_m2: nombreOptionnel,
  pac_usage: z
    .enum(Object.keys(USAGES_PAC) as [keyof typeof USAGES_PAC])
    .optional(),
  pac_systeme_deporte: z
    .enum(Object.keys(OUI_NON) as [keyof typeof OUI_NON])
    .optional(),
  pac_deporte_marque: z.string().optional().default(""),
  pac_deporte_reference: z.string().optional().default(""),
  /**
   * Identifiant du modèle de PAC au sens de l'article 2 du règlement (UE)
   * 2017/1369 — celui de la base EPREL. Le cadre A le marque d'un astérisque
   * DEPUIS la vA78.4, soit le 01/01/2026 : c'est une obligation en vigueur, pas
   * à venir. Le mot « EPREL » n'apparaît jamais dans les textes officiels, qui
   * disent « le numéro du modèle » (vA78.4) puis « la référence du modèle »
   * (vA82.5) — même donnée, deux formulations.
   */
  pac_reference_modele: z.string().optional().default(""),
  /**
   * Numéro d'agrément du modèle, exigé au cadre A de la vA82.5 (01/09/2026)
   * pour les seules PAC bénéficiant de la bonification du 1° du IV de
   * l'article 3-6 de l'arrêté du 29 décembre 2014 modifié. Facultatif : il ne
   * concerne qu'une partie des dossiers, et pas avant septembre.
   */
  pac_numero_agrement: z.string().optional().default(""),

  // --- Travaux : chauffe-eau thermodynamique (requis si geste = cet) ---
  // Critère d'éligibilité depuis la vA78-4 (01/01/2026) : l'efficacité
  // énergétique ECS au profil déclaré, pas le COP. Cf. CHANGELOG-cerfa.md.
  cet_efficacite_ecs: nombreOptionnel,
  // Le COP n'est plus un critère et ne figure plus au cadre A. Conservé en
  // facultatif : il reste écrit sur beaucoup de devis, et le supprimer ferait
  // perdre la comparaison devis / saisie sur les dossiers qui le portent.
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

  // --- Travaux : chauffe-eau solaire individuel (requis si geste =
  // solaire_thermique). Champs calés sur les mentions qu'exige le BAR-TH-101 sur
  // la preuve de réalisation : appoint, fluide, surface, efficacité, ballons.
  solaire_appoint: z.enum(["electrique_joule", "autre"]).optional(),
  solaire_fluide: z.enum(["eau", "eau_glycolee"]).optional(),
  solaire_surface_capteurs_m2: nombreOptionnel,
  solaire_profil_soutirage: z.enum(["M", "L", "XL", "XXL"]).optional(),
  solaire_efficacite_ecs: nombreOptionnel,
  solaire_nb_ballons: nombreOptionnel,
  solaire_volume_ballon_l: nombreOptionnel,
  /** Classe d'efficacité du ballon (UE 812/2013) — exigée si volume <= 500 L. */
  solaire_classe_ballon: z.string().optional().default(""),
  solaire_certification: z.enum(["cstbat", "solar_keymark", "equivalence"]).optional(),
  // Deux cases à astérisque du cadre A du BAR-TH-101, sans équivalent ailleurs
  // dans la saisie : la couverture totale du besoin ECS, et le fait que les
  // capteurs ne soient pas hybrides (un capteur hybride PV/thermique ne relève
  // pas de cette fiche).
  solaire_couvre_totalite_ecs: z
    .enum(Object.keys(OUI_NON) as [keyof typeof OUI_NON])
    .optional(),
  solaire_capteurs_non_hybrides: z
    .enum(Object.keys(OUI_NON) as [keyof typeof OUI_NON])
    .optional(),
  solaire_marque: z.string().optional().default(""),
  solaire_reference: z.string().optional().default(""),

  // --- Chronologie (dates_json) — clé du contrôle anti-refus ---
  // Engagement de l'offre CEE (rôle actif et incitatif). Optionnel au schéma,
  // car sans objet en MaPrimeRénov' ; en CEE, son absence est un bloquant relevé
  // par le moteur (`controlerDossier`), de même que sa postériorité au devis
  // au-delà des quatorze jours de l'art. R. 221-22 du code de l'énergie.
  date_offre_cee: dateISOOptionnelle,
  /**
   * Repli quand l'artisan sait l'offre antérieure au devis sans en retrouver la
   * date exacte. Une déclaration ne vaut pas une preuve : le moteur la traite en
   * avertissement, jamais en conforme (`chrono_offre_cee`). Elle existe parce que
   * bloquer un dossier réellement conforme sur une date oubliée, c'est le faux
   * positif que le contrôle anti-refus est censé éviter.
   */
  offre_cee_anterieure: z
    .enum(Object.keys(OUI_NON) as [keyof typeof OUI_NON])
    .optional(),
  date_visite_technique: dateISOOptionnelle,
  date_devis: dateISO,
  date_debut_travaux: dateISOOptionnelle,
  date_fin_travaux: dateISOOptionnelle,
  date_facture: dateISOOptionnelle,
  // Référence de la facture. Portée au cadre A de l'AH (annexe 1 BAR-TH-171),
  // sans astérisque : attendue mais pas bloquante, d'où l'absence de `requisSi`.
  facture_reference: z.string().optional().default(""),

  // --- Montants ---
  montant_ht: nombrePositif("Montant HT invalide"),
  montant_ttc: nombrePositif("Montant TTC invalide"),
  montant_prime_estime: nombreOptionnel,
  // Aides publiques perçues hors CEE (ex. MaPrimeRénov') — obligatoire sur l'AH
  // depuis la 6e période (01/04/2026). Laisser vide = aucune aide.
  montant_aides_publiques: nombreOptionnel,

  // --- Sous-traitance ---
  // Les SIX cadres A portent, à astérisque : « Identité du professionnel
  // titulaire du signe de qualité ayant réalisé l'opération, s'il n'est pas le
  // signataire de cette attestation (sous-traitant par exemple) ». Question
  // posée quel que soit le geste, et jamais préremplie : une sous-traitance non
  // déclarée est un motif de refus, et supposer « non » serait deviner à la
  // place de l'artisan (revue du 2026-07-25, CHANGELOG-cerfa.md).
  sous_traitance: z
    .enum(Object.keys(OUI_NON) as [keyof typeof OUI_NON])
    .optional(),
  sous_traitant_nom: z.string().optional().default(""),
  sous_traitant_prenom: z.string().optional().default(""),
  sous_traitant_raison_sociale: z.string().optional().default(""),
  sous_traitant_siret: z.string().optional().default(""),

  // Parrainage artisan → artisan : code du parrain saisi au 1er dossier
  // (−30 € de remise). Facultatif ; validé côté serveur (apply_referral_code).
  code_parrain: z.string().optional().default(""),
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
    // Les trois champs marqués d'un astérisque à l'annexe 1 : sans eux, l'AH de
    // l'obligé ne peut pas être remplie.
    requisSi(
      "pac_surface_chauffee_m2",
      v.pac_surface_chauffee_m2,
      "Surface chauffée par la PAC requise (m²)",
    );
    requisSi("pac_usage", v.pac_usage);
    requisSi("pac_systeme_deporte", v.pac_systeme_deporte);
    requisSi(
      "pac_reference_modele",
      v.pac_reference_modele,
      "Référence du modèle (base EPREL) requise",
    );
    requisSi("pac_regulateur", v.pac_regulateur);
    if (v.pac_regulateur === "oui") {
      requisSi("pac_regulateur_classe", v.pac_regulateur_classe);
    }
    requisSi("pac_note_dimensionnement", v.pac_note_dimensionnement);
    if (v.pac_systeme_deporte === "oui") {
      requisSi("pac_deporte_marque", v.pac_deporte_marque);
      requisSi("pac_deporte_consomme_energie", v.pac_deporte_consomme_energie);
    }
  } else if (v.geste === "cet") {
    requisSi(
      "cet_efficacite_ecs",
      v.cet_efficacite_ecs,
      "Efficacité énergétique ECS requise (%)",
    );
    requisSi("cet_profil_soutirage", v.cet_profil_soutirage);
    requisSi("cet_volume_l", v.cet_volume_l, "Volume requis (L)");
    requisSi("cet_marque", v.cet_marque);
  } else if (v.geste === "bois") {
    requisSi("bois_combustible", v.bois_combustible);
    requisSi("bois_rendement", v.bois_rendement, "Rendement requis (%)");
    requisSi("bois_marque", v.bois_marque);
  } else if (v.geste === "solaire_thermique") {
    requisSi("solaire_appoint", v.solaire_appoint);
    requisSi("solaire_fluide", v.solaire_fluide);
    requisSi(
      "solaire_surface_capteurs_m2",
      v.solaire_surface_capteurs_m2,
      "Surface de capteurs requise (m²)",
    );
    requisSi("solaire_profil_soutirage", v.solaire_profil_soutirage);
    requisSi("solaire_efficacite_ecs", v.solaire_efficacite_ecs, "Efficacité ECS requise (%)");
    requisSi("solaire_nb_ballons", v.solaire_nb_ballons, "Nombre de ballons requis");
    requisSi("solaire_volume_ballon_l", v.solaire_volume_ballon_l, "Volume requis (L)");
    requisSi("solaire_certification", v.solaire_certification);
    // Les deux cases à astérisque du cadre A.
    requisSi("solaire_couvre_totalite_ecs", v.solaire_couvre_totalite_ecs);
    requisSi("solaire_capteurs_non_hybrides", v.solaire_capteurs_non_hybrides);
    requisSi("solaire_marque", v.solaire_marque);
    // Classe d'efficacité : exigée par la fiche pour les ballons <= 500 L
    // seulement. Au-dessus, la fiche ne la demande pas : ne pas la réclamer.
    if (
      typeof v.solaire_volume_ballon_l === "number" &&
      v.solaire_volume_ballon_l <= 500
    ) {
      requisSi(
        "solaire_classe_ballon",
        v.solaire_classe_ballon,
        "Classe d'efficacité requise (ballon <= 500 L)",
      );
    }
  } else {
    requisSi("type_isolation", v.type_isolation);
    requisSi("surface_isolee_m2", v.surface_isolee_m2, "Surface requise");
    requisSi("isolant_type", v.isolant_type);
    requisSi("resistance_thermique_r", v.resistance_thermique_r, "Résistance R requise");
  }

  // Sous-traitance : hors des branches par geste, les six fiches la demandent.
  requisSi("sous_traitance", v.sous_traitance);
  if (v.sous_traitance === "oui") {
    requisSi("sous_traitant_nom", v.sous_traitant_nom);
    requisSi("sous_traitant_prenom", v.sous_traitant_prenom);
    requisSi("sous_traitant_raison_sociale", v.sous_traitant_raison_sociale);
    if (!/^\d{14}$/.test(v.sous_traitant_siret ?? "")) {
      ctx.addIssue({
        code: "custom",
        path: ["sous_traitant_siret"],
        message: "Le SIRET doit comporter 14 chiffres",
      });
    } else if (v.sous_traitant_siret === v.siret) {
      // Un sous-traitant qui porte le SIRET du signataire n'en est pas un : ce
      // cadre n'existe QUE pour le cas « ce n'est pas le signataire ».
      ctx.addIssue({
        code: "custom",
        path: ["sous_traitant_siret"],
        message:
          "Ce SIRET est celui de votre entreprise. Le cadre ne se remplit que si les travaux ont été réalisés par une AUTRE entreprise.",
      });
    }
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
  isolation_pare_vapeur: undefined as unknown as keyof typeof OUI_NON,
  pac_etas: "",
  pac_puissance_kw: "",
  pac_temperature: undefined as unknown as "basse" | "moyenne_haute",
  pac_marque: "",
  pac_reference: "",
  pac_regulateur: undefined as unknown as keyof typeof OUI_NON,
  pac_regulateur_classe: "",
  pac_deporte_consomme_energie: undefined as unknown as keyof typeof OUI_NON,
  pac_note_dimensionnement: undefined as unknown as keyof typeof OUI_NON,
  pac_surface_chauffee_m2: "",
  pac_usage: undefined as unknown as keyof typeof USAGES_PAC,
  pac_systeme_deporte: undefined as unknown as keyof typeof OUI_NON,
  pac_deporte_marque: "",
  pac_deporte_reference: "",
  pac_reference_modele: "",
  pac_numero_agrement: "",
  cet_efficacite_ecs: "",
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
  solaire_appoint: undefined as unknown as "electrique_joule" | "autre",
  solaire_fluide: undefined as unknown as "eau" | "eau_glycolee",
  solaire_surface_capteurs_m2: "",
  solaire_profil_soutirage: undefined as unknown as "M" | "L" | "XL" | "XXL",
  solaire_efficacite_ecs: "",
  solaire_nb_ballons: "",
  solaire_volume_ballon_l: "",
  solaire_classe_ballon: "",
  solaire_certification: undefined as unknown as
    | "cstbat"
    | "solar_keymark"
    | "equivalence",
  solaire_couvre_totalite_ecs: undefined as unknown as keyof typeof OUI_NON,
  solaire_capteurs_non_hybrides: undefined as unknown as keyof typeof OUI_NON,
  solaire_marque: "",
  solaire_reference: "",
  date_offre_cee: "",
  offre_cee_anterieure: undefined as unknown as keyof typeof OUI_NON,
  date_visite_technique: "",
  date_devis: "",
  date_debut_travaux: "",
  date_fin_travaux: "",
  date_facture: "",
  facture_reference: "",
  montant_ht: "" as unknown as number,
  montant_ttc: "" as unknown as number,
  montant_prime_estime: "",
  montant_aides_publiques: "",
  sous_traitance: undefined as unknown as keyof typeof OUI_NON,
  sous_traitant_nom: "",
  sous_traitant_prenom: "",
  sous_traitant_raison_sociale: "",
  sous_traitant_siret: "",
  code_parrain: "",
};
