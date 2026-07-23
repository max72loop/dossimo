import { refuserSiCronNonAutorise } from "@/lib/cron/auth";
import { envoyerProchain } from "@/lib/prospection/file";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tick d'envoi : au plus UN message par appel.
 *
 * Appelée en boucle par le job du workflow, qui espace lui-même ses appels de
 * quelques minutes tirées au hasard (voir `.github/workflows/prospection.yml`).
 * Le rythme ne vient pas d'ici : une fonction serverless ne peut pas s'étaler sur
 * huit heures, et un envoi en rafale est précisément ce qu'un filtre anti-spam
 * sait reconnaître.
 *
 * Cette route n'a plus de jitter propre. Elle en a eu un (un tick sur cinq sauté)
 * tant qu'on croyait le cron GitHub honoré toutes les dix minutes : jeter 20 % de
 * 54 ticks était indolore. Dans les faits GitHub n'en lance qu'environ un par
 * heure, et le 2026-07-19 ce tirage a coûté 3 des 8 seuls ticks de la journée,
 * pour 4 messages partis sur 27 préparés. L'irrégularité est désormais produite
 * par les pauses de la boucle appelante, où elle ne détruit aucun envoi.
 *
 * Protégé par CRON_SECRET. Sans secret configuré, la route est fermée : une route
 * d'envoi ouverte, c'est un relais de spam offert au premier venu.
 */
export async function GET(req: Request) {
  const refus = refuserSiCronNonAutorise(req);
  if (refus) return refus;

  try {
    const resultat = await envoyerProchain();
    return Response.json(resultat);
  } catch (err) {
    console.error("[prospection] tick:", err);
    return new Response("Erreur d'envoi.", { status: 500 });
  }
}
