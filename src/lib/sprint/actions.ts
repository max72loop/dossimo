"use server";

import { revalidatePath } from "next/cache";

import { getAdminEmail } from "@/lib/auth/is-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { jourParis, type ModeSprint } from "./lot";

/**
 * Marquages du sprint de prospection (plan v3, §12, outil 2), en service-role.
 *
 * L'envoi lui-même reste manuel (l'humain copie-colle et clique). Ces actions ne
 * font qu'enregistrer l'état dans `prospects_dossimo` après coup : « envoyé » pose
 * la date, « STOP » pose l'opt-out. Toujours gardées par l'auth admin.
 */

async function exigerAdmin(): Promise<void> {
  if (!(await getAdminEmail())) throw new Error("Accès non autorisé.");
}

/**
 * Pose la date du jour (heure de Paris) sur la colonne correspondant au mode.
 *
 * Trois colonnes distinctes plutôt qu'un compteur : c'est ce qui rend la
 * sélection des lots rejouable et l'A/B mesurable. `date_envoi` et
 * `date_relance` sont uniques par contact ; `date_nurturing` est écrasée à
 * chaque édition mensuelle, seule la dernière compte pour l'éligibilité.
 */
type PatchDate = { date_envoi: string } | { date_relance: string } | { date_nurturing: string };

/** Le patch est construit par mode : la colonne écrite ne vient jamais du client. */
function patchDuMode(mode: ModeSprint, jour: string): PatchDate {
  switch (mode) {
    case "relance":
      return { date_relance: jour };
    case "nurturing":
      return { date_nurturing: jour };
    default:
      return { date_envoi: jour };
  }
}

/** Marque un contact comme traité pour le mode courant (premier / relance / nurturing). */
export async function marquerEnvoye(formData: FormData): Promise<void> {
  await exigerAdmin();
  const placeId = String(formData.get("place_id") ?? "");
  if (!placeId) return;
  const modeBrut = String(formData.get("mode") ?? "premier");
  // Mode inconnu : on retombe sur `premier` plutôt que d'écrire une colonne
  // arbitraire depuis une valeur venue du client.
  const mode: ModeSprint =
    modeBrut === "relance" || modeBrut === "nurturing" ? modeBrut : "premier";
  const admin = createAdminClient();
  await admin
    .from("prospects_dossimo")
    .update(patchDuMode(mode, jourParis()))
    .eq("place_id", placeId);
  revalidatePath("/admin/sprint");
}

/**
 * Enregistre une réponse du contact. Elle le sort de la prospection active :
 * plus de relance, plus de nurturing. C'est aussi l'un des cinq chiffres du
 * pilotage (plan §11).
 */
export async function marquerReponse(formData: FormData): Promise<void> {
  await exigerAdmin();
  const placeId = String(formData.get("place_id") ?? "");
  if (!placeId) return;
  const admin = createAdminClient();
  await admin
    .from("prospects_dossimo")
    .update({ reponse: true })
    .eq("place_id", placeId);
  revalidatePath("/admin/sprint");
}

/**
 * Pose `opt_out = true` (STOP). Priorité RGPD : un refus est enregistré le jour
 * même, définitivement. Le contact ne ressortira plus dans aucun lot.
 */
export async function marquerStop(formData: FormData): Promise<void> {
  await exigerAdmin();
  const placeId = String(formData.get("place_id") ?? "");
  if (!placeId) return;
  const admin = createAdminClient();
  await admin
    .from("prospects_dossimo")
    .update({ opt_out: true })
    .eq("place_id", placeId);
  revalidatePath("/admin/sprint");
}
