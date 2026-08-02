/**
 * Régénère l'affiche de la visite guidée (`public/visite/apercu.webp`) à partir
 * de la démo Supademo elle-même.
 *
 *   node scripts/visite-affiche.mjs
 *
 * À lancer **chaque fois que la démo est remplacée ou réenregistrée** : sans
 * cela, la vitrine promet un écran que la visite ne montre plus. Rien ici n'est
 * une décision de design (elles sont dans DESIGN.md §5, « Contenu tiers
 * embarqué ») : le script ne fait que dériver un actif servi par nous d'une
 * capture qui vit chez l'hébergeur.
 *
 * Pourquoi une capture servie depuis `public/` plutôt que la vignette de
 * l'hébergeur : la règle « rien du tiers avant le clic » interdit d'aller
 * chercher quoi que ce soit sur `media.supademo.com` au chargement de la page.
 * Le fichier est donc figé au moment de ce script, pas au moment de la visite.
 *
 * L'identifiant de la démo et le numéro d'étape retenu ne sont PAS recopiés
 * ici : ils sont lus dans `src/lib/landing/visite.ts`, seule source (deux
 * sources pour une valeur = elles divergent). Les motifs sont ancrés sur les
 * noms des constantes ; s'ils changent, le script s'arrête au lieu de produire
 * une affiche fausse.
 *
 * `sharp` n'est pas une dépendance déclarée du projet : il arrive avec Next.
 * Ce script ne tourne qu'à la main, jamais au build ni en production.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import sharp from "sharp";

const RACINE = join(dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1"), "..");

/**
 * Découpe appliquée à la capture. Deux retraits, tous deux pour la même raison :
 * ce que la barre d'en-tête de l'app contient n'a rien à faire sur la vitrine.
 *
 * - `ENTETE` retire le bandeau applicatif, qui porte le **nom de l'entreprise
 *   connectée**. La vitrine est sans donnée nominative depuis le 2026-07-22 et
 *   une capture ne fait pas exception. L'affiche a de toute façon son propre
 *   cadre de navigateur, dessiné avec les tokens.
 * - `BARRE` retire la barre de défilement du navigateur de capture, qui se lit
 *   comme un artefact une fois l'image posée dans un autre cadre.
 */
const ENTETE = 58;
const BARRE = 18;
/** Largeur de sortie : ~1,45× la largeur d'affichage maximale de l'affiche. */
const LARGEUR = 1600;

// ---------------------------------------------------------------- la source
const visite = readFileSync(join(RACINE, "src", "lib", "landing", "visite.ts"), "utf8");

function extraire(nom, motif) {
  const m = visite.match(motif);
  if (!m) throw new Error(`${nom} introuvable dans visite.ts : la source a changé de forme, corriger ce script`);
  return m[1];
}

const ID = extraire("ID", /const ID = "([^"]+)"/);
const ORIGINE = extraire("ORIGINE", /const ORIGINE = "([^"]+)"/);
const ETAPE = Number(extraire("affiche.etape", /etape:\s*(\d+)/));
const SORTIE = extraire("affiche.src", /src:\s*"([^"]+)"/);

// ------------------------------------------------------- la capture d'étape
const page = await fetch(`${ORIGINE}/demo/${ID}`).then((r) => {
  if (!r.ok) throw new Error(`démo injoignable (${r.status}) : ${ORIGINE}/demo/${ID}`);
  return r.text();
});

// Les captures d'étapes sont dans le JSON embarqué de la page, dans l'ordre du
// parcours. On lit la première URL qui suit le marqueur de l'étape voulue.
const etapes = new Map();
const motif = /Step (\d+).{0,500}?(https:\/\/media\.supademo\.com\/[A-Za-z0-9]+\/[A-Za-z0-9_-]+\.jpg)/gs;
for (const m of page.matchAll(motif)) {
  const numero = Number(m[1]);
  if (!etapes.has(numero)) etapes.set(numero, m[2]);
}

const source = etapes.get(ETAPE);
if (!source) {
  throw new Error(
    `étape ${ETAPE} introuvable dans la démo (${etapes.size} étapes lues). ` +
      `La démo a-t-elle été raccourcie ? Ajuster affiche.etape dans visite.ts.`,
  );
}

const capture = Buffer.from(await fetch(source).then((r) => r.arrayBuffer()));
const { width, height } = await sharp(capture).metadata();
if (width !== 1920 || height !== 945) {
  throw new Error(
    `capture en ${width}×${height}, attendue en 1920×945. Vérifier VISITE.ratio et les valeurs de découpe ci-dessus.`,
  );
}

const image = sharp(capture)
  .extract({ left: 0, top: ENTETE, width: width - BARRE, height: height - ENTETE })
  .resize({ width: LARGEUR })
  .webp({ quality: 78 });

const fichier = join(RACINE, "public", ...SORTIE.split("/").filter(Boolean));
mkdirSync(dirname(fichier), { recursive: true });
const rendu = await image.toBuffer();
writeFileSync(fichier, rendu);

const meta = await sharp(rendu).metadata();
console.log(`affiche : étape ${ETAPE} → ${SORTIE} (${meta.width}×${meta.height}, ${Math.round(rendu.length / 1024)} ko)`);
console.log("Si les dimensions ont changé, reporter largeur/hauteur dans VISITE.affiche.");
