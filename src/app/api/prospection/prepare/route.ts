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
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response("CRON_SECRET non configuré.", { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Non autorisé.", { status: 401 });
  }

  try {
    const resultat = await preparerFile();
    return Response.json({ ok: true, ...resultat });
  } catch (err) {
    console.error("[prospection] prepare:", err);
    return new Response("Erreur de préparation.", { status: 500 });
  }
}
