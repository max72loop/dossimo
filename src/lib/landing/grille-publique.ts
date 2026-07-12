import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { getActiveTiers, grilleAffichee, type GrilleAffichee } from "@/lib/pricing";

/**
 * Grille tarifaire pour les pages PUBLIQUES (landing, CGV), lue depuis la même
 * table `pricing_tiers` que le checkout. Une seule source : le prix annoncé au
 * visiteur est celui qui lui sera facturé.
 *
 * Client ANONYME et SANS COOKIES, volontairement :
 *  — la clé anon suffit, la RLS ouvre `pricing_tiers` en lecture (migration 0015).
 *    Passer par le service-role reviendrait à contourner la RLS pour lire une donnée
 *    publique : aucun besoin, et un mauvais réflexe à ne pas installer ;
 *  — le client à cookies (`supabase/server`) rendrait la lecture dépendante de la
 *    requête. Next lève alors une `DynamicServerError` pendant le prérendu, que le
 *    `catch` ci-dessous avalerait — étouffant un signal de contrôle du framework et
 *    laissant la page sans tarif.
 *
 * Ne lève jamais. Si la base est injoignable ou la grille vide, renvoie `null` et
 * l'appelant tait le prix : mieux vaut une page sans tarif qu'une page en erreur, et
 * surtout aucun chiffre plutôt qu'un chiffre faux — les CGV engagent contractuellement.
 */
export async function grillePublique(): Promise<GrilleAffichee | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  try {
    const supabase = createSupabaseClient<Database>(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return grilleAffichee(await getActiveTiers(supabase));
  } catch (err) {
    console.error("[landing] grille tarifaire indisponible:", err);
    return null;
  }
}
