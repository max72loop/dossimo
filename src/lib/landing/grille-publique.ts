import "server-only";

import type { PricingTier } from "@/lib/database.types";
import { grilleAffichee, type GrilleAffichee } from "@/lib/pricing";

/**
 * Grille tarifaire pour les pages PUBLIQUES (landing, CGV), lue depuis la même
 * table `pricing_tiers` que le checkout. Une seule source : le prix annoncé au
 * visiteur est celui qui lui sera facturé.
 *
 * Lecture REST et SANS COOKIES, volontairement :
 *  — évite d'initialiser Supabase Realtime, qui requiert un WebSocket natif absent
 *    de Node 20 et faisait silencieusement disparaître toute la grille ;
 *  — la clé anon suffit normalement, la RLS ouvrant `pricing_tiers` en lecture
 *    (migration 0015). Un repli service-role strictement serveur couvre les bases
 *    où cette migration n'a pas encore été appliquée ;
 *  — le client à cookies (`supabase/server`) rendrait la lecture dépendante de la
 *    requête. Next lève alors une `DynamicServerError` pendant le prérendu, que le
 *    `catch` ci-dessous avalerait — étouffant un signal de contrôle du framework et
 *    laissant la page sans tarif.
 *
 * Ne lève jamais. Si la base est injoignable ou la grille vide, renvoie `null` et
 * l'appelant tait le prix : mieux vaut une page sans tarif qu'une page en erreur, et
 * surtout aucun chiffre plutôt qu'un chiffre faux — les CGV engagent contractuellement.
 */
async function lirePaliers(
  baseUrl: string,
  apiKey: string,
): Promise<PricingTier[]> {
  const endpoint = new URL("/rest/v1/pricing_tiers", baseUrl);
  endpoint.searchParams.set(
    "select",
    "id,name,aid_min_cents,aid_max_cents,price_cents,active,created_at",
  );
  endpoint.searchParams.set("active", "eq.true");
  endpoint.searchParams.set("order", "aid_min_cents.asc");

  const response = await fetch(endpoint, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`pricing_tiers REST: ${response.status}`);
  }

  return (await response.json()) as PricingTier[];
}

export async function grillePublique(): Promise<GrilleAffichee | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  try {
    let tiers = await lirePaliers(url, anon);

    // Une réponse 200 vide alors que la grille existe signale généralement une
    // policy publique non déployée. Le repli ne quitte jamais ce module serveur.
    if (tiers.length === 0 && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      tiers = await lirePaliers(url, process.env.SUPABASE_SERVICE_ROLE_KEY);
    }

    return grilleAffichee(tiers);
  } catch (err) {
    console.error("[landing] grille tarifaire indisponible:", err);
    return null;
  }
}
