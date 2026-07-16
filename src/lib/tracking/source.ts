/**
 * Attribution d'acquisition par canal, côté navigateur (plan v3, section 12.5).
 *
 * Le sprint de prospection envoie des liens `?utm_source=whatsapp|email`. On
 * capte cette valeur à l'arrivée sur le site et on la garde le temps de la
 * session, pour la joindre à l'inscription puis au premier dossier.
 *
 * First-party strict : sessionStorage uniquement, aucun cookie, aucune donnée
 * envoyée à un tiers. Compatible RGPD et avec la politique de confidentialité
 * affichée (« le site n'a aucun analytics »), car on ne stocke qu'un libellé de
 * canal, pas un profil de navigation.
 */

const SOURCE_KEY = "dossimo_source";

/**
 * Réduit une valeur brute à un libellé de canal sûr : minuscules, `a-z 0-9 _ -`,
 * 40 caractères max. Tout le reste (injections, valeurs vides, trop longues)
 * retombe sur `null`. On ne fait jamais confiance au paramètre d'URL tel quel.
 */
export function sanitizeSource(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 40);
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * À l'arrivée sur une page portant `?utm_source=…`, mémorise le canal.
 * Premier contact prioritaire (« first-touch ») : si une source est déjà en
 * session, on ne l'écrase pas. No-op hors navigateur ou si sessionStorage est
 * indisponible (navigation privée stricte) : le suivi ne doit jamais lever.
 */
export function captureSource(): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const source = sanitizeSource(url.searchParams.get("utm_source"));
    if (!source) return;
    if (window.sessionStorage.getItem(SOURCE_KEY)) return;
    window.sessionStorage.setItem(SOURCE_KEY, source);
  } catch {
    // sessionStorage bloqué : on renonce silencieusement.
  }
}

/** Source mémorisée pour cette session, ou `null`. */
export function readSource(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sanitizeSource(window.sessionStorage.getItem(SOURCE_KEY));
  } catch {
    return null;
  }
}
