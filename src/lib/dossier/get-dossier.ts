import { createClient } from "@/lib/supabase/server";
import type { Artisan, Dossier } from "@/lib/database.types";
import {
  fetchRegleActive,
  type RegleMetierResolue,
} from "@/lib/rules/regles-metier";
import type { VerificationEntreprise } from "@/lib/verification/types";
import type {
  OCCUPATIONS,
  PRECARITES,
  LOGEMENT_TYPES,
  RESIDENCES,
  Famille,
  TypeIsolation,
} from "@/lib/dossier/cee-isolation";

/** Forme typée de `caracteristiques_techniques_json` d'un dossier. */
export interface CeeIsolationCaracteristiques {
  /**
   * Famille de geste ; absent = isolation (dossiers créés avant le multi-geste).
   * Dérivé de `Famille` et NON réécrit à la main : cette union a déjà divergé du
   * référentiel, et un geste manquant ici ne lève aucune erreur — il est juste
   * traité en isolation, silencieusement, jusque dans les PDF.
   */
  geste?: Famille;
  fiche: string;
  beneficiaire: {
    nom: string;
    prenom: string;
    adresse: string;
    code_postal: string;
    commune: string;
    email: string | null;
    telephone: string | null;
    occupation: keyof typeof OCCUPATIONS;
    precarite: keyof typeof PRECARITES;
  };
  logement: {
    type: keyof typeof LOGEMENT_TYPES;
    annee_construction: number;
    residence: keyof typeof RESIDENCES;
    surface_habitable: number | null;
  };
  /**
   * Bloc technique de l'isolation — présent pour la seule famille isolation.
   * Absent des dossiers PAC / CET / bois, qui portent `pac` / `cet` / `bois` à
   * la place : tout lecteur doit donc le garder optionnel (`travaux?.`) ou
   * s'exécuter dans une branche déjà filtrée par `geste`.
   */
  travaux?: {
    fiche: string;
    type_isolation: TypeIsolation;
    surface_isolee_m2: number;
    isolant_type: string;
    isolant_marque: string | null;
    isolant_reference: string | null;
    resistance_thermique_r: number;
    epaisseur_mm: number | null;
    /** Pare-vapeur ou dispositif équivalent (cadre A des BAR-EN-101 / 103).
     *  `null` = non renseigné ; absent des dossiers antérieurs à la question. */
    pare_vapeur?: boolean | null;
  };
  /** Bloc technique de la PAC air/eau (présent pour la famille pac_air_eau). */
  pac?: {
    type_pac: "air_eau";
    fiche: string;
    etas: number;
    puissance_kw: number;
    temperature: "basse" | "moyenne_haute";
    marque: string | null;
    reference: string | null;
    /** « La PAC est équipée d'un régulateur » — case à astérisque du cadre A. */
    regulateur?: boolean | null;
    regulateur_classe: string | null;
    /** Note de dimensionnement remise au bénéficiaire (cadre A). */
    note_dimensionnement?: boolean | null;
    /** Le système déporté consomme de l'énergie pour l'ECS (cadre A). */
    deporte_consomme_energie?: boolean | null;
    // Cadre A de l'AH (annexe 1 BAR-TH-171 vA78.4). Nullables et non requis :
    // les dossiers créés avant leur ajout n'en portent pas, et prétendre le
    // contraire au niveau du type ferait mentir la lecture.
    surface_chauffee_m2?: number | null;
    usage?: "chauffage" | "chauffage_ecs" | null;
    systeme_deporte?: boolean | null;
    deporte_marque?: string | null;
    deporte_reference?: string | null;
    /** Référence du modèle au sens du règlement (UE) 2017/1369 — base EPREL. */
    reference_modele?: string | null;
    /** Numéro d'agrément, cadre A vA82.5 pour les PAC bonifiées. */
    numero_agrement?: string | null;
  };
  /** Bloc technique du chauffe-eau thermodynamique (présent pour la famille cet). */
  cet?: {
    type_cet: "accumulation";
    fiche: string;
    /**
     * Efficacité énergétique pour le chauffage de l'eau (%), au profil déclaré.
     * Critère d'éligibilité depuis la vA78-4. Absente des dossiers antérieurs
     * à son ajout, d'où le type nullable.
     */
    efficacite_ecs?: number | null;
    /** Plus un critère depuis la vA78-4 : indicatif, souvent porté au devis. */
    cop: number | null;
    profil_soutirage: "M" | "L" | "XL";
    volume_l: number;
    marque: string | null;
    reference: string | null;
  };
  /** Bloc technique de l'appareil de chauffage au bois (présent pour la famille bois). */
  bois?: {
    type_bois: "appareil";
    fiche: string;
    combustible: "granules" | "buches";
    rendement: number;
    emissions_co: number | null;
    marque: string | null;
    reference: string | null;
  };
  /**
   * Bloc technique du chauffe-eau solaire individuel (famille solaire_thermique).
   * `profil_soutirage` admet XXL, que le bloc `cet` ne connaît pas : les deux
   * fiches ne définissent pas les mêmes profils.
   */
  solaire?: {
    type_solaire: "cesi";
    fiche: string;
    appoint: "electrique_joule" | "autre";
    fluide: "eau" | "eau_glycolee";
    surface_capteurs_m2: number;
    profil_soutirage: "M" | "L" | "XL" | "XXL";
    efficacite_ecs: number;
    nb_ballons: number;
    volume_ballon_l: number;
    classe_ballon: string | null;
    certification: "cstbat" | "solar_keymark" | "equivalence";
    /** Cases à astérisque du cadre A du BAR-TH-101. */
    couvre_totalite_ecs?: boolean | null;
    capteurs_non_hybrides?: boolean | null;
    marque: string | null;
    reference: string | null;
  };
  montants: {
    ht: number;
    ttc: number;
    prime_estime: number | null;
    aides_publiques_hors_cee?: number | null;
    /** Référence de la facture, portée au cadre A de l'AH (annexe 1). */
    facture_reference?: string | null;
  };
  rge: {
    numero: string;
    domaine: string;
    date_debut: string | null;
    date_fin: string;
  };
  /**
   * Titulaire du signe de qualité ayant réalisé l'opération quand ce n'est pas
   * le signataire de l'AH (cadre A des six fiches). `null` = pas de
   * sous-traitance ; `undefined` = dossier antérieur à la question, jamais posée.
   */
  sous_traitant?: {
    nom: string;
    prenom: string;
    raison_sociale: string;
    siret: string;
  } | null;
  /**
   * Résultat de la vérification SIRET + RGE contre les annuaires officiels,
   * figé à la création du dossier. Optionnel : absent des dossiers créés avant
   * l'introduction du contrôle (le moteur de règles retombe alors sur les seuls
   * contrôles de dates auto-déclarées).
   */
  verification?: VerificationEntreprise;
}

export interface DossierDates {
  /**
   * Date d'engagement de l'offre CEE (le « coup de pouce », matérialisée par le
   * cadre de contribution). Antérieure au devis, ou postérieure de quatorze jours
   * au plus et avant le début des travaux (art. R. 221-22 du code de l'énergie) :
   * c'est le rôle actif et incitatif, motif de refus CEE n° 1 et le seul
   * irrattrapable. Sans objet en MaPrimeRénov'. Absente des dossiers antérieurs à
   * l'introduction du contrôle (le moteur signale alors la date manquante en CEE).
   */
  offre_cee: string | null;
  /**
   * Antériorité de l'offre déclarée par l'artisan faute de date exacte.
   * `true` = déclarée antérieure au devis, `false` = déclarée postérieure,
   * `null`/absent = question sans réponse ou jamais posée (dossiers d'avant le
   * 2026-08-01). Ne vaut jamais conformité, seulement un avertissement : une
   * déclaration n'est pas une preuve d'antériorité.
   */
  offre_cee_anterieure_declaree?: boolean | null;
  visite_technique: string | null;
  devis: string;
  debut_travaux: string | null;
  fin_travaux: string | null;
  facture: string | null;
}

export interface DossierComplet {
  dossier: Dossier;
  artisan: Artisan | null;
  caracteristiques: CeeIsolationCaracteristiques;
  dates: DossierDates;
  /**
   * Règle métier active pour ce couple (dispositif, type_travaux), résolue une
   * fois ici. Les moteurs (contrôle, pièces) la lisent en synchrone, avec repli
   * sur leurs valeurs codées si null. Voir `regles_metier` (§7/§9.4).
   */
  regle: RegleMetierResolue | null;
}

/**
 * Charge un dossier + son artisan. Retourne null si introuvable OU si le
 * dossier n'appartient pas à l'artisan connecté : lecture via le client
 * auth-scopé, la RLS filtre. C'est la garde qui protège la vue `[id]` et les
 * routes PDF (récap, checklist, rapport).
 */
export async function getDossier(id: string): Promise<DossierComplet | null> {
  const supabase = await createClient();

  const { data: dossier, error } = await supabase
    .from("dossiers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !dossier) return null;

  let artisan: Artisan | null = null;
  if (dossier.artisan_id) {
    const { data } = await supabase
      .from("artisans")
      .select("*")
      .eq("id", dossier.artisan_id)
      .maybeSingle();
    artisan = data ?? null;
  }

  const regle = await fetchRegleActive(
    supabase,
    dossier.dispositif,
    dossier.type_travaux,
  );

  const caracteristiques =
    dossier.caracteristiques_techniques_json as unknown as CeeIsolationCaracteristiques;

  // Point de normalisation unique : un dossier antérieur au portage des quatre
  // profils stocke `precarite: "classique"` (modèle à trois bandes). On le lit
  // comme `intermediaire` (le violet, bande éligible qu'il recouvrait de fait pour
  // l'estimation) — sans quoi `PRECARITES["classique"]` serait `undefined` partout
  // (labels PDF/UI vides, barème introuvable). La migration 0046 corrige les lignes
  // en base ; ceci protège tout ce qui échapperait encore.
  if ((caracteristiques.beneficiaire?.precarite as string) === "classique") {
    caracteristiques.beneficiaire.precarite = "intermediaire";
  }

  return {
    dossier,
    artisan,
    caracteristiques,
    dates: dossier.dates_json as unknown as DossierDates,
    regle,
  };
}
