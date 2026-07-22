# Dossimo, suivi de projet

> État au 2026-07-20. Document de synthèse destiné au suivi hors dépôt (VPS).
> Sources : historique git (164 commits, du 2026-07-07 au 2026-07-19), `CLAUDE.md`,
> `AGENTS.md`, `DESIGN.md`, `supabase/README.md`, `docs/`, code de `src/`.

---

## 1. Le projet

Dossimo est un outil web qui aide les artisans RGE indépendants à produire des dossiers
**MaPrimeRénov'** et **CEE** conformes et anti-refus, sans passer par un mandataire, en
gardant la main sur leur client et leur prime.

**Positionnement, à ne jamais perdre de vue :**

- Dossimo ne dépose jamais le dossier et ne touche jamais la prime. Le dépôt sur
  `maprimerenov.gouv.fr` est réservé aux mandataires habilités par l'Anah, un rôle
  refusé par choix stratégique.
- Dossimo produit le pack documentaire complet et vérifié, que l'artisan et son client
  déposent eux-mêmes.
- Différenciateur face aux mandataires : l'artisan garde le contrôle de sa relation
  client et de sa prime.
- Conséquence juridique : service indépendant d'aide à la préparation de dossier,
  **non affilié à l'Anah ni à France Rénov'**. Mention obligatoire sur la landing,
  l'espace artisan, chaque PDF généré et les e-mails transactionnels.

**Cœur de valeur :** pas le remplissage, mais la cohérence garantie et le contrôle
anti-refus. Toutes les pièces sortant d'une saisie unique, l'incohérence devis/facture
(motif de refus n°1) devient structurellement impossible.

**Domaine :** `dossimo.app` en principal, `dossimo.pro` en redirection 301.
Contact : `max@dossimo.pro`. Nom encore à sécuriser (recherche d'antériorité INPI).

---

## 2. Chronologie de construction

Le projet a été bâti en treize jours, du 7 au 19 juillet 2026, par vagues cohérentes.

| Période | Ce qui a été livré |
|---|---|
| **07/07** | Amorçage du dépôt, socle Next.js + Supabase. |
| **08/07** | Journée la plus dense (30 commits) : upload de pièces + extraction VLM + vérification croisée, attestations sur l'honneur CEE, LLM de vigilance, pack PDF unique, Stripe Checkout, moteur `regles_metier` éditable + UI admin, brique MaPrimeRénov', estimateur de prime, **nouvelle identité de marque**, refonte de la saisie en assistant multi-étapes, tarification par palier, 4 gestes (isolation, PAC air/eau, CET, bois), tests Vitest. |
| **09-10/07** | Mentions légales / CGV / RGPD, grille de prix + parrainage + crédits, vérification SIRET et RGE contre les annuaires officiels, refonte de la page dossier (hero verdict, synthèse, actions restantes), émission des factures, garde du segment `/admin`, animations Motion. |
| **11-12/07** | Vérification des mentions obligatoires sur les pièces, correction des dossiers PAC/CET/bois, lecture des devis PAC/CET/bois, **dépôt des pièces par le bénéficiaire** via lien public. |
| **13/07** | Refonte éditoriale de la landing, accessibilité, sécurité des uploads et en-têtes, bibliothèque de devis (modèles, versions, export PDF puis DOCX), relances bénéficiaire, opt-out public, actions prioritaires du tableau de bord, CGV professionnelles étendues. |
| **14/07** | Notifications de lead via Google Apps Script, adresses `@dossimo.pro`, **code de lancement DOSSIMO50** et fin du premier dossier gratuit, refonte de la page compte artisan, durcissement de l'auth et du SEO, **système de cold email**. |
| **15-16/07** | Console de données admin, audit pré-lancement, console de prospection du sprint de lancement + attribution UTM, tableau de pilotage du sprint, relance J+5 et nurturing mensuel, **réparation du back-end Supabase et rédaction de `supabase/README.md`**. |
| **17/07** | Correction du parsing des nombres sur pièces scannées, bornage et déduplication des lectures VLM, ancrage de l'export de devis à sa version, **hub `/guides` + menu de site + trois guides**, relances assistées et conscientes de la cadence. |
| **18-19/07** | Automatisation de la prospection e-mail (cadence 7 jours montant à 40/jour), e-mails HTML de marque avec repli texte, livrables d'après-saisie (feuille de route, attestation, fiche client), **gouvernance design : `DESIGN.md`, tokens en source unique, test de miroir**, refonte visuelle « cartes flottantes » sur tout l'espace artisan, hero « bandeau encre » sur la landing, tempo d'envoi de prospection découplé du cron GitHub. |

---

## 3. Architecture technique

| Domaine | Choix acté |
|---|---|
| Front + espace artisan | Next.js 16.2 (App Router, React 19.2, TypeScript) sur Vercel |
| Base + stockage | Supabase (PostgreSQL + Storage, bucket privé `pieces`) |
| Paiement | Stripe 22.x |
| Emailing | Google Apps Script sous `max@dossimo.pro` (Resend écarté pour l'instant) |
| PDF depuis template | React-PDF (`@react-pdf/renderer` 4.5) |
| PDF Cerfa à champs | `pdf-lib` 1.17 |
| Export bureautique | `docx` 9.7 (export DOCX des devis) |
| Moteur de règles | Code déterministe + LLM via OpenRouter (vision et texte) |
| Formulaires / validation | react-hook-form + zod 4 |
| UI | Tailwind 4, lucide-react, Motion |
| Tests | Vitest 4 (~35 fichiers de test) |

Décisions : pas de service Python séparé, pas de Puppeteer. Tout reste dans le runtime
Node/Next.js.

**Volumétrie :** ~19 500 lignes dans `src/lib`, 43 migrations SQL, 27 tables.

---

## 4. Le pipeline en cinq étages, état par étage

1. **Saisie unique** du chantier vers Supabase. ✅ Fini (assistant multi-étapes, plus un
   parcours « document-first » où l'artisan envoie son devis et Dossimo pré-remplit).
2. **Moteur de règles** : validation de conformité et remontée des points de refus.
   ✅ Fini et testé (chaque règle dure a un cas conforme et un cas de refus).
3. **Génération documentaire** : ✅ fini pour la génération depuis template,
   🟡 **partiel** pour le remplissage des Cerfa officiels à champs (étape en cours).
4. **Assemblage du pack** avec vérification de cohérence croisée : 🟡 le pack unique
   existe, la vérification croisée à l'assemblage reste à faire.
5. **Livraison** du pack et du rapport à l'artisan (espace + e-mail). ✅ Fini.

---

## 5. Ce qui est livré, module par module

### Cœur métier

- **Moteur de contrôle anti-refus** (`src/lib/rules/`) : croise dossier ⨯ règle active ⨯
  dispositif, contrôle des pièces, contrôle de l'avis d'imposition contre les plafonds de
  ressources, bordereau des pièces manquantes. Les constantes en dur ne servent que de
  repli si aucune règle n'est en base.
- **Règles éditables** (`regles_metier` + `/admin/regles`) : seuils `r_min`, `etas_min`,
  `cop_min`, taux de TVA, ancienneté minimale, barème de prime, pièces requises. Modifiables
  sans redéploiement.
- **Vérification croisée pièce ↔ saisie** (`src/lib/piece/`) : extraction VLM des devis et
  factures, sortie validée par zod, comparaison avec la saisie (`ok` / `écart` / `absent`),
  contrôle des mentions obligatoires imposées par la fiche CEE. C'est le différenciateur.
- **Vérification SIRET et RGE** contre les annuaires officiels, avec contrôle que le domaine
  RGE couvre bien le geste. Trois modes (`reel` / `demo` / `off`).
- **Vigilance IA** (OpenRouter) : points de vigilance rédigés, persistés, dispositif-conscients.
  Le déterministe reste toujours la source de vérité.

### Gestes couverts

Isolation (BAR-EN-101/102/103), pompe à chaleur air/eau (BAR-TH-171), chauffe-eau
thermodynamique (BAR-TH-148), appareil de chauffage au bois (BAR-TH-112), solaire thermique
CESI (BAR-TH-101). Dispositifs CEE **et** MaPrimeRénov'.

### Documents produits

Récapitulatif, checklist, rapport de contrôle, attestation de contrôle, feuille de route,
fiche client, attestations sur l'honneur CEE (10 modèles en reproduction fidèle), mandat MPR
(Cerfa 16089-02 en surimpression), facture Dossimo. Le tout exportable en **un PDF unique**
avec page de garde, plus des routes dédiées par document.

### Parcours bénéficiaire

Lien de dépôt public sans compte, token HMAC-SHA-256 dérivé d'un secret serveur avec nonce
par lien, seul le hachage stocké, expiration à 60 jours, révocation réellement définitive.
L'artisan est prévenu quand son client a déposé, la checklist se coche seule. Relances
assistées (cadence J0/J3/J7/J14, plafond, opt-out public).

### Espace artisan

Liste de dossiers avec priorités, page dossier avec hero verdict et synthèse (complétude,
actions restantes, risque), profil en self-service, sécurité du compte, factures,
bibliothèque de devis avec modèles personnels et export PDF/DOCX.

### Admin

Accueil des consoles, édition des règles, gestion des modèles de devis, console de données
(nettoyage des dossiers de test), pilotage, prospection, sprint de lancement et son pilotage.
**Requête en langage naturel** : la question devient un plan de requête structuré (jamais de
SQL généré), sur liste blanche de tables et colonnes, avec masquage des colonnes PII avant
tout envoi au LLM.

### Acquisition

- **Landing** refondue plusieurs fois, dernière itération « bandeau encre », grille de prix
  lue depuis `pricing_tiers`, capture de lead qui n'est jamais perdue si l'e-mail échoue.
- **SEO** : hub `/guides` + six pages piliers (`constituer-dossier-cee-conforme`,
  `devis-cee-conforme`, `devis-maprimerenov-conforme`, `eviter-refus-maprimerenov`,
  `mentions-obligatoires-devis-rge`, `offre-cee-avant-le-devis`,
  `qualification-rge-valide-geste`), sitemap, robots, JSON-LD, images OG/Twitter.
- **Démo publique** `/demo` : analyse de devis gratuite, qui journalise le clic de prospection.
- **Prospection cold email** automatisée : cadence sur 7 jours montant de 15 à 40 messages par
  jour, file de validation humaine avant envoi, texte brut puis HTML de marque avec repli
  texte, `List-Unsubscribe`, pas de pixel de suivi (CNIL), liste de suppression permanente.
- **Sprint bicanal manuel** (WhatsApp + e-mail) : lot du jour, accroches, relance J+5,
  nurturing mensuel, tableau de KPI. Fichier de ~2 900 contacts issus de l'annuaire public ADEME.
- **Attribution d'acquisition** : capture d'`utm_source`, sessionStorage seul, aucun cookie
  ni tiers.

---

## 6. Modèle économique

- **Grille en vigueur : trois paliers, 49 € / 149 € / 249 € par dossier**, pilotés par la
  table `pricing_tiers` (bornes en cents, inclusives) : Essentiel jusqu'à 999,99 € d'aide,
  Pivot de 1 000 à 5 000 €, Premium au-delà. Jamais en dur dans le code.
- **Le premier dossier gratuit a été supprimé** le 14/07, remplacé par le code de lancement
  **DOSSIMO50**, dont la source unique de vérité est `src/lib/lancement.ts` (prolongé au
  31/07 après un incident de désynchronisation).
- **Parrainage actif** : code parrain, remise filleul de 30 € sur son premier dossier payant,
  crédits parrain cumulables expirant à 12 mois, grand-livre FIFO d'application des crédits.
- **Garde-fou** : alerte si le prix dépasse 12 % de l'aide estimée.
- **Facturation légale** : numérotation `FA-2026-00001` continue et sans trou, factures
  immuables au niveau du trigger (y compris en service-role), snapshot figé de l'acheteur et
  des lignes, conformité CGI art. 242 nonies A et code de commerce art. L441-9.
- **Abonnement** : décision toujours reportée, à trancher une fois connu le coût de production
  réel d'un dossier.

Toute la logique d'argent vit en SQL dans des fonctions `SECURITY DEFINER` ; le TypeScript
n'appelle que des RPC. Un trigger réécrit silencieusement toute colonne d'argent modifiée
depuis le client.

---

## 7. Sécurité et conformité

- **RLS activée sur les 27 tables**, en trois profils : policy propriétaire (`artisan_id`
  rattaché à `auth.uid()`), policy de lecture pour les référentiels, et **absence volontaire
  de policy** pour les tables service-role only (leads, prospection, compteurs de facture,
  rate limits). Une table sans policy n'est pas une table oubliée.
- Un seul accès `anon` dans tout le schéma : `pricing_tiers` en lecture, pour que la vitrine
  et le checkout lisent la même grille.
- **Rate limiting d'authentification** en fenêtre glissante, clé hachée, jamais l'e-mail en clair.
- **Aucune donnée personnelle vers un LLM** : masquage PII avant tout appel. Seul l'avis
  d'imposition part vers un modèle de vision, délibérément.
- Bucket `pieces` privé, convention de chemin portant l'appartenance, triple policy en défense
  en profondeur.
- Pages légales complètes : mentions légales, CGV professionnelles, politique de confidentialité.

---

## 8. Gouvernance et documentation interne

Quatre documents font autorité et doivent être lus avant d'agir :

- **`CLAUDE.md`** : brief de référence du projet, positionnement, modèle de données, ordre de
  construction, conventions.
- **`AGENTS.md`** : les règles non négociables. Base de données, design, règles métier en
  données et non en composants, aucune donnée personnelle vers un LLM, jamais d'erreur avalée
  en silence.
- **`supabase/README.md`** : carte du schéma, modèle de sécurité, **historique des incidents**.
  À lire avant toute migration.
- **`DESIGN.md`** : toute décision visuelle s'y prend d'abord, puis se reflète dans les fichiers
  qu'il nomme. Piège central : les tokens vivent dans deux miroirs qui doivent rester
  identiques, `src/app/globals.css` (web) et `src/lib/pack/pdf-theme.ts` (React-PDF). Un
  changement de palette touche les deux dans le même commit, sinon le site et les PDF divergent.

**Identité de marque** (en vigueur depuis le 08/07) : logo dossimo, palette encre / gris /
crème / bleu, police Unbounde. Parti d'exécution de l'espace artisan : cartes flottantes à
ombre douce. Pas de tirets cadratins dans la copie.

**Cinq règles de base de données**, nées d'incidents réels :

1. Jamais de SQL appliqué à la main dans l'éditeur Supabase, toujours `npx supabase db push`.
2. Jamais réécrire ni renuméroter une migration appliquée, écrire la suivante.
3. Avant tout `create or replace function`, lire l'état **courant** de la fonction.
4. `npx supabase db reset` avant d'ouvrir une PR, seule preuve que l'historique rejoue.
5. Un correctif s'applique partout, pas à une seule table.

---

## 9. Incidents traversés (mémoire du projet)

| Incident | Effet | Résolution |
|---|---|---|
| Migrations `0024` et `0025` contenant du texte collé, pas du SQL | Historique irrejouable, `db reset` en erreur de syntaxe | Passées en no-op documentées, contenu réel rejoué dans `0027` |
| `0030` enregistrée sans avoir été exécutée | Rate limiter échouant en mode fermé : **plus personne ne pouvait se connecter** | `0036` rejoue le contenu |
| Chaîne `0034 → 0036 → 0038` | Un `create or replace` a écrasé en silence l'attribution d'acquisition, morte pendant deux migrations | `0040` restaure `source` et le `search_path` ensemble |
| `search_path` sans `extensions` | `auth.signUp` en erreur 500 « Database error saving new user » | `0038` puis `0040` |
| Token de dépôt déterministe | **La révocation ne révoquait rien** : une URL fuitée redevenait valide après régénération, sur un avis d'imposition, un RIB et une pièce d'identité | `0041`, nonce de 32 octets par lien |
| `prospects_dossimo` créée à la main | La prod marchait, tout environnement neuf cassait | `0039` la crée dans sa forme finale |
| Deux migrations préfixées `0014` | `db push` bloqué | Renumérotation en `0035` |
| Grille de prix dupliquée | La landing promettait « 49 à 149 € » quand le checkout facturait 249 € | Source unique `pricing_tiers`, lecture `anon` |

---

## 10. Ce qui reste à faire

### Dette back-end prioritaire (audit du 2026-07-16)

- [ ] **Purger les pièces justificatives.** Avis d'imposition, RIB et pièces d'identité
      s'accumulent sans limite (RGPD art. 5.1.e). Point le plus lourd du projet, sur les
      données les plus sensibles.
- [ ] Donner au bénéficiaire un droit exerçable (accès, rectification, effacement) : il dépose
      ses pièces via une URL et n'existe pas en base. Tension à arbitrer avec l'immuabilité
      légale des factures, où son nom est figé à vie.
- [ ] Borner par colonne le `grant update` sur `dossiers`, comme `0031` l'a fait pour `artisans`.
- [ ] Câbler `expire_old_credits` à un cron (la route `/api/cron/expire-credits` existe déjà) :
      sans lui, `credit_balance_cents` dérive dès qu'un crédit expire.
- [ ] Purger `leads`, `prospects` et `auth_rate_limits` (CNIL : ~3 ans après le dernier contact
      en prospection B2B).
- [ ] `paiements.montant` est un `numeric` alors que la convention est l'entier en cents, et la
      conversion se fait exactement là où la loi exige l'exactitude.
- [ ] Index manquants sur plusieurs clés étrangères.

### Produit

- [ ] **Porter les quatre profils de revenus MaPrimeRénov'.** Le modèle n'en connaît que trois,
      calqués sur le CEE, et son `classique` confond *violet* (intermédiaire, éligible) et
      *rose* (supérieur, non éligible). Conséquence : un ménage « classique » n'a aucune
      estimation. Tous les gestes sont concernés.
- [ ] **Contrôler le non-cumul CEE du solaire.** Depuis 2026, BAR-TH-101/143/168 ne sont plus
      cumulables avec BAR-TH-171 et BAR-TH-172. Non détectable aujourd'hui : la règle est
      inter-dossiers et le moteur ne voit qu'un dossier à la fois.
- [ ] Implémenter le remplissage des **Cerfa officiels CEE isolation** avec `pdf-lib`, piloté
      par `version_formulaire` de `regles_metier`. Étape en cours du plan de construction.
- [ ] Mettre en place le processus de surveillance Cerfa : vérification mensuelle des versions
      en vigueur sur `service-public.fr` et les fiches CEE de l'ATEE, archivage des anciens
      modèles, entrée dans `CHANGELOG-cerfa.md` (aujourd'hui vide, statut « en attente de
      validation initiale »).
- [ ] Ajouter la **vérification de cohérence croisée à l'assemblage** du pack (étage 4).
- [ ] Faire **valider les modèles de devis** : tous les `quote_templates` sont encore en
      `placeholder = true` et plusieurs portent des marqueurs `[À VALIDER]`. Un modèle
      placeholder bloque déjà l'export, la garde tient, mais la bibliothèque n'est pas utilisable.
- [ ] Compléter le référentiel `obliges` (une entrée « À définir », des `exigences_json` vides).
- [ ] Migrer le bordereau des pièces, encore statique, vers `regles_metier.pieces_requises_json`.

### Exploitation et lancement

- [ ] **Publier l'enregistrement DNS `_dmarc`**, bloquant externe de la prospection e-mail.
      Piège connu : une clé DKIM publiée mais non activée.
- [ ] Nettoyer la facture de test `FA-2026-00001` avant la mise en production.
- [ ] Trancher le nom : recherche d'antériorité INPI avant tout dépôt de marque.
- [ ] Écrire les guides SEO restants du backlog (P1 à P3).
- [ ] Mettre `supabase/README.md` à jour : sa carte du schéma s'arrête à `0041` alors que
      `0042` et `0043` existent, et il liste encore `reminder_logs` comme code mort.
- [ ] Aligner la documentation sur la réalité du LLM : `CLAUDE.md` §12 mentionne
      `ANTHROPIC_API_KEY`, le code utilise OpenRouter.
- [ ] Régler la dérive de conventions du schéma : les migrations `0001-0020` et `0021-0043`
      ne suivent pas les mêmes règles (langue, énumérations, idempotence, `(select auth.uid())`).
- [ ] `src/lib/database.types.ts` est écrit à la main, sans script de régénération : rien
      n'empêche mécaniquement la dérive.

### Deux pièges à ne jamais oublier

- **`dossiers.statut` et `dossiers.status`** coexistent à une lettre près. `statut` est le
  parcours métier, `status` l'axe facturation. Rien ne les tient cohérents.
- **L'ordre de l'énumération `statut_dossier` ne suit pas le parcours métier.** Jamais de
  `order by statut` ni de comparaison `>`, trier dans le code.

---

## 11. Commandes

```bash
npm run dev                       # serveur de dev
npm run build                     # build de production
npm run lint                      # ESLint
npm run test                      # Vitest
npx supabase db push              # appliquer les migrations
npx supabase db reset             # rejouer tout l'historique (obligatoire avant PR)
npx supabase migration new <nom>  # nouvelle migration
```

## 12. Variables d'environnement

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
(Server Actions uniquement), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`DEPOT_LINK_SECRET` (32 caractères minimum, sans repli), clé OpenRouter,
`ADMIN_EMAILS`, `DOSSIMO_VERIFICATION_MODE`, webhook Google Apps Script.

Les clés service-role et Stripe live ne vivent que dans les variables Vercel de production.
Aucun secret dans le code, les migrations ou les PDF de test.
