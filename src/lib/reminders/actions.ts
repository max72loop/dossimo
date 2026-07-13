"use server";

import { revalidatePath } from "next/cache";
import { getDossier } from "@/lib/dossier/get-dossier";
import { piecesAttendues } from "@/lib/depot/pieces-attendues";
import { emettreLien } from "@/lib/depot/lien";
import { resoudreLien } from "@/lib/depot/lien";
import { formatReminderMessage } from "@/lib/reminders/message";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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
  const { data: uploads } = await supabase.from("pieces_justificatives")
    .select("type,validation_status,rejection_reason")
    .eq("dossier_id", dossierId).eq("deposant", "beneficiaire").order("created_at", { ascending: false });
  const documents = piecesAttendues(data).flatMap((expected) => {
    const upload = (uploads ?? []).find((item) => item.type === expected.type);
    return upload?.validation_status === "approved" ? [] : [{ label: expected.titre, reason: upload?.validation_status === "rejected" ? upload.rejection_reason : null }];
  });
  if (!documents.length) return { ok: false as const, error: "Toutes les pièces attendues sont validées." };
  const token = await emettreLien(dossierId);
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const message = formatReminderMessage({ prenom: data.caracteristiques.beneficiaire.prenom, entreprise: data.artisan?.entreprise ?? "Votre artisan", documents, url: `${base}/depot/${token}` });
  return { ok: true as const, ...message };
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
