import { VISITE } from "@/lib/landing/visite";

/**
 * Politique de sécurité du contenu, source unique.
 *
 * Extraite du proxy pour être **testable sans Next ni Supabase** : une directive
 * manquante ne se voit pas au build, elle se voit en production, sur l'écran du
 * visiteur. C'est exactement ce qui est arrivé le 2026-07-30 — la visite guidée a
 * été livrée sans `frame-src`, donc la `iframe` retombait sur `default-src 'self'`
 * et le navigateur affichait « Ce contenu est bloqué ».
 *
 * Règle pour tout tiers embarqué à l'avenir : son origine vit dans le module qui
 * porte le tiers (ici `lib/landing/visite.ts`), jamais recopiée ici en dur, et
 * `csp.test.ts` vérifie que la directive la contient.
 */
export function construireCsp({
  nonce,
  isDev = false,
}: {
  nonce: string;
  isDev?: boolean;
}): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    // Cadres SORTANTS : la visite guidée est le seul tiers embarqué de la vitrine
    // (DESIGN.md §5). `frame-ancestors 'none'` juste au-dessus traite le cas
    // inverse — personne ne met Dossimo dans un cadre — et ne dispense pas de
    // celui-ci.
    `frame-src 'self' ${VISITE.origine}`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Les composants Motion utilisent des attributs style dynamiques.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com",
    "font-src 'self' data:",
    "upgrade-insecure-requests",
  ].join("; ");
}
