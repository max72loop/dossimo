import { createAdminClient } from "@/lib/supabase/admin";
import { purgerPiecesExpirees } from "@/lib/piece/retention";

export const runtime = "nodejs";
// Jamais de cache : chaque appel agit sur l'état courant des pièces.
export const dynamic = "force-dynamic";

/**
 * Cron : purge les pièces justificatives échues (fichier Storage + ligne), pour
 * borner la conservation des données les plus sensibles du produit — avis
 * d'imposition, RIB, pièce d'identité (art. 5.1.e RGPD). Fenêtres de rétention
 * dans `src/lib/piece/retention.ts`. À planifier une fois par jour (vercel.json).
 *
 * Protégé par CRON_SECRET, même schéma que expire-credits : sans secret la route
 * est fermée (503) ; secret présent mais en-tête absente/fausse → 401.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response("CRON_SECRET non configuré.", { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Non autorisé.", { status: 401 });
  }

  try {
    const rapport = await purgerPiecesExpirees(createAdminClient());
    return Response.json({ ok: true, ...rapport });
  } catch (err) {
    console.error("[cron] purge-pieces:", err);
    return new Response("Erreur de purge.", { status: 500 });
  }
}
