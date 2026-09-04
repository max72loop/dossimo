/**
 * Hiérarchie d'actions : un seul bouton PLEIN par écran (l'action principale
 * contextuelle), tout le reste en outline. Ces classes sont la source unique
 * pour ne pas voir réapparaître des boutons pleins concurrents.
 */
/**
 * Anneau de focus clavier. Exporté : la vitrine a ses propres CTA (plus hauts, plus
 * arrondis) qui n'adoptent pas `BTN_PRINCIPAL`, mais qui doivent rester navigables
 * au clavier — sans quoi le focus y est invisible.
 */
export const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-encre";

/**
 * Même anneau, pour un élément posé SUR fond encre : l'anneau `encre` y disparaît,
 * donc le focus clavier devenait invisible exactement là où la vitrine met ses
 * actions les plus visibles (hero, visite guidée, bandeau tarifs). Cette constante
 * existait déjà, recopiée à l'identique dans `app/page.tsx` et `app/tarifs/page.tsx` :
 * elle est remontée ici pour ne pas dériver une troisième fois.
 */
export const FOCUS_SOMBRE =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papier";

export const BTN_PRINCIPAL = `inline-flex h-11 items-center justify-center rounded bg-accent px-5 text-sm font-semibold text-blanc-casse transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`;

export const BTN_SECONDAIRE = `inline-flex h-11 items-center justify-center rounded border border-encre/25 bg-blanc-casse px-4 text-sm font-medium text-encre transition-colors hover:bg-papier-fonce disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`;

export const BTN_SECONDAIRE_SM = `inline-flex h-9 items-center justify-center rounded border border-encre/25 bg-blanc-casse px-3 text-xs font-medium text-encre transition-colors hover:bg-papier-fonce disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`;

/**
 * CTA de la vitrine.
 *
 * DESIGN.md §5 acte que la vitrine a ses propres actions, plus hautes et plus
 * arrondies que celles de l'app (`BTN_PRINCIPAL`) : la divergence est voulue,
 * sa RECOPIE ne l'était pas. Ces classes vivaient en cinq exemplaires (hero et
 * bandeau tarifs de `app/page.tsx`, deux fois dans `app/tarifs/page.tsx`, une
 * fois dans `app/visite/page.tsx`) et avaient déjà dérivé de trois façons : la
 * variante de `/tarifs` avait perdu `transition-colors` — son survol claquait là
 * où les autres fondaient — et son action secondaire portait `border-papier/25`
 * quand les deux autres portaient `/30`. Même histoire que `FOCUS_SOMBRE`,
 * remonté ici le 2026-07-29 pour la même raison.
 *
 * DEUX habillages, un par fond, et c'est une INVERSION, pas une divergence : le
 * bleu de marque ne va jamais sur encre (1,95:1, cf. DESIGN.md §5 « logo »),
 * donc l'action principale s'y renverse en crème sur encre. Forme, hauteur,
 * graisse, transition et anneau de focus restent identiques des deux côtés.
 */
const CTA_VITRINE_FORME =
  "group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold transition-colors";

/** Action principale de la vitrine, sur fond clair (crème, blanc cassé). */
export const CTA_VITRINE = `${CTA_VITRINE_FORME} bg-accent text-blanc-casse hover:bg-accent-hover ${FOCUS}`;

/** La même, sur fond encre (hero, bandeau tarifs, hero de la visite). */
export const CTA_VITRINE_ENCRE = `${CTA_VITRINE_FORME} bg-papier text-encre hover:bg-blanc-casse ${FOCUS_SOMBRE}`;

/** Action secondaire sur fond encre : contour, jamais un second bouton plein. */
export const CTA_VITRINE_ENCRE_SECONDAIRE = `inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-papier/30 px-6 text-sm font-medium text-papier transition-colors hover:bg-papier/10 ${FOCUS_SOMBRE}`;

/**
 * Variante compacte, réservée à la barre d'en-tête : un bouton de 48 px dans une
 * barre de 64 px ne laisserait pas l'assise que le logo réclame juste à côté
 * (DESIGN.md §5, zone de protection). Seule la hauteur change ; la couleur, la
 * forme et le survol restent ceux de `CTA_VITRINE`.
 */
export const CTA_VITRINE_COMPACT = `inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-blanc-casse transition-colors hover:bg-accent-hover ${FOCUS}`;
