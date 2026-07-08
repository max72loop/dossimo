"use server";

import { getDossier } from "@/lib/dossier/get-dossier";
import { createClient } from "@/lib/supabase/server";
import { generateVigilancePoints, type VigilanceResult } from "@/lib/llm/vigilance";

/**
 * Génère les points de vigilance rédigés pour un dossier, PUIS les persiste sur
 * le dossier (affichage instantané ensuite + inclusion au rapport, sans re-payer
 * l'appel LLM). Auth-scopé : `getDossier` renvoie null si le dossier n'appartient
 * pas à l'artisan connecté (RLS). Déclenché à la demande depuis l'espace dossier.
 */
export async function genererPointsVigilance(
  dossierId: string,
): Promise<VigilanceResult> {
  const data = await getDossier(dossierId);
  if (!data) {
    return { ok: false, reason: "erreur", message: "Dossier introuvable." };
  }

  const res = await generateVigilancePoints(data);
  if (!res.ok) return res;

  const generatedAt = new Date().toISOString();
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("dossiers")
      .update({ vigilance_json: res.points, vigilance_at: generatedAt })
      .eq("id", dossierId);
    if (error) console.error("[llm] persistance vigilance:", error.message);
  } catch (err) {
    // Persistance best-effort : on renvoie les points même si l'écriture échoue
    // (ex. migration 0003 non encore appliquée).
    console.error("[llm] persistance vigilance:", err);
  }

  return { ...res, generatedAt };
}
