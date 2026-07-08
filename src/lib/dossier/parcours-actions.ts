"use server";

import { revalidatePath } from "next/cache";

import { getDossier } from "@/lib/dossier/get-dossier";
import { createClient } from "@/lib/supabase/server";
import { STATUTS_VALIDES } from "@/lib/dossier/parcours";
import type { StatutDossier } from "@/lib/database.types";

export type StatutResult = { ok: true } | { ok: false; error: string };

/**
 * Change l'état d'un dossier dans son parcours. Auth-scopé : getDossier renvoie
 * null si le dossier n'appartient pas à l'artisan connecté (RLS).
 */
export async function changerStatutDossier(
  dossierId: string,
  statut: StatutDossier,
): Promise<StatutResult> {
  if (!STATUTS_VALIDES.has(statut)) {
    return { ok: false, error: "Statut invalide." };
  }

  const data = await getDossier(dossierId);
  if (!data) return { ok: false, error: "Dossier introuvable." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("dossiers")
    .update({ statut })
    .eq("id", dossierId);

  if (error) {
    console.error("[parcours] update:", error.message);
    // 22P02 = valeur d'enum inconnue (migration 0007 pas encore appliquée).
    return {
      ok: false,
      error:
        error.code === "22P02"
          ? "État indisponible : la migration du parcours n'est pas encore appliquée."
          : "Échec de la mise à jour.",
    };
  }
  revalidatePath(`/dossiers/${dossierId}`);
  revalidatePath("/dossiers");
  return { ok: true };
}
