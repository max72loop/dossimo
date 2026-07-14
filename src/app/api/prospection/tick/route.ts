import { envoyerProchain } from "@/lib/prospection/file";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tick d'envoi : au plus UN message par appel.
 *
 * À appeler toutes les dix minutes pendant la fenêtre (voir
 * `.github/workflows/prospection.yml`). Le rythme ne vient pas d'une boucle
 * interne : une fonction serverless ne peut pas s'étaler sur huit heures, et un
 * envoi en rafale est précisément ce qu'un filtre anti-spam sait reconnaître.
 *
 * Un tick sur cinq est sauté au hasard. Sans cela, les envois tomberaient à des
 * minutes régulières, signature d'un automate.
 *
 * Protégé par CRON_SECRET. Sans secret configuré, la route est fermée : une route
 * d'envoi ouverte, c'est un relais de spam offert au premier venu.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response("CRON_SECRET non configuré.", { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Non autorisé.", { status: 401 });
  }

  if (Math.random() < 0.2) {
    return Response.json({ envoye: false, motif: "tick sauté (jitter)" });
  }

  try {
    const resultat = await envoyerProchain();
    return Response.json(resultat);
  } catch (err) {
    console.error("[prospection] tick:", err);
    return new Response("Erreur d'envoi.", { status: 500 });
  }
}
