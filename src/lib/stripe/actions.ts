"use server";

import { getDossier } from "@/lib/dossier/get-dossier";
import { accesDossier } from "@/lib/dossier/acces";
import { estimerPrime } from "@/lib/dossier/prime";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  priceDossier,
  claimRefereeDiscount,
  confirmDossierPayment,
  labelEuros,
} from "@/lib/pricing";

export type PaiementResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/**
 * Crée une session Stripe Checkout pour débloquer le pack d'un dossier (paiement
 * ponctuel).
 *
 * Le prix vient du système à paliers (migrations 0012/0013), source de vérité
 * unique : on tarife le dossier depuis l'aide ESTIMÉE (recalculée serveur via le
 * barème piloté par la règle métier), ce qui pose `estimated_aid_cents` et
 * recalcule `final_price_cents` (déjà nette de la remise filleul et des crédits
 * parrain éventuellement appliqués). On facture ce montant net, jamais un prix
 * fourni par le client.
 *
 * Auth-scopé : getDossier renvoie null si le dossier n'appartient pas à
 * l'artisan connecté. C'est le webhook (service-role) qui, à l'encaissement,
 * fige le prix et déclenche la récompense parrain.
 */
export async function creerSessionPaiementDossier(
  dossierId: string,
): Promise<PaiementResult> {
  if (!isStripeConfigured()) {
    return { ok: false, error: "Le paiement n'est pas encore activé." };
  }

  const data = await getDossier(dossierId);
  if (!data) return { ok: false, error: "Dossier introuvable." };

  const acces = await accesDossier(data);
  if (acces.debloque) {
    return { ok: false, error: "Ce dossier est déjà débloqué." };
  }

  // Aide estimée = base du palier. Recalculée serveur depuis le barème (jamais
  // un montant fourni par le client). Sans barème estimable, pas de tarif fiable.
  const aide = estimerPrime(data);
  if (!aide) {
    return {
      ok: false,
      error:
        "Montant d'aide non estimable pour ce dossier : impossible de déterminer le palier. Complétez le dossier (surface, profil de revenus) ou le barème.",
    };
  }
  const aidCents = Math.round(aide.montant * 100);

  const supabase = await createClient();

  let finalCents: number;
  try {
    // Pose le palier + estimated_aid_cents, réclame la remise filleul (−30 € si
    // 1er dossier payant d'un parrainage), puis lit le prix net. Ce dossier est
    // forcément PAYANT (le contrôle acces.debloque plus haut a écarté l'offert).
    await priceDossier(supabase, dossierId, aidCents);
    const priced = await claimRefereeDiscount(supabase, dossierId);
    finalCents = priced.final_price_cents ?? priced.base_price_cents ?? 0;
  } catch (err) {
    console.error("[stripe] price_dossier:", err);
    return { ok: false, error: "Erreur lors du calcul du prix." };
  }

  // Entièrement couvert par les crédits parrain : rien à encaisser via Stripe.
  // On confirme côté serveur (service-role) et on enregistre un paiement à 0 €
  // pour débloquer le livrable, puis on déclenche la récompense parrain.
  if (finalCents <= 0) {
    try {
      const admin = createAdminClient();
      await admin.from("paiements").insert({
        dossier_id: data.dossier.id,
        artisan_id: data.dossier.artisan_id,
        montant: 0,
        statut: "paye",
        type: "ponctuel",
      });
      await confirmDossierPayment(admin, data.dossier.id);
    } catch (err) {
      console.error("[stripe] règlement par crédits:", err);
      return { ok: false, error: "Erreur lors du règlement par crédits." };
    }
    return { ok: true, url: `${siteUrl()}/dossiers/${data.dossier.id}?paye=1` };
  }

  const { prenom, nom } = data.caracteristiques.beneficiaire;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: finalCents,
            product_data: {
              name: `Pack Dossimo, dossier ${prenom} ${nom}`,
              description: `Contrôle anti-refus + pack documentaire (${data.caracteristiques.fiche}). ${labelEuros(finalCents)}.`,
            },
          },
        },
      ],
      metadata: {
        dossier_id: data.dossier.id,
        artisan_id: data.dossier.artisan_id ?? "",
      },
      success_url: `${siteUrl()}/dossiers/${data.dossier.id}?paye=1`,
      cancel_url: `${siteUrl()}/dossiers/${data.dossier.id}?annule=1`,
    });

    if (!session.url) {
      return { ok: false, error: "Impossible d'ouvrir le paiement. Réessayez." };
    }
    return { ok: true, url: session.url };
  } catch (err) {
    console.error("[stripe] session:", err);
    return { ok: false, error: "Erreur lors de l'ouverture du paiement." };
  }
}
