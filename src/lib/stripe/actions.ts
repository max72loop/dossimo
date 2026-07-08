"use server";

import { getDossier } from "@/lib/dossier/get-dossier";
import { accesDossier } from "@/lib/dossier/acces";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { prixDossier } from "@/lib/stripe/pricing";

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
 * ponctuel). Auth-scopé : getDossier renvoie null si le dossier n'appartient pas
 * à l'artisan connecté. L'appartenance est reportée dans les métadonnées ; c'est
 * le webhook (service-role) qui enregistre le paiement encaissé.
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

  const { prenom, nom } = data.caracteristiques.beneficiaire;
  const prix = prixDossier(data);

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: prix.cents,
            product_data: {
              name: `Pack Dossimo, dossier ${prenom} ${nom}`,
              description: `Contrôle anti-refus + pack documentaire (${data.caracteristiques.fiche}).`,
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
