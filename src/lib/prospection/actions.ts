"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminEmail } from "@/lib/auth/is-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/prospection/cadence";
import { parserProspects } from "@/lib/prospection/csv";
import { campagneActive, preparerFile } from "@/lib/prospection/file";

/**
 * Actions de la console de prospection.
 *
 * Chaque action revérifie le rôle admin : un layout ne protège pas une Server
 * Action, qui s'exécute hors de l'arbre de rendu (cf. src/app/admin/layout.tsx).
 */

const PAGE = "/admin/prospection";

async function garde(): Promise<void> {
  const admin = await getAdminEmail();
  if (!admin) throw new Error("Accès refusé.");
}

function retour(message: string, type: "ok" | "erreur" = "ok"): never {
  revalidatePath(PAGE);
  redirect(`${PAGE}?${type}=${encodeURIComponent(message)}`);
}

/**
 * Import CSV. La `source` est obligatoire : l'article 14 du RGPD impose de dire
 * au destinataire d'où vient son adresse, et cette phrase est reprise telle
 * quelle dans le pied du message. Sans elle, l'envoi ne serait pas licite.
 */
export async function importerProspects(formData: FormData): Promise<never> {
  await garde();

  const csv = String(formData.get("csv") ?? "");
  const source = String(formData.get("source") ?? "").trim();
  if (!source) {
    retour("Indiquez d'où viennent ces adresses (obligatoire).", "erreur");
  }
  if (!csv.trim()) {
    retour("Aucune donnée collée.", "erreur");
  }

  const { lignes, rejets } = parserProspects(csv, source);
  if (lignes.length === 0) {
    retour(
      `Aucune ligne exploitable. ${rejets[0]?.motif ?? "Vérifiez l'en-tête du fichier."}`,
      "erreur",
    );
  }

  const supabase = createAdminClient();
  const emails = lignes.map((l) => l.email);

  // Deux filtres avant écriture : les adresses déjà connues (réimport du même
  // fichier) et celles qui se sont opposées. Une opposition survit à tout import.
  const [{ data: existants }, { data: supprimes }] = await Promise.all([
    supabase.from("prospects").select("email").in("email", emails),
    supabase.from("prospection_suppressions").select("email").in("email", emails),
  ]);

  const connus = new Set((existants ?? []).map((p) => p.email.toLowerCase()));
  const opposes = new Set((supprimes ?? []).map((s) => s.email.toLowerCase()));

  const nouveaux = lignes.filter(
    (l) => !connus.has(l.email) && !opposes.has(l.email),
  );

  if (nouveaux.length > 0) {
    const { error } = await supabase.from("prospects").insert(nouveaux);
    if (error) retour(`Import refusé : ${error.message}`, "erreur");
  }

  const details = [
    `${nouveaux.length} prospect(s) importé(s)`,
    connus.size > 0 ? `${connus.size} déjà connu(s)` : null,
    opposes.size > 0 ? `${opposes.size} désinscrit(s) écarté(s)` : null,
    rejets.length > 0 ? `${rejets.length} ligne(s) rejetée(s)` : null,
  ].filter(Boolean);

  retour(details.join(" · "));
}

export async function preparerFileAction(): Promise<never> {
  await garde();
  const { crees, motif } = await preparerFile();
  retour(
    crees > 0
      ? `${crees} message(s) préparé(s), à relire puis valider.`
      : `Rien à préparer : ${motif ?? "file déjà complète"}.`,
    crees > 0 ? "ok" : "erreur",
  );
}

/** Valide toute la file du jour : ces messages deviennent envoyables. */
export async function validerFile(): Promise<never> {
  await garde();
  const supabase = createAdminClient();
  const campagne = await campagneActive(supabase);
  if (!campagne) retour("Aucune campagne active.", "erreur");

  const { data, error } = await supabase
    .from("prospection_messages")
    .update({ statut: "valide" })
    .eq("campagne_id", campagne.id)
    .eq("scheduled_on", jourParis(new Date()))
    .eq("statut", "en_attente")
    .select("id");

  if (error) retour(`Validation refusée : ${error.message}`, "erreur");
  retour(`${data?.length ?? 0} message(s) validé(s), envoi étalé sur la journée.`);
}

/**
 * Écarte un message : il ne partira jamais, et le prospect sort de la campagne.
 * C'est l'issue de secours quand la relecture montre une donnée douteuse.
 */
export async function ecarterMessage(formData: FormData): Promise<never> {
  await garde();
  const id = String(formData.get("id") ?? "");
  if (!id) retour("Message introuvable.", "erreur");

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("prospection_messages")
    .update({ statut: "annule", erreur: "écarté à la relecture" })
    .eq("id", id)
    .in("statut", ["en_attente", "valide"])
    .select("prospect_id")
    .maybeSingle();

  if (data?.prospect_id) {
    await supabase
      .from("prospects")
      .update({ statut: "exclu" })
      .eq("id", data.prospect_id);
  }

  retour("Message écarté.");
}

/** Coupe ou relance la campagne. À utiliser dès qu'un signalement remonte. */
export async function basculerPause(formData: FormData): Promise<never> {
  await garde();
  const supabase = createAdminClient();
  const campagne = await campagneActive(supabase);
  if (!campagne) retour("Aucune campagne active.", "erreur");

  const enPause = !campagne.en_pause;
  const motif = String(formData.get("motif") ?? "").trim() || null;

  const { error } = await supabase
    .from("prospection_campagnes")
    .update({ en_pause: enPause, motif_pause: enPause ? motif : null })
    .eq("id", campagne.id);

  if (error) retour(`Impossible : ${error.message}`, "erreur");
  retour(enPause ? "Campagne mise en pause." : "Campagne relancée.");
}
