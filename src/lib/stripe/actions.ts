"use server";

import { getDossier } from "@/lib/dossier/get-dossier";
import { CODE_LANCEMENT, FIN_LANCEMENT_EPOCH, REMISE_LANCEMENT } from "@/lib/lancement";
import { accesDossier } from "@/lib/dossier/acces";
import { estimerPrime, raisonNonEstimable } from "@/lib/dossier/prime";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emettreFacture } from "@/lib/factures/emettre";
import {
  priceDossier,
  claimRefereeDiscount,
  confirmDossierPayment,
  labelEuros,
} from "@/lib/pricing";
import { redirect } from "next/navigation";

/** Codes que le client sait traiter autrement qu'en simple message d'erreur. */
export type PaiementCode = "adresse_manquante" | "aide_non_estimable";

export type PaiementResult =
  | { ok: true; url: string }
  /** `code` permet au client de réagir (ex. afficher le formulaire d'adresse). */
  | { ok: false; error: string; code?: PaiementCode };

export type PaiementFormState =
  | { error: null; code: null }
  | { error: string; code: PaiementCode | null };

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

// Mention de non-affiliation affichée sur la page Stripe Checkout, sous le
// bouton de paiement. Reprend mot pour mot le pied de page (site-footer.tsx) :
// même positionnement, même engagement juridique, partout où le client paie
// (CLAUDE.md §2). Stripe plafonne custom_text à 1200 caractères.
const MENTION_INDEPENDANCE =
  "Dossimo est un service indépendant d'aide à la préparation de dossier, " +
  "non affilié à l'Anah ni à France Rénov'. Dossimo ne dépose jamais le " +
  "dossier et ne perçoit jamais la prime : vous et votre client déposez " +
  "vous-mêmes et conservez l'intégralité de la prime.";

async function garantirCodeLancement(stripe: ReturnType<typeof getStripe>) {
  if (Math.floor(Date.now() / 1000) > FIN_LANCEMENT_EPOCH) return;
  const existants = await stripe.promotionCodes.list({ code: CODE_LANCEMENT, active: true, limit: 1 });
  const existant = existants.data[0];
  if (existant?.expires_at === FIN_LANCEMENT_EPOCH) return;
  if (existant) await stripe.promotionCodes.update(existant.id, { active: false });
  // L'id change avec la date de fin : un coupon Stripe déjà créé garde son
  // `redeem_by` d'origine (retrieve réussit, create est sauté), donc prolonger la
  // fenêtre sans changer l'id laisserait le coupon expirer au 26 malgré un code
  // promo au 31. Nouvel id => nouveau coupon avec le bon `redeem_by`.
  const couponId = "dossimo-lancement-2026-50-31juillet";
  try {
    await stripe.coupons.retrieve(couponId);
  } catch {
    // `name` Stripe est plafonné à 40 caractères : le dépasser fait échouer la
    // création du coupon (400), donc garantirCodeLancement() lèverait à chaque
    // ouverture de paiement pendant toute la fenêtre de lancement.
    await stripe.coupons.create({ id: couponId, percent_off: REMISE_LANCEMENT * 100, duration: "once", name: "Lancement Dossimo : 50% premier dossier", redeem_by: FIN_LANCEMENT_EPOCH });
  }
  await stripe.promotionCodes.create({ promotion: { type: "coupon", coupon: couponId }, code: CODE_LANCEMENT, expires_at: FIN_LANCEMENT_EPOCH, restrictions: { first_time_transaction: true } });
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
    // Deux causes, un seul geste (déblocage manuel), mais un message distinct :
    // « surface » est réparable côté artisan, « structurel » est une dette de
    // barème (profil MPR « classique », couple sans barème). Le client rend un
    // bloc de reprise avec un contact, jamais un cul-de-sac technique.
    const raison = raisonNonEstimable(data);
    return {
      ok: false,
      code: "aide_non_estimable",
      error:
        raison === "surface"
          ? "La surface isolée n'a pas été renseignée à la création, donc l'aide et le palier ne peuvent pas être calculés."
          : "On ne peut pas estimer l'aide sur ce profil pour l'instant, donc aucun palier de prix ne peut être fixé automatiquement.",
    };
  }
  const aidCents = Math.round(aide.montant * 100);

  const supabase = await createClient();

  // Adresse de facturation : mention obligatoire sur la facture (art. 242
  // nonies A du CGI). On la réclame AVANT d'encaisser — après le paiement, il
  // serait trop tard pour émettre une facture conforme.
  const { data: fiche } = await supabase
    .from("artisans")
    .select("adresse, code_postal, ville")
    .eq("id", data.dossier.artisan_id ?? "")
    .maybeSingle();
  if (!fiche?.adresse || !fiche.code_postal || !fiche.ville) {
    return {
      ok: false,
      code: "adresse_manquante",
      error:
        "Complétez votre adresse de facturation pour recevoir une facture conforme.",
    };
  }

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
      const { data: paiement, error } = await admin
        .from("paiements")
        .insert({
          dossier_id: data.dossier.id,
          artisan_id: data.dossier.artisan_id,
          montant: 0,
          statut: "paye",
          type: "ponctuel",
        })
        .select("id")
        .single();
      if (error) throw error;
      await confirmDossierPayment(admin, data.dossier.id);
      // Une vente à 0 € reste une vente : elle donne lieu à facture, au même
      // titre qu'un encaissement Stripe. La remise apparaît par le montant nul.
      await emettreFacture(admin, paiement.id);
    } catch (err) {
      console.error("[stripe] règlement par crédits:", err);
      return { ok: false, error: "Erreur lors du règlement par crédits." };
    }
    return { ok: true, url: `${siteUrl()}/dossiers/${data.dossier.id}?paye=1` };
  }

  const { prenom, nom } = data.caracteristiques.beneficiaire;

  try {
    const stripe = getStripe();
    await garantirCodeLancement(stripe);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Force la page Checkout en français quel que soit le navigateur du client.
      locale: "fr",
      allow_promotion_codes: Math.floor(Date.now() / 1000) <= FIN_LANCEMENT_EPOCH,
      // Case à cocher CGV obligatoire avant paiement. REQUIERT que l'URL des
      // CGV soit renseignée dans le Dashboard Stripe (Réglages > Informations
      // publiques > Conditions générales), EN TEST ET EN LIVE : sans elle,
      // Stripe rejette la création de session. URL attendue : dossimo.app/cgv.
      consent_collection: { terms_of_service: "required" },
      custom_text: {
        submit: { message: MENTION_INDEPENDANCE },
        terms_of_service_acceptance: {
          message:
            "En réglant, vous acceptez les conditions générales de vente de Dossimo.",
        },
      },
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

/**
 * Action de formulaire progressive : le clic de paiement est mis en file par
 * React même si l'hydratation n'est pas terminée, puis redirige côté serveur.
 */
export async function ouvrirPaiementDossier(
  dossierId: string,
  _previous: PaiementFormState,
): Promise<PaiementFormState> {
  void _previous;
  const result = await creerSessionPaiementDossier(dossierId);
  if (result.ok) redirect(result.url);
  return { error: result.error, code: result.code ?? null };
}
