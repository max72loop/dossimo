import type Stripe from "stripe";

import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmDossierPayment } from "@/lib/pricing";
import { emettreFacture } from "@/lib/factures/emettre";

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

      const { data: insere, error } = await admin
        .from("paiements")
        .insert({
          dossier_id: dossierId,
          artisan_id: artisanId,
          stripe_id: session.id,
          montant: (session.amount_total ?? 0) / 100,
          statut: "paye",
          type: "ponctuel",
        })
        .select("id")
        .maybeSingle();

      // 23505 = doublon (webhook rejoué) : déjà enregistré, on acquitte.
      if (error && error.code !== "23505") {
        console.error("[stripe] enregistrement paiement:", error.message);
        return new Response("Erreur d'enregistrement.", { status: 500 });
      }

      // Sur rejeu, l'insert ne rend pas de ligne : on relit le paiement existant
      // pour pouvoir (ré)émettre la facture de façon idempotente.
      let paiementId = insere?.id ?? null;
      if (!paiementId) {
        const { data: existant } = await admin
          .from("paiements")
          .select("id")
          .eq("stripe_id", session.id)
          .maybeSingle();
        paiementId = existant?.id ?? null;
      }

      // Fige le prix du dossier et déclenche la récompense parrain. Idempotent
      // côté SQL (no-op si déjà figé) : un rejeu Stripe ne double pas le crédit.
      // En cas d'échec, on renvoie 500 pour que Stripe réessaie (l'insert de
      // paiement ci-dessus retombera alors en 23505, acquitté).
      if (dossierId) {
        try {
          await confirmDossierPayment(admin, dossierId);
        } catch (err) {
          console.error("[stripe] confirm_dossier_payment:", err);
          return new Response("Erreur de confirmation.", { status: 500 });
        }
      }

      // Facture : émise à l'encaissement, jamais à la demande. Idempotente, donc
      // sans risque au rejeu. En cas d'échec on renvoie 500 pour que Stripe
      // réessaie : un paiement encaissé sans facture est un manquement.
      if (paiementId) {
        try {
          await emettreFacture(admin, paiementId);
        } catch (err) {
          console.error("[stripe] emettre_facture:", err);
          return new Response("Erreur de facturation.", { status: 500 });
        }
      }
    }
  }

  return new Response("ok", { status: 200 });
}
