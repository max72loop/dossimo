// fr-FR insère une espace fine insécable (U+202F) ou insécable (U+00A0) comme
// séparateur de milliers ; ces glyphes manquent aux polices PDF standard et
// s'affichent alors comme "/". On les normalise en espace ordinaire.
const NBSP = /[  ]/g;

export const euro = (n: number | null | undefined) =>
  n == null
    ? "—"
    : n
        .toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
        .replace(NBSP, " ");

export const dateFr = (s: string | null | undefined) => {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR");
};
