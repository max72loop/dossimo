"use server";

import { revalidatePath } from "next/cache";

import { getAdminEmail } from "@/lib/auth/is-admin";
import { enregistrerEvenement } from "@/lib/mesure/journal";

/**
 * Saisie du temps humain passé sur un dossier.
 *
 * Aucune machine ne peut le mesurer : c'est du temps au téléphone, des allers-
 * retours par mail, un devis relu à la main. Sans lui, le coût d'un dossier se
 * limite à quelques centimes de LLM, ce qui donnerait une marge magnifique et
 * complètement fausse — c'est exactement l'erreur qu'un tableau de bord produit
 * fait faire à un tableau de bord d'entreprise.
 *
 * Réservé à l'admin : c'est une donnée de pilotage interne, l'artisan n'a rien
 * à y voir ni à y écrire.
 */
export async function enregistrerAssistance(input: {
  dossierId: string;
  minutes: number;
}): Promise<{ ok: boolean; error?: string }> {
  if (!(await getAdminEmail())) return { ok: false, error: "Réservé à l'administration." };

  const minutes = Math.round(input.minutes);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return { ok: false, error: "Indiquez un nombre de minutes supérieur à zéro." };
  }
  if (minutes > 8 * 60) {
    return { ok: false, error: "Plus de 8 heures sur un dossier : saisissez plusieurs fois." };
  }
  const dossierId = input.dossierId.trim();
  if (!dossierId) return { ok: false, error: "Indiquez le dossier concerné." };

  // Écriture vérifiée, contrairement à la télémétrie automatique : quelqu'un
  // vient de taper ces minutes et attend une confirmation. Un « c'est noté »
  // sur une insertion échouée est un mensonge, et le temps saisi est perdu.
  const ecrit = await enregistrerEvenement({ type: "assistance", dossierId, minutes });
  if (!ecrit.ok) return { ok: false, error: "Enregistrement impossible." };

  revalidatePath("/admin/tunnel");
  return { ok: true };
}
