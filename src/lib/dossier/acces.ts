import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { DossierComplet } from "@/lib/dossier/get-dossier";

/**
 * Droit d'accès au livrable d'un dossier (contrôle anti-vol du paiement).
 *
 * Règle (CLAUDE.md §10) : le PREMIER dossier de l'artisan est gratuit (produit
 * d'appel) ; les suivants nécessitent un paiement ponctuel. Un dossier est
 * « débloqué » s'il est le plus ancien de l'artisan OU s'il a un paiement `paye`.
 *
 * Utilisé côté serveur pour verrouiller à la fois les téléchargements PDF et le
 * détail affiché à l'écran (un simple bouton caché ne protège rien).
 */
export interface AccesDossier {
  debloque: boolean;
  gratuit: boolean;
  paye: boolean;
}

export async function accesDossier(data: DossierComplet): Promise<AccesDossier> {
  const supabase = await createClient();

  // Gratuit : le plus ancien dossier de l'artisan.
  let gratuit = false;
  if (data.dossier.artisan_id) {
    const { data: premier } = await supabase
      .from("dossiers")
      .select("id")
      .eq("artisan_id", data.dossier.artisan_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    gratuit = !!premier && premier.id === data.dossier.id;
  }

  // Payé : un paiement encaissé existe pour ce dossier.
  const { data: paiement } = await supabase
    .from("paiements")
    .select("id")
    .eq("dossier_id", data.dossier.id)
    .eq("statut", "paye")
    .limit(1)
    .maybeSingle();
  const paye = !!paiement;

  return { gratuit, paye, debloque: gratuit || paye };
}

/**
 * Garde des routes de livrable (PDF). Renvoie une réponse 402 si le dossier
 * n'est pas débloqué, sinon `null` (la route peut continuer). C'est la
 * protection serveur : impossible de télécharger un livrable en tapant l'URL.
 */
export async function verrouLivrable(
  data: DossierComplet,
): Promise<Response | null> {
  const { debloque } = await accesDossier(data);
  if (debloque) return null;
  return new Response(
    "Dossier verrouillé : paiement requis pour accéder au livrable.",
    { status: 402 },
  );
}
