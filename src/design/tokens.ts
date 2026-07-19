/**
 * Source machine unique de la palette Dossimo.
 *
 * Les décisions se prennent dans `DESIGN.md` ; ce fichier est leur implémentation
 * canonique. Deux miroirs en dérivent :
 *
 *  - `src/app/globals.css` (`@theme`, web) doit être IDENTIQUE à cet objet.
 *    L'égalité est vérifiée par `src/design/tokens.test.ts` : toute dérive casse
 *    le test, plus un oubli possible.
 *  - `src/lib/pack/pdf-theme.ts` (PDF) IMPORTE ces valeurs directement — aucune
 *    recopie à la main.
 *
 * L'ordre des clés suit celui du bloc `@theme` de `globals.css`, pour comparer les
 * deux à l'œil sans friction.
 */
export const TOKENS = {
  // Couleurs de marque
  encre: "#16202b",
  tampon: "#35507f",
  // Accent de marque (ex-token `terre-cuite`, renommé le 2026-07-19) : c'est le
  // bleu. `accent-hover` est le survol de l'action principale.
  accent: "#35507f",
  "accent-hover": "#2a3f65",
  // Accent lisible SUR fond encre (le bleu foncé y manque de contraste). Déjà en
  // usage dans le PDF (sur-titre) et l'e-mail ; promu en token le 2026-07-19.
  "accent-clair": "#9db0cf",
  papier: "#f3f0e9",
  "blanc-casse": "#fbf9f3",
  ardoise: "#5b636d",
  filigrane: "#e2ddd1",
  "encre-claire": "#9aa1a9",

  // Fonds neutres utilitaires
  "papier-fonce": "#eae6dc",

  // Couleurs sémantiques
  succes: "#2d6a4f",
  "succes-bg": "#e7f1ea",
  erreur: "#9b2c2c",
  "erreur-bg": "#f6e9e6",
  avertissement: "#a8730b",
  "avertissement-bg": "#f6eed6",
  info: "#35507f",
  "info-bg": "#e9edf4",
} as const;

export type TokenName = keyof typeof TOKENS;
