/**
 * Normalisation des nombres lus sur une pièce.
 *
 * Un VLM rend ce qu'il voit, dans le format où c'est imprimé : « 4 200,00 € »,
 * « 4.200,50 », « 28 450 », « 7,5 », « 95 m² ». Sans normalisation commune, chaque
 * appelant réinventait la sienne, et les deux en production étaient fausses :
 * `parseFloat("28.450")` rendait 28,45 pour un revenu fiscal de 28 450 €, et
 * `parseFloat("4.200,50")` rendait 4,2 pour un montant TTC. Ces valeurs pilotent la
 * catégorie de revenus et les écarts bloquants : Dossimo fabriquait le refus qu'il
 * prétend éviter.
 *
 * Une seule fonction, testée sur les formats réellement rencontrés.
 */

/**
 * Point(s) seul(s) sans virgule : le seul cas réellement ambigu. « 28.450 » vaut
 * 28 450 sur un avis d'imposition, « 4.2 » vaut 4,2 pour une résistance thermique.
 * On ne tranche « milliers » que sur la forme stricte d'un groupement : des groupes
 * de exactement trois chiffres, un premier groupe de un à trois chiffres, et pas de
 * zéro en tête. Ce dernier point protège les décimaux à trois chiffres (« 0.125 »),
 * qu'aucun groupement de milliers ne peut produire.
 */
function estGroupementMilliers(corps: string): boolean {
  return /^[1-9]\d{0,2}(\.\d{3})+$/.test(corps);
}

/**
 * Le nombre porté par `v`, ou null si `v` n'en porte pas.
 *
 * Accepte les nombres tels quels, et les chaînes dans les formats FR (virgule
 * décimale, espace ou point de milliers) comme EN (point décimal, virgule de
 * milliers). Unités, symboles et espaces (y compris fins et insécables) sont
 * ignorés : ils ne portent pas de valeur.
 */
export function parseNombreFr(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;

  const brut = v.replace(/[^\d.,-]/g, "");
  const signe = brut.trimStart().startsWith("-") ? -1 : 1;
  const corps = brut.replace(/-/g, "");
  if (!/\d/.test(corps)) return null;

  const point = corps.lastIndexOf(".");
  const virgule = corps.lastIndexOf(",");

  let normalise: string;
  if (point >= 0 && virgule >= 0) {
    // Les deux présents : le dernier rencontré est le séparateur décimal, l'autre
    // groupe les milliers. Vrai dans les deux conventions, sans avoir à deviner.
    const decimal = point > virgule ? "." : ",";
    const milliers = decimal === "." ? "," : ".";
    normalise = corps.split(milliers).join("").replace(decimal, ".");
  } else if (virgule >= 0) {
    // Virgule seule : décimale en FR. Sauf répétée (« 1,234,567 »), qui ne peut
    // être qu'un groupement de milliers à l'anglaise.
    const groupes = corps.split(",");
    normalise = groupes.length > 2 ? groupes.join("") : corps.replace(",", ".");
  } else if (point >= 0) {
    normalise = estGroupementMilliers(corps) ? corps.split(".").join("") : corps;
  } else {
    normalise = corps;
  }

  const n = parseFloat(normalise);
  return Number.isFinite(n) ? signe * n : null;
}
