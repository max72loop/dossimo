"use server";

import { revalidatePath } from "next/cache";

import { getAdminEmail } from "@/lib/auth/is-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "./lot";

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

/** Pose `date_envoi = aujourd'hui` (heure de Paris) sur un contact. */
export async function marquerEnvoye(formData: FormData): Promise<void> {
  await exigerAdmin();
  const placeId = String(formData.get("place_id") ?? "");
  if (!placeId) return;
  const admin = createAdminClient();
  await admin
    .from("prospects_dossimo")
    .update({ date_envoi: jourParis() })
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
