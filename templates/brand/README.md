# Kits de marque source

Les livraisons brutes du logo, datées, telles qu'elles ont été reçues. Ce dossier
n'est **pas servi** par le site (contrairement à `public/`) : ce sont des sources,
pas des actifs.

Rien ici n'est utilisé au rendu. Le logo en vigueur vit dans
[`src/lib/brand/mark.ts`](../../src/lib/brand/mark.ts), et les fichiers de
`public/brand/` en sont dérivés par `node scripts/brand-assets.mjs`
(cf. `DESIGN.md` §5).

| Fichier | Ce qu'il contient |
|---|---|
| `2026-07-08 Dossimo - Idées de logo.zip` | Explorations initiales, mot-signe typographique. Retenu à l'époque : « dossimo » en Unbounded, deux « o » gris. |
| `2026-07-25 refonte logo dossimo.zip` | Refonte en vigueur : symbole dossier + coche, mot-signe dessiné. Bleu `#35507F` (déjà le token `tampon`), encre `#19222D` ramenée sur le token `encre` `#16202b`. |

## `police/` — la police du mot-signe

`Unbounded[wght].ttf` (variable, axe de graisse) et sa licence `OFL.txt`.
C'est la même police que celle des titres, chargée côté web par `next/font` ; ce
fichier-ci n'existe que pour `scripts/brand-motsigne.mjs`, qui convertit
« dossimo » en courbes. Il ne part **ni au build ni en production**.

Ne pas le remplacer par une autre graisse sans relancer le script et recopier le
tracé dans `mark.ts` : le logo cesserait sinon de correspondre à sa police.

## À l'arrivée d'un nouveau kit

Déposer le zip daté ici, reporter les tracés dans `mark.ts`, régénérer par
`node scripts/brand-assets.mjs`, vérifier par `npx vitest run src/lib/brand`, et
consigner la décision dans le journal de `DESIGN.md`. Ne jamais servir un fichier
de ce dossier directement.
