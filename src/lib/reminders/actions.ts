"use server";

import { revalidatePath } from "next/cache";
import { getDossier } from "@/lib/dossier/get-dossier";
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
