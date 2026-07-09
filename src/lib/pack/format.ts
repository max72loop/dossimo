import { formatEurosPdf } from "@/lib/format/montant";

/**
 * Formatage des documents PDF. Le format monétaire est centralisé dans
 * `@/lib/format/montant` : `formatEurosPdf` normalise les espaces insécables,
 * absentes des polices PDF standard (elles s'y affichent « / »).
 */
export const euro = formatEurosPdf;

export const dateFr = (s: string | null | undefined) => {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR");
};
