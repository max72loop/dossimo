import "server-only";

import Stripe from "stripe";

/**
 * Client Stripe (server-only). Le paiement passe par Stripe Checkout hébergé :
 * aucune donnée de carte ne transite par Dossimo.
 */

/** true si une clé secrète Stripe réelle est configurée (placeholders exclus). */
export function isStripeConfigured(): boolean {
  const k = process.env.STRIPE_SECRET_KEY;
  return !!k && k.startsWith("sk_") && !k.includes("...");
}

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY manquant.");
  if (!cached) cached = new Stripe(key);
  return cached;
}

/**
 * Prix d'un dossier (produit ponctuel). Configurable par env — le pricing n'est
 * pas figé (CLAUDE.md §10). Défaut : 149 €.
 */
export const PRIX_DOSSIER_CENTS: number = (() => {
  const n = Number(process.env.STRIPE_PRICE_CENTS);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 14900;
})();

export const PRIX_DOSSIER_LABEL: string = (PRIX_DOSSIER_CENTS / 100).toLocaleString(
  "fr-FR",
  { minimumFractionDigits: PRIX_DOSSIER_CENTS % 100 === 0 ? 0 : 2 },
) + " €";
