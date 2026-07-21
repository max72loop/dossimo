/**
 * Mention d'indépendance — la phrase que le positionnement de Dossimo impose sur
 * chaque PDF et chaque e-mail transactionnel (CLAUDE.md §2, DESIGN.md) : le produit
 * est un service indépendant, non affilié à l'Anah ni à France Rénov', qui ne dépose
 * pas le dossier et ne perçoit pas la prime.
 *
 * Source unique de la FAMILLE « documents & transactionnel ». Elle était recopiée à
 * la main dans le récap, la facture, l'attestation sur l'honneur et le pied des
 * messages de prospection — et la relance du bénéficiaire l'avait purement oubliée.
 * Un libellé imposé qui bouge doit désormais bouger ICI, une fois, sans risque de
 * laisser une surface en arrière.
 *
 * La famille « web » (pied de page, checkout Stripe, landing) emploie une variante
 * plus longue et d'un autre registre (« Dossimo est un service… vous conservez
 * l'intégralité de la prime »), volontairement couplée entre `site-footer.tsx` et
 * `stripe/actions.ts` par un commentaire dédié : elle n'est pas gérée ici.
 */

/** Noyau, amorce en minuscule, terminé par un point. Brique de toutes les variantes. */
export const MENTION_INDEPENDANCE =
  "service indépendant d'aide à la préparation de dossier, non affilié à l'Anah ni à France Rénov'.";

/** La mention seule, amorce en majuscule : quand elle ouvre une phrase. */
export const MENTION_INDEPENDANCE_PHRASE =
  MENTION_INDEPENDANCE.charAt(0).toUpperCase() + MENTION_INDEPENDANCE.slice(1);

/** Variante préfixée de la marque, pour un pied de PDF ou d'e-mail. */
export const DISCLAIMER_DOSSIMO = `Dossimo — ${MENTION_INDEPENDANCE}`;

/**
 * Variante complète : marque + mention + rappel du non-dépôt. Pied du pack
 * documentaire (récap, checklist, rapport) et des e-mails transactionnels.
 */
export const DISCLAIMER_DOSSIMO_COMPLET = `${DISCLAIMER_DOSSIMO} Dossimo ne dépose pas le dossier et ne perçoit pas la prime.`;
