import { createClient } from "@/lib/supabase/server";
import type { Artisan, Dossier } from "@/lib/database.types";
import type {
  OCCUPATIONS,
  PRECARITES,
  LOGEMENT_TYPES,
  RESIDENCES,
  TypeIsolation,
} from "@/lib/dossier/cee-isolation";

/** Forme typée de `caracteristiques_techniques_json` pour un dossier CEE isolation. */
export interface CeeIsolationCaracteristiques {
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
  travaux: {
    type_isolation: TypeIsolation;
    fiche: string;
    surface_isolee_m2: number;
    isolant_type: string;
    isolant_marque: string | null;
    isolant_reference: string | null;
    resistance_thermique_r: number;
    epaisseur_mm: number | null;
  };
  montants: {
    ht: number;
    ttc: number;
    prime_estime: number | null;
  };
  rge: {
    numero: string;
    domaine: string;
    date_debut: string | null;
    date_fin: string;
  };
}

export interface DossierDates {
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

  return {
    dossier,
    artisan,
    caracteristiques:
      dossier.caracteristiques_techniques_json as unknown as CeeIsolationCaracteristiques,
    dates: dossier.dates_json as unknown as DossierDates,
  };
}
