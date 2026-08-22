import { refuserSiCronNonAutorise } from "@/lib/cron/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { purgerProspectionExpiree } from "@/lib/prospection/retention";

export const runtime = "nodejs";
// Jamais de cache : chaque appel agit sur l'état courant des données.
export const dynamic = "force-dynamic";

/**
 * Cron : purge les données de prospection échues (contacts dormants depuis trois
 * ans sans aucune réponse, leads au plafond de trois ans sauf convertis, lignes
 * du rate limiter échues). Fenêtres et exclusions dans
 * `src/lib/prospection/retention.ts`. À planifier une fois par jour (vercel.json).
 *
 * Protégé par CRON_SECRET, même schéma que expire-credits et purge-pieces :
 * sans secret la route est fermée (503) ; en-tête absente ou fausse → 401.
 */
export async function GET(req: Request) {
  const refus = refuserSiCronNonAutorise(req);
  if (refus) return refus;

  try {
    const rapport = await purgerProspectionExpiree(createAdminClient());
    return Response.json({ ok: true, ...rapport });
  } catch (err) {
    console.error("[cron] purge-prospection:", err);
    return new Response("Erreur de purge.", { status: 500 });
  }
}
