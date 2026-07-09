import { createAdminClient } from "@/lib/supabase/admin";
import { expireOldCredits } from "@/lib/pricing";

export const runtime = "nodejs";
// Jamais de cache : chaque appel doit refléter l'état courant des crédits.
export const dynamic = "force-dynamic";

/**
 * Cron : passe les crédits parrain échus (> 12 mois) en `expired` et rafraîchit
 * les soldes. À planifier une fois par jour (Vercel Cron → vercel.json).
 *
 * Protégé par CRON_SECRET : Vercel Cron envoie `Authorization: Bearer <secret>`
 * quand la variable est définie. Sans secret configuré, la route est fermée
 * (503) pour éviter une exposition publique par erreur.
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
    const expired = await expireOldCredits(createAdminClient());
    return Response.json({ ok: true, expired });
  } catch (err) {
    console.error("[cron] expire-credits:", err);
    return new Response("Erreur d'expiration.", { status: 500 });
  }
}
