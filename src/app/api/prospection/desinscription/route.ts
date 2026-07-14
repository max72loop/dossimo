import { desinscrire } from "@/lib/prospection/file";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Désinscription en un clic (RFC 8058).
 *
 * Gmail et Outlook affichent un bouton natif « Se désabonner » quand le message
 * porte `List-Unsubscribe` + `List-Unsubscribe-Post`. Ce bouton envoie un POST
 * ici, sans que le destinataire ait à ouvrir quoi que ce soit. C'est la meilleure
 * protection qui existe contre le bouton « Signaler comme spam », qui, lui, coûte
 * de la réputation à tout le domaine.
 *
 * Volontairement non authentifiée : le jeton EST l'autorisation, et il ne donne
 * accès à rien d'autre qu'à l'arrêt des envois.
 */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return new Response("Jeton manquant.", { status: 400 });

  try {
    const resultat = await desinscrire(token, "un-clic (List-Unsubscribe)");
    // 200 même si le jeton est inconnu : ne pas révéler à un tiers si une adresse
    // est dans la liste, et ne jamais faire échouer un désabonnement.
    return Response.json({ ok: resultat.ok });
  } catch (err) {
    console.error("[prospection] désinscription un-clic:", err);
    return new Response("Erreur.", { status: 500 });
  }
}
