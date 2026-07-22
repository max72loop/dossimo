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
encadré offre, bouton, pied légal.

Deux dettes à connaître, non encore sous garde-fou :

- **Couleurs en hex brut**, non miroitées depuis `tokens.ts` (l'e-mail ne peut pas
  importer le TS). Pire : le fond extérieur `#E7E2D6` **n'est même pas un token**,
  c'est une troisième crème parasite, à réaligner sur `papier-fonce` (`#eae6dc`).
- **Copie en double source** : le HTML (`GABARIT_HTML`) et le texte
  (`prospection_campagnes.corps`, en base). Toute modif de fond (offre, prix,
  DOSSIMO50) se répercute **aux deux**.

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
| `--font-display` | Unbounded | Titres forts, wordmark |
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

### Logo et actifs de marque

Fichiers dans [`public/brand/`](public/brand/). Deux variantes de mot-signe, **une par
fond** :

- `dossimo-logo-nuit.png` : version claire, **sur fond encre** (bandeau PDF via
  [`logo.ts`](src/lib/pack/logo.ts), en-tête e-mail).
- `dossimo-logo-encre.png` / `.svg` : version sombre, **sur fond crème** (web).
- Icônes : `dossimo-icon.png` / `dossimo-icon-clair.png`. Favicon, apple-icon et
  images sociales : `src/app/icon.png`, `apple-icon.png`, `opengraph-image.tsx`,
  `twitter-image.tsx`.

**Règle : jamais le mauvais logo sur le mauvais fond** (nuit sur clair, encre sur
sombre). Zone de protection et taille minimale : à figer (§8).

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
- [ ] Logo : zone de protection et taille minimale (§5).
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
