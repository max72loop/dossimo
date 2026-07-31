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
 * La famille « web » (pied de page, checkout Stripe, cluster /refus) est désormais
 * gérée ici aussi, plus bas. Elle l'était par un commentaire couplant à la main
 * `site-footer.tsx` et `stripe/actions.ts` : le cluster « refus » en aurait fait
 * une troisième copie, ce qui est exactement le seuil où un couplage commenté
 * cesse de tenir (docs/cluster-refus.md § 3.4).
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

/* -------------------------------------------------------------------------- */
/* Famille « web » : pied de page, checkout Stripe, cluster /refus             */
/* -------------------------------------------------------------------------- */

/**
 * Registre plus long que la variante documentaire : la page vitrine explique le
 * positionnement, elle ne se contente pas de le déclarer. Le tronc est commun,
 * seule la fin change de personne selon qui lit.
 *
 * Apostrophes typographiques (’) et non droites : ces chaînes sont rendues en
 * HTML, à côté d'une copie qui en emploie partout. Les variantes documentaires
 * ci-dessus gardent l'apostrophe droite, qui est ce que rend React-PDF.
 */
const MENTION_WEB_TRONC =
  "Dossimo est un service indépendant d’aide à la préparation de dossier, non affilié " +
  "à l’Anah ni à France Rénov’. Dossimo ne dépose jamais le dossier et ne perçoit " +
  "jamais la prime :";

/** Parle de l'artisan à la troisième personne : pied de page, pages éditoriales. */
export const MENTION_INDEPENDANCE_WEB =
  `${MENTION_WEB_TRONC} l’artisan et son client déposent eux-mêmes et conservent ` +
  "l’intégralité de la prime.";

/**
 * S'adresse au lecteur : checkout Stripe, où celui qui lit est celui qui paie.
 * Stripe plafonne `custom_text` à 1200 caractères, cette variante est très en deçà.
 */
export const MENTION_INDEPENDANCE_WEB_ADRESSEE =
  `${MENTION_WEB_TRONC} vous et votre client déposez vous-mêmes et conservez ` +
  "l’intégralité de la prime.";
