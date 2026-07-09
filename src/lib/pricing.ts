import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Database,
  Dossier,
  PricingTier,
} from "@/lib/database.types";

/**
 * Pricing 3 paliers indexé sur le montant d'AIDE ESTIMÉE (migrations 0012/0013).
 *
 * Ce module ne code AUCUN seuil en dur : les paliers vivent dans la table
 * `pricing_tiers`. Les fonctions pures (computeQuote/selectTier) servent à la
 * fois à l'affichage simulation et aux tests ; les wrappers RPC délèguent tout
 * calcul monétaire aux fonctions SQL SECURITY DEFINER (jamais de prix accepté
 * depuis le client).
 */

type Client = SupabaseClient<Database>;

/** Garde-fou : au-delà, le forfait dépasse une part jugée trop grande de l'aide. */
export const MAX_PRICE_RATIO = 0.12;

export interface Quote {
  /** Palier retenu, ou null si l'aide ne tombe dans aucun palier actif. */
  tier: Pick<PricingTier, "id" | "name" | "price_cents"> | null;
  aidCents: number;
  priceCents: number | null;
  /** true si priceCents > 12 % de l'aide estimée. */
  priceWarning: boolean;
}

/**
 * Sélectionne le palier d'une aide donnée. Bornes inclusives des deux côtés,
 * `aid_max_cents` null = sans plafond. On ne considère que les paliers actifs
 * et on prend le plus bas qui matche (les paliers ne se chevauchent pas).
 */
export function selectTier(
  aidCents: number,
  tiers: readonly PricingTier[],
): PricingTier | null {
  const eligibles = tiers
    .filter((t) => t.active)
    .filter(
      (t) =>
        aidCents >= t.aid_min_cents &&
        (t.aid_max_cents == null || aidCents <= t.aid_max_cents),
    )
    .sort((a, b) => a.aid_min_cents - b.aid_min_cents);
  return eligibles[0] ?? null;
}

/**
 * Devis pur (sans persistance) : palier + prix + drapeau de garde-fou 12 %.
 * Miroir exact de la logique de `price_dossier()` côté SQL.
 */
export function computeQuote(
  aidCents: number,
  tiers: readonly PricingTier[],
): Quote {
  const tier = selectTier(aidCents, tiers);
  if (!tier) {
    return { tier: null, aidCents, priceCents: null, priceWarning: false };
  }
  return {
    tier: { id: tier.id, name: tier.name, price_cents: tier.price_cents },
    aidCents,
    priceCents: tier.price_cents,
    priceWarning: tier.price_cents > MAX_PRICE_RATIO * aidCents,
  };
}

/**
 * Prix du pack pour AFFICHAGE, calculé sur l'aide estimée via la grille à
 * paliers (même source de vérité que le checkout). Charger `tiers` une seule
 * fois (getActiveTiers) puis appeler par dossier dans une liste. Renvoie "—"
 * si l'aide est inconnue ou hors de tout palier.
 */
export function prixPack(
  aidCents: number | null,
  tiers: readonly PricingTier[],
): { cents: number | null; label: string } {
  if (aidCents == null) return { cents: null, label: "—" };
  const q = computeQuote(aidCents, tiers);
  if (q.priceCents == null) return { cents: null, label: "—" };
  return { cents: q.priceCents, label: labelEuros(q.priceCents) };
}

/** Libellé euros compact ("49 €", "12,50 €"). */
export function labelEuros(cents: number): string {
  return (
    (cents / 100).toLocaleString("fr-FR", {
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }) + " €"
  );
}

/** Charge les paliers actifs (référentiel lisible par tout utilisateur connecté). */
export async function getActiveTiers(client: Client): Promise<PricingTier[]> {
  const { data, error } = await client
    .from("pricing_tiers")
    .select("*")
    .eq("active", true)
    .order("aid_min_cents", { ascending: true });
  if (error) throw new Error(`pricing_tiers: ${error.message}`);
  return data ?? [];
}

/**
 * Devis d'affichage pour la simulation : lit les paliers en base puis calcule,
 * sans rien persister sur le dossier.
 */
export async function getQuote(
  client: Client,
  estimatedAidCents: number,
): Promise<Quote> {
  const tiers = await getActiveTiers(client);
  return computeQuote(estimatedAidCents, tiers);
}

// ---------------------------------------------------------------------------
// Wrappers RPC typés. Le calcul reste 100 % serveur (fonctions SQL atomiques).
// ---------------------------------------------------------------------------

/**
 * Tarife un dossier (pose le palier, ne fige pas). `estimatedAidCents`, quand
 * fourni, est recalculé côté serveur depuis le barème et fait foi : c'est la
 * seule voie autorisée à écrire `estimated_aid_cents` (le trigger de garde
 * bloque toute écriture directe par le client).
 */
export async function priceDossier(
  client: Client,
  dossierId: string,
  estimatedAidCents?: number | null,
): Promise<Dossier> {
  const { data, error } = await client.rpc("price_dossier", {
    p_dossier_id: dossierId,
    ...(estimatedAidCents != null
      ? { p_estimated_aid_cents: estimatedAidCents }
      : {}),
  });
  if (error) throw new Error(`price_dossier: ${error.message}`);
  return data as Dossier;
}

/**
 * Réclame la remise filleul (−30 €) sur ce dossier s'il est le 1er dossier
 * PAYANT d'un filleul avec un parrainage en attente. À appeler au checkout,
 * après priceDossier. No-op si aucune remise à réclamer ou prix déjà figé.
 */
export async function claimRefereeDiscount(
  client: Client,
  dossierId: string,
): Promise<Dossier> {
  const { data, error } = await client.rpc("claim_referee_discount", {
    p_dossier_id: dossierId,
  });
  if (error) throw new Error(`claim_referee_discount: ${error.message}`);
  return data as Dossier;
}

/** Consomme les crédits parrain (FIFO par expiration) sur le prix du dossier. */
export async function applyCreditsToDossier(
  client: Client,
  dossierId: string,
): Promise<Dossier> {
  const { data, error } = await client.rpc("apply_credits_to_dossier", {
    p_dossier_id: dossierId,
  });
  if (error) throw new Error(`apply_credits_to_dossier: ${error.message}`);
  return data as Dossier;
}

/**
 * Confirme le paiement : fige le prix et déclenche la récompense parrain.
 * À n'appeler que depuis un contexte de confiance (webhook Stripe, service-role).
 * Idempotent côté SQL.
 */
export async function confirmDossierPayment(
  admin: Client,
  dossierId: string,
): Promise<Dossier> {
  const { data, error } = await admin.rpc("confirm_dossier_payment", {
    p_dossier_id: dossierId,
  });
  if (error) throw new Error(`confirm_dossier_payment: ${error.message}`);
  return data as Dossier;
}

/** Passe les crédits échus en `expired`. À appeler par un cron/service-role. */
export async function expireOldCredits(admin: Client): Promise<number> {
  const { data, error } = await admin.rpc("expire_old_credits", {});
  if (error) throw new Error(`expire_old_credits: ${error.message}`);
  return (data as number | null) ?? 0;
}
