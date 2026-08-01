# Design Dossimo — la source de vérité

**Ce fichier fait autorité sur toutes les décisions de design du produit**, de la
landing à l'espace artisan jusqu'aux PDF. Avant toute décision visuelle (couleur,
police, espacement, forme de composant, ton d'un texte affiché), **on relit ce
fichier d'abord**. Une décision se prend ici, puis se répercute dans les fichiers
d'implémentation ci-dessous. Jamais l'inverse, jamais en douce dans un composant.

L'objectif est la **cohérence de bout en bout** : un artisan doit reconnaître
Dossimo à l'identique sur la vitrine, dans son espace, et sur le PDF qu'il imprime
pour son client.

---

## 1. La règle du miroir (à ne jamais oublier)

Un seul fichier ne peut pas porter *physiquement* tous les tokens : le web impose
le CSS (Tailwind v4 veut le `@theme`), les PDF imposent le TypeScript. Les décisions
sont donc **centralisées ici**, avec **une source machine unique** pour les couleurs
et des miroirs qui en dérivent :

| Décision | Source / implémentation |
|---|---|
| **Couleurs** | Source unique : [`src/design/tokens.ts`](src/design/tokens.ts). Miroir web : [`src/app/globals.css`](src/app/globals.css) (`@theme`), **égalité vérifiée par [`src/design/tokens.test.ts`](src/design/tokens.test.ts)**. Miroir PDF : [`src/lib/pack/pdf-theme.ts`](src/lib/pack/pdf-theme.ts) **importe** `tokens.ts` (aucune recopie). |
| Polices | [`src/app/layout.tsx`](src/app/layout.tsx) (next/font) + `@theme` `--font-*`. PDF : Helvetica seulement. |
| Rayons / ombres | `globals.css` (`--radius-*`, `--shadow-*`) ; PDF : `pdf-theme.ts` (`styles`). |
| Boutons / actions | [`src/components/ui/boutons.ts`](src/components/ui/boutons.ts). |
| Champs / formulaires | [`src/components/ui/champs.ts`](src/components/ui/champs.ts) (`CHAMP_INPUT`, `CHAMP_LABEL`, `CHAMP_ERREUR`, `CHAMP_HINT`), importé par `fields.tsx` et les formulaires vitrine / auth. |

```
Décision (DESIGN.md)
   └─ src/design/tokens.ts   ← source machine unique des couleurs
        ├─ pdf-theme.ts       (import direct, zéro copie)
        └─ globals.css        (miroir CSS, égalité imposée par tokens.test.ts)
```

**Une couleur se change dans `tokens.ts` ET dans `globals.css`, au même commit** :
le test refuse la dérive. Les polices et les rayons restent des miroirs manuels
(pas encore sous test) : à changer des deux côtés à la main.

> Piège React-PDF : les polices Google (Unbounded, Inter…) ne sont PAS disponibles
> dans les PDF, qui n'ont que Helvetica. La *cohérence de marque* dans les PDF passe
> par la couleur, la mise en page et le cachet, pas par la police.

### Le troisième support : l'e-mail

Il n'y a pas deux cibles de rendu mais **trois** : web, PDF, et **e-mail**. L'e-mail
a ses propres contraintes dures, incompatibles avec les deux autres :

- CSS **inline** obligatoire, mise en page en **tables**, largeur **600px**.
- **Pas de webfont** (comme le PDF) : pile système
  `-apple-system, 'Segoe UI', Roboto, Helvetica, Arial`. Unbounded absent.
- Les **clients sombres** peuvent réinverser les couleurs ; Gmail **rogne** les
  e-mails trop lourds.

État actuel : le gabarit de marque vit dans
[`src/lib/prospection/message.ts`](src/lib/prospection/message.ts) (`GABARIT_HTML`) :
bandeau encre + logo nuit (`/brand/dossimo-logo-nuit.png`), accent bleu, 3 étapes,
encadré « sans mandataire », bouton, pied légal.

Deux dettes à connaître, non encore sous garde-fou :

- **Couleurs en hex brut**, non miroitées depuis `tokens.ts` (l'e-mail ne peut pas
  importer le TS). Pire : le fond extérieur `#E7E2D6` **n'est même pas un token**,
  c'est une troisième crème parasite, à réaligner sur `papier-fonce` (`#eae6dc`).
- **Copie en double source** : le HTML (`GABARIT_HTML`) et le texte
  (`prospection_campagnes.corps`, en base). Toute modif de fond (offre, prix,
  positionnement) se répercute **aux deux** : un déploiement ne corrige que le
  premier. Le retrait du code DOSSIMO50, le 01/08/2026, a demandé une migration
  (`0056_prospection_retrait_dossimo50.sql`) en plus du code, et a laissé un
  garde-fou qui bloque les envois quand les deux divergent.

Pied légal **obligatoire** (LCEN art. 6 + lien de désinscription) via
`mentionsLegales()` : c'est ce qui rend l'envoi licite, pas de la décoration.

### Impression et papier

Le PDF n'est pas qu'un fichier écran, c'est un **objet imprimé** : l'artisan imprime
l'attestation sur l'honneur pour la faire **signer à la main**, souvent en **noir et
blanc**. Contraintes propres au papier :

- Format **A4**, marges fixes ([`pdf-theme.ts`](src/lib/pack/pdf-theme.ts) :
  `PAD_X 44`, `PAD_TOP 40`, bas 56).
- **Sauts de page** maîtrisés : un bloc réglementaire ne se coupe pas en deux
  (`wrap={false}` sur les sections et les constats) ; le pied légal est `fixed`.
- **Lisible en N/B** : la sémantique ne repose jamais sur la seule couleur (bordures +
  libellé explicite, cf. §5). Une pastille verte doit rester compréhensible en gris.
- Zones de **signature** manuscrite (bénéficiaire + professionnel), avec la note
  « aucune rature ».

À figer (§8) : quelles **pages web** sont aussi pensées pour l'impression.

---

## 2. Palette

Identité : monochrome encre + gris, fond crème, bleu de marque pour liens et
actions. Sobre, net.

| Token (`--color-…`) | Valeur | Rôle |
|---|---|---|
| `encre` | `#16202b` | Texte principal, aplats sombres (bandeaux) |
| `tampon` | `#35507f` | Bleu de marque : liens, accents, cachet |
| `accent` | `#35507f` | Bleu de marque : liens, actions, cachet (ex-token `terre-cuite`, renommé le 2026-07-19). |
| `accent-hover` | `#2a3f65` | Survol de l'action principale. |
| `accent-clair` | `#9db0cf` | Accent **lisible sur fond encre** (le bleu foncé y manque de contraste). Sur-titre PDF, e-mail, hero du landing. |
| `papier` | `#f3f0e9` | Fond de page (crème) |
| `blanc-casse` | `#fbf9f3` | Fond de carte |
| `papier-fonce` | `#eae6dc` | Fond neutre secondaire, survols |
| `ardoise` | `#5b636d` | Texte secondaire |
| `filigrane` | `#e2ddd1` | Filets, bordures |
| `encre-claire` | `#9aa1a9` | Texte tertiaire, marques inactives |

**Sémantique** (toujours en paire couleur + fond clair) :

| Sens | Texte | Fond |
|---|---|---|
| Succès | `succes #2d6a4f` | `succes-bg #e7f1ea` |
| Erreur / bloquant | `erreur #9b2c2c` | `erreur-bg #f6e9e6` |
| Avertissement | `avertissement #a8730b` | `avertissement-bg #f6eed6` |
| Info | `info #35507f` | `info-bg #e9edf4` |

Règle : la couleur sémantique est **séparée** de l'accent de marque. Le rouge est
réservé aux vrais points bloquants.

---

## 3. Typographie

Quatre familles, câblées dans `layout.tsx` puis exposées en tokens `@theme` :

| Token | Police | Rôle |
|---|---|---|
| `--font-display` | Unbounded | Titres forts, et le mot-signe du logo (converti en courbes, §5) |
| `--font-serif` | Source Serif 4 | Titres de section, chiffres éditoriaux |
| `--font-sans` | Inter | Corps de texte, UI |
| `--font-mono` | Geist Mono | Données : références, dates, montants (avec `tabular-nums`) |

### Contenu éditorial long (guides, articles)

La surface `/guides`
([`SeoGuidePage`](src/components/seo/guide-page.tsx)) est de la **prose longue**, au
besoin typographique distinct de l'app :

- Largeur : coquille `max-w-4xl`, mais **texte `max-w-3xl`** (lecture confortable,
  viser ~65 caractères par ligne).
- Titres en **serif** (Source Serif), sur-titre en capitales espacées (`tampon`), fil
  d'Ariane, mention « Vérifié le … ».
- Données structurées (JSON-LD Article + BreadcrumbList) : le SEO fait partie du
  design de la page.
- À figer (§8) : échelle de titres de la prose (h2/h3/h4), style des liens dans le
  corps, sommaire pour les guides longs.

### Système spatial

C'est le troisième pilier, à égalité avec la couleur et la typo : c'est lui qui
fait qu'une landing et une page dossier « se ressemblent » ou non, même palette
identique.

- **Unité de base** : l'échelle Tailwind (multiples de 4px). On **reste sur
  l'échelle** ; pas de valeur arbitraire (`p-[13px]`, `mt-[7px]`).
- **Largeurs de conteneur** : aujourd'hui **dispersées** de `max-w-md` à `max-w-7xl`,
  à rationaliser (cf. §8). État de facto observé, par surface :
  - Auth / dépôt bénéficiaire : `max-w-md`
  - Contenu éditorial (landing, guides) : `max-w-2xl` / `max-w-3xl` (texte lisible,
    viser ~65 caractères par ligne)
  - Formulaires artisan : `max-w-5xl`
  - Page dossier (dense) : `max-w-6xl`
- **Mobile-first** : le bénéficiaire dépose au téléphone, l'artisan photographie
  depuis le chantier. Toute vue se conçoit d'abord en étroit ; points de rupture
  Tailwind (`sm/md/lg/xl`) par-dessus, jamais l'inverse.
- **Rythme vertical** : espacement inter-sections cohérent (échelle à figer, §8).

### Formes

- **Rayons** : `--radius-sm 6px`, `--radius 8px`, `--radius-md 12px`. Arrondis doux,
  alignés sur l'icône.
- **Ombres** : `--shadow-sm` (0 1px 2px) et `--shadow-md` (0 6px 16px), très
  discrètes. Le relief vient surtout des bordures, pas des ombres.

### Élévation et surfaces flottantes

Échelle de z-index **de facto**, à respecter (posée à la main aujourd'hui, à
formaliser en §8) :

| Niveau | z | Exemples |
|---|---|---|
| Contenu superposé | `z-10` | badges, tooltip d'aide (`oblige-suivi.tsx`) |
| En-tête / barre collante | `z-40` | header app et vitrine, barre CTA mobile |
| Overlay / menu / flottant | `z-50` | `overlay-progression`, menu mobile, aide flottante |
| Skip-link | `60` | toujours au-dessus de tout (`globals.css`) |

Règle : plus une surface est haute, plus son ombre est marquée. L'en-tête collant est
translucide + `backdrop-blur`, filet en bas. Aucune valeur de z hors de cette échelle.

### Mouvement

- Sobre. `stepIn` (fondu montant 0.25s) pour l'apparition d'étapes. Toute animation
  respecte `prefers-reduced-motion: reduce`.

### Responsive et tactile

Dossimo est un produit **terrain** : le bénéficiaire photographie ses pièces au
téléphone (page de dépôt `max-w-md`, bouton « Choisir un fichier ou photographier »),
l'artisan saisit depuis le chantier.

- **Cibles tactiles** : zone cliquable confortable au doigt (les actions visent déjà
  `h-11`) ; ne pas descendre en dessous sur mobile.
- **Patterns mobiles assumés** : menu plein écran (`site-menu.tsx`), barre CTA
  collante en bas sur la vitrine (`md:hidden`).
- **Tables et formulaires** doivent tenir en étroit : stratégie de repli des tables
  encore à figer (§8, §5).

### Micro-interactions et transitions

Le mouvement d'**entrée** est cadré (`stepIn`), mais pas les micro-interactions du
quotidien, aujourd'hui posées au cas par cas (`transition-colors`, `hover:bg-*`, rings
de focus). À harmoniser :

- Un jeu **réduit de durées** (ex. ~150ms pour l'UI, ~250ms pour les surfaces) et une
  courbe standard, au lieu d'un choix par composant.
- États codifiés : `hover`, `focus-visible` (l'anneau `FOCUS`), `active`, `disabled`.
- `prefers-reduced-motion` étendu à **tout** ce qui bouge, pas qu'aux entrées.

(Valeurs exactes à figer, §8.)

---

## 5. Composants et motifs

- **Hiérarchie d'action** ([`boutons.ts`](src/components/ui/boutons.ts)) : **un seul
  bouton plein par écran** (l'action principale contextuelle), tout le reste en
  outline. Anneau de focus `FOCUS` obligatoire sur tout élément navigable.
- **Cartes : ombre douce sur le web, bordure sur le papier.** Décision 2026-07-19.
  Sur le **web**, le relief est porté par une **ombre douce** (`--shadow-md`), coins un
  peu plus arrondis, sans filet ; la sémantique passe par le badge et, si besoin, un
  fond teinté léger (ex. `succes-bg`), jamais un aplat plein saturé. En **PDF et à
  l'impression**, l'ombre ne tient pas (React-PDF, lecture N/B) : les cartes restent
  **bordées**, sémantique portée par la bordure. Cette divergence web↔PDF est
  **assumée et voulue** (cf. §1). Migration web à faire (§8).
- **Parti d'exécution de l'espace artisan : « cartes flottantes »** (2026-07-19).
  Contenu réparti en **cartes distinctes** posées sur le crème, coins bien arrondis
  (~16px), ombre douce **généreuse** (`--shadow-lg` à introduire, ~`0 14px 34px -12px`),
  grille aérée, **sans bandeau lourd**. Look dashboard moderne. Le PDF, lui, reste
  bordé et sobre. **Source unique** :
  [`src/components/ui/cartes.ts`](src/components/ui/cartes.ts) (`CARTE`, `CARTE_SM`,
  `CARTE_INTERNE`), comme `boutons.ts` pour les actions.
- **Badges contournés** : bordure + texte colorés, fond transparent.
- **Cachet (tampon)** : élément signature bleu, sur les livrables de contrôle.

### Contenu tiers embarqué (visite guidée)

Un seul contenu tiers vit sur la vitrine : la **visite guidée** interactive, hébergée
par Supademo ([`visite-guidee.tsx`](src/components/landing/visite-guidee.tsx),
identifiant et URL dans [`lib/landing/visite.ts`](src/lib/landing/visite.ts)).
Quatre règles, valables pour tout embarquement futur (vidéo, calendrier, chat) :

- **L'origine du tiers s'ouvre dans la politique de sécurité, au même commit.** Notre
  CSP n'a pas de `frame-src` par défaut : elle retombe sur `default-src 'self'` et le
  navigateur refuse le cadre en affichant « Ce contenu est bloqué. Pour résoudre le
  problème, contactez le propriétaire du site ». L'origine vit dans le module du tiers
  (`VISITE.origine`), la politique la lit ([`lib/security/csp.ts`](src/lib/security/csp.ts)),
  et [`csp.test.ts`](src/lib/security/csp.test.ts) refuse la dérive. `frame-ancestors
  'none'` traite le cas inverse (personne n'encadre Dossimo) et ne dispense pas de
  celui-ci : c'est la confusion qui a mis la visite en ligne cassée le 2026-07-30.

- **Rien avant le clic.** Le tiers n'est monté qu'après une action explicite. Avant,
  on affiche une **affiche locale** dessinée avec les tokens — ici un faux cadre de
  navigateur, pas une capture à servir. La vitrine ne fait donc porter le poids d'un
  lecteur tiers qu'à ceux qui le demandent, et aucune requête ne part vers un tiers
  sans geste du visiteur. Ce second point tient à la promesse produit : Dossimo dit
  aux artisans qu'il traite leurs documents sobrement, une vitrine qui appelle un
  tiers au premier octet dirait l'inverse. Un test verrouille l'absence d'`iframe`
  au rendu ([`visite-guidee.test.tsx`](src/components/landing/visite-guidee.test.tsx)).
- **L'`iframe` n'est jamais le seul chemin.** Un lien direct l'accompagne toujours :
  navigateur qui bloque les cadres tiers, tiers en panne, lecteur d'écran en
  difficulté — le contenu reste atteignable.
- **L'hébergeur est nommé** sous le cadre, en `ardoise`. On ne fait pas passer un
  tiers pour du Dossimo.

**Rythme de page** : la visite prolonge la section « Comment ça marche » *dans* cette
section (ancre `#visite`) au lieu d'en ouvrir une nouvelle. Les quatre cartes
annoncent le parcours, la visite le montre — et l'alternance papier / crème / encre
de la landing n'a pas à absorber deux sections de même teinte à la suite. La page
autonome [`/visite`](src/app/visite/page.tsx) sert les usages que l'ancre ne couvre
pas : lien de prospection, cible indexable, lecture isolée.

### Champs et formulaires

Le cœur du produit (la saisie unique) a **déjà un système de champs**, à utiliser tel
quel : [`src/components/dossier/fields.tsx`](src/components/dossier/fields.tsx) —
`TextField`, `SelectField`, `FieldShell`, `Section`.

- Anatomie d'un champ : label + astérisque si requis, puis le contrôle, puis **soit**
  une aide (`hintClass`) **soit** une erreur (`errorClass`), jamais les deux.
- États de l'input : repos, focus (`focus:border-tampon` + ring), invalide
  (`aria-[invalid=true]:border-erreur`), désactivé (`disabled:bg-papier-fonce`).
- Motif « valeur assistée » : un champ pré-rempli confirmé s'affiche en encadré
  succès avec un bouton « Modifier ».

**Règle : passer par ces composants, ne jamais réécrire un input à la main.** Deux
contournements existent déjà et sont à résorber (un `const input = "…"` recopié dans
`oblige-suivi.tsx` et `issue-dossier.tsx`) : ils divergent en hauteur, focus et états.

### États (vide, chargement, erreur)

- **Chargement** : [`Spinner`](src/components/ui/spinner.tsx), indéterminé, hérite de
  `currentColor`, `motion-reduce` géré. Progression connue : `overlay-progression`.
- **Vide** : pas encore de composant partagé (à trancher, §8). Principe posé :
  un vide n'est jamais un blanc (message + une action de sortie).
- **Erreur** : une exception non gérée est désormais rattrapée par des *error
  boundaries* Next à la marque, jamais l'écran par défaut. Trois niveaux :
  [`src/app/error.tsx`](src/app/error.tsx) (application, dans le layout racine),
  [`src/app/dossiers/error.tsx`](src/app/dossiers/error.tsx) (espace artisan, DANS
  le shell : l'artisan garde sa navigation) et
  [`src/app/global-error.tsx`](src/app/global-error.tsx) (dernier filet, layout
  racine en échec : autonome, styles inline). Chacun dit ce qui s'est passé et
  propose une reprise (`unstable_retry`) + une sortie. C'est la traduction visuelle
  de « les erreurs ne sont jamais avalées en silence » (`AGENTS.md`).

### Dépôt de fichiers

Le geste central du produit : l'artisan verse ses pièces, le bénéficiaire
photographie les siennes. Trois écrans le portent
([`pieces-justificatives.tsx`](src/components/dossier/pieces-justificatives.tsx),
[`demarrage-assiste.tsx`](src/components/dossier/demarrage-assiste.tsx),
[`depot-client.tsx`](src/components/depot/depot-client.tsx)) et suivent le même
motif. Décision 2026-07-30.

- **Le fichier choisi se voit immédiatement.** Nom, poids, et une ligne à lui.
  Rien ne doit pouvoir être déposé sans que l'écran change : c'est le défaut qui
  a motivé le motif.
- **Une ligne par fichier, un état par ligne** (`attente`, `préparation`,
  `envoi`, `reçue`, `erreur`), et la ligne avance seule. Pas de formulaire à
  valider à la fin.
- **L'attente est nommée et bornée.** Une lecture par le modèle prend plusieurs
  secondes : on dit ce qui se passe (« Dossimo lit le document et vérifie les
  mentions obligatoires »), avec `Spinner` + barre indéterminée. La barre est en
  CSS (`animate-pulse` + `motion-reduce:animate-none`) et **jamais** en transform
  Motion : `reducedMotion="user"` expédie un transform à sa valeur d'arrivée,
  donc hors cadre, et supprime le seul signe d'activité pour ceux qui l'ont
  demandé.
- **La ligne d'envoi ne cède la place à la carte définitive que lorsque celle-ci
  est rendue** (état dérivé de l'identifiant renvoyé par l'action, pas un
  minuteur). La pièce n'est jamais nulle part.
- **Glisser-déposer sur ordinateur, appareil photo sur mobile.** Le bouton
  « Photographier » et l'attribut `capture` sont conditionnés à
  [`useTactile`](src/components/ui/use-tactile.ts) : posé sans condition,
  `capture` force l'appareil photo et rend inatteignable le PDF déjà rangé dans
  le téléphone.
- **Le chemin clavier passe par de vrais boutons**, pas par l'`input` : celui-ci
  reste `sr-only` (jamais `hidden`, qui casse le déclenchement programmatique),
  porte un `aria-label` et sort de l'ordre de tabulation (`tabIndex={-1}`) pour
  ne pas doubler le bouton d'un arrêt muet.
- **Ce qui manque est proposé là où l'on dépose**, en raccourcis dérivés de la
  checklist (donc de `regles_metier`), jamais d'une liste recopiée.
- **Un type deviné est proposé, jamais imposé** : il s'affiche, se corrige d'un
  clic avant l'envoi, et reste vide quand le nom du fichier ne dit rien. Même
  règle que « ne jamais inventer un chiffre » (§6), appliquée à un classement.

### Logo et actifs de marque

Le logo est un **symbole + un mot-signe**, depuis la refonte du 2026-07-25. Le
symbole est un dossier dont le rabat se prolonge en coche : *le dossier est
complet*, ce que le produit promet en une forme. Le mot-signe est « dossimo » en
**Unbounded Bold**, la police de titre de la marque (§3), donc rien à réapprendre
côté typographie. Il perd en revanche ses deux « o » gris, qui entraient en
concurrence avec le bleu du symbole : le mot-signe est désormais d'un seul ton. La
version d'avant (mot-signe seul, sans symbole, avec les « o » gris) est dans
[`public/brand/archive/`](public/brand/archive/) et ne doit plus apparaître nulle
part.

**Le mot-signe est en courbes, pas en texte vivant.** Ce n'est pas un détail
d'implémentation, c'est ce qui garantit un seul logo : Unbounded n'existe ni dans
les PDF (React-PDF n'a qu'Helvetica, §1) ni dans les e-mails (pas de webfont, §1),
et la carte sociale est rendue par Satori, qui ne sait pas ouvrir les woff2 de
`next/font`. En texte vivant, le mot-signe serait juste sur le web et faux partout
ailleurs, ce qui était le cas de la carte sociale avant le 2026-07-25 : elle
affichait « dossimo » dans la police par défaut de Satori. Effet de bord utile :
le logo est juste dès le premier rendu, sans attendre le chargement de la webfont.
La conversion se relance par `node scripts/brand-motsigne.mjs`, à recopier dans
`mark.ts` (opération ponctuelle, pas une étape de build).

**Une seule source : [`src/lib/brand/mark.ts`](src/lib/brand/mark.ts).** Elle porte
les tracés, les quatre déclinaisons de couleur et les seuils de taille. Tout le
reste en dérive :

```
brand-motsigne.mjs  ← police Unbounded → courbes (à la main, si la police change)
        ↓
mark.ts   ← tracés + DECLINAISONS (les couleurs viennent de tokens.ts)
  ├─ ui/logo.tsx           SVG inline, l'écran
  ├─ opengraph-image.tsx   carte sociale (Satori ne lit pas le disque)
  └─ public/brand/*        régénéré par `node scripts/brand-assets.mjs`
                           égalité imposée par mark.test.ts
```

Un actif retouché à la main dans un éditeur, ou un PNG oublié d'avant une refonte,
devient un **test rouge** : c'est le même garde-fou que `tokens.test.ts` pour la
palette. Ne jamais recolorer un tracé dans un composant, passer par
`DECLINAISONS`.

**Quatre déclinaisons, une par fond.**

| Déclinaison | Symbole | Mot-signe | Fond |
|---|---|---|---|
| `encre` | `tampon` | `encre` | Clair (crème, blanc) : la référence |
| `nuit` | `accent-clair` | `blanc-casse` | Encre (bandeau PDF, en-tête e-mail) |
| `mono-encre` | `encre` | `encre` | Un seul ton : gravure, tampon, impression N/B |
| `mono-blanc` | blanc | blanc | Un seul ton sur photo ou aplat |

**Le bleu de marque ne va JAMAIS sur fond encre** : `#35507f` sur `#16202b`
plafonne à 1,95:1, le symbole y disparaît. Sur foncé, c'est `accent-clair`
(7,3:1). C'est la seule raison d'être de la déclinaison `nuit`, et un test le
vérifie.

**Zone de protection** : rien (texte, filet, bord de page) à moins de **0,5 × la
hauteur du signe**. Exprimée en fraction, elle reste vraie à toutes les tailles.

**Tailles minimales**, mesurées sur rendu réel et non devinées :

- signature horizontale : **20 px** de haut. En dessous, le mot-signe se referme.
- symbole seul, en contour sur fond clair : **24 px**.
- en dessous, c'est la **pastille** (symbole clair sur aplat encre, glyphe à 68 %
  du côté). Ce qui **ne marche pas**, et a été essayé : épaissir le contour du
  symbole pour les petites tailles. Ce sont les vides internes qui portent la
  forme ; un contour doublé les referme et l'icône devient une tache grise.

**Les fichiers.** Signature : `dossimo-logo.svg` / `.png` (fond clair),
`dossimo-logo-nuit.svg` / `.png` (fond encre, utilisé par le bandeau PDF via
[`logo.ts`](src/lib/pack/logo.ts) et l'en-tête e-mail), `dossimo-logo-mono-encre.svg`,
`dossimo-logo-mono-blanc.svg`. Symbole : `dossimo-symbole{,-nuit,-blanc}.svg`.
Pastilles du kit (usages externes : presse, partenaires, profils) :
`dossimo-icon.png`, `dossimo-icon-clair.png`, `dossimo-avatar-512.png` (plein
cadre, sans arrondi : les plateformes appliquent le leur, et un double arrondi
bave).

Icônes d'application, dans `src/app/` : `icon.png` (32), `icon1.png` (16),
`icon2.png` (512), `apple-icon.png` (180, plein cadre, iOS masque lui-même) et
`favicon.ico` (16 + 32). **Les trois tailles sont nécessaires** : Next lit la
dimension réelle du fichier pour écrire l'attribut `sizes` de chaque `<link>`, et
sans un 16 px rendu net, l'onglet reçoit le 512 réduit à la volée par le
navigateur — exactement la bouillie que les seuils ci-dessus cherchent à éviter.
L'`.ico` est la seule icône qu'un client demande sans qu'on la lui ait déclarée
(lecteurs de flux, robots, aperçus de lien).

Les sources brutes des kits livrés sont dans
[`templates/brand/`](templates/brand/), hors dossier servi.

**Le rapport d'aspect fait partie du logo** : 1206,12 / 204,59 ≈ **5,90**
(`RATIO_LOCKUP`). Il a bougé deux fois le 2026-07-25, de 2,96 à 4,88 puis à 5,90
quand le mot-signe est repassé en Unbounded, plus large que le mot-signe du kit.
Tout cadre fixe qui contient le logo doit suivre (`styles.logo` du PDF, `width` de
l'image e-mail). `mark.test.ts` vérifie les rasters et le cadre PDF, précisément
parce que ce genre d'oubli ne se voit qu'à l'impression. **Ne jamais dimensionner
un logo par sa largeur** : on lui donne une hauteur, la largeur suit.

### Iconographie et emoji

Jeu **unique** : `lucide-react` (déjà dans ~28 fichiers, c'est le standard de fait).

- Une icône décorative est `aria-hidden` ; sinon elle porte un intitulé accessible.
- Taille alignée sur le texte (`h-4 w-4` par défaut), même épaisseur de trait.
- **Pas d'emoji dans l'UI produit.** Les emoji posés en dur sont une dette à résorber
  (« 🔒 » et « ↓ » dans la page dossier, « › » dans `ParcoursSelector`).
- **En PDF, lucide (SVG) n'existe pas** : les repères y sont dessinés (pastilles,
  cachet), jamais des emoji.

### Structure de page (shells, en-tête, navigation, pied)

Plusieurs coquilles : vitrine, espace artisan
([`espace-artisan-shell.tsx`](src/components/dossier/espace-artisan-shell.tsx)),
auth (`(auth)/layout.tsx`, centré `max-w-md`), admin, legal.

- **En-tête** : collant (`sticky top-0 z-40`), translucide + `backdrop-blur`, filet
  en bas. **Deux traitements assumés** : app plus sobre (`border-filigrane`), vitrine
  plus affirmée (`border-b-2 border-encre`, [`site-header.tsx`](src/components/landing/site-header.tsx)).
- **Navigation mobile** : menu plein écran ([`site-menu.tsx`](src/components/landing/site-menu.tsx),
  `role="dialog"`), et une barre CTA collante en bas sur la vitrine mobile.
- **Pied** : porte la mention légale obligatoire (aujourd'hui répétée, à centraliser).
- **CTA vitrine ≠ actions app** : la vitrine a ses propres boutons (plus hauts, plus
  arrondis), l'app utilise `boutons.ts`. Divergence assumée, à garder explicite.

### Tables et densité de données

Grande partie du produit, dense et tabulaire : listes dossiers / factures, admin
(pilotage, prospection, données). Conventions à tenir :

- **Alignement** : texte à gauche, **nombres à droite en `tabular-nums`**.
- En-tête discret, ligne active / survol légère, densité constante.
- **Responsive** : une table ne tient pas sur un téléphone. Stratégie à figer (§8) :
  cartes empilées, colonnes prioritaires, ou scroll horizontal maîtrisé.

### Retours d'action (messages et bandeaux)

Pas de système de toast : tout est **inline**, au plus près de l'action. Convention de
facto à tenir :

- **Succès / info** : message `role="status"` sous l'action (`issue-dossier.tsx`,
  `oblige-suivi.tsx`).
- **Erreur** : `role="alert"` (`lead-form.tsx`).
- **Bandeau de page** : encart coloré en tête pour un événement de navigation
  (« Paiement confirmé… », « Code parrain… »), avec la sémantique du §2.
- Chargement d'une action : le [`Spinner`](src/components/ui/spinner.tsx) maison
  (il gère `motion-reduce`), **pas** `Loader2` de lucide (doublon résorbé le 2026-07-19).

À trancher (§8) : quand un toast se justifie plutôt qu'un inline, et son placement.

### Aide contextuelle et pédagogie

Le produit **explique** (c'est sa valeur anti-refus). L'aide existe déjà sous **trois
formes**, à conventionner :

- **Aide inline** courte sous un champ (`hintClass`, `fields.tsx`).
- **Tooltip** ponctuel sur un terme (`CircleHelp`, `oblige-suivi.tsx`).
- **Panneau flottant** pour l'explication longue et le contact
  ([`aide-dossimo.tsx`](src/components/dossier/aide-dossimo.tsx) : bouton « Je suis
  bloqué » en bas-droite `z-50`, dont l'accordéon « Expliquez-moi les couleurs »).

Règle : inline pour une précision, tooltip pour un mot, panneau pour « je suis
bloqué ». Ton **pédagogique** : expliquer le motif de refus sans jargon. Rien ne part
sans action de l'utilisateur (la messagerie s'ouvre d'abord).

### Onboarding et première expérience

Distinct des « états » (données vides) : ici on **guide un premier usage** et on donne
confiance avant le premier paiement.

- **Document-first** : le démarrage assisté
  ([`demarrage-assiste.tsx`](src/components/dossier/demarrage-assiste.tsx)) part d'une
  **photo du devis**, lit les champs, puis pré-remplit le formulaire.
- **Valeur assistée** comme patron (déjà dans `fields.tsx`) : champ pré-rempli en
  encadré succès + « Modifier ». À réutiliser partout où l'on pré-remplit.
- **Essai sans compte** (la démo) : le premier écran ne doit pas intimider et doit
  tenir la promesse de la vitrine (cohérence vitrine → première minute dans l'app).

---

## 6. Ton et copie (le texte est du design)

- **Français** pour tout ce que voit l'utilisateur (UI, PDF, e-mails), **anglais**
  pour le code et les identifiants (CLAUDE.md §11).
- **Vouvoiement**, direct, concret. On nomme les choses par ce que l'utilisateur
  reconnaît.
- **Ne jamais inventer un chiffre.** Valeur inconnue au rendu = `"—"`, jamais un
  fallback du type `?? "149 €"` (`AGENTS.md`).
- **Mention obligatoire** partout où c'est pertinent : « Dossimo, service
  indépendant d'aide à la préparation de dossier, non affilié à l'Anah ni à France
  Rénov'. » (CLAUDE.md §2).
- Ponctuation naturelle : éviter les tirets cadratins dans la copie.

### Formats de données

Le format d'un montant ou d'une date **est** une décision de design : une seule
vérité, partagée entre les supports.

- **Euro** : `formatEuros` ([`src/lib/format/montant.ts`](src/lib/format/montant.ts))
  = « 1 200,00 € » (séparateur insécable, deux décimales toujours). En PDF,
  `formatEurosPdf` : mêmes valeurs, espaces insécables normalisées (sinon Helvetica
  les rend « / »). Une source, deux rendus.
- **Valeur inconnue** : `"—"`, jamais un chiffre inventé (`AGENTS.md`).
- **Chiffres en colonne** : `tabular-nums` (dates, montants, compteurs).
- **Date** : format à unifier. L'écran pose « 05/05/2026 », mais les PDF récents
  posent « 05.05.2026 » en mono. Divergence à trancher (§8).

---

## 7. Accessibilité (socle non négociable)

- Focus clavier toujours visible (`FOCUS`).
- Contrastes lisibles sur fond crème comme sur fond encre.
- `prefers-reduced-motion` respecté partout.
- `.skip-link` en tête de page.

---

## 8. Décisions ouvertes — refonte en cours

> Cette section se remplit AVANT de coder la refonte. Tant qu'une ligne est vide,
> la décision n'est pas prise : ne pas l'improviser dans un composant.

- [x] Direction : **rafraîchissement** de l'identité actuelle (2026-07-19).
- [x] Palette : **conservée** ; renommer le token `terre-cuite` → `accent` (mécanique, à faire).
- [x] Polices : **conservées** (Unbounded / Inter / Source Serif).
- [x] Relief des cartes : **ombre douce sur le web**, **bordure conservée en PDF / impression** (§5).
- [x] Déclinaison PDF : **inchangée** (rafraîchissement) ; les cartes PDF restent bordées.
- [x] Parti d'exécution de l'espace artisan : **cartes flottantes** (§5, 2026-07-19).
- [x] Migrer l'**espace artisan** vers les cartes flottantes (page dossier, liste, profil, factures) — 2026-07-19.
- [x] Migrer l'**admin** et les pages **guides** vers les cartes flottantes — 2026-07-19.
- [x] **Landing** : direction « bandeau encre » conservée, mais la page adopte un parcours éditorial plus court et plus visuel : CTA visible sans défilement, grandes cartes illustrées, preuves regroupées et sections redondantes fusionnées. Aucune donnée nominative ou coordonnée personnelle sur la vitrine ; elles restent cantonnées aux pages légales (2026-07-22).
- [x] **Page tarifs** : route publique autonome `/tarifs`, alimentée par `pricing_tiers`, accessible depuis le header et le footer. La section de prix de la landing reste un résumé ; le menu ne pointe plus vers une ancre (2026-07-22).
- [x] Décliner le parti sur les sections de la home (comparaison, garanties, tarifs, contact) — 2026-07-19.
- [ ] Consolider la redondance de tokens : `tampon` et `accent` valent tous deux `#35507f` (et `info`). Fusionner vers `accent`.
- [ ] Introduire `--shadow-lg` (ombre des cartes flottantes) dans `globals.css` (§4).
- [ ] Échelle typographique et échelle d'espacement figées.
- [ ] Largeurs de conteneur rationalisées (aujourd'hui de `max-w-md` à `max-w-7xl`, §4).
- [ ] Déclinaison e-mail (§1) : réaligner le fond `#E7E2D6` sur `papier-fonce`, et
      décider si un garde-fou vérifie que ses hex appartiennent bien à la palette.
- [ ] Format de date unifié web / PDF (« 05/05/2026 » vs « 05.05.2026 », §6).
- [~] Convention des états vide / erreur (§5) : **erreur faite** (error boundaries
      Next à la marque, 3 niveaux) ; état **vide** encore sans composant partagé.
- [~] Résorber les inputs écrits à la main hors de `fields.tsx` (§5) : classes
      **centralisées** dans `champs.ts` (fin des 5 copies divergentes de
      `inputClass`/`labelClass`) ; restent les `<input>` bruts recopiés dans
      `oblige-suivi.tsx` et `issue-dossier.tsx`, à faire passer par `TextField`.
- [x] Logo : zone de protection et taille minimale — figées le 2026-07-25 (§5),
      dans `mark.ts` (`ZONE_PROTECTION`, `MIN_PX`).
- [ ] Formaliser l'échelle de z-index (§4).
- [x] Éliminer les emoji de l'UI produit au profit de lucide (§5) : emoji et
      glyphes de statut (`🔒`→`Lock`, `✓`→`Check`, `✗`→`X`, `↓`→`Download`,
      `›`→`ChevronRight`) ET flèches de navigation (`←`/`→`→`ArrowLeft`/`ArrowRight`)
      remplacés dans **tout l'espace artisan / dossier, la démo, les devis et
      l'admin**. Ne restent que : les flèches **décoratives déjà `aria-hidden`** des
      CTA de la vitrine (traitement propre à la landing, §5) et les flèches en
      commentaires de code. `≠` (« ≠ écart ») conservé (typographie, cf. journal).
- [ ] Centraliser la mention légale du pied de page (§5).
- [ ] Stratégie responsive des tables (§5).
- [ ] Convention toast vs message inline, et son placement (§5).
- [x] Résorber le doublon de spinner : tous les `Loader2` ramenés sur le `Spinner` maison (§5) — 2026-07-19.
- [ ] Cibles tactiles minimales sur mobile (§4).
- [ ] Échelle de titres et style de liens de la prose éditoriale (§3).
- [ ] Impression : quelles pages web sont pensées pour le papier (§1).
- [ ] Durées et courbes de transition harmonisées (§4).
- [ ] Convention des trois niveaux d'aide (inline / tooltip / panneau) (§5).
- [ ] Cohérence onboarding : promesse vitrine → première minute app (§5).

---

## 9. Comment changer une décision (recette)

1. **Décider ici d'abord.** Mettre à jour la section concernée de ce fichier, et
   ajouter une ligne au journal (§11). Tant que ce n'est pas écrit, la décision
   n'est pas prise.
2. **Implémenter à la source.** Couleur → [`src/design/tokens.ts`](src/design/tokens.ts).
   Police → [`src/app/layout.tsx`](src/app/layout.tsx). Rayon / ombre → `globals.css`.
   Bouton → [`boutons.ts`](src/components/ui/boutons.ts).
3. **Reporter dans le miroir CSS.** Recopier la même valeur dans le `@theme` de
   [`globals.css`](src/app/globals.css) (le PDF suit `tokens.ts` tout seul).
4. **Lancer le garde-fou.** `npx vitest run src/design/tokens.test.ts` : le miroir
   doit rester vert.
5. **Vérifier le PDF.** Les `COLORS` PDF suivent `tokens.ts` automatiquement ; en
   cas de doute, régénérer un pack et regarder.
6. **Passer la définition de terminé (§10)** avant de committer.

## 10. Définition de « terminé » (couverture)

Calquée sur la checklist PR de `supabase/README.md`. Un changement de design n'est
fini que lorsqu'il est appliqué **partout** — c'est la parade au défaut « appliqué à
un seul endroit » (`AGENTS.md`).

- [ ] Landing / vitrine
- [ ] Espace artisan (page dossier, formulaires, listes)
- [ ] PDF (pack, feuille de route, attestation, fiche client, récap, checklist)
- [ ] E-mails transactionnels
- [ ] Thème clair ET fond encre
- [ ] États focus clavier + `prefers-reduced-motion`
- [ ] `npx vitest run src/design/tokens.test.ts` vert

## 11. Journal des décisions

Deux lignes par décision, datées, pour ne pas re-débattre le passé.

| Date | Décision | Pourquoi |
|---|---|---|
| 2026-08-01 | **Estimateur, profil rose** : le résultat porte un statut textuel autonome « Non éligible MaPrimeRénov', éligible CEE. » au-dessus des montants. La ligne MaPrimeRénov' conserve « — » et son explication ; le montant CEE reste calculé depuis `regles_metier`. Aucun nouveau token. | Une simple absence de montant ressemble à un barème manquant. Le statut nomme la distinction réglementaire violet/rose sans inventer de prime et permet de comprendre d'un coup d'œil que le dossier conserve une voie CEE. |
| 2026-07-08 | Palette encre / gris / crème / **bleu** (`#35507f`), polices Unbounded + Inter + Source Serif. | Alignement sur le kit logo. L'accent passe du terracotta au bleu ; le token `terre-cuite` n'est pas renommé (dette assumée, cf. §2). |
| 2026-07-19 | `DESIGN.md` devient la source de vérité ; `tokens.ts` source machine des couleurs + test de miroir ; règle inscrite dans `AGENTS.md`. | Coordonner landing → vitrine → espace artisan → PDF et empêcher la dérive des tokens par machine, pas par discipline. |
| 2026-07-19 | Refonte = **rafraîchissement** : identité et polices conservées, accent bleu (token `terre-cuite` → `accent`), **cartes en ombre douce sur le web** (bordure conservée en PDF / impression). | Moderniser l'écran sans casser la lisibilité N/B du papier ni une identité récente. Deux traitements de carte selon la cible, choix produit assumé. |
| 2026-07-19 | Espace artisan : parti **« cartes flottantes »** (arrondis marqués, ombre douce généreuse `--shadow-lg`, grille aérée, sans bandeau lourd). | Choisi parmi 5 pistes maquettées. Assume la décision ombre douce, look dashboard moderne, cohérent avec l'accent bleu. |
| 2026-07-20 | Landing : trois surfaces de **preuve** ajoutées, sans nouveau token ni nouvelle couleur. (1) Section « Confiance » (éditeur identifié + traitement des documents) posée juste avant les tarifs. (2) Section « Estimation » (simulateur d'aide) posée juste avant les tarifs, pour donner un ordre de grandeur au prix. (3) Page **`/exemple`** montrant le pack réel, en second CTA du hero et dans le sommaire. | La vitrine ne portait aucune preuve : ni éditeur identifiable, ni montant de référence, ni livrable visible. Le CTA unique (« envoyer un devis client réel ») était trop haut pour du trafic SEO froid. Les trois blocs réutilisent les motifs existants (cartes en ombre douce §5, `SectionLabel`, palette inchangée) : aucune décision visuelle nouvelle n'est prise ici. |
| 2026-07-19 | Landing : parti **« bandeau encre »** (hero fond encre, titre clair, accent en bleu clair, carte rapport flottante) ; nouveau token `accent-clair` (#9db0cf) pour l'accent lisible sur encre. | Choisi parmi 4 pistes. Ancre le landing dans l'identité encre partagée avec le PDF et l'e-mail ; le token solde un bleu clair qui traînait en dur à trois endroits. |
| 2026-07-21 | Dead-end « prix inconnu » : quand l'aide n'est pas estimable (profil sans barème, ou surface non saisie), le paiement ne renvoie plus un message technique bloquant mais un **bloc de reprise** (`PaywallCta` → `DeblocageManuel`) qui explique la cause et ouvre une demande de déblocage manuel par e-mail (messagerie pré-remplie, rien n'est envoyé sans action). Aucun prix n'est inventé (AGENTS.md). | Traduction de « une erreur se dit et propose une reprise » (§5) sur le seul vrai cul-de-sac du parcours artisan. Décision produit : déblocage manuel plutôt que palier par défaut (jamais de tarif non justifié). |
| 2026-07-21 | Nettoyage des glyphes : tous les emoji, symboles de statut et flèches de navigation passent en **icônes lucide** (`Lock`, `Check`, `X`, `Download`, `ChevronRight`, `ArrowLeft`, `ArrowRight`) dans l'espace artisan / dossier, la démo, les devis ET l'admin ; le statut « Verrouillé / Pack débloqué » adopte `Badge`. Le symbole `≠` (« ≠ écart ») est **conservé** : typographie porteuse de sens, sans équivalent lucide propre. Ne restent que les flèches décoratives déjà `aria-hidden` des CTA de la vitrine. | Applique la règle « pas d'emoji / de glyphe dans l'UI » (§5) de bout en bout. |
| 2026-07-21 | Cohérence de l'espace artisan : les deux blocs les plus vus, restés en cartes bordées `shadow-sm`, passent au parti **cartes flottantes** (`VerdictHero` et `ActionsPrioritaires` via `CARTE_LISTE`). Glyphes `✓`/`!` du verdict remplacés par des icônes **lucide** (`Check`/`AlertTriangle`), `text-white` ramené sur `text-blanc-casse`. Deux composants partagés amorcent la **boîte à composants** : `EmptyState` (`ui/empty-state.tsx`, adopté dans la liste des dossiers) et `Badge` (`ui/badge.tsx`, pastille sémantique par ton, qui remplace le `StatusBadge` local de la landing et les pills recopiées de la liste). | Suite de l'audit UX : achève une migration `2026-07-19` qui avait sauté ces deux blocs, et amorce la boîte à composants (§8). |
| 2026-07-22 | Admin prospection : l'engagement passe de 6 tuiles plates à un **entonnoir** en carte flottante (`CARTE`) — barres proportionnelles partis → ouverts → cliqués, sur la même base (100 % = messages partis), tons sémantiques (ouvert = `tampon`/info, cliqué = `succes`), chiffres mono `tabular-nums`, badge `avertissement` quand l'échantillon < 200. La tuile « Envoyés / plafond » gagne une **jauge** d'avancement. Aucun nouveau token : jauges/barres composées depuis les tokens existants (`bg-papier-fonce` en piste, remplissages sémantiques). | Le suivi d'ouverture ajouté le 22/07 rendait la grille de tuiles illisible ; un entonnoir montre d'un coup d'œil la déperdition à chaque étape. Motif de barres = magnitude étiquetée par ligne (pas une palette catégorielle), la couleur reste redondante avec le libellé (accessibilité). |
| 2026-07-22 | Landing : les illustrations passent de scènes dessinées inline (`MaisonArtisan`) à six **scènes en aplats servies depuis `public/illustrations/`** (artisan, maison rénovée, facture, pack, contrôle, formes), via un composant `Illustration` (`<img>` décoratif, hors payload HTML). Recolorées sur les **tokens exacts** : crème→`papier`, périwinkle→`accent-clair`, marine→`accent`, sombres→`encre` ; les accents chauds d'origine (jaune/corail/orange) sont ramenés dans la famille bleue, aucune couleur hors-charte. Les pictos d'étapes (`EtapePicto`) et les vagues (`WaveDivider`) restent inline : lisibles à petite échelle, ce que ne sont pas des scènes 1024px. | Rendre la vitrine plus visuelle sans introduire de couleur (charte stricte) ni de dépendance. Le `<img>` statique de même origine garde l'actif hors du HTML et évite d'activer `dangerouslyAllowSVG`. Les illustrations restent décoratives (`alt` vide) : la copie validée porte le sens (§7). |
| 2026-07-22 | Landing : refonte du parcours sur un rythme inspiré des meilleures vitrines grand public du secteur, sans reprendre leur marque ni leur contenu. Le hero encre devient plus court pour rendre le CTA visible dès le premier écran ; les six SVG Dossimo portent la narration ; le fonctionnement, le livrable et la différence avec un mandataire deviennent trois blocs forts ; les preuves de confiance, auparavant dispersées, sont regroupées avant le prix. | La page précédente empilait trop de sections de poids équivalent et retardait l'action principale. La nouvelle hiérarchie garde les preuves utiles et les fonctions dynamiques, mais réduit la charge de lecture et rapproche chaque objection de sa réponse. |
| 2026-07-22 | Landing : retrait de toutes les données nominatives et coordonnées personnelles (nom de l'éditeur, adresse, SIREN, e-mail), y compris du pied et du JSON-LD. La confiance est portée par les engagements de traitement et un lien vers la politique de confidentialité ; les informations obligatoires restent sur les pages légales. | La vitrine présente le produit, pas l'identité privée de l'entrepreneur. Les mentions réglementaires gardent leur place sur les surfaces légales dédiées. |
| 2026-07-22 | Tarifs : création d'une page publique autonome `/tarifs`. Le header et le footer y conduisent directement ; la grille et les offres JSON-LD sont dérivées de `pricing_tiers` via `grillePublique`, comme le checkout. Si la base est indisponible, aucun prix n'est affiché. | Permettre de consulter, comprendre et partager les tarifs sans atterrir sur une ancre de la longue landing, tout en conservant une seule source de vérité commerciale. |
| 2026-07-21 | Audit UX : trois briques posées. (1) **Error boundaries** à la marque (`error.tsx`, `dossiers/error.tsx`, `global-error.tsx`) — Next 16 : récupération via `unstable_retry`, pas `reset`. (2) **Navigation mobile de l'espace artisan** (`espace-artisan-menu.tsx`) sur le patron de `site-menu.tsx` : les liens Dossiers/Factures/Devis/Compte, masqués sous `md:`, étaient inatteignables au téléphone. (3) **`champs.ts`** : source unique des classes de champ, fin des 5 copies divergentes (les formulaires vitrine/auth n'avaient ni état désactivé ni `aria-[invalid]`). | Audit produit / UX. Ces trois trous contredisaient des principes déjà écrits (erreur qui se dit §5, produit terrain mobile §4, source unique §1). Aucun nouveau token ni couleur. |
| 2026-07-25 | Attestation sur l'honneur CEE : le badge « Reproduction conforme » et sa notice ne sont plus écrits en dur. Ils **dérivent** de `revueValidee()` (`src/lib/cerfa/registry.ts`). Sans revue four-eyes signée, le badge passe en ton `avertissement` (« Modèle Dossimo »), la notice dirige d'abord vers l'AH de l'obligé (téléversement `AhObligeFill`) et présente la reproduction comme un secours, le bouton dit « Attestation pré-remplie (PDF) » au lieu de « Formulaire officiel pré-rempli », et le pied de page du PDF n'affirme plus la fidélité au modèle. Aucun nouveau token. | Application de « ne jamais inventer un chiffre » (§6) à une affirmation de conformité, qui engage bien plus qu'un montant. Le libellé était une garantie auto-décernée sur un document que personne n'a comparé au modèle d'un obligé réel : c'est exactement le motif de refus que Dossimo prétend supprimer (CLAUDE.md §8). Le ton `avertissement` plutôt que `erreur` : le document reste utilisable, c'est la promesse qui est suspendue. |
| 2026-07-25 | **Refonte du logo** : le mot-signe typographique (Unbounded, deux « o » gris) devient une signature **symbole + mot-signe**, le symbole étant un dossier dont le rabat se prolonge en coche. Nouvelle source unique [`src/lib/brand/mark.ts`](src/lib/brand/mark.ts) : tracés, 4 déclinaisons par fond, zone de protection, tailles minimales. `public/brand/*` et les icônes d'application sont désormais **dérivés** par `scripts/brand-assets.mjs`, et `mark.test.ts` interdit la dérive (rapports d'aspect des rasters et cadre PDF compris). `ui/logo.tsx` passe en SVG inline (`taille` → `hauteur`, variante `encre-mono` → `mono-encre`), la carte sociale cesse de redessiner le mot-signe en texte, le cadre du bandeau PDF passe de 82 × 27 à 78 × 16. Aucun nouveau token : le bleu du kit livré **était déjà** `tampon` (`#35507f`) ; l'encre du kit (`#19222D`) a été ramenée sur le token `encre` (`#16202b`). | Kit livré le 2026-07-25. Trois décisions au-delà du simple remplacement de fichiers. (1) **Contraste** : le bleu de marque sur fond encre plafonne à 1,95:1, donc la déclinaison `nuit` porte le symbole en `accent-clair` (7,3:1) — sans quoi le symbole disparaissait du bandeau PDF et de l'en-tête e-mail. (2) **Petites tailles** : le contour du symbole tombe sous le pixel en favicon ; l'épaissir referme les vides internes et donne une tache, la correction juste est d'agrandir le glyphe dans sa pastille (68 % du côté). (3) **Rapport d'aspect** : passer de 2,96 à 4,88 casse silencieusement tout cadre fixe, d'où le test qui compare rasters et cadre PDF au tracé. Le mot-signe a désormais sa propre police, distincte d'Unbounded qui reste la police des titres (§3). |
| 2026-07-25 | Attestation sur l'honneur CEE : le document est **requalifié en fiche de préparation** et cesse de se présenter comme une AH. Bandeau « Préparer votre attestation sur l'honneur » + « Ne pas signer / ne pas déposer », avertissement en tête, cadres A/B/C renommés en blocs métier (« Opération et logement », « Bénéficiaire », « Professionnel »), suppression de l'engagement sur l'honneur et des deux zones de signature, remplacés par un bloc « Ce qu'il vous reste à faire » en 5 étapes. Sur l'écran dossier, le téléversement de l'AH de l'obligé (`AhObligeFill`) remonte **au-dessus** du bouton de téléchargement, le badge passe à « Fiche de préparation », le titre de section devient « Attestation sur l'honneur ». Le mandat MPR (seul `officiel` restant) gagne une note « relisez le placement des valeurs ». Aucun nouveau token. | Revue réglementaire du 25/07 (CHANGELOG-cerfa.md) : l'annexe 7 de l'arrêté du 4 septembre 2014 réserve l'émission de l'AH au demandeur et interdit « toute modification du contenu et de l'organisation ». Un document Dossimo ne peut donc pas être une AH, si fidèle soit-il. Retirer les zones de signature n'est pas cosmétique : c'est ce qui empêche l'artisan de signer et déposer une pièce irrecevable. La hiérarchie de l'écran suit la hiérarchie du droit, le chemin conforme d'abord. |
| 2026-07-25 | **Logo, suite** : le mot-signe revient à **Unbounded Bold**, converti en courbes par `scripts/brand-motsigne.mjs` (fontkit, déjà présent avec Next), et non en texte vivant. Il reste d'un seul ton, sans les deux « o » gris d'avant. Composition : hauteur du mot = 0,73 × celle du symbole (proportion du kit), écart symbole ↔ mot ramené de 97,36 à 78 unités, centrage vertical. Le rapport d'aspect passe de 4,88 à **5,90**, donc le cadre du bandeau PDF passe de 78 × 16 à 94 × 16. Sur la vitrine, le logo grandit : en-tête `h-8 sm:h-9` (28 → 32/36 px) et la barre s'ouvre à `sm:h-18` pour tenir la zone de protection, pied `h-9`. | Le mot-signe dessiné du kit abandonnait Unbounded, ce qui créait une troisième police de marque pour un gain nul. Le retour à Unbounded aligne le logo sur les titres. Les courbes plutôt que le texte vivant : Unbounded est absente des PDF et des e-mails, et Satori ne lit pas les woff2 de `next/font` — en texte, le mot-signe serait juste sur le web et faux ailleurs (c'était le cas de la carte sociale). Bénéfice supplémentaire : plus de logo affiché dans une police de repli le temps que la webfont charge. L'écart de 97 unités, réglé pour un mot-signe plus léger, détachait visiblement les deux éléments sous Unbounded Bold ; 78 a été retenu par comparaison à 22, 36 et 48 px. La barre d'en-tête grandit parce qu'un logo à 36 px dans une barre à 64 px violait la zone de protection écrite trois paragraphes plus haut. |
| 2026-07-27 | Autorité éditoriale SEO : les pages publiques `/a-propos` et `/methode-editoriale` reprennent la coquille des guides (`max-w-4xl`, prose `max-w-3xl`, titres serif, fil d’Ariane). Les guides sont signés par l’organisation Dossimo et renvoient vers sa méthode, sans profil personnel ni donnée nominative sur la vitrine. | Donner aux moteurs de recherche et aux outils d’IA une entité éditoriale et des principes de publication explicites, tout en conservant la décision du 2026-07-22 qui cantonne l’identité personnelle aux pages légales. |
| 2026-07-29 | **Visite guidée** ajoutée à la vitrine : parcours interactif Supademo, capturé sur l'app réelle et rendu **neutre quant au geste**. Embarquée dans la section « Comment ça marche » (ancre `#visite`), plus une page autonome `/visite` (menu et pied de page). Nouveau motif §5 « Contenu tiers embarqué » : rien n'est chargé avant le clic (affiche locale dessinée avec les tokens, aucun actif servi), lien direct toujours offert, hébergeur nommé sous le cadre. `FOCUS_SOMBRE`, recopié à l'identique dans `app/page.tsx` et `app/tarifs/page.tsx`, remonte dans `boutons.ts`. Aucun nouveau token, aucune couleur nouvelle. | La vitrine décrivait le parcours (quatre cartes) sans jamais le montrer : le seul livrable visible était le PDF d'exemple, en fin de tunnel. La première version de la démo racontait un chantier de chauffe-eau solaire, dont un tiers des étapes en saisie de champs propres au CESI : un poseur de pompe à chaleur ne s'y reconnaissait pas, et le parcours donnait l'image d'un long formulaire, l'inverse de « montés sans vos soirées ». La version retenue ne garde que le tronc commun à tous les gestes — dépôt du devis, préremplissage, contrôles, checklist — qui est aussi ce que Dossimo a d'unique. Le chargement au clic plutôt qu'au rendu : la vitrine ne troque pas sa vitesse et sa sobriété de traitement contre un lecteur tiers que la plupart des visiteurs n'ouvriront pas. |
| 2026-07-30 | Visite guidée, correctif : la CSP gagne une directive `frame-src 'self' https://app.supademo.com`, lue depuis `VISITE.origine`. La politique quitte le proxy pour [`lib/security/csp.ts`](src/lib/security/csp.ts), module pur testable, et [`csp.test.ts`](src/lib/security/csp.test.ts) vérifie que l'origine du tiers y figure. Le motif §5 « Contenu tiers embarqué » passe de trois à quatre règles, la nouvelle étant la première. | La visite est partie en production illisible : sans `frame-src`, la CSP retombe sur `default-src 'self'` et le navigateur affichait « Ce contenu est bloqué » à la place du cadre. Ni le build, ni ESLint, ni les tests ne pouvaient le voir — le test existant vérifie l'absence d'`iframe` au rendu, pas la permission de la charger. D'où le déplacement : une politique de sécurité enfouie dans le proxy, au milieu du rafraîchissement de session Supabase, n'est ni relue ni testée. `frame-ancestors 'none'` donnait en plus l'illusion que le sujet des cadres était traité, alors qu'il ne couvre que le sens entrant. |
| 2026-07-30 | **Dépôt de fichiers** : nouveau motif §5, appliqué aux trois écrans qui reçoivent un document. Le fichier choisi s'affiche (nom, poids) au lieu de disparaître dans l'input ; une file d'envoi montre chaque fichier avec son état et son avancement ; l'attente longue est nommée ; la ligne s'efface quand la carte définitive arrive (état dérivé de l'`pieceId` renvoyé par l'action). Glisser-déposer et envoi multiple sur la zone artisan, qui offre désormais les neuf types de pièces au lieu de deux, avec raccourcis vers ce que la checklist réclame encore et type deviné d'après le nom du fichier. `capture` et bouton « Photographier » conditionnés à `useTactile` (remonté de `depot-client.tsx` vers `ui/use-tactile.ts`), `input` en `sr-only` et non `hidden`. Barres de progression en CSS et non en transform Motion. Nouvelle source unique [`lib/piece/catalogue.ts`](src/lib/piece/catalogue.ts) : libellés, types déposables par l'artisan, formats, taille maximale. Aucun nouveau token. | Retour terrain : « on dépose le document dans l'impression que rien ne se passe ». C'était exact — sur l'écran d'entrée, choisir un devis ne changeait rien à l'affichage, et pendant les secondes de lecture du modèle l'écran était identique à celui d'avant le clic, à un mot près sur le bouton. Deuxième défaut, de rythme celui-là : la zone de dépôt n'acceptait que le devis et la facture (le serveur en accepte neuf), un fichier à la fois, ce qui obligeait à finir le dossier depuis la checklist repliée en bas de page. Le motif Motion est un piège d'accessibilité vérifié : `reducedMotion="user"` fige un transform à sa valeur finale, donc hors cadre. |
