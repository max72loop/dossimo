"use server";

import { revalidatePath } from "next/cache";

import { getDossier } from "@/lib/dossier/get-dossier";
import { accesDossier } from "@/lib/dossier/acces";
import { estimerPrime } from "@/lib/dossier/prime";
import { createClient } from "@/lib/supabase/server";
import {
  priceDossier,
  claimRefereeDiscount,
  applyCreditsToDossier,
  labelEuros,
} from "@/lib/pricing";

export type CreditsResult =
  | { ok: true; netCents: number; creditsCents: number; netLabel: string }
  | { ok: false; error: string };

/**
 * Applique les crédits parrain de l'artisan sur un dossier, avant paiement.
 * Auth-scopé : getDossier renvoie null si le dossier n'appartient pas à
 * l'artisan connecté (RLS), et la fonction SQL revérifie la propriété.
 *
 * On tarife d'abord (pose le palier + estimated_aid_cents depuis le barème),
 * puis on consomme les crédits en FIFO sur le prix net. Le checkout facturera
 * ensuite `final_price_cents`.
 */
export async function appliquerCreditsAuDossier(
  dossierId: string,
): Promise<CreditsResult> {
  const data = await getDossier(dossierId);
  if (!data) return { ok: false, error: "Dossier introuvable." };

  const acces = await accesDossier(data);
  if (acces.debloque) {
    return { ok: false, error: "Ce dossier est déjà débloqué." };
  }

  const aide = estimerPrime(data);
  if (!aide) {
    return {
      ok: false,
      error:
        "Montant d'aide non estimable : impossible de déterminer le palier. Complétez le dossier.",
    };
  }
  const aidCents = Math.round(aide.montant * 100);

  const supabase = await createClient();
  try {
    await priceDossier(supabase, dossierId, aidCents);
    await claimRefereeDiscount(supabase, dossierId);
    const withCredits = await applyCreditsToDossier(supabase, dossierId);
    const netCents = withCredits.final_price_cents ?? 0;
    const creditsCents = withCredits.credit_applied_cents ?? 0;
    revalidatePath(`/dossiers/${dossierId}`);
    return { ok: true, netCents, creditsCents, netLabel: labelEuros(netCents) };
  } catch (err) {
    console.error("[credits] apply:", err);
    return { ok: false, error: "Erreur lors de l'application des crédits." };
  }
}
