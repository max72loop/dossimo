import type Stripe from "stripe";

import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Webhook Stripe : confirme les paiements encaissés. Signature vérifiée (corps
 * brut) ; écriture en service-role (bypass RLS). Idempotent : une réception
 * dupliquée par Stripe ne crée pas de doublon (index unique sur stripe_id).
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isStripeConfigured() || !secret || secret.includes("...")) {
    return new Response("Paiement non configuré.", { status: 400 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Signature manquante.", { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(body, sig, secret);
  } catch (err) {
    console.error("[stripe] signature invalide:", err);
    return new Response("Signature invalide.", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") {
      const dossierId = session.metadata?.dossier_id || null;
      const artisanId = session.metadata?.artisan_id || null;
      const admin = createAdminClient();

      const { error } = await admin.from("paiements").insert({
        dossier_id: dossierId,
        artisan_id: artisanId,
        stripe_id: session.id,
        montant: (session.amount_total ?? 0) / 100,
        statut: "paye",
        type: "ponctuel",
      });

      // 23505 = doublon (webhook rejoué) : déjà enregistré, on acquitte.
      if (error && error.code !== "23505") {
        console.error("[stripe] enregistrement paiement:", error.message);
        return new Response("Erreur d'enregistrement.", { status: 500 });
      }
    }
  }

  return new Response("ok", { status: 200 });
}
