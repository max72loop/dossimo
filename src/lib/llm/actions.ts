"use server";

import { getDossier } from "@/lib/dossier/get-dossier";
import { generateVigilancePoints, type VigilanceResult } from "@/lib/llm/vigilance";

/**
 * Génère les points de vigilance rédigés pour un dossier. Auth-scopé :
 * `getDossier` renvoie null si le dossier n'appartient pas à l'artisan connecté
 * (RLS). Déclenché à la demande depuis l'espace dossier (pas à chaque rendu).
 */
export async function genererPointsVigilance(
  dossierId: string,
): Promise<VigilanceResult> {
  const data = await getDossier(dossierId);
  if (!data) {
    return { ok: false, reason: "erreur", message: "Dossier introuvable." };
  }
  return generateVigilancePoints(data);
}
