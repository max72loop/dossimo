# Dossimo — Brief de démarrage projet

> Ce fichier est le contexte de référence du projet. Claude Code le lit à chaque
> session. Langue de travail : français en conversation, code en anglais.

@AGENTS.md

## 1. Le projet en une phrase

Dossimo est un outil web qui aide les **artisans RGE indépendants d'Île-de-France**
à produire des dossiers **MaPrimeRénov'** et **CEE** conformes et anti-refus, sans
passer par un mandataire, en gardant la main sur leur client et leur prime.

## 2. Positionnement — à ne jamais perdre de vue

- Dossimo **ne dépose jamais** le dossier et **ne touche jamais** la prime. Le dépôt
  sur `maprimerenov.gouv.fr` est réservé aux mandataires habilités par l'Anah — un
  rôle que Dossimo refuse d'endosser **par choix stratégique**.
- Dossimo produit le **pack documentaire complet et vérifié**, que l'artisan et son
  client déposent eux-mêmes.
- **Angle différenciateur** face aux mandataires : l'artisan garde le contrôle de sa
  relation client et de sa prime, là où un mandataire prend la main sur le dossier.
  Dossimo sécurise juste la conformité avant dépôt.
- **Conséquence juridique** : Dossimo est un service indépendant d'aide à la
  préparation de dossier, **non affilié à l'Anah ni à France Rénov'**. Cette mention
  doit figurer partout où c'est pertinent.

## 3. Dispositifs couverts

**MaPrimeRénov'** et **CEE** (Certificats d'Économies d'Énergie) dès le départ.
Le volume bascule vers les CEE quand MaPrimeRénov' vacille, et la conformité CEE
(fiches BAR, mentions obligatoires, justificatifs) génère beaucoup d'erreurs
bloquantes.

## 4. Ce que fait le produit — deux volets

- **Volet génération** : produire le pack documentaire prérempli à partir d'une
  saisie unique des données du chantier.
- **Volet contrôle** : vérifier la conformité et faire remonter les points qui
  déclenchent un refus, **avant le dépôt**.

Le cœur de valeur n'est pas le remplissage mais la **cohérence garantie** et le
**contrôle anti-refus**. Comme toutes les pièces sont générées depuis la même saisie
unique, l'incohérence entre devis et facture (un des premiers motifs de refus)
devient **structurellement impossible**.

## 5. Architecture technique cible

| Domaine | Choix |
|---|---|
| Front + espace artisan | Next.js sur Vercel |
| Base de données + stockage | Supabase (PostgreSQL + Storage) |
| Paiement | Stripe |
| Emailing | Resend |
| Remplissage PDF Cerfa à champs | `pdf-lib` (Node), ou `pypdf` si service Python séparé |
| Génération depuis template | React-PDF, ou HTML → PDF via Puppeteer |
| Moteur de règles | Code déterministe (règles dures) + LLM via API Anthropic (règles souples, rédaction des points de vigilance) |

## 6. Pipeline en cinq étages

1. **Saisie unique** des données chantier dans un formulaire structuré → Supabase.
2. **Moteur de règles** : validation de conformité et remontée des points de refus.
3. **Génération documentaire**, deux voies : remplissage de PDF Cerfa à champs, et
   génération depuis template.
4. **Assemblage** du pack complet avec vérification de cohérence croisée.
5. **Livraison** du pack et du rapport de contrôle à l'artisan (espace + email).

## 7. Modèle de données initial (Supabase)

**`artisans`** — `id`, `entreprise`, `nom`, `prenom`, `email`, `telephone`, `ville`,
`siret`, `qualification_rge`, `statut_abonnement`, `created_at`.

**`dossiers`** — `id`, `artisan_id`, `statut` (`nouveau` | `en_traitement` | `livre`),
`dispositif` (`maprimerenov` | `cee`), `type_travaux`, `commune`, `code_postal`,
`statut_rge`, `client_identifie`, `montant_estime`, `dates_json`,
`caracteristiques_techniques_json`, `formule`, `created_at`, `delivered_at`.

**`regles_metier`** — `id`, `dispositif`, `type_travaux`, `condition_json`,
`pieces_requises_json`, `points_vigilance_json`, `version_formulaire`, `version`,
`actif`. Table **éditable, jamais en dur, versionnée** ; elle pilote aussi la version
de formulaire Cerfa en vigueur.

**`paiements`** — `id`, `dossier_id` ou `artisan_id`, `stripe_id`, `montant`,
`statut`, `type` (`abonnement` | `ponctuel`), `created_at`.

## 8. Point technique critique — versionnement des Cerfa

Les formulaires Cerfa changent de version par arrêté (numéro à cinq chiffres +
indice de version). Chaque **modèle maître doit être versionné et surveillé**, sinon
Dossimo génère un dossier sur un vieux modèle et **fabrique lui-même le motif de
refus** qu'il prétend éviter. La table `regles_metier` pilote la version en vigueur.

## 9. Ordre de construction — du plus utile au plus ambitieux

1. **Un seul couple dispositif + type de travaux : CEE isolation.** Génération depuis
   template (récap client + checklist) + règles dures de contrôle. C'est ce qui crée
   de la valeur le plus vite, sans dépendre d'un Cerfa officiel.
2. Ajouter le **remplissage des Cerfa officiels** du même dispositif, avec le
   versionnement.
3. **Brancher le LLM** pour les règles souples et les points de vigilance rédigés.
4. **Étendre** aux autres dispositifs et types de travaux — en enrichissant la
   **table de règles, pas le code**.

En parallèle : la landing page existe déjà en HTML statique (vitrine + capteur de
leads) ; son formulaire devra être branché sur **Supabase + Resend**.

## 10. Décisions ouvertes — à ne pas coder en dur

- **Pricing non figé**, fixé après test de prix terrain. Ne pas coder de grille
  rigide, garder une structure souple. Hypothèse provisoire : **premier dossier
  gratuit** (produit d'appel), puis **prix unique ~149 € / dossier** ; abonnement
  décidé plus tard, une fois connu le coût de production réel d'un dossier.
- **Le nom « Dossimo »** doit être validé par recherche d'antériorité INPI +
  vérification du domaine `dossimo.fr` avant tout dépôt de marque.

## 11. Premières tâches

- [x] Initialiser un projet Next.js + TypeScript, le connecter à Supabase.
- [x] Créer le schéma de base de données (modèle §7) → `supabase/migrations/0001_initial_schema.sql`.
- [x] Construire le formulaire de saisie unique pour le couple **CEE isolation** → `/dossiers/nouveau`.
- [x] Implémenter la génération depuis template (récap client + checklist) → PDF React-PDF : `/dossiers/[id]/recap.pdf` & `/checklist.pdf`.
- [x] Implémenter les premières règles dures de contrôle : chronologie,
      qualification RGE, mentions obligatoires CEE → `src/lib/rules/`, rapport `/dossiers/[id]/rapport.pdf`.
- [x] Brancher le formulaire de la landing sur Supabase + Resend (capture de leads)
      → table `leads` (migration 0001), Server Action `src/lib/landing/actions.ts`
      (insert service-role + e-mails Resend best-effort), formulaire `src/components/landing/lead-form.tsx`.
