"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminEmail } from "@/lib/auth/is-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/prospection/cadence";
import { parserProspects } from "@/lib/prospection/csv";
import {
  TAILLE_SALVE,
  campagneActive,
  envoyerSalve,
  preparerFile,
} from "@/lib/prospection/file";

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
  const [
    { data: existants, error: erreurExistants },
    { data: supprimes, error: erreurSupprimes },
  ] = await Promise.all([
    supabase.from("prospects").select("email").in("email", emails),
    supabase.from("prospection_suppressions").select("email").in("email", emails),
  ]);

  // Une lecture muette rend `opposes` vide, donc réimporte des adresses qui se
  // sont opposées, donc les redémarche. Ce n'est pas un compteur faux, c'est une
  // sollicitation illicite : on refuse l'import entier plutôt que d'écrire à
  // l'aveugle. Une opposition survit à tout (AGENTS.md, « fail loudly »).
  if (erreurSupprimes) {
    retour(
      `Import refusé : impossible de vérifier les désinscriptions (${erreurSupprimes.message}).`,
      "erreur",
    );
  }
  if (erreurExistants) {
    retour(
      `Import refusé : impossible de vérifier les doublons (${erreurExistants.message}).`,
      "erreur",
    );
  }

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

/**
 * Valide la file en attente : ces messages deviennent envoyables.
 *
 * `lte` et non `eq` sur `scheduled_on`, comme le sélecteur d'envoi
 * (`envoyerProchain`). L'asymétrie précédente était fatale : un lot préparé un
 * jour et non validé le jour même sortait de l'écran, le bouton se grisait, et
 * l'index unique `prospection_un_message_par_prospect` interdisait de recréer
 * ces messages. Les 40 messages du 26/08/2026 étaient ainsi devenus
 * définitivement invalidables, et leurs prospects perdus pour la campagne.
 */
export async function validerFile(): Promise<never> {
  await garde();
  const supabase = createAdminClient();
  const campagne = await campagneActive(supabase);
  if (!campagne) retour("Aucune campagne active.", "erreur");

  const jour = jourParis(new Date());
  const { data, error } = await supabase
    .from("prospection_messages")
    .update({ statut: "valide" })
    .eq("campagne_id", campagne.id)
    .lte("scheduled_on", jour)
    .eq("statut", "en_attente")
    .select("id, scheduled_on");

  if (error) retour(`Validation refusée : ${error.message}`, "erreur");

  const lignes = data ?? [];
  const retard = lignes.filter((m) => m.scheduled_on !== jour).length;
  retour(
    `${lignes.length} message(s) validé(s)` +
      (retard > 0 ? `, dont ${retard} en retard rattrapé(s)` : "") +
      ". Cliquez « Envoyer maintenant » pour les faire partir.",
  );
}

/**
 * Envoie une salve de messages sur-le-champ, sans attendre le planificateur.
 *
 * La fenêtre horaire est levée ici, et seulement ici : l'admin qui clique sait
 * quelle heure il est. Tous les autres garde-fous tiennent (pause, plafond du
 * jour, dates de campagne, copie périmée, exclusions).
 */
export async function envoyerMaintenant(): Promise<never> {
  await garde();
  const { envoyes, motifArret } = await envoyerSalve({
    taille: TAILLE_SALVE,
    forcerHorsFenetre: true,
  });

  if (envoyes === 0) {
    retour(`Aucun message parti : ${motifArret ?? "raison inconnue"}.`, "erreur");
  }
  retour(
    `${envoyes} message(s) parti(s)` +
      (motifArret ? `, puis arrêt : ${motifArret}` : "") +
      ".",
  );
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
  const { data, error } = await supabase
    .from("prospection_messages")
    .update({ statut: "annule", erreur: "écarté à la relecture" })
    .eq("id", id)
    .in("statut", ["en_attente", "valide"])
    .select("prospect_id")
    .maybeSingle();

  // « Message écarté. » s'affichait quoi qu'il arrive. Un écartement raté et
  // annoncé réussi, c'est le message douteux qui part quand même au prochain
  // tick, alors que la relecture l'avait justement arrêté.
  if (error) retour(`Écartement refusé : ${error.message}`, "erreur");
  if (!data) {
    retour("Message introuvable ou déjà parti : rien n'a été écarté.", "erreur");
  }

  const { error: erreurProspect } = await supabase
    .from("prospects")
    .update({ statut: "exclu" })
    .eq("id", data.prospect_id);
  if (erreurProspect) {
    retour(
      `Message écarté, mais le prospect n'a pas pu être exclu : ${erreurProspect.message}`,
      "erreur",
    );
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
