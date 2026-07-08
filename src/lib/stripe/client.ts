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

// La tarification (par palier selon la taille du dossier) vit dans
// src/lib/stripe/pricing.ts.
