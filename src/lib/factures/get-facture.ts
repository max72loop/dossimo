import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Facture } from "@/lib/database.types";

/** Acheteur figé au moment de l'émission (instantané `acheteur_json`). */
export interface AcheteurFacture {
  entreprise: string | null;
  nom: string | null;
  prenom: string | null;
  email: string | null;
  siret: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
}

/** Ligne de prestation figée (instantané `lignes_json`). */
export interface LigneFacture {
  designation: string;
  detail: string;
  quantite: number;
  pu_ht_cents: number;
  total_ht_cents: number;
}

export interface FactureComplete {
  facture: Facture;
  acheteur: AcheteurFacture;
  lignes: LigneFacture[];
}

function decoder(facture: Facture): FactureComplete {
  return {
    facture,
    acheteur: (facture.acheteur_json ?? {}) as unknown as AcheteurFacture,
    lignes: (Array.isArray(facture.lignes_json)
      ? facture.lignes_json
      : []) as unknown as LigneFacture[],
  };
}

/**
 * Charge une facture via le client auth-scopé : la RLS ne laisse passer que
 * les factures de l'artisan connecté. Renvoie null sinon (y compris pour une
 * facture qui existe mais appartient à un autre artisan).
 */
export async function getFacture(id: string): Promise<FactureComplete | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("factures")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? decoder(data as Facture) : null;
}

/** Factures de l'artisan connecté, la plus récente d'abord. */
export async function listerFactures(): Promise<Facture[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("factures")
    .select("*")
    .order("emise_le", { ascending: false });
  return (data ?? []) as Facture[];
}
