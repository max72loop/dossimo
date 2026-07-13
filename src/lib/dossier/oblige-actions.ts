"use server";

import { revalidatePath } from "next/cache";

import { getDossier } from "@/lib/dossier/get-dossier";
import { createClient } from "@/lib/supabase/server";

export type RetourStatut = "en_cours" | "accepte" | "refuse" | "abandonne";

export async function choisirOblige(
  dossierId: string,
  obligeId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await getDossier(dossierId))) return { ok: false, error: "Dossier introuvable." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("dossiers")
    .update({ oblige_id: obligeId })
    .eq("id", dossierId);
  if (error) return { ok: false, error: "Enregistrement impossible." };
  revalidatePath(`/dossiers/${dossierId}`);
  return { ok: true };
}

export async function enregistrerRetourDepot(input: {
  dossierId: string;
  statut: RetourStatut;
  motif?: string;
  detail?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!(await getDossier(input.dossierId))) return { ok: false, error: "Dossier introuvable." };
  const supabase = await createClient();
  const { error } = await supabase.from("retours_depot").upsert(
    {
      dossier_id: input.dossierId,
      statut: input.statut,
      motif: input.motif?.trim() || null,
      detail: input.detail?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "dossier_id" },
  );
  if (error) return { ok: false, error: "Enregistrement impossible." };
  revalidatePath(`/dossiers/${input.dossierId}`);
  revalidatePath("/admin/pilotage");
  return { ok: true };
}

