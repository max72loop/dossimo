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
  const { error } = await admin
    .from("prospects_dossimo")
    .update(patchDuMode(mode, jourParis()))
    .eq("place_id", placeId);
  // On lève au lieu d'ignorer : sans ça, un échec d'écriture laissait l'UI
  // afficher un succès et le contact ressortait dans le lot du lendemain, où il
  // aurait été recontacté. Les cinq chiffres du pilotage A/B divergeaient aussi
  // du réel, en silence.
  if (error) throw new Error(`Marquage « ${mode} » impossible : ${error.message}`);
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
  const { error } = await admin
    .from("prospects_dossimo")
    .update({ reponse: true })
    .eq("place_id", placeId);
  if (error) throw new Error(`Marquage de la réponse impossible : ${error.message}`);
  revalidatePath("/admin/sprint");
}

/**
 * Enregistre un STOP. Priorité RGPD : un refus est enregistré le jour même,
 * définitivement, et le contact ne ressort dans aucun lot.
 *
 * DEUX ÉCRITURES, et les deux comptent :
 *  1. `prospection_suppressions` (clé = e-mail) : la preuve DURABLE de
 *     l'opposition, exigible en cas de contrôle. Elle ne se purge jamais et
 *     survit à tout réimport du fichier.
 *  2. `prospects_dossimo.opt_out` : le drapeau de confort qui sort le contact
 *     des lots. Il est NON durable : un `default false` sur une colonne d'une
 *     table réimportable veut dire qu'un opt-out disparaît si la ligne est
 *     supprimée puis réimportée. C'est exactement le scénario contre lequel
 *     `prospection_suppressions` a été conçue (migration 0032).
 *
 * La suppression est écrite EN PREMIER, volontairement : si la seconde écriture
 * échoue, il reste la preuve du refus, et `chargerLotDuJour` filtre déjà sur les
 * suppressions. L'inverse laisserait un refus sans trace.
 *
 * On lève à la moindre erreur : un STOP avalé en silence, c'est un contact
 * recontacté après avoir dit non.
 */
export async function marquerStop(formData: FormData): Promise<void> {
  await exigerAdmin();
  const placeId = String(formData.get("place_id") ?? "");
  if (!placeId) return;
  const admin = createAdminClient();

  const { data: contact, error: lectureError } = await admin
    .from("prospects_dossimo")
    .select("emails")
    .eq("place_id", placeId)
    .maybeSingle();
  if (lectureError) {
    throw new Error(`Lecture du contact impossible : ${lectureError.message}`);
  }

  // 1) La preuve durable, sur chaque adresse connue du contact.
  const emails = (contact?.emails ?? [])
    .map((e) => (e ?? "").trim().toLowerCase())
    .filter((e) => e.includes("@"));
  if (emails.length) {
    const { error: suppressionError } = await admin
      .from("prospection_suppressions")
      .upsert(
        emails.map((email) => ({ email, motif: "stop sprint prospection" })),
        { onConflict: "email" },
      );
    if (suppressionError) {
      throw new Error(`Enregistrement du refus impossible : ${suppressionError.message}`);
    }
  }

  // 2) Le drapeau qui le sort des lots.
  const { error } = await admin
    .from("prospects_dossimo")
    .update({ opt_out: true })
    .eq("place_id", placeId);
  if (error) throw new Error(`Opt-out impossible : ${error.message}`);

  revalidatePath("/admin/sprint");
}
