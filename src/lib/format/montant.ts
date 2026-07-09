/**
 * Format monétaire unique de Dossimo : « 1 200,00 € » — séparateur de milliers
 * insécable, toujours deux décimales.
 *
 * Toute somme affichée à l'écran passe par `formatEuros`. Les documents PDF
 * passent par `formatEurosPdf` : les polices PDF standard ne portent pas
 * l'espace fine insécable produite par `Intl` et l'affichent « / ».
 */
const EUROS = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Espace fine insécable (U+202F, séparateur de milliers) et espace insécable
// (U+00A0, avant le symbole €). Écrites en séquences d'échappement à dessein :
// ces glyphes sont invisibles dans un éditeur et se perdent au moindre
// ré-encodage du fichier, ce qui ramènerait le bug d'affichage PDF.
const ESPACES_INSECABLES = /[\u202F\u00A0]/g;

/** Montant affiché à l'écran. `null` / `undefined` → tiret cadratin. */
export function formatEuros(montant: number | null | undefined): string {
  return montant == null ? "—" : EUROS.format(montant);
}

/** Même format, espaces insécables normalisées pour les polices PDF. */
export function formatEurosPdf(montant: number | null | undefined): string {
  return formatEuros(montant).replace(ESPACES_INSECABLES, " ");
}
