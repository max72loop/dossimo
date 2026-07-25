/**
 * Régénère les actifs de marque de `public/brand/` (et les icônes d'application)
 * à partir de la SEULE source des tracés : `src/lib/brand/mark.ts`.
 *
 *   node scripts/brand-assets.mjs
 *
 * Rien ici n'est une décision de design : tout est écrit dans DESIGN.md §5 et
 * implémenté dans `mark.ts`. Ce script ne fait que dériver. `mark.test.ts`
 * vérifie ensuite que les fichiers produits n'ont pas dérivé du module, donc un
 * actif retouché à la main dans un éditeur devient un test rouge.
 *
 * Les tracés et les couleurs sont extraits par expression régulière plutôt
 * qu'importés : Node 20 ne sait pas exécuter du TypeScript, et ajouter un
 * transpileur pour six fichiers PNG serait payer trop cher. Les motifs sont
 * ancrés sur les noms des constantes ; s'ils changent, le script s'arrête au lieu
 * de produire un actif faux.
 *
 * `sharp` n'est pas une dépendance déclarée du projet : il arrive avec Next
 * (optimisation d'images). Ce script est le seul endroit qui s'en sert, et il ne
 * tourne qu'à la main, jamais au build ni en production.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import sharp from "sharp";

const RACINE = join(dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1"), "..");
const BRAND = join(RACINE, "public", "brand");

function lire(chemin) {
  return readFileSync(join(RACINE, chemin), "utf8");
}

function extraire(source, nom, motif) {
  const m = source.match(motif);
  if (!m) throw new Error(`${nom} introuvable : la source a changé de forme, corriger ce script`);
  return m[1];
}

// ---------------------------------------------------------------- la source
const mark = lire("src/lib/brand/mark.ts");
const tokensTs = lire("src/design/tokens.ts");

const SYMBOLE_D = extraire(mark, "SYMBOLE_D", /export const SYMBOLE_D =\s*\n?\s*"([^"]+)"/);
const MOT_SIGNE_D = extraire(mark, "MOT_SIGNE_D", /export const MOT_SIGNE_D =\s*\n?\s*"([^"]+)"/);
const SYMBOLE_VIEWBOX = extraire(mark, "SYMBOLE_VIEWBOX", /SYMBOLE_VIEWBOX = "([^"]+)"/);
const LOCKUP_VIEWBOX = extraire(mark, "LOCKUP_VIEWBOX", /LOCKUP_VIEWBOX = "([^"]+)"/);

const token = (nom) =>
  extraire(tokensTs, `token ${nom}`, new RegExp(`"?${nom}"?:\\s*"(#[0-9a-fA-F]{3,8})"`));

const ENCRE = token("encre");
const BLANC_CASSE = token("blanc-casse");
const TAMPON = token("tampon");

/**
 * Les déclinaisons ne sont PAS redéfinies ici : elles sont lues dans
 * `DECLINAISONS` de `mark.ts`, qui est leur seul auteur. Sans cette lecture, la
 * règle « le bleu de marque ne va jamais sur fond encre » vivrait à deux endroits,
 * et le jour où l'un bouge, les actifs et le site cessent de dire la même chose.
 */
function declinaisons() {
  const bloc = extraire(mark, "DECLINAISONS", /export const DECLINAISONS = \{([\s\S]*?)\n\} as const;/);
  const resoudre = (expr) => {
    const litteral = expr.match(/^"(#[0-9a-fA-F]{3,8})"$/);
    if (litteral) return litteral[1];
    const ref = expr.match(/^TOKENS(?:\.([\w]+)|\["([\w-]+)"\])$/);
    if (!ref) throw new Error(`valeur de couleur illisible : « ${expr} »`);
    return token(ref[1] ?? ref[2]);
  };
  const out = {};
  const re = /^\s*"?([\w-]+)"?:\s*\{\s*symbole:\s*(.+?),\s*motSigne:\s*(.+?)\s*\},$/gm;
  let m;
  while ((m = re.exec(bloc)) !== null) {
    out[m[1]] = { symbole: resoudre(m[2]), motSigne: resoudre(m[3]) };
  }
  const attendues = ["encre", "nuit", "mono-encre", "mono-blanc"];
  for (const nom of attendues) {
    if (!out[nom]) throw new Error(`déclinaison « ${nom} » non lue dans mark.ts`);
  }
  return out;
}

const DECL = declinaisons();

const [, , LOCKUP_W, LOCKUP_H] = LOCKUP_VIEWBOX.split(" ").map(Number);
const [, , SYM_W, SYM_H] = SYMBOLE_VIEWBOX.split(" ").map(Number);

// ------------------------------------------------------------------- gabarits
/** Signature horizontale. `px` fixe la hauteur de rendu du fichier. */
function svgLockup({ symbole, motSigne, px = LOCKUP_H }) {
  const w = Math.round(px * (LOCKUP_W / LOCKUP_H));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${Math.round(px)}" viewBox="${LOCKUP_VIEWBOX}" role="img" aria-label="Dossimo">
  <path fill="${symbole}" d="${SYMBOLE_D}"/>
  <path fill="${motSigne}" d="${MOT_SIGNE_D}"/>
</svg>
`;
}

/** Symbole seul, à sa géométrie livrée. */
function svgSymbole({ couleur, px = SYM_H }) {
  const w = Math.round(px * (SYM_W / SYM_H));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${Math.round(px)}" viewBox="${SYMBOLE_VIEWBOX}" role="img" aria-label="Dossimo">
  <path fill="${couleur}" d="${SYMBOLE_D}"/>
</svg>
`;
}

/**
 * Part du côté occupée par le symbole dans la pastille. 0,68 est réglé sur le
 * rendu réel à 16 px, la taille contraignante.
 *
 * La tentation, à cette taille, est d'épaissir le contour du symbole pour le
 * rendre plus présent. C'est l'inverse qu'il faut faire : ce sont les VIDES
 * (l'intérieur du dossier, l'écart entre la coche et le bord) qui portent la
 * forme, et un contour doublé les referme en tache grise. La correction utile est
 * d'agrandir le glyphe dans sa pastille, pas de l'épaissir.
 */
const PART = 0.68;

/**
 * Pastille : symbole centré sur un aplat arrondi. C'est la forme du logo aux
 * tailles où la signature horizontale ne tient plus (favicon, avatar, app).
 * `rayon` et `part` sont des fractions du côté.
 */
function svgPastille({ cote, fond, signe, rayon = 0.22, part = PART }) {
  const hauteur = cote * part;
  const largeur = hauteur * (SYM_W / SYM_H);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cote}" height="${cote}" viewBox="0 0 ${cote} ${cote}">
  <rect width="${cote}" height="${cote}" rx="${cote * rayon}" fill="${fond}"/>
  <svg x="${(cote - largeur) / 2}" y="${(cote - hauteur) / 2}" width="${largeur}" height="${hauteur}" viewBox="${SYMBOLE_VIEWBOX}">
    <path fill="${signe}" d="${SYMBOLE_D}"/>
  </svg>
</svg>
`;
}

// -------------------------------------------------------------------- sortie
mkdirSync(BRAND, { recursive: true });

const svgs = {
  // Signature, une déclinaison par fond (DESIGN.md §5).
  "public/brand/dossimo-logo.svg": svgLockup(DECL.encre),
  "public/brand/dossimo-logo-nuit.svg": svgLockup(DECL.nuit),
  "public/brand/dossimo-logo-mono-encre.svg": svgLockup(DECL["mono-encre"]),
  "public/brand/dossimo-logo-mono-blanc.svg": svgLockup(DECL["mono-blanc"]),
  // Symbole seul, à partir de 24 px de haut (cf. MIN_PX).
  "public/brand/dossimo-symbole.svg": svgSymbole({ couleur: DECL.encre.symbole }),
  "public/brand/dossimo-symbole-nuit.svg": svgSymbole({ couleur: DECL.nuit.symbole }),
  "public/brand/dossimo-symbole-blanc.svg": svgSymbole({ couleur: DECL["mono-blanc"].symbole }),
};

for (const [chemin, contenu] of Object.entries(svgs)) {
  writeFileSync(join(RACINE, chemin), contenu, "utf8");
}

/** Rasterise un SVG à sa taille naturelle (width/height sont déjà en pixels). */
async function rasteriser(svg) {
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

async function png(chemin, svg) {
  const buf = await rasteriser(svg);
  writeFileSync(join(RACINE, chemin), buf);
  return buf.length;
}

/**
 * Empaquette des PNG dans un conteneur ICO. `sharp` ne sait pas écrire d'ICO, et
 * le format est assez simple pour être écrit à la main : en-tête de 6 octets,
 * une entrée de répertoire de 16 octets par image, puis les PNG bruts (l'ICO
 * accepte du PNG embarqué depuis Vista).
 *
 * Pourquoi s'en donner la peine : `/favicon.ico` est la seule icône qu'un client
 * demande SANS qu'on la lui ait déclarée. Les lecteurs de flux, certains
 * robots et les aperçus de lien la cherchent à la racine, et sans elle ils
 * n'affichent rien plutôt que d'aller lire les balises `<link>`.
 */
function ico(images) {
  const entete = Buffer.alloc(6);
  entete.writeUInt16LE(0, 0); // réservé
  entete.writeUInt16LE(1, 2); // type 1 = icône
  entete.writeUInt16LE(images.length, 4);

  const repertoire = Buffer.alloc(16 * images.length);
  let position = 6 + 16 * images.length;
  images.forEach(({ cote, buf }, i) => {
    const o = i * 16;
    // 0 signifie 256 dans ce format ; au-delà, l'ICO ne sait pas décrire la taille.
    repertoire.writeUInt8(cote >= 256 ? 0 : cote, o);
    repertoire.writeUInt8(cote >= 256 ? 0 : cote, o + 1);
    repertoire.writeUInt16LE(1, o + 4); // plans de couleur
    repertoire.writeUInt16LE(32, o + 6); // bits par pixel
    repertoire.writeUInt32LE(buf.length, o + 8);
    repertoire.writeUInt32LE(position, o + 12);
    position += buf.length;
  });

  return Buffer.concat([entete, repertoire, ...images.map((i) => i.buf)]);
}

const pastille = (cote, opts = {}) =>
  svgPastille({ cote, fond: ENCRE, signe: BLANC_CASSE, ...opts });

const rasters = [
  // Signature rastérisée : bandeau PDF et en-tête e-mail (React-PDF et les
  // clients mail ne rendent pas le SVG de façon fiable).
  ["public/brand/dossimo-logo-nuit.png", svgLockup({ ...DECL.nuit, px: 240 })],
  ["public/brand/dossimo-logo.png", svgLockup({ ...DECL.encre, px: 240 })],
  // Pastille du kit, pour les usages externes (presse, partenaires, profils).
  ["public/brand/dossimo-icon.png", pastille(512)],
  // Pastille claire : sur fond sombre ou en signature d'e-mail.
  ["public/brand/dossimo-icon-clair.png", pastille(512, { fond: BLANC_CASSE, signe: TAMPON })],
  // Avatar carré des profils (WhatsApp Business, réseaux) : plein cadre, sans
  // arrondi — chaque plateforme applique le sien, et un double arrondi bave.
  ["public/brand/dossimo-avatar-512.png", pastille(512, { rayon: 0 })],
  // Icônes d'application. Convention Next : plusieurs icônes se déclarent par un
  // suffixe numéroté, et Next lit la taille RÉELLE du fichier pour écrire
  // l'attribut `sizes` de chaque `<link>`. Fournir les trois tailles est le seul
  // moyen qu'un onglet reçoive le 16 px réglé à la main plutôt qu'un 512 réduit
  // à la volée par le navigateur, qui rend le symbole en bouillie.
  //
  // L'ordre est lexical (icon, icon1, icon2), et un client qui ignore `sizes`
  // prend le premier : c'est pour lui que le 32 passe devant, taille d'un onglet
  // sur écran à densité doublée.
  ["src/app/icon.png", pastille(32)],
  ["src/app/icon1.png", pastille(16)],
  ["src/app/icon2.png", pastille(512)],
  // iOS masque lui-même l'icône : la fournir déjà arrondie donne un double
  // arrondi. Plein cadre, opaque.
  ["src/app/apple-icon.png", pastille(180, { rayon: 0 })],
];

let total = 0;
for (const [chemin, svg] of rasters) {
  total += await png(chemin, svg);
}

// `favicon.ico` doit rester au premier niveau de `app/` (contrainte Next).
const conteneurIco = ico([
  { cote: 16, buf: await rasteriser(pastille(16)) },
  { cote: 32, buf: await rasteriser(pastille(32)) },
]);
writeFileSync(join(RACINE, "src/app/favicon.ico"), conteneurIco);
total += conteneurIco.length;

console.log(
  `${Object.keys(svgs).length} SVG + ${rasters.length} PNG + 1 ICO écrits (${Math.round(total / 1024)} Ko).`,
);
console.log(`Vérifier ensuite : npx vitest run src/lib/brand`);