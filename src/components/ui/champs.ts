/**
 * Champs de formulaire — source unique des classes, comme `boutons.ts` l'est
 * pour les actions et `cartes.ts` pour les cartes (DESIGN.md §5).
 *
 * Avant ce fichier, `inputClass` / `labelClass` étaient recopiés dans cinq
 * composants (fields, auth-forms, lead-form, estimateur, demarrage-assiste), et
 * les copies DIVERGEAIENT : les formulaires vitrine et auth n'avaient ni l'état
 * désactivé ni le rougissement `aria-[invalid=true]` que porte le système de
 * champs. Un champ en erreur y restait gris. `CHAMP_INPUT` est la version
 * canonique (celle de `fields.tsx`), à importer partout.
 *
 * Le petit espace label→contrôle se règle à la composition : soit `mb-1.5` sur le
 * label (patron de `fields.tsx`), soit `mt-1.5` devant `CHAMP_INPUT` (patron des
 * formulaires vitrine). Les deux produisent le même écart ; on n'en fige pas un
 * pour ne pas déplacer les mises en page existantes.
 */

/** Input / select : hauteur, bordure, focus, états désactivé et invalide. */
export const CHAMP_INPUT =
  "h-11 w-full rounded border border-filigrane bg-blanc-casse px-3.5 text-sm text-encre placeholder:text-encre-claire outline-none transition focus:border-tampon focus:ring-2 focus:ring-tampon/15 disabled:bg-papier-fonce aria-[invalid=true]:border-erreur";

/** Libellé de champ (sans marge : la composer selon le patron, cf. en-tête). */
export const CHAMP_LABEL = "block text-sm font-medium text-ardoise";

/** Message d'erreur sous un champ. */
export const CHAMP_ERREUR = "mt-1 text-xs text-erreur";

/** Aide inline sous un champ (jamais affichée en même temps que l'erreur). */
export const CHAMP_HINT = "mt-1 text-xs text-encre-claire";
