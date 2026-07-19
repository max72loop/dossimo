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
| `terre-cuite` → `accent` | `#35507f` | **Décidé (2026-07-19)** : l'accent reste le bleu, on renomme le token `terre-cuite` en `accent` partout (`tokens.ts`, `globals.css`, `boutons.ts`, `fields.tsx`). Tâche mécanique à faire, §8. |
| `terre-cuite-hover` | `#2a3f65` | Survol de l'action principale |
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
- **Vide** et **erreur** : pas encore de convention (à trancher, §8). Principe posé :
  un vide n'est jamais un blanc (message + une action de sortie) ; une erreur se dit
  et propose une reprise. C'est la traduction visuelle de « les erreurs ne sont jamais
  avalées en silence » (`AGENTS.md`).

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
- Chargement d'une action : le [`Spinner`](src/components/ui/spinner.tsx) maison,
  **pas** `Loader2` de lucide (un doublon traîne dans `demo-guide.tsx`, à résorber).

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
- [ ] Migrer la **vitrine** et l'**admin** vers les cartes flottantes (§5).
- [ ] Introduire `--shadow-lg` (ombre des cartes flottantes) dans `globals.css` (§4).
- [ ] Échelle typographique et échelle d'espacement figées.
- [ ] Largeurs de conteneur rationalisées (aujourd'hui de `max-w-md` à `max-w-7xl`, §4).
- [ ] Déclinaison e-mail (§1) : réaligner le fond `#E7E2D6` sur `papier-fonce`, et
      décider si un garde-fou vérifie que ses hex appartiennent bien à la palette.
- [ ] Format de date unifié web / PDF (« 05/05/2026 » vs « 05.05.2026 », §6).
- [ ] Convention des états vide / erreur (§5).
- [ ] Résorber les inputs écrits à la main hors de `fields.tsx` (§5).
- [ ] Logo : zone de protection et taille minimale (§5).
- [ ] Formaliser l'échelle de z-index (§4).
- [ ] Éliminer les emoji de l'UI produit au profit de lucide (§5).
- [ ] Centraliser la mention légale du pied de page (§5).
- [ ] Stratégie responsive des tables (§5).
- [ ] Convention toast vs message inline, et son placement (§5).
- [ ] Résorber le doublon de spinner (`Spinner` maison vs `Loader2`, §5).
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
