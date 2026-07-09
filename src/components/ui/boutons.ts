/**
 * Hiérarchie d'actions : un seul bouton PLEIN par écran (l'action principale
 * contextuelle), tout le reste en outline. Ces classes sont la source unique
 * pour ne pas voir réapparaître des boutons pleins concurrents.
 */
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-encre";

export const BTN_PRINCIPAL = `inline-flex h-11 items-center justify-center rounded bg-terre-cuite px-5 text-sm font-semibold text-blanc-casse transition-colors hover:bg-terre-cuite-hover disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`;

export const BTN_SECONDAIRE = `inline-flex h-11 items-center justify-center rounded border border-encre/25 bg-blanc-casse px-4 text-sm font-medium text-encre transition-colors hover:bg-papier-fonce disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`;

export const BTN_SECONDAIRE_SM = `inline-flex h-9 items-center justify-center rounded border border-encre/25 bg-blanc-casse px-3 text-xs font-medium text-encre transition-colors hover:bg-papier-fonce disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`;
