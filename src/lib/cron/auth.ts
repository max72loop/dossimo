import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Vérifie l'en-tête `Authorization: Bearer <CRON_SECRET>` d'une route planifiée
 * (Vercel Cron, workflow GitHub). Retourne la `Response` à renvoyer telle quelle
 * si l'appel est refusé — `503` si le secret n'est pas configuré (une route
 * ouverte par erreur, c'est un relais offert au premier venu), `401` si l'en-tête
 * est absente ou fausse — ou `null` si l'appel est autorisé.
 *
 * La comparaison est à temps constant. Un `!==` de chaîne court-circuite au
 * premier octet qui diffère : le temps de réponse fuite alors la longueur du
 * préfixe correct, un oracle qui permet de reconstruire le secret octet par
 * octet. On hache les deux côtés en une empreinte de taille fixe avant
 * `timingSafeEqual`, ce qui neutralise à la fois le canal temporel et toute
 * fuite de longueur (le secret Stripe passe déjà par une vérification équivalente
 * en interne, cf. `constructEventAsync`).
 */
export function refuserSiCronNonAutorise(req: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response("CRON_SECRET non configuré.", { status: 503 });
  }
  const fourni = req.headers.get("authorization") ?? "";
  if (!egaliteConstante(fourni, `Bearer ${secret}`)) {
    return new Response("Non autorisé.", { status: 401 });
  }
  return null;
}

/**
 * Égalité à temps constant de deux chaînes de longueurs quelconques.
 * `timingSafeEqual` exige des buffers de même taille ; on hache donc chaque
 * entrée en SHA-256 (32 octets fixes) avant de comparer.
 */
function egaliteConstante(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
