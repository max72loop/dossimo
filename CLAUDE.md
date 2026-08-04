# Dossimo — Brief de démarrage projet

> Ce fichier est le contexte de référence du projet. Claude Code le lit à chaque
> session. Langue de travail : français en conversation, code en anglais.

@AGENTS.md

## 1. Le projet en une phrase

Dossimo est un outil web qui aide les **artisans RGE indépendants**
à produire des dossiers **MaPrimeRénov'** et **CEE** conformes et anti-refus, sans
passer par un mandataire, en gardant la main sur leur client et leur prime.

## 2. Positionnement — à ne jamais perdre de vue

- Dossimo **ne dépose jamais** le dossier et **ne touche jamais** la prime. Le dépôt
  sur `maprimerenov.gouv.fr` est réservé aux mandataires habilités par l'Anah, un
  rôle que Dossimo refuse d'endosser **par choix stratégique**.
- Dossimo produit le **pack documentaire complet et vérifié**, que l'artisan et son
  client déposent eux-mêmes.
- **Angle différenciateur** face aux mandataires : l'artisan garde le contrôle de sa
  relation client et de sa prime, là où un mandataire prend la main sur le dossier.
  Dossimo sécurise juste la conformité avant dépôt.
- **Conséquence juridique** : Dossimo est un service indépendant d'aide à la
  préparation de dossier, **non affilié à l'Anah ni à France Rénov'**. Cette mention
  doit figurer partout où c'est pertinent : landing, espace artisan, chaque PDF
  généré (récap, checklist, rapport), e-mails transactionnels.

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

## 5. Architecture technique — décisions actées

| Domaine | Choix |
|---|---|
| Front + espace artisan | Next.js (TypeScript) sur Vercel |
| Base de données + stockage | Supabase (PostgreSQL + Storage) |
| Paiement | Stripe |
| Emailing | Resend |
| Génération PDF depuis template | **React-PDF** (en production : récap, checklist, rapport) |
| Remplissage PDF Cerfa à champs | **`pdf-lib`** (Node), à implémenter à l'étape 2 du §9 |
| Moteur de règles | Code déterministe (règles dures) + LLM via API Openrouter (règles souples, rédaction des points de vigilance) |

> Décision : pas de service Python séparé (`pypdf` écarté), pas de Puppeteer.
> Tout reste dans le runtime Node/Next.js tant qu'aucun besoin ne l'impose.

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

**`leads`** — capture du formulaire landing (migration 0001).

## 8. Point technique critique — versionnement des Cerfa

Les formulaires Cerfa changent de version par arrêté (numéro à cinq chiffres +
indice de version). Chaque **modèle maître doit être versionné et surveillé**, sinon
Dossimo génère un dossier sur un vieux modèle et **fabrique lui-même le motif de
refus** qu'il prétend éviter. La table `regles_metier` pilote la version en vigueur.

**Processus de surveillance** : vérification mensuelle (1er du mois) des versions
en vigueur sur `service-public.fr` et les fiches CEE de l'ATEE ; en cas de nouvelle
version, mettre à jour `version_formulaire` dans `regles_metier`, archiver l'ancien
modèle maître dans `templates/cerfa/archive/`, et consigner le changement dans
`CHANGELOG-cerfa.md`. Aucune génération ne doit pointer un modèle absent de la
table active.

## 9. Ordre de construction — du plus utile au plus ambitieux

1. ~~Un seul couple dispositif + type de travaux : CEE isolation~~ ✅ fait.
2. Ajouter le **remplissage des Cerfa officiels** du même dispositif, avec le
   versionnement (§8). ← **étape en cours**
3. **Brancher le LLM** pour les règles souples et les points de vigilance rédigés.
4. **Étendre** aux autres dispositifs et types de travaux, en enrichissant la
   **table de règles, pas le code**.

## 10. Modèle économique

- **Grille en vigueur : trois paliers, 49 € / 149 € / 249 € par dossier.**
  Le détail de ce que couvre chaque palier vit dans Stripe et sur la landing,
  **jamais en dur dans le code** : garder la structure de pricing souple
  (table ou config), la grille peut encore bouger après retours terrain.
- Abonnement : décision reportée, à trancher une fois connu le coût de production
  réel d'un dossier.
- Système de **parrainage artisan** actif, à prendre en compte dans le tunnel
  de paiement.
- **Le nom « Dossimo »** doit être validé par recherche d'antériorité INPI +
  vérification du domaine avant tout dépôt de marque. Domaine principal :
  `dossimo.app`, redirection 301 `dossimo.pro` → `dossimo.app`.

## 11. Conventions du repo

**Commandes**

```bash
npm run dev          # serveur de dev Next.js
npm run build        # build de production
npm run lint         # ESLint
npm run test         # tests (Vitest)          ← à compléter si différent
npx supabase db push # appliquer les migrations locales
npx supabase migration new <nom>  # nouvelle migration
```

**Structure des dossiers clés**

```
src/lib/rules/        # règles dures du moteur de contrôle
src/lib/landing/      # Server Actions de la landing (leads, Resend)
src/components/landing/  # composants de la vitrine
supabase/migrations/  # schéma versionné, jamais de modif directe en prod
templates/cerfa/      # modèles maîtres Cerfa versionnés (+ archive/)
```

**Règles de travail**

- Code et identifiants en anglais, contenu utilisateur (PDF, e-mails, UI) en français.
- Toute nouvelle règle métier passe par `regles_metier` ou `src/lib/rules/`,
  jamais dispersée dans les composants.
- **Toute migration qui modifie le texte d'un motif de refus met à jour
  `docs/refus/motifs-assertions.md` dans le même commit**, au même titre que
  `database.types.ts` pour un changement de schéma. Ce fichier est la seule
  source des sources : chaque affirmation réglementaire y porte le slug du motif
  qu'elle soutient, sa référence exacte, la version du texte et sa date
  d'applicabilité. Le texte des motifs vit en base, jamais recopié en markdown.
- Chaque règle dure a un test avec un cas conforme et un cas de refus.
- Migrations Supabase uniquement additives une fois en prod (pas de `DROP` sans plan).

## 12. Environnement et secrets

- Variables dans `.env.local` (jamais committé), modèle dans `.env.example` :
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (Server Actions uniquement, jamais côté client)
  - `GOOGLE_APPS_SCRIPT_WEBHOOK_URL` + `GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET` :
    **tout l'e-mail sortant passe par là** (leads, demandes de refus,
    prospection). Resend reste écarté, il n'y a plus de `RESEND_API_KEY`.
    Les deux variables vont ensemble : avec une seule des deux, le code
    n'envoie rien et se contente d'un avertissement en journal.
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (mode **test** en local et preview)
  - `OPENROUTER_API_KEY` (+ `OPENROUTER_MODEL`, `OPENROUTER_VLM_MODEL`) : la
    passerelle LLM du projet, pas d'appel direct à Anthropic.
- Les clés service-role et Stripe live ne vivent que dans les variables Vercel
  (production). Aucun secret dans le code, les migrations ou les PDF de test.
- Les e-mails d'authentification (confirmation, mot de passe oublié, changement
  d'adresse) ne passent PAS par le webhook : c'est Supabase Auth qui les
  expédie, avec le SMTP réglé dans son tableau de bord.

## 13. Prochaines tâches

> Le back-end a été audité le 2026-07-16. L'état du schéma, le modèle de
> sécurité, l'historique des incidents et la dette restante sont documentés dans
> **`supabase/README.md`** : c'est la référence, à lire avant toute migration.

**Dette back-end prioritaire (issue de l'audit)**

- [x] **Purger les pièces justificatives.** Cron quotidien
      `/api/cron/purge-pieces` + logique dans `src/lib/piece/retention.ts`
      (fichier Storage + ligne, fail loud). Les deux fenêtres de rétention
      (`RETENTION_APRES_LIVRAISON_JOURS` = 90, `RETENTION_MAX_JOURS` = 180)
      restent **à faire valider juridiquement**.
- [ ] Donner au bénéficiaire un droit exerçable (accès / rectification /
      effacement) : il dépose ses pièces via une URL et n'existe pas en base.
- [x] Borner par colonne le `grant update` sur `dossiers`, comme `0031` l'a fait
      pour `artisans`. Fait en `0045` (7 colonnes ouvertes, le reste verrouillé).
- [x] Câbler `expire_old_credits` à un cron : fait (`vercel.json` →
      `/api/cron/expire-credits`, protégé par `CRON_SECRET`).
- [ ] Purger `leads`, `prospects`, `auth_rate_limits` et `refus_demandes`
      (CNIL : ~3 ans après le dernier contact en prospection B2B). Pour
      `refus_demandes`, la durée est annoncée au visiteur dans le libellé de
      consentement et dans `/confidentialite` : elle est due.

**Produit**

- [ ] **Cluster « refus » (acquisition).** Lot 1 livré le 2026-07-31 : onze
      motifs rédigés et publiés, pages `/refus`, `/refus/maprimerenov-refuse`,
      `/refus/cee-rejete`, `/refus/motifs/[slug]`, `/refus/particulier`,
      `/refus/merci`, formulaire de diagnostic, sitemap et maillage croisé.
      **Reste à faire à la main : déployer `webhook.gs` dans Apps Script** (hors
      cycle Vercel) et tester sur un envoi réel. Lot 2 en septembre, conditionné
      aux demandes reçues. Périmètre, exclusions explicites et ordre d'exécution
      dans **`docs/cluster-refus.md`** : c'est la référence du chantier, à lire
      avant d'y toucher.
- [ ] **Porter les quatre profils de revenus MaPrimeRénov'.** Le modèle n'en
      connaît que trois (`grande_precarite` / `precaire` / `classique`, calqués
      sur le CEE) alors que l'Anah en a quatre, et son `classique` confond
      *violet* (intermédiaire, éligible) et *rose* (supérieur, **non éligible**).
      Conséquence actuelle : le barème MPR du CESI ne seede que les deux profils
      représentables sans ambiguïté (migration `0042`), donc un ménage
      « classique » n'a aucune estimation. Tous les gestes sont concernés.
- [ ] **Contrôler le non-cumul CEE du solaire.** Depuis 2026, BAR-TH-101 / 124 /
      143 / 168 **et BAR-TH-148 (chauffe-eau thermodynamique)** ne sont plus
      cumulables avec BAR-TH-171 et BAR-TH-172 (PAC air/eau et eau/eau). Liste
      relevée au § 2 des fiches elles-mêmes le 2026-07-30 : le BAR-TH-148 y
      figurait et manquait ici comme dans le moteur. Non détectable aujourd'hui :
      la règle est inter-dossiers, et le moteur ne voit qu'un dossier à la fois.
      Trois autres écarts moteur relevés au même moment sont listés dans
      `SUIVI-PROJET.md` (§ « Moteur : écarts relevés au sourçage »).
- [ ] Implémenter le remplissage des Cerfa officiels CEE isolation avec `pdf-lib`,
      piloté par `version_formulaire` de `regles_metier`.
- [ ] Mettre en place le processus de surveillance Cerfa (§8) et créer
      `CHANGELOG-cerfa.md`.
- [ ] Ajouter l'assemblage du pack complet avec vérification de cohérence croisée
      (étage 4 du pipeline).
- [ ] Brancher l'API Anthropic pour les règles souples et la rédaction des points
      de vigilance.
- [ ] Intégrer la grille 49/149/249 € dans Stripe + tunnel de paiement, structure
      de pricing en config.
- [ ] Prendre en compte le parrainage dans le tunnel (code parrain à la souscription).