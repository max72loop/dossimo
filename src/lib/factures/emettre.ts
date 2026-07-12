import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Facture } from "@/lib/database.types";
import { editeur } from "@/lib/legal/editeur";

/**
 * Émet la facture d'un paiement encaissé.
 *
 * Toute la logique sensible (numérotation continue, idempotence, verrou
 * concurrent, instantané de l'acheteur) vit dans la fonction SQL
 * `emettre_facture` : elle s'exécute dans une seule transaction, ce qu'un
 * enchaînement d'appels depuis Node ne peut pas garantir.
 *
 * Rejouable sans risque : appelée deux fois sur le même paiement, elle renvoie
 * la facture déjà émise et ne consomme pas de numéro.
 *
 * Requiert un client service-role : l'exécution de la fonction est révoquée
 * pour `authenticated` et `anon`.
 */
export async function emettreFacture(
  admin: SupabaseClient<Database>,
  paiementId: string,
): Promise<Facture> {
  const { data, error } = await admin.rpc("emettre_facture", {
    p_paiement_id: paiementId,
    p_tva_taux: editeur.tva.taux,
    p_mention_tva: editeur.tva.mention,
  });
  if (error) throw new Error(`emettre_facture: ${error.message}`);
  return data as Facture;
}
