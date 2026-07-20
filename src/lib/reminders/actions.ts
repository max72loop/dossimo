"use server";

import { revalidatePath } from "next/cache";
import { getDossier } from "@/lib/dossier/get-dossier";
import { piecesAttendues } from "@/lib/depot/pieces-attendues";
import {
  etatDesPieces,
  motifDeRejet,
  piecesARelancer,
  type FichierDepose,
} from "@/lib/depot/etat-pieces";
import { emettreLien } from "@/lib/depot/lien";
import { resoudreLien } from "@/lib/depot/lien";
import { formatReminderMessage } from "@/lib/reminders/message";
import { chargerEtatRelance } from "@/lib/reminders/get";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Ligne SQL → fichier déposé. Non exporté : un module « use server » ne peut
 * exposer que des fonctions asynchrones.
 */
type LigneUpload = {
  id: string;
  type: string;
  nom_fichier: string | null;
  validation_status: "submitted" | "approved" | "rejected" | null;
  rejection_reason: string | null;
  created_at: string;
};

function versFichiers(lignes: LigneUpload[] | null): FichierDepose[] {
  return (lignes ?? []).map((l) => ({
    id: l.id,
    type: l.type,
    nomFichier: l.nom_fichier,
    validationStatus: l.validation_status,
    rejectionReason: l.rejection_reason,
    createdAt: l.created_at,
  }));
}

export async function configurerRelances(dossierId: string, enabled: boolean) {
  if (!(await getDossier(dossierId))) return { ok: false as const, error: "Dossier introuvable." };
  const supabase = await createClient();
  const { data: existing } = await supabase.from("reminder_schedules").select("enabled_at").eq("dossier_id", dossierId).maybeSingle();
  const { error } = await supabase.from("reminder_schedules").upsert({
    dossier_id: dossierId,
    enabled,
    enabled_at: enabled ? (existing?.enabled_at ?? new Date().toISOString()) : existing?.enabled_at ?? null,
  }, { onConflict: "dossier_id" });
  if (error) return { ok: false as const, error: "Mise à jour impossible." };
  revalidatePath(`/dossiers/${dossierId}`);
  return { ok: true as const };
}

export async function revoirPieceBeneficiaire(input: { dossierId: string; pieceId: string; status: "approved" | "rejected"; reason?: string }) {
  if (!(await getDossier(input.dossierId))) return { ok: false as const, error: "Dossier introuvable." };
  if (input.status === "rejected" && !input.reason?.trim()) return { ok: false as const, error: "Indiquez le motif du rejet." };
  const supabase = await createClient();
  const { error } = await supabase.from("pieces_justificatives").update({
    validation_status: input.status,
    rejection_reason: input.status === "rejected" ? input.reason!.trim() : null,
    reviewed_at: new Date().toISOString(),
  }).eq("id", input.pieceId).eq("dossier_id", input.dossierId).eq("deposant", "beneficiaire");
  if (error) return { ok: false as const, error: "Revue impossible." };
  revalidatePath(`/dossiers/${input.dossierId}`);
  return { ok: true as const };
}

/** Prépare une relance que l'artisan envoie lui-même tant qu'aucun provider n'est configuré. */
export async function preparerRelanceManuelle(dossierId: string) {
  const data = await getDossier(dossierId);
  if (!data) return { ok: false as const, error: "Dossier introuvable." };
  const supabase = await createClient();
  const { data: uploads, error } = await supabase.from("pieces_justificatives")
    .select("id,type,nom_fichier,validation_status,rejection_reason,created_at")
    .eq("dossier_id", dossierId).eq("deposant", "beneficiaire").order("created_at", { ascending: true });
  if (error) return { ok: false as const, error: "Lecture des pièces impossible." };
  const documents = piecesARelancer(
    etatDesPieces(piecesAttendues(data), versFichiers(uploads)),
  ).map((etat) => ({ label: etat.attendue.titre, reason: motifDeRejet(etat) }));
  if (!documents.length) return { ok: false as const, error: "Toutes les pièces attendues sont validées." };
  const token = await emettreLien(dossierId);
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const message = formatReminderMessage({ prenom: data.caracteristiques.beneficiaire.prenom, entreprise: data.artisan?.entreprise ?? "Votre artisan", documents, url: `${base}/depot/${token}` });
  return { ok: true as const, ...message };
}

/**
 * Consigne qu'une relance vient d'être envoyée par l'artisan (WhatsApp, SMS ou
 * copie). C'est ce log qui réserve l'étape et débloque la suivante : sans lui, la
 * cadence n'avance jamais et le dossier reste éternellement « à relancer ».
 *
 * L'étape est recalculée côté serveur (jamais reçue du client) pour qu'un appel
 * ne puisse pas sauter ou rejouer une étape. L'écriture est idempotente via le
 * `unique(dossier_id, cadence_step, channel)` : un double clic ne double pas.
 */
export async function enregistrerRelanceEnvoyee(dossierId: string) {
  const data = await getDossier(dossierId);
  if (!data) return { ok: false as const, error: "Dossier introuvable." };

  const etat = await chargerEtatRelance(dossierId);
  if (etat.desinscrit) return { ok: false as const, error: "Le client s'est désinscrit des relances." };
  if (!etat.active) return { ok: false as const, error: "Activez d'abord les relances sur ce dossier." };
  if (!etat.due) return { ok: false as const, error: "Aucune relance n'est due pour l'instant." };

  const supabase = await createClient();
  const { data: uploads, error: lectureErr } = await supabase
    .from("pieces_justificatives")
    .select("id,type,nom_fichier,validation_status,rejection_reason,created_at")
    .eq("dossier_id", dossierId)
    .eq("deposant", "beneficiaire")
    .order("created_at", { ascending: true });
  if (lectureErr) return { ok: false as const, error: "Lecture des pièces impossible." };
  const manquants = piecesARelancer(
    etatDesPieces(piecesAttendues(data), versFichiers(uploads)),
  ).map((etat) => etat.attendue.type);
  if (!manquants.length) return { ok: false as const, error: "Toutes les pièces attendues sont validées." };

  const { error } = await supabase.from("reminder_logs").upsert(
    {
      dossier_id: dossierId,
      cadence_step: etat.due.cadenceStep,
      document_types: manquants,
      channel: "manual",
      status: "sent",
      sent_at: new Date().toISOString(),
    },
    { onConflict: "dossier_id,cadence_step,channel", ignoreDuplicates: true },
  );
  if (error) return { ok: false as const, error: "Enregistrement de la relance impossible." };

  revalidatePath(`/dossiers/${dossierId}`);
  revalidatePath("/dossiers");
  return { ok: true as const, etape: etat.due.cadenceStep };
}

/** Désinscription publique, autorisée uniquement par un token de dépôt encore valide. */
export async function desinscrireDesRelances(token: string) {
  const lien = await resoudreLien(token);
  if (!lien) return { ok: false as const, error: "Ce lien n'est plus valide." };
  const { error } = await createAdminClient().from("reminder_schedules").upsert({
    dossier_id: lien.dossierId,
    enabled: false,
    opt_out_at: new Date().toISOString(),
  }, { onConflict: "dossier_id" });
  if (error) return { ok: false as const, error: "La désinscription est indisponible. Réessayez plus tard." };
  return { ok: true as const };
}
