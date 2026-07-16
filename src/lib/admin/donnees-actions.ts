"use server";

import { revalidatePath } from "next/cache";

import { getAdminEmail } from "@/lib/auth/is-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { interrogerDonnees, type InterrogationResult } from "@/lib/admin/nl-query";

export type SuppressionResult =
  | { ok: true; dossiers: number; fichiers: number }
  | { ok: false; error: string };

/**
 * Supprime définitivement une liste de dossiers de test (admin uniquement).
 *
 * Ordre imposé par le modèle : la cascade SQL (`on delete cascade`) retire les
 * lignes enfantes (pièces, dépôt bénéficiaire, relances, pilotage obligé) mais
 * **PAS les objets du bucket Storage `pieces`**. On supprime donc d'abord les
 * fichiers, puis les lignes `dossiers`. Si l'étape Storage échoue, on n'efface
 * aucune ligne — pour ne pas laisser des fichiers orphelins non traçables.
 */
export async function supprimerDossiers(ids: string[]): Promise<SuppressionResult> {
  if (!(await getAdminEmail())) return { ok: false, error: "Accès refusé." };

  const cibles = [...new Set(ids.filter(Boolean))];
  if (cibles.length === 0) return { ok: false, error: "Aucun dossier sélectionné." };

  const admin = createAdminClient();

  // 1. Fichiers Storage liés aux pièces des dossiers ciblés.
  const { data: pieces, error: readErr } = await admin
    .from("pieces_justificatives")
    .select("storage_path")
    .in("dossier_id", cibles);
  if (readErr) {
    console.error("[nettoyage] lecture pièces:", readErr.message);
    return { ok: false, error: "Impossible de lister les fichiers liés. Rien n'a été supprimé." };
  }

  const chemins = (pieces ?? []).map((p) => p.storage_path).filter(Boolean);
  let fichiers = 0;
  if (chemins.length > 0) {
    const { data: retires, error: storageErr } = await admin.storage
      .from("pieces")
      .remove(chemins);
    if (storageErr) {
      console.error("[nettoyage] storage:", storageErr.message);
      return {
        ok: false,
        error: "Échec de la suppression des fichiers Storage. Rien n'a été supprimé.",
      };
    }
    fichiers = retires?.length ?? chemins.length;
  }

  // 2. Lignes dossiers : la cascade nettoie le reste.
  const { error: delErr, count } = await admin
    .from("dossiers")
    .delete({ count: "exact" })
    .in("id", cibles);
  if (delErr) {
    console.error("[nettoyage] suppression dossiers:", delErr.message);
    return {
      ok: false,
      error: `Fichiers retirés (${fichiers}) mais échec de la suppression des dossiers.`,
    };
  }

  revalidatePath("/admin/donnees");
  return { ok: true, dossiers: count ?? cibles.length, fichiers };
}

/**
 * Question en langage naturel sur la base (admin uniquement). La traduction et
 * l'exécution — strictement en lecture seule — vivent dans `nl-query.ts`.
 */
export async function poserQuestion(question: string): Promise<InterrogationResult> {
  if (!(await getAdminEmail())) return { ok: false, error: "Accès refusé." };
  return interrogerDonnees(question);
}
