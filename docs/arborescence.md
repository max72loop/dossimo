# Arborescence commentée du dépôt

> Relevé sur `main` le 2026-09-06. 360 fichiers TS/TSX, 59 tests colocalisés,
> 59 migrations SQL, 34 domaines dans `src/lib`, 11 livrables PDF.
>
> **Convention** : un `x.test.ts` vit toujours à côté du `x.ts` qu'il couvre. Les
> tests ne sont donc pas listés séparément ci-dessous.

## Le pipeline en cinq étages, et qui l'exécute

| # | Étage | Fichiers |
|---|---|---|
| 1 | Saisie unique | `lib/dossier/cee-isolation.ts`, `form-steps.ts`, `components/dossier/DossierCeeIsolationForm.tsx`, `lib/dossier/actions.ts` |
| 2 | Moteur de règles | `lib/rules/*` (dures), `lib/rules/regles-metier.ts` + table `regles_metier` (éditables), `lib/llm/vigilance.ts` (souples) |
| 3 | Génération documentaire | `lib/pack/*` (React-PDF), `lib/cerfa/*` (pdf-lib), `lib/quotes/*` |
| 4 | Assemblage et cohérence croisée | `lib/pack/render.ts` (`mergePdfs`), `lib/piece/compare.ts`, `lib/dossier/rapport.ts` |
| 5 | Livraison | `app/dossiers/[id]/*.pdf/route.ts`, `lib/dossier/acces.ts` (paywall), `integrations/google-apps-script/webhook.gs` |

---

## Racine

```
CLAUDE.md              Brief projet : positionnement, dispositifs, architecture, modèle de données, prochaines tâches.
AGENTS.md              Règles non négociables : base de données, design, données personnelles, erreurs jamais avalées.
DESIGN.md              Toute décision visuelle se prend ici d'abord, puis se répercute dans les fichiers qu'il nomme.
SUIVI-PROJET.md        Journal d'avancement et écarts relevés (dont « Moteur : écarts relevés au sourçage »).
CHANGELOG-cerfa.md     Historique des versions de formulaires officiels (CLAUDE.md §8).
README.md              Prise en main du dépôt.

package.json           Scripts (dev/build/lint/test) et dépendances : Next 16, React 19, Supabase, Stripe,
                       React-PDF, pdf-lib, docx, Zod, Motion.
next.config.ts         Configuration Next.js.
tsconfig.json          TypeScript strict, alias `@/*` vers `src/`.
eslint.config.mjs      ESLint (config Next).
postcss.config.mjs     PostCSS pour Tailwind 4.
vitest.config.mts      Vitest : environnement, alias, stubs.
vercel.json            Région cdg1 + deux crons : expire-credits (3 h), purge-pieces (3 h 30).
.env.example           Modèle des variables ; .env.local jamais committé.
test/stubs/empty.ts    Stub neutre pour les modules écartés en test.
src/proxy.ts           L'ancien middleware.ts, renommé par Next 16. Rafraîchit la session Supabase
                       (fenêtre bornée) et applique la CSP.
```

## docs/

```
cluster-refus.md                Référence du chantier acquisition « refus » : périmètre, exclusions, ordre.
conformite-reglementaire.md     Ce que la conformité exige, dispositif par dispositif.
landing-conversion-2026.md      Décisions de conversion de la vitrine.
pricing-parrainage.md           Grille tarifaire et mécanique de parrainage.
prospection-cold-email.md       Doctrine d'envoi à froid : cadence, contenu, conformité.
refus/motifs-assertions.md      La source des sources : chaque affirmation réglementaire, sa référence
                                exacte, sa version, sa date. Mis à jour dans le même commit que la migration.
sources-reglementaires/cee/     Fiches CEE officielles archivées avec leur version (BAR-EN-101/102,
                                BAR-TH-112/125/148/171, dont les deux versions successives de la 171).
```

---

## src/app — les routes

### Socle

```
layout.tsx             Layout racine : polices (Inter, Source Serif, Geist Mono, Unbounded),
                       métadonnées, capture de source d'acquisition.
globals.css            Bloc @theme Tailwind : miroir web des tokens, identique à src/design/tokens.ts.
error.tsx              Filet d'erreur applicatif, rendu dans le layout racine (charte appliquée).
global-error.tsx       Dernier filet : l'erreur est dans le layout racine, donc sans Tailwind de marque.
not-found.tsx          404.
robots.ts / sitemap.ts Espace artisan et back-office exclus de l'indexation ; sitemap strictement public.
opengraph-image.tsx    Carte de partage. twitter-image.tsx réutilise le même visuel.
favicon.ico, icon*.png, apple-icon.png
```

### Vitrine publique

```
page.tsx                            Landing : promesse, étapes, estimateur, formulaire de contact.
tarifs/page.tsx                     Grille publique lue depuis pricing_tiers : jamais de prix en dur.
a-propos/page.tsx                   Qui édite Dossimo, et pourquoi il ne dépose pas.
exemple/page.tsx + pack.pdf/route   Pack d'exemple public depuis un dossier fictif : montrer le livrable.
demo/page.tsx, visite/page.tsx      Démonstration guidée et visite interactive embarquée.
guides/page.tsx                     Hub SEO, page pilier regroupant les guides par famille.
[slug]/page.tsx                     Route unique de TOUS les guides SEO, à la racine pour préserver
                                    l'indexation. Remplace dix page.tsx dupliqués.
actualites-maprimerenov-cee/        Veille réglementaire publiée.
methode-editoriale/page.tsx         Comment le contenu est sourcé : gage de sérieux du cluster SEO.
(legal)/layout.tsx                  Coquille commune des pages légales.
(legal)/mentions-legales|cgv|confidentialite   Alimentées par lib/legal/editeur.ts.
```

### Cluster « refus » (acquisition)

```
refus/layout.tsx                Bandeau d'indépendance posé une seule fois pour tout le cluster.
refus/page.tsx                  Entrée du cluster + formulaire de diagnostic.
refus/maprimerenov-refuse/      Les deux pages ciblées, rendues par un composant commun.
refus/cee-rejete/
refus/motifs/[slug]/page.tsx    Une page par motif publié dans refus_motifs. dynamicParams = false.
refus/particulier/page.tsx      Aiguillage « je suis un particulier », statique et sans collecte.
refus/merci/page.tsx            Confirmation de dépôt, en noindex.
```

### Authentification et compte

```
(auth)/layout.tsx                       Coquille des écrans d'authentification.
(auth)/connexion|inscription|mot-de-passe-oublie   Trois portes d'entrée vers le même compte.
nouveau-mot-de-passe/page.tsx           Réinitialisation, atteinte par lien e-mail.
auth/confirm/route.ts                   Vérification du lien Supabase Auth puis redirection sûre.
```

### Espace artisan

```
dossiers/layout.tsx        Coquille : en-tête, navigation, garde d'authentification.
dossiers/error.tsx         Filet d'erreur de l'espace : l'artisan garde sa navigation.
dossiers/page.tsx          Liste des dossiers avec statut de parcours.
dossiers/nouveau/page.tsx  Création d'un dossier : la saisie unique.
dossiers/[id]/page.tsx     La page qui porte le produit : verdict, complétude, actions restantes,
                           pièces, prime, livrables.
dossiers/profil/page.tsx   Compte : entreprise, contact, sécurité, parrainage.
dossiers/factures/page.tsx Historique des factures.
```

### Les onze livrables PDF

```
dossiers/[id]/pack.pdf           Le pack complet assemblé (couverture + documents générés).
dossiers/[id]/recap.pdf          Récapitulatif du chantier depuis la saisie unique.
dossiers/[id]/checklist.pdf      Checklist reliée à ce qui est réellement déposé.
dossiers/[id]/rapport.pdf        Rapport de contrôle anti-refus.
dossiers/[id]/attestation.pdf    Preuve datée du pré-contrôle ; verdict issu de rapportComplet.
dossiers/[id]/cerfa.pdf          Formulaire officiel rempli via pdf-lib, piloté par le registre.
dossiers/[id]/feuille-route.pdf  Chemin daté du dépôt et échéance légale.
dossiers/[id]/fiche-client.pdf   À remettre au bénéficiaire, générée côté artisan uniquement.
factures/[id]/facture.pdf        Facture Dossimo d'un paiement encaissé.
exemple/pack.pdf                 Le pack d'exemple public.
api/quotes/[id]/export           Export du devis (PDF ou DOCX), mentions de la version utilisée.
```

### Bénéficiaire et devis (hors session)

```
depot/[token]/page.tsx           La seule page qui s'adresse au client de l'artisan, par lien signé.
desinscription/[token]/page.tsx  Retrait des relances ou de la prospection, en un clic.
devis/page.tsx + layout.tsx      Générateur de devis conforme depuis les modèles publiés.
```

### Back-office `/admin` (liste d'UUID immuables)

```
admin/layout.tsx                 Garde d'accès, en-tête et barre de navigation (nav-admin.tsx).
admin/page.tsx                   Sommaire : trois rubriques, chiffres du jour par console (lib/admin/sommaire.ts).
  Prospection
admin/contacts/page.tsx          Le fichier : recherche, historique des échanges, réponses, relances, STOP.
admin/prospection/page.tsx       File e-mail : import CSV, validation, envoi manuel, pause.
  Pilotage
admin/tunnel/page.tsx            Contact → paiement → dossier accepté sans reprise ; par source utm, par palier.
admin/pilotage/page.tsx          Retours de dépôt : issues, motifs de refus, obligés CEE.
  Produit et données
admin/regles/page.tsx            Édition de regles_metier : le moteur se modifie ici, pas dans le code.
admin/devis/page.tsx             Publication des modèles de devis.
admin/donnees/page.tsx           Inventaire des dossiers, suppression des saisies de test.
  ├─ table-nettoyage.tsx         Tableau de sélection et suppression.
  └─ question-donnees.tsx        Questions en langage naturel : traduction en requête cataloguée, jamais du SQL.
```

### API

```
stripe/webhook/route.ts          Signature vérifiée sur le corps brut, écriture service-role, idempotent.
cron/purge-pieces/route.ts       Purge quotidienne des pièces échues (fichier Storage + ligne), fail loud.
cron/expire-credits/route.ts     Crédits parrain > 12 mois passés en `expired`.
prospection/prepare/route.ts     Prépare la file du jour en messages `en_attente`.
prospection/tick/route.ts        Au plus UN message par appel : le goutte-à-goutte anti-spam.
prospection/bilan/route.ts       Bilan de fin de journée : le plafond a-t-il été tenu ?
prospection/pixel/route.ts       Pixel d'ouverture servi en première partie depuis le domaine.
prospection/desinscription/      Désinscription en un clic (RFC 8058), bouton natif Gmail/Outlook.
```

---

## src/components — l'interface

### `ui/` — primitives partagées, sources uniques

```
boutons.ts             Un seul bouton plein par écran, tout le reste en outline.
cartes.ts              Traitement de carte flottante de l'espace artisan.
champs.ts              Classes des champs de formulaire.
badge.tsx              Pastille sémantique de statut (autrefois recopiée à trois endroits).
logo.tsx               Signature horizontale en SVG inline : source unique du logo à l'écran.
empty-state.tsx        État vide, avec toujours une action de sortie.
section-repliable.tsx  <details> natif : clavier et lecteurs d'écran, sans état ni librairie.
spinner.tsx            Indicateur d'activité. overlay-progression.tsx pour les attentes longues.
motion-provider.tsx    Réglage global des animations, reducedMotion="user" honoré.
use-tactile.ts         Détection tactile, pour l'attribut `capture` des champs fichier.
```

### `dossier/` — la page dossier, bloc par bloc

```
DossierCeeIsolationForm.tsx + fields.tsx   Le formulaire de saisie unique et ses champs.
verdict-hero.tsx        Le verdict en tête : unique indicateur de risque global, jamais contredit.
barre-completude.tsx    Largeur en style inline (juste avant hydratation), seul scaleX est animé.
actions-restantes.tsx / actions-prioritaires.tsx   Ce qu'il reste à faire ; rouge réservé aux blocages.
pieces-justificatives.tsx / checklist-pieces.tsx   Dépôt côté artisan et suivi de la checklist.
lien-depot.tsx / reprise-depot.tsx / marquer-vues.tsx   Réclamer les pièces, reprendre, accuser réception.
relances-beneficiaire.tsx   Cadence de relance du bénéficiaire.
depot-guide.tsx / feuille-de-route.tsx   Où déposer, à qui, quand ; et le chemin daté qui en découle.
ecart-prime.tsx         Barème Dossimo ≠ saisie : ni alerte, ni motif de refus.
points-vigilance-ia.tsx / finding-assistance.tsx / aide-dossimo.tsx   Vigilance rédigée et aide contextuelle.
paywall-cta.tsx / credits-cta.tsx   Déblocage du livrable et crédits parrain. prix={null} si inconnu.
parcours-selector.tsx / issue-dossier.tsx   Statut de parcours et issue finale.
oblige-suivi.tsx / ah-oblige-fill.tsx   Choix de l'obligé CEE et remplissage de son attestation.
espace-artisan-shell.tsx / espace-artisan-menu.tsx   Coquille et navigation de l'espace.
tableau-de-bord.tsx / metriques-valeur.tsx / demarrage-assiste.tsx   Vue d'ensemble et prise en main.
```

### Autres territoires

```
landing/site-header.tsx, site-menu.tsx, site-footer.tsx   Sommaire de la vitrine ; ancres ABSOLUES car
                        il coiffe aussi les pages légales et les guides.
landing/estimateur.tsx, lead-form.tsx      Simulateur d'aide et formulaire de contact.
landing/illustrations.tsx, visite-guidee.tsx, demo-guide.tsx   SVG dans la palette + seul contenu tiers.
depot/depot-client.tsx  L'écran du bénéficiaire : photo, compression, envoi, état de chaque pièce.
auth/auth-forms.tsx     Connexion, inscription, mot de passe oublié.
artisan/profil-forms.tsx, profil-securite.tsx, profil-parrainage.tsx, profil-ui.tsx, use-action.ts
                        Le compte, et le cycle de vie commun de ses formulaires.
admin/sections.ts       Les consoles et leurs rubriques, source unique de la barre et du sommaire.
admin/nav-admin.tsx     Barre de navigation (client uniquement pour usePathname).
admin/en-tete-console.tsx   Gabarit commun des consoles : largeur, titre, avertissement de production.
admin/regle-editor.tsx, contacts-liste.tsx, saisie-assistance.tsx
quotes/quote-library.tsx, quote-template-editor.tsx   Bibliothèque et édition des modèles de devis.
refus/refus-page.tsx, motif-page.tsx, diagnostic-form.tsx, guides-prevention.tsx
                        Rendu du cluster : aucun contenu éditorial décidé ici, tout vient de la base.
seo/guide-page.tsx, editorial-page.tsx    Gabarits des guides et pages éditoriales.
legal/legal-doc.tsx     Primitives typographiques des pages légales.
tracking/capture-source.tsx   Capte ?utm_source= à l'arrivée, monté une fois dans le layout racine.
```

### `src/design/`

```
tokens.ts       Source unique de la palette. Deux miroirs : globals.css (identique) et pdf-theme.ts (import).
tokens.test.ts  Casse dès que le miroir CSS dérive. C'est ce qui empêche site et PDF de diverger.
```

---

## src/lib — la logique métier

> Règle de lecture : `actions.ts` = Server Actions (écriture), `get*.ts` = lecture
> auth-scopée, le reste = fonctions pures et testables.

### `dossier/` — de la saisie au verdict

```
cee-isolation.ts          Le schéma de la saisie unique : SOURCE DE VÉRITÉ de tout le pack.
form-steps.ts             Découpage du formulaire en étapes.
actions.ts                createDossierCeeIsolation, updateMontantPrime.
get-dossier.ts            Lecture auth-scopée : null si le dossier n'appartient pas à l'artisan.
rapport.ts                rapportComplet : le verdict qui alimente écran, rapport et attestation.
synthese.ts               Complétude, actions restantes, niveau de risque, métriques de valeur.
prime.ts                  Estimation indicative depuis le barème de la règle métier. null si aucun barème.
acces.ts                  Droit d'accès au livrable : contrôle anti-contournement du paiement.
parcours.ts / parcours-actions.ts   Cycle de vie ordonné, piloté à la main par l'artisan.
depot-guide.ts / feuille-route.ts   À qui déposer et quand ; échéance dérivée des dates saisies.
geste-technique.ts        Lignes techniques à afficher selon le geste.
oblige-actions.ts         Choix de l'obligé CEE et retour de dépôt.
document-first-actions.ts analyserDevisInitial : partir du devis plutôt que du formulaire.
credits-actions.ts        Application du solde de crédits parrain avant paiement.
verification-actions.ts   Vérification SIRET + RGE à la volée depuis le formulaire.
guest-draft.ts            Brouillon local d'un visiteur non inscrit.
```

### `rules/` et `regles/` — le moteur anti-refus

```
rules/types.ts             Vocabulaire du moteur : findings, sévérités, contrat des règles dures.
rules/controle-dossier.ts  Règles dures sur la saisie.
rules/controle-pieces.ts   Règles dures sur les pièces réelles extraites (devis, facture).
rules/controle-avis.ts     Avis d'imposition vs catégorie de revenus déclarée.
rules/plafonds.ts          Barème des plafonds de ressources.
rules/regles-metier.ts     Résolution de la règle éditable applicable (dispositif, geste, version).
regles/condition.ts        Validation + fusion d'une condition : logique pure, sans accès base.
regles/admin-actions.ts    createRegle, updateRegle — l'édition depuis /admin/regles.
```

### `piece/` et `depot/` — les pièces réelles, des deux côtés

```
piece/catalogue.ts        Libellés, qui dépose quoi, limites d'envoi. Source unique.
piece/document.ts         Préparation d'un document avant lecture par un modèle vision.
piece/extract.ts          Extraction des champs d'un devis / d'une facture.
piece/mentions.ts         Seconde passe : vérification des mentions obligatoires.
piece/avis-imposition.ts  La pièce la plus lourde de conséquences du dossier.
piece/compare.ts          Vérification croisée pièces ↔ saisie. Ce qui transforme le contrôle en garantie.
piece/checklist.ts        La checklist reliée aux pièces réellement déposées.
piece/num.ts              Normalisation des nombres lus sur une pièce.
piece/file-validation.ts  Formats acceptés côté serveur : le type MIME du navigateur ne suffit pas.
piece/retention.ts        Rétention RGPD : 90 j après livraison, 180 j maximum. Fichier ET ligne.
piece/actions.ts, get.ts  Dépôt, suppression, lecture, conversion en écarts et contrôles.
depot/lien.ts             Lien de dépôt signé, avec nonce et révocation.
depot/pieces-attendues.ts Ce que le BÉNÉFICIAIRE doit fournir, et lui seul.
depot/etat-pieces.ts      Où en est chaque pièce, sachant qu'une pièce peut tenir en plusieurs fichiers.
depot/suivi.ts            Le même état, vu de l'artisan.
depot/compresser-image.ts Réduction de la photo dans le navigateur, avant l'envoi.
depot/actions.ts          Créer/révoquer le lien, déposer, retirer, marquer vues.
```

### `pack/` et `cerfa/` — la génération documentaire

```
pack/documents.tsx        Les documents React-PDF : récap, contrôle, checklist, couverture,
                          attestation, feuille de route, fiche client.
pack/render.ts            Rendu de chaque PDF + mergePdfs : l'assemblage du pack.
pack/pdf-theme.ts         Miroir PDF de la charte : importe design/tokens.ts, aucune recopie.
pack/format.ts, logo.ts   Formatage (espaces insécables absentes des polices PDF) et logo en data-URI.
pack/pieces-cee-isolation.ts   Pièces et mentions obligatoires du couple CEE / isolation.
pack/exemple.ts           Le dossier fictif du pack public.
cerfa/registry.ts         CŒUR DU VERSIONNEMENT (§8) : chaque modèle, sa référence d'arrêté,
                          sa version, ses dates d'applicabilité.
cerfa/generate.ts         Résout le modèle en vigueur, puis produit le document.
cerfa/fill.ts             Remplit les champs AcroForm, puis aplatit le formulaire.
cerfa/overlay.ts          Surimpression aux coordonnées mesurées, pour les PDF officiels sans champ.
cerfa/mapping.ts          Valeurs à injecter, indexées par nom de champ.
cerfa/winansi.ts          Caractères hors Latin-1 remappés (espace fine insécable des montants fr-FR).
cerfa/acroform-inspect.ts Inspection des champs d'un PDF : l'outil de mise en correspondance.
cerfa/ah-document.tsx, oblige-fill.ts, oblige-actions.ts   Attestation sur l'honneur de l'obligé.
```

### Argent, compte, sécurité

```
pricing.ts                Trois paliers indexés sur l'aide estimée. AUCUN seuil en dur.
referral.ts               Parrainage artisan → artisan, crédits, anti-farming SIRET.
stripe/client.ts, actions.ts   Checkout hébergé : aucune donnée de carte ne transite par Dossimo.
factures/emettre.ts       Numérotation continue, idempotence, verrou : la logique sensible reste en base.
factures/document.tsx, render.ts, get-facture.ts   PDF + acheteur figé à l'émission.
auth/actions.ts           Connexion, inscription, réinitialisation, déconnexion.
auth/get-artisan.ts       getUser() revalidé côté serveur : la source de vérité, pas la session.
auth/password.ts          Règle unique de robustesse, partagée par les trois portes d'entrée.
auth/rate-limit.ts        Quotas, avec un état `unavailable` distinct pour les pannes du limiteur.
auth/redirect.ts          `next` honoré seulement vers l'espace dossiers.
auth/is-admin.ts          Contrôle admin par liste d'UUID immuables.
artisan/profil-actions.ts, facturation-actions.ts   Entreprise, contact, mot de passe, e-mail,
                          sessions, adresse de facturation.
artisan/siret.ts          Validation SIRET : un chiffre faux est un motif de refus direct.
verification/verifier.ts, annuaire.ts, rge.ts, domaines.ts, types.ts, fixtures.ts
                          SIRET + RGE contre les annuaires officiels. Annuaire injoignable =
                          contrôle dégradé, jamais un blocage.
security/csp.ts           Politique de sécurité du contenu, source unique.
cron/auth.ts              Vérifie Authorization: Bearer CRON_SECRET ; 503 si le secret manque.
forms/timing.ts, timing-action.ts   Jeton d'ouverture signé : un formulaire rempli trop vite n'est pas humain.
forms/anti-spam.ts        Domaine non jetable ET enregistrement MX présent.
```

### LLM, mesure, admin

```
llm/openrouter.ts         Passerelle unique vers les modèles, texte et vision. Clé server-only.
llm/vigilance.ts, actions.ts   Points de vigilance rédigés, persistés pour ne pas re-payer l'appel.
admin/nl-query.ts         Le LLM ne génère JAMAIS de SQL, et masquerPii masque toute colonne
                          nominative avant l'envoi.
admin/inventaire.ts, donnees-actions.ts   Inventaire des dossiers et suppression depuis la console.
admin/sommaire.ts         Les chiffres du jour du sommaire, relus depuis les fonctions de chaque console.
mesure/tunnel.ts, tunnel-charge.ts   Contact → essai → inscription → dossier → paiement → dépôt
                          → accepté sans reprise.
mesure/sources.ts         Comptes, dossiers et payés par source utm : factuel, jamais déclaratif.
mesure/journal.ts         Les deux seules écritures de mesure : evenements_parcours, appels_llm.
mesure/assistance-actions.ts   Le seul chiffre qu'aucune machine ne mesure : le temps humain.
```

### Acquisition

```
landing/actions.ts             submitLead, estimerAide.
landing/estimation.ts + estimation-refs.ts   Le simulateur ; référentiel séparé car le calcul est server-only.
landing/grille-publique.ts     Prix affichés lus dans la même table que le checkout.
landing/copy.ts, visite.ts     Formules partagées et identifiants de la visite guidée.
seo/site.ts                    Titres construits sur les mots réellement tapés, marque en queue.
seo/guides.ts                  Ordre éditorial des familles ; pilote le hub et le menu.
seo/gestes.ts, gestes-loader.ts   Pages « par geste » dérivées de regles_metier : le contenu suit le moteur.
refus/motifs-loader.ts         Charge les motifs publiés. Le texte vit en base, jamais en markdown.
refus/pages.ts, jsonld.ts, schema.ts, consentements.ts, contact.ts, actions.ts
                               Pages fixes, balisage, schéma de la demande, consentements, repli, soumission.
prospection/file.ts            La file : préparation, envoi, salve, clic, ouverture, désinscription, bilan.
prospection/cadence.ts         Quand on a le droit d'envoyer et combien. Fonctions pures, horloge injectée.
prospection/message.ts         Accroche, corps, mentions légales, lien de désinscription, pixel.
prospection/csv.ts             Parseur RFC 4180 maison, pour l'import collé dans l'admin.
prospection/envoi.ts           Transport, via le Web App Apps Script déjà en place pour les leads.
prospection/actions.ts         Import, préparation, validation, envoi manuel, écartement, pause.
prospection/accroches.ts       Accroche par domaine RGE (bucket prioritaire), partagée avec Contacts.
contacts/liste.ts, actions.ts  Fichier refondu (0057/0058) ; échanges, réponses et STOP.
reminders/schedule.ts, message.ts, get.ts, actions.ts
                               Relances du bénéficiaire : cadence, fenêtre d'envoi, message signé
                               par l'artisan mais transitant par Dossimo.
tracking/source.ts             Attribution par canal, côté navigateur.
```

### Devis, socle et divers

```
quotes/generate.ts, actions.ts, admin-actions.ts   Génération d'un devis conforme, modèles
                          personnels, publication des modèles.
quotes/quote-document.tsx, render.ts, render-docx.ts   Sortie PDF et DOCX. Les mentions viennent
                          de la version du modèle utilisée, pas de la plus récente.
supabase/server.ts        Server Components, routes et actions ; cookies() asynchrone depuis Next 15.
supabase/client.ts        Client navigateur, clé anonyme uniquement.
supabase/admin.ts         Service-role : contourne RLS, jamais côté client.
supabase/middleware.ts    Rafraîchissement de session avec fenêtre bornée, utilisé par proxy.ts.
database.types.ts         Types du schéma. À mettre à jour dans le même commit que la migration.
legal/editeur.ts          Identité de l'éditeur : source unique mentions / CGV / confidentialité.
legal/mentions.ts         La mention d'indépendance, obligatoire sur chaque PDF et chaque e-mail.
format/montant.ts         « 1 200,00 € » : séparateur insécable, toujours deux décimales.
brand/mark.ts             Géométrie du signe : un dossier dont le rabat se prolonge en coche.
```

---

## supabase/ — le schéma

> Quatre règles avant d'y toucher, toutes issues d'incidents réels : jamais de SQL
> appliqué à la main, jamais de migration réécrite ou renumérotée, lire l'état
> courant d'une fonction avant de la remplacer, `npx supabase db reset` avant PR.

```
README.md          LA RÉFÉRENCE : carte du schéma, modèle de sécurité, historique des incidents,
                   dette restante. À lire avant toute migration.
config.toml        Configuration du CLI et de l'environnement local.
migrations/        59 migrations, additives une fois en production.
scripts/*.sql      Exploitation : tirage de prospects, corps de campagne, relance, import, rattrapage.
tests/*.sql        Tests SQL des migrations sensibles : parrainage (0013, 0055),
                   profils de revenus (0046), canal téléphone (0052).
```

| Migrations | Ce qu'elles installent |
|---|---|
| `0001 – 0011` | Schéma initial, pièces justificatives, vigilance persistée, seeds des règles métier (CEE isolation, MPR, PAC air/eau, CET, bois) et barèmes de prime. |
| `0012 – 0015` | Pricing, parrainage, facturation, paliers publics. |
| `0016 – 0019` | Dépôt par le bénéficiaire : types de pièces, lien, pièces vues. |
| `0020 – 0029` | Pilotage des obligés, bibliothèque de devis, sources officielles des fiches CEE, relances, validation des pièces, lien de dépôt unique. |
| `0030 – 0041` | Sécurité des comptes, profil artisan, prospection, source d'acquisition, mentions des pièces, et les migrations de réparation (0036, 0038, 0040) à lire avant d'y retoucher. |
| `0042 – 0049` | Solaire thermique, relances assistées, plafond intermédiaire MPR, `grant update` borné par colonne sur `dossiers`, quatre profils de revenus MPR, pixel d'ouverture, anti-farming SIRET. |
| `0050 – 0059` | Mesure du tunnel, canal téléphone, motifs de refus et leur seed, trace de parrainage, refonte du schéma de prospection et son backfill. |

---

## Autour du code

```
integrations/google-apps-script/webhook.gs      Le Web App qui expédie leads, demandes de refus,
                          relances et prospection. Déployé à la main, hors cycle Vercel.
integrations/google-apps-script/verifier-deploiement.mjs   Vérifie que le déploiement répond
                          et accepte le secret.
.github/workflows/quality.yml       lint + test sur chaque PR et sur main.
.github/workflows/prospection.yml   Le tempo des campagnes. GitHub n'honore pas un cron haute
                          fréquence : chaque exécution drippe plusieurs messages avec des pauses
                          de 2 à 6 minutes, à l'intérieur du job.
scripts/brand-assets.mjs, brand-motsigne.mjs   Fabriquent les fichiers de marque depuis la
                          géométrie de lib/brand/mark.ts.
scripts/visite-affiche.mjs          Produit l'aperçu de la visite guidée.
public/brand/                       Logos, symboles, icônes (archive/ pour les versions retirées).
public/illustrations/               Illustrations SVG de la vitrine.
public/cerfa/                       Modèle officiel servi directement : mandat MPR 16089*02.
templates/brand/                    Sources de marque et la police Unbounded (+ licence OFL).
templates/cerfa/                    PRÉVU par le §8 (modèles maîtres versionnés + archive/),
                                    PAS ENCORE CRÉÉ : c'est l'étape 2 de l'ordre de construction.
```

---

## Cinq repères pour s'orienter vite

| La question | Le fichier |
|---|---|
| Où change-t-on une règle de conformité ? | Table `regles_metier` via `/admin/regles`, ou `src/lib/rules/` pour une règle dure. Jamais dans un composant. |
| Où change-t-on une couleur ? | `DESIGN.md` d'abord, puis `src/design/tokens.ts` ; `globals.css` et `pdf-theme.ts` suivent dans le même commit. |
| Où est décidé ce que contient le pack ? | `src/lib/pack/documents.tsx` pour le contenu, `src/lib/pack/render.ts` pour l'assemblage. |
| Qu'est-ce qui garantit la cohérence devis / facture ? | Le schéma unique `src/lib/dossier/cee-isolation.ts`, croisé aux pièces réelles par `src/lib/piece/compare.ts`. |
| Par où sort un e-mail ? | `integrations/google-apps-script/webhook.gs`, sauf les e-mails d'authentification, expédiés par Supabase Auth. |
