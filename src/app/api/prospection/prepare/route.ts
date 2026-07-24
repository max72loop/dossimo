import { refuserSiCronNonAutorise } from "@/lib/cron/auth";
import { preparerFile } from "@/lib/prospection/file";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Prépare la file du jour (messages `en_attente`, jamais envoyés tels quels).
 *
 * À appeler une fois par jour ouvré en début de matinée. La validation reste
 * humaine : cette route ne fait que remplir l'écran `/admin/prospection`.
 *
 * Elle est idempotente : deux appels le même jour complètent jusqu'au plafond
 * sans le dépasser.
 */
export async function GET(req: Request) {
  const refus = refuserSiCronNonAutorise(req);
  if (refus) return refus;

  try {
    const resultat = await preparerFile();
    return Response.json({ ok: true, ...resultat });
  } catch (err) {
    console.error("[prospection] prepare:", err);
    return new Response("Erreur de préparation.", { status: 500 });
  }
}
