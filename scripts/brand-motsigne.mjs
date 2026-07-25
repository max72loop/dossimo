/**
 * Convertit le mot « dossimo » en tracés SVG, dans la police de marque, et le
 * cale dans le repère du symbole.
 *
 *   node scripts/brand-motsigne.mjs
 *
 * À lancer UNIQUEMENT quand la police, la graisse ou la composition changent : le
 * résultat se recopie dans `MOT_SIGNE_D` et `LOCKUP_VIEWBOX` de
 * `src/lib/brand/mark.ts`, qui reste la source du signe. C'est une opération
 * ponctuelle, pas une étape de build.
 *
 * Pourquoi des courbes et non du texte vivant : le mot-signe doit être identique
 * sur les quatre supports, or Unbounded n'existe ni dans les PDF (React-PDF n'a
 * qu'Helvetica) ni dans les e-mails (pas de webfont), et la carte sociale est
 * rendue par Satori, qui ne sait pas lire les woff2 de `next/font`. Un mot-signe
 * en texte vivant serait donc juste sur le web et faux partout ailleurs : c'était
 * déjà le cas de la carte sociale, qui a longtemps affiché « dossimo » dans la
 * police par défaut de Satori sans que personne ne le voie. En courbes, le logo
 * est le même partout, et le web n'attend plus le chargement de la webfont pour
 * l'afficher juste.
 *
 * `fontkit` n'est pas une dépendance déclarée : il arrive avec Next. Ce script ne
 * tourne qu'à la main.
 */

import { openSync } from "fontkit";

/** Cadre du symbole, à l'origine (cf. `SYMBOLE_VIEWBOX`). */
const SYM_W = 196.29;
const SYM_H = 204.59;

/**
 * Hauteur visuelle du mot-signe, en fraction de la hauteur du symbole. Reprise du
 * kit livré : cette proportion place l'ascendante du « d » près du haut du
 * symbole et la ligne de base près de son bas.
 */
const PART_MOT = 0.73;

/**
 * Écart entre le symbole et le mot-signe, en unités du tracé. Le kit livré
 * l'avait à 97,36 pour un mot-signe plus léger ; Unbounded Bold étant plus large
 * et plus gras, 97 détachait visiblement les deux éléments. 78 a été retenu par
 * comparaison à 22, 36 et 48 px de haut.
 */
const ECART = 78;

/** Identique au `tracking-[-0.02em]` que portait l'ancien mot-signe typographique. */
const TRACKING_EM = -0.02;

const POLICE = "templates/brand/police/Unbounded[wght].ttf";
const GRAISSE = 700;
const MOT = "dossimo";

const police = openSync(POLICE);
const bold = police.getVariation({ wght: GRAISSE });
const upem = bold.unitsPerEm;
const run = bold.layout(MOT);

// Position de chaque glyphe, en unités de police, y vers le HAUT.
const glyphes = [];
let curseur = 0;
run.glyphs.forEach((glyphe, i) => {
  glyphes.push({ path: glyphe.path, dx: curseur });
  curseur += run.positions[i].xAdvance + TRACKING_EM * upem;
});

/**
 * Boîte englobante réelle du mot, et non les métriques de la police : « dossimo »
 * n'a ni descendante ni majuscule, donc le cadre des métriques laisserait un vide
 * en haut et en bas que le calage reporterait dans le logo.
 */
const boite = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
for (const { path, dx } of glyphes) {
  const b = path.bbox;
  boite.x0 = Math.min(boite.x0, b.minX + dx);
  boite.x1 = Math.max(boite.x1, b.maxX + dx);
  boite.y0 = Math.min(boite.y0, b.minY);
  boite.y1 = Math.max(boite.y1, b.maxY);
}
const largeurMot = boite.x1 - boite.x0;
const hauteurMot = boite.y1 - boite.y0;

const k = (SYM_H * PART_MOT) / hauteurMot;
const decalageX = SYM_W + ECART - boite.x0 * k;
// Centrage vertical sur l'axe du symbole ; y_svg = bas du mot − y_police × k.
const decalageY = SYM_H / 2 + (hauteurMot * k) / 2 + boite.y0 * k;

const r = (n) => String(Math.round(n * 100) / 100);

const LETTRE = {
  moveTo: "M",
  lineTo: "L",
  quadraticCurveTo: "Q",
  bezierCurveTo: "C",
  closePath: "Z",
};

/** Réécrit un tracé de police (y vers le haut) en tracé SVG (y vers le bas). */
function transformer(path, dx) {
  const sortie = [];
  for (const cmd of path.commands) {
    const lettre = LETTRE[cmd.command];
    if (!lettre) throw new Error(`commande de tracé inconnue : ${cmd.command}`);
    const points = [];
    for (let i = 0; i < cmd.args.length; i += 2) {
      points.push(`${r((cmd.args[i] + dx) * k + decalageX)},${r(decalageY - cmd.args[i + 1] * k)}`);
    }
    sortie.push(lettre + points.join(" "));
  }
  return sortie.join("");
}

const motSigne = glyphes.map(({ path, dx }) => transformer(path, dx)).join("");
const largeurLockup = SYM_W + ECART + largeurMot * k;

console.log(`${police.familyName} ${GRAISSE}, « ${MOT} » : ${r(largeurMot * k)} × ${r(hauteurMot * k)} unités`);
console.log(`\nLOCKUP_VIEWBOX = "0 0 ${r(largeurLockup)} ${SYM_H}"   (rapport ${(largeurLockup / SYM_H).toFixed(3)})`);
console.log(`\nMOT_SIGNE_D =\n"${motSigne}"`);
console.log(`\nÀ recopier dans src/lib/brand/mark.ts, puis : node scripts/brand-assets.mjs`);
