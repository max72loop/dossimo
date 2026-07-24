import { refuserSiCronNonAutorise } from "@/lib/cron/auth";
import { bilanFinDeJournee } from "@/lib/prospection/file";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bilan de fin de journée : la campagne a-t-elle livré ce que le plafond du jour
 * autorisait ? Appelée une fois, après la fermeture de la fenêtre d'envoi.
 *
 * Le point aveugle qu'elle ferme : la route `tick` renvoie 200 même quand elle
 * n'envoie rien, et un run que GitHub ne planifie pas ne produit AUCUN signal. Une
 * journée qui sort 4 messages sur 40 (constaté le 2026-07-19) passait donc
 * totalement inaperçue tant que personne n'ouvrait `/admin/prospection`.
 *
 * Ici, une sous-livraison DUE au planificateur (des messages validés sont restés en
 * file après la fermeture) renvoie 500 : le run GitHub vire au rouge et son échec
 * arrive par e-mail. Une file vide (validation humaine oubliée, fichier épuisé)
 * n'est pas une panne du système et ne rougit rien — elle est seulement reportée
 * dans le corps de la réponse. Fail loud, mais pas au loup (AGENTS.md).
 *
 * Protégée par CRON_SECRET, comme `prepare` et `tick`.
 */
export async function GET(req: Request) {
  const refus = refuserSiCronNonAutorise(req);
  if (refus) return refus;

  try {
    const bilan = await bilanFinDeJournee();
    if (bilan.sousLivraison) {
      const detail =
        `${bilan.envoyes}/${bilan.plafond} partis, ` +
        `${bilan.restantsDus} message(s) validé(s) restés en file`;
      console.error(`[prospection] sous-livraison ${bilan.jour} : ${detail}`);
      return new Response(`Sous-livraison ${bilan.jour} : ${detail}.`, {
        status: 500,
      });
    }
    return Response.json({ ok: true, ...bilan });
  } catch (err) {
    console.error("[prospection] bilan:", err);
    return new Response("Erreur de bilan.", { status: 500 });
  }
}
