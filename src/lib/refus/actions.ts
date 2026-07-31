"use server";

import { consumeAuthRateLimit } from "@/lib/auth/rate-limit";
import { editeur } from "@/lib/legal/editeur";
import { instantaneConsentements } from "@/lib/refus/consentements";
import { demandeRefusSchema } from "@/lib/refus/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/database.types";

/**
 * Dépôt d'une demande de diagnostic de refus, depuis `/refus`, sans compte.
 *
 * L'écriture passe en service-role : `refus_demandes` est en RLS SANS POLICY
 * (migration 0053), comme `leads`. Aucune policy anonyme n'est ouverte sur une
 * table qui contient un e-mail, un téléphone et le récit d'un dossier refusé.
 */

/** Adresse de repli, affichée quand la soumission ne peut pas aboutir. */
export const EMAIL_REPLI = editeur.emailContact;

export type SoumettreDemandeResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      /** Vrai quand l'artisan doit pouvoir passer par l'e-mail : l'UI affiche EMAIL_REPLI. */
      repliEmail?: true;
      fieldErrors?: Record<string, string[]>;
    };

export async function soumettreDemandeRefus(
  input: unknown,
): Promise<SoumettreDemandeResult> {
  const parsed = demandeRefusSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Certains champs sont incomplets.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const d = parsed.data;

  // --- 1. Honeypot ---
  // Le champ invisible est validé par le schéma (max 0 caractère), donc un robot
  // qui le remplit est déjà sorti plus haut. Rien à refaire ici.

  // --- 2. Anti-flood, borné par IP, EN MODE FERMÉ ---
  //
  // Différence assumée avec `submitLead` (src/lib/landing/actions.ts), qui laisse
  // passer si le limiteur est en panne pour ne jamais perdre un lead. Ici on
  // refuse dans les DEUX cas, quota comme panne, pour une raison de nature :
  // cette route reçoit un texte libre de 4 000 caractères et nourrit une file de
  // traitement MANUEL. Un limiteur muet, c'est une file noyée que personne ne
  // dépile, donc des artisans qui attendent un diagnostic qui n'arrivera pas.
  // Mieux vaut refuser franchement et donner une adresse e-mail : une demande
  // envoyée à la main arrive quand même, un formulaire qui inonde la file coûte
  // à tout le monde.
  //
  // Clé bornée par IP, surtout PAS par e-mail : l'adresse est saisie par
  // l'appelant, la faire entrer dans la clé laisserait repartir à zéro à chaque
  // envoi (cf. `consumeAuthRateLimit`).
  const verdict = await consumeAuthRateLimit("refus", "", 5);
  if (verdict !== "ok") {
    return {
      ok: false,
      repliEmail: true,
      error:
        verdict === "quota"
          ? "Trop de demandes envoyées depuis votre connexion. Réessayez dans quelques minutes, ou écrivez-nous directement."
          : "Le formulaire est momentanément indisponible. Écrivez-nous directement, votre demande sera traitée de la même façon.",
    };
  }

  // --- 3. Écriture ---
  // Le consentement est horodaté ICI, au moment où la demande est acceptée, et
  // accompagné du TEXTE EXACT qui était affiché (source unique :
  // consentements.ts). Une case cochée sans son libellé ne prouve rien.
  const consentements = instantaneConsentements();

  const { error } = await createAdminClient()
    .from("refus_demandes")
    .insert({
      profil: d.profil,
      aide: d.aide ?? null,
      geste: d.geste,
      email: d.email,
      telephone: d.telephone,
      date_notification: d.date_notification,
      motif_libre: d.motif_libre,
      consentement_contact_at: new Date().toISOString(),
      consentements_version: consentements.version,
      consentements_texte: consentements.textes as unknown as Json,
      utm_source: d.utm_source,
      utm_medium: d.utm_medium,
      utm_campaign: d.utm_campaign,
    });

  // Fail loud : une demande avalée en silence, c'est un artisan qui attend une
  // réponse à une demande qui n'existe nulle part (AGENTS.md).
  if (error) {
    console.error("[refus] insertion échouée:", error.message);
    return {
      ok: false,
      repliEmail: true,
      error:
        "Impossible d'enregistrer votre demande pour le moment. Réessayez dans un instant, ou écrivez-nous directement.",
    };
  }

  return { ok: true };
}
