import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Database,
  Referral,
  ReferralCredit,
} from "@/lib/database.types";

/**
 * Parrainage artisan → artisan (migrations 0012/0013).
 *
 * Le filleul saisit un code à son 1er dossier (−30 €). Le parrain touche 50 € de
 * crédit SEULEMENT quand le filleul PAIE ce 1er dossier (déclenché par
 * `confirm_dossier_payment`, pas ici). Toute la validation vit dans la fonction
 * SQL `apply_referral_code` ; ce wrapper ne fait que la traduire en résultat
 * typé exploitable par l'UI.
 */

type Client = SupabaseClient<Database>;

export type ApplyReferralResult =
  | { ok: true; referral: Referral }
  | { ok: false; reason: ReferralError; message: string };

export type ReferralError =
  | "unknown_code" // code parrain inexistant
  | "already_paid" // le filleul a déjà payé un dossier (bonus réservé au 1er)
  | "already_referred" // le filleul a déjà utilisé un code
  | "unknown"; // erreur inattendue

/** Traduit l'erreur PostgREST d'`apply_referral_code` en cause métier. */
function classify(message: string): ReferralError {
  const m = message.toLowerCase();
  if (m.includes("inconnu")) return "unknown_code";
  if (m.includes("déjà payé") || m.includes("deja paye")) return "already_paid";
  if (m.includes("déjà utilisé") || m.includes("deja utilise"))
    return "already_referred";
  return "unknown";
}

/**
 * Applique un code parrain pour un filleul. Les cas « attendus » (code inconnu,
 * filleul déjà payant, déjà parrainé) reviennent en { ok:false } plutôt qu'en
 * exception. Un code valide mais auto-parrainage revient en { ok:true } avec
 * `referral.status = 'self_blocked'` (enregistré, sans remise).
 */
export async function applyReferralCode(
  client: Client,
  refereeId: string,
  code: string,
): Promise<ApplyReferralResult> {
  const { data, error } = await client.rpc("apply_referral_code", {
    p_referee_id: refereeId,
    p_code: code,
  });

  if (error) {
    return { ok: false, reason: classify(error.message), message: error.message };
  }
  return { ok: true, referral: data as Referral };
}

/** Crédits vivants (actifs, non expirés) du parrain, du plus proche au plus loin. */
export async function listActiveCredits(
  client: Client,
  artisanId: string,
): Promise<ReferralCredit[]> {
  const { data, error } = await client
    .from("referral_credits")
    .select("*")
    .eq("artisan_id", artisanId)
    .eq("status", "active")
    .order("expires_at", { ascending: true });
  if (error) throw new Error(`referral_credits: ${error.message}`);
  return data ?? [];
}

export interface ReferralOverview {
  code: string | null;
  balanceCents: number;
  /** Parrainages émis par cet artisan (en tant que parrain). */
  referrals: Referral[];
  credits: ReferralCredit[];
}

/**
 * Vue d'ensemble pour l'espace artisan : son code, son solde matérialisé, ses
 * parrainages et ses crédits. Auth-scopé par la RLS.
 */
export async function getReferralOverview(
  client: Client,
  artisanId: string,
): Promise<ReferralOverview> {
  const [{ data: artisan }, referrals, credits] = await Promise.all([
    client
      .from("artisans")
      .select("referral_code, credit_balance_cents")
      .eq("id", artisanId)
      .maybeSingle(),
    client
      .from("referrals")
      .select("*")
      .eq("referrer_id", artisanId)
      .order("created_at", { ascending: false }),
    client
      .from("referral_credits")
      .select("*")
      .eq("artisan_id", artisanId)
      .order("expires_at", { ascending: true }),
  ]);

  return {
    code: artisan?.referral_code ?? null,
    balanceCents: artisan?.credit_balance_cents ?? 0,
    referrals: referrals.data ?? [],
    credits: credits.data ?? [],
  };
}
