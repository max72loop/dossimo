/**
 * L'offre de lancement DOSSIMO50 : code, échéance, et prix remisé.
 *
 * Source unique. Avant ce module, l'échéance vivait au moins à cinq endroits que
 * rien ne synchronisait : `FIN_CODE_LANCEMENT` dans les actions Stripe, trois
 * chaînes « 31 juillet 2026 » écrites en dur dans la landing et l'inscription, et
 * le corps de campagne stocké en base. Le 16/07/2026, la prolongation du 26 au 31
 * a été faite dans le code mais pas en base : la campagne a annoncé pendant un
 * jour une échéance plus courte que la réalité. Un déploiement ne corrige jamais
 * une chaîne stockée en base — d'où ce module, et d'où la règle : toute nouvelle
 * mention de l'offre lit ici, jamais une constante recopiée.
 *
 * Le PRIX, lui, n'est pas ici : il se dérive de `pricing_tiers` (grille facturée),
 * jamais d'une valeur en dur — la grille peut bouger (CLAUDE.md §10) et un prix
 * barré faux est un prix mensonger.
 */

import { labelEuros, type GrilleAffichee } from "@/lib/pricing";

/** Code promo Stripe du lancement. */
export const CODE_LANCEMENT = "DOSSIMO50";

/** Remise appliquée par le coupon (50 %). */
export const REMISE_LANCEMENT = 0.5;

/** Fin de validité : 31/07/2026 à 23h59m59s, heure de Paris. */
export const FIN_LANCEMENT = new Date("2026-07-31T21:59:59.000Z");

/** La même échéance en secondes epoch, format attendu par Stripe (`redeem_by`). */
export const FIN_LANCEMENT_EPOCH = Math.floor(FIN_LANCEMENT.getTime() / 1000);

/**
 * L'offre court-elle encore ? Sert à taire l'offre plutôt qu'à promettre une
 * remise expirée : un message parti le 1er août ne doit pas annoncer DOSSIMO50.
 */
export function offreLancementActive(maintenant: Date = new Date()): boolean {
  return maintenant.getTime() <= FIN_LANCEMENT.getTime();
}

/** Échéance en clair pour la copie (« 31 juillet 2026 »), en heure de Paris. */
export function finLancementLisible(): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(FIN_LANCEMENT);
}

/**
 * Prix d'appel remisé, dérivé du palier le plus bas de la grille facturée.
 * `null` si la grille est illisible : l'appelant tait alors le prix.
 */
export function prixLancement(grille: GrilleAffichee | null): { remise: string; plein: string } | null {
  if (!grille) return null;
  return {
    remise: labelEuros(Math.round(grille.minCents * (1 - REMISE_LANCEMENT))),
    plein: labelEuros(grille.minCents),
  };
}
