# Cluster « refus »

> Brique d'acquisition : un cluster de pages `/refus` qui explique les motifs de
> refus MaPrimeRénov' et CEE, et un formulaire de diagnostic qui capte des
> artisans. Découpé en **deux lots** : le lot 1 en août 2026, le lot 2 en
> septembre, conditionné aux demandes réellement reçues.
>
> Document de référence du chantier. Le périmètre décidé ici prime sur toute
> interprétation d'un ticket ou d'une conversation.

## 1. Contexte et objectif

Le site est en phase de lancement, avec quasiment aucun trafic. Le marketing
monte progressivement en août 2026 pour viser de la traction en septembre.

Le cluster a deux fonctions, **dans cet ordre** :

1. **Support de vente immédiat** pour la prospection sortante déjà en place
   (WhatsApp à froid, appels sur les leads ADEME RGE, cold email, cf.
   [`prospection-cold-email.md`](prospection-cold-email.md)). Une page « les
   motifs de refus » est le lien envoyé après une première réponse, ou en
   relance. **Elle a de la valeur le jour de sa publication, sans aucune
   indexation.**
2. **Captation SEO à maturation.** Sur un domaine jeune, l'ordre de grandeur
   réaliste de classement est novembre ou décembre, pas septembre. C'est la
   mécanique du canal, pas un défaut d'exécution.

**Conséquence directe sur le ton** : on rédige d'abord pour un artisan qui lit,
ensuite pour le moteur. Moins de mots clés, plus de démonstration de compétence.

## 2. Principe de découpe

Le critère de découpe n'est **pas l'importance**, c'est le **délai d'amorçage**.

- **Lot 1 (août)** : tout ce qui doit être indexé ou envoyable dès maintenant.
- **Lot 2 (septembre, environ 2 jours)** : tout ce qui ne sert qu'une fois qu'il
  y a du volume, et qui ne gagne rien à exister plus tôt.

### Hors périmètre du lot 1, explicitement

Ne pas écrire ce code, **même en squelette** :

- bucket `refus`, upload de fichier, validation MIME, compression image ;
- `retention.ts` et le cron de purge ;
- `src/app/admin/refus` ;
- `classification.ts` (point d'extension spéculatif : une interface qui retourne
  une liste vide n'apporte rien) ;
- profil « Particulier » avec collecte de données.

## 3. Lot 1, à livrer en août

### 3.1 Contenu (le vrai travail, à faire en premier)

**8 à 10 motifs de refus réels, entièrement rédigés.** Pas de seed vide : une
page motif sans contenu ne se classe pas, elle occupe une URL.

Pour chaque motif :

- le libellé ;
- l'aide concernée (MaPrimeRénov', CEE, ou les deux) ;
- ce qui déclenche le refus ;
- ce qui le prévient côté artisan ;
- si la décision est contestable. **Formulation corrigée le 30/07/2026** : côté
  MaPrimeRénov', il s'agit d'un **recours administratif préalable obligatoire**
  auprès du directeur général de l'Anah (décret n° 2020-26, art. 9), et non d'un
  recours gracieux facultatif ; sans lui, la requête au juge est irrecevable.
  **Aucune page n'annonce de délai chiffré** : le délai de deux mois est celui du
  recours contentieux (R. 421-1 CJA), pas celui du recours préalable, qu'aucun
  texte ne fixe. Les pages renvoient à la notification reçue, en s'appuyant sur
  R. 421-5 CJA, selon lequel un délai non mentionné dans la notification n'est
  pas opposable. Détail et sources dans
  [`refus/motifs-assertions.md`](refus/motifs-assertions.md) § 1.

### 3.1 bis Circuit de validation du contenu réglementaire

`refus_motifs.publie` vaut `false` par défaut : un motif rédigé existe en base et
**ne sort pas en page** tant qu'il n'est pas relu. La rédaction est faite par
l'agent, la **validation reste chez Max** et doit être réelle. Trois règles la
rendent tenable.

**1. La prose et les assertions sont séparées.** À côté du `contenu_json` de
chaque motif, produire une **liste explicite des affirmations réglementaires**,
une par ligne, avec sa **source primaire**, sa **date de consultation** et la
**référence exacte** (article, section). C'est cette liste qui est relue, pas les
paragraphes. Relire dix pages de prose confiante prend une soirée et ne détecte
rien ; relire trente assertions sourcées prend vingt minutes et détecte tout.

**2. Une assertion sans source primaire ne se reformule pas, elle se signale.**
Le mode d'échec à éviter est la phrase adoucie qui masque une affirmation
invérifiée (« en général », « le plus souvent »). Source manquante : **marqueur
visible dans la liste, jamais dans le texte**.

**3. Amorcer depuis `regles_metier`, pas depuis le web.** Cette table est déjà la
version codifiée de ce qui rend un dossier non conforme, et elle a été validée :
**chaque règle dure existante est un motif candidat, sourcé par construction**
(cf. aussi [`src/lib/rules/`](../src/lib/rules/) et
[`docs/sources-reglementaires/`](sources-reglementaires/)). Le web ne sert qu'à
compléter ce qui manque.

Ce qui reste inconditionnel : aucun délai, aucun chiffre, aucune voie de recours
écrit sans source vérifiée à la date de rédaction, conformément à
[`conformite-reglementaire.md`](conformite-reglementaire.md).

### 3.2 Base, migration `0053_refus_motifs.sql`

**`refus_motifs`** : `id`, `slug` unique, `libelle`, `aide`
(`text + check` : `maprimerenov` | `cee` | `les_deux`), `description`,
`contestable` bool, `publie` bool default false, `meta_title`,
`meta_description`, `contenu_json` (sections + FAQ), `created_at`, `updated_at`.

**`refus_demandes`**, version réduite : `id`, `profil`
(`artisan_rge` | `autre`), `aide`, `geste`, `email`, `telephone` nullable,
`date_notification` date nullable, `motif_libre`, `statut`
(`nouveau` | `en_cours` | `traite` | `abandonne`), `consentement_contact_at`,
`consentements_version`, `consentements_texte` jsonb, `utm_source`,
`utm_medium`, `utm_campaign`, `diagnostic`, `created_at`, `updated_at`.

**Pas de `storage_path`, pas de `creneau_rappel`, pas de `refus_demandes_motifs`
en lot 1.**

**`date_notification` : stockée, jamais calculée.** La contestabilité se joue sur
un délai courant depuis la notification : sans cette date, ni le formulaire ni le
diagnostic manuel ne savent s'il court encore, et le texte libre ne peut pas la
porter de façon exploitable. Le champ est **optionnel au formulaire** : un
artisan qui n'a pas sa notification sous les yeux ne doit pas être bloqué, et un
champ obligatoire ferait chuter la complétion.

En revanche, **aucun compte à rebours n'est construit dessus** : pas d'affichage
du type « il vous reste X jours », pas de verdict calculé sur la recevabilité. La
date informe le diagnostic manuel, rien de plus. Le contenu des pages **n'annonce
aucun délai chiffré** et renvoie à ce que porte la notification reçue, un délai
non mentionné dans celle-ci n'étant pas opposable (R. 421-5 CJA). Se tromper sur
un délai affiché ferait perdre un recours à quelqu'un.

Contraintes, toutes issues de [`supabase/README.md`](../supabase/README.md) :

- RLS activée sur les deux tables, **sans policy** (service-role uniquement,
  comme `leads`), plus `revoke all ... from anon, authenticated`.
- `refus_motifs` est lue en service-role, comme `regles_metier` l'est par
  [`gestes-loader.ts`](../src/lib/seo/gestes-loader.ts). **Ne pas ouvrir un
  second accès `anon`** : `pricing_tiers` reste le seul du schéma.
- Conventions §6 : `create table if not exists`, `drop policy if exists` avant
  `create policy`, `search_path = public, pg_temp` (pg_temp en dernier) sur toute
  `SECURITY DEFINER`, `notify pgrst, 'reload schema';` après changement de droits,
  `text + check` plutôt qu'un enum.
- [`src/lib/database.types.ts`](../src/lib/database.types.ts) est écrit à la
  main : mise à jour **dans le même commit**.
- `npx supabase db reset` avant d'ouvrir la PR.

### 3.3 Socle serveur, `src/lib/refus/`

- **`consentements.ts`** : texte exact de la case et `CONSENTEMENTS_VERSION`,
  source unique partagée entre le formulaire et le stockage.
- **`schema.ts`** : schéma Zod partagé, **validé côté serveur**, le client ne
  fait que du confort.
- **`actions.ts`** : Server Action `soumettreDemandeRefus`. Séquence : honeypot,
  `consumeAuthRateLimit("refus", ...)` borné par IP
  ([`rate-limit.ts`](../src/lib/auth/rate-limit.ts), l'union TS de `action` est à
  étendre, la colonne SQL est un `text` libre), validation Zod, insert. Erreurs
  remontées, jamais avalées.
- **Mode fermé si le limiteur est en panne**, contrairement au formulaire lead
  ([`landing/actions.ts`](../src/lib/landing/actions.ts), qui laisse passer pour
  ne jamais perdre un lead). Ce choix est **commenté dans le code**, et
  l'utilisateur bloqué se voit proposer **une adresse e-mail de repli**.
- Tests Vitest sur le schéma : cas conformes, cas de refus, consentement non
  coché.

### 3.4 Pages publiques

- **`src/app/refus/layout.tsx`** : coquille vitrine (`SiteHeader` +
  `SiteFooter`) et **bandeau de mention d'indépendance**, une fois pour tout le
  cluster. La variante « web » de la mention est **remontée dans**
  [`src/lib/legal/mentions.ts`](../src/lib/legal/mentions.ts) plutôt que
  recopiée une troisième fois (elle est aujourd'hui couplée à la main entre
  `site-footer.tsx` et `stripe/actions.ts`).
- **`/refus`** (hub), **`/refus/maprimerenov-refuse`**, **`/refus/cee-rejete`**.
  Contenu en données typées dans `src/lib/refus/pages.ts`, sur le modèle de
  [`guides.ts`](../src/lib/seo/guides.ts).
- **`/refus/motifs/[slug]`** : `motifs-loader.ts` calqué sur
  [`gestes-loader.ts`](../src/lib/seo/gestes-loader.ts) (lecture service-role,
  dégradation gracieuse si la base est injoignable), `generateStaticParams` +
  `dynamicParams = false`, `publicMetadata`, JSON-LD `Article` +
  `BreadcrumbList`, et `FAQPage` **seulement si la FAQ existe réellement** (même
  règle que [`guide-page.tsx`](../src/components/seo/guide-page.tsx)).
- **`/refus/merci`**, `noindex`.
- **Aiguillage particulier** : le bouton « je suis un particulier » mène à une
  page **statique** qui explique que, côté MaPrimeRénov', un recours devant le
  juge suppose d'avoir d'abord saisi le directeur général de l'Anah (recours
  administratif préalable obligatoire), qui renvoie à la notification reçue pour
  les délais applicables **sans en annoncer aucun**, et qui oriente vers France
  Rénov' dont l'accompagnement est gratuit. **Aucune collecte, aucun formulaire,
  aucun e-mail.** Cela supprime entièrement la branche B2C du cadre CNIL tout en
  gardant le trafic et l'autorité.
- **Formulaire** : e-mail, téléphone optionnel, date de notification optionnelle
  (§3.2), texte libre. Pas d'upload en lot 1, donc le motif « Dépôt de fichiers »
  de [`DESIGN.md`](../DESIGN.md) §5 est **sans objet ici**.

### 3.5 SEO et maillage

- [`src/app/sitemap.ts`](../src/app/sitemap.ts) : ajout du hub, des deux pages
  ciblées et des motifs publiés.
- Maillage croisé avec les trois guides de la catégorie « Refus & prévention »
  (`eviter-refus-maprimerenov`, `offre-cee-avant-le-devis`,
  `qualification-rge-valide-geste`), via un **champ optionnel sur l'interface
  `SeoGuide`**, pas un bloc codé en dur dans `guide-page.tsx`.

### 3.6 E-mail de confirmation

Ajouter un type `refus_demande` dans
[`integrations/google-apps-script/webhook.gs`](../integrations/google-apps-script/webhook.gs),
**dans le même lot**. C'est la partie la moins chère de la fonctionnalité et elle
porte le premier contact de la relation. Pas de Resend (compte occupé par un
autre projet), tout passe par le webhook Apps Script.

Le déploiement dans Apps Script est **manuel et hors du cycle Vercel** : c'est
une **étape nommée de la checklist de livraison**, pas une finition.

### 3.7 Conformité

Finalité, base légale, durée de conservation et droits dans
[`/confidentialite`](../src/app/(legal)/confidentialite/page.tsx), **en source
unique**. Encart résumé sur `/refus` qui y renvoie, plutôt qu'un texte juridique
dupliqué.

**Durée retenue : 3 ans après dernier contact**, aligné sur la prospection B2B
existante. Pas de dette nouvelle créée.

## 4. Lot 2, septembre, conditionné aux demandes réellement reçues

- Bucket privé `refus` (`public = false`, patron de
  [`0002_pieces_justificatives.sql`](../supabase/migrations/0002_pieces_justificatives.sql)),
  chemin `{demande_id}/{uuid}.{ext}`, **aucune policy `anon` ni
  `authenticated`**.
- Upload et validation via
  [`file-validation.ts`](../src/lib/piece/file-validation.ts),
  [`document.ts`](../src/lib/piece/document.ts),
  [`compresser-image.ts`](../src/lib/depot/compresser-image.ts). **Inclure le
  WebP** : c'est le format des captures d'écran Android, cas fréquent pour une
  notification reçue en ligne.
- Table de liaison `refus_demandes_motifs`.
- `src/app/admin/refus` : le contrôle `getAdminEmail` est **refait sur chaque
  page et chaque Server Action** (un layout ne protège pas une Server Action).
  Ouverture de la pièce par **URL signée à courte durée**.
- Purge 30 jours : `RETENTION_FICHIER_REFUS_JOURS = 30`, fonction pure testée,
  **fichier puis ligne** de chemin, fail loud, décalque de
  [`retention.ts`](../src/lib/piece/retention.ts). Route cron protégée par
  `CRON_SECRET`, entrée dans [`vercel.json`](../vercel.json), doc dans
  `supabase/README.md` §8.
- Test **live** d'accès `anon` au bucket, sur le modèle de
  `mentions.live.test.ts`. Un test statique sur la migration vérifie qu'on n'a
  pas écrit de policy `anon`, pas que la base n'en a pas.

## 5. Ordre d'exécution du lot 1

1. Rédaction des 8 à 10 motifs.
2. Migration `0053` + `database.types.ts`.
3. Socle serveur `src/lib/refus/` + tests Vitest.
4. Pages du cluster + formulaire + aiguillage particulier.
5. SEO, maillage, sitemap.
6. `webhook.gs` + déploiement manuel Apps Script.
7. RGPD, `supabase/README.md`, `CLAUDE.md` §13.

Une étape à la fois, diff montré et validé avant de passer à la suivante.

## 6. Règles de travail

- **Pas de code mort, pas de point d'extension spéculatif.**
- Les placeholders `[À RÉDIGER : ...]` sont **interdits sur les motifs**, c'est
  le livrable. Tolérés ailleurs.
- Toute migration met à jour `database.types.ts` **dans le même commit**.
- Icônes lucide uniquement, **pas d'emoji**, typo serif Unbounded pour les
  titres, tokens de `@theme` dans `globals.css` en miroir de `pdf-theme.ts`.
- **Ne rien promettre au visiteur qui soit faux. Un refus n'est pas définitif, le
  contenu doit le dire.** Aucune formulation qui promet un résultat, un
  remboursement ou une issue favorable.

## 7. Checklist de livraison du lot 1

- [ ] 8 à 10 motifs rédigés, sources primaires archivées, relus et passés à
      `publie = true`
- [ ] `npx supabase db reset` passe de bout en bout
- [ ] `npm run test` passe (schéma Zod : cas conforme + cas de refus)
- [ ] `database.types.ts` reflète la migration `0053`
- [ ] RLS activée sans policy + `revoke` sur les deux tables neuves
- [ ] Aucun nouvel accès `anon` dans le schéma
- [ ] Bandeau d'indépendance visible sur chaque page du cluster
- [ ] Nouvelles URL présentes dans le sitemap, `/refus/merci` en `noindex`
- [ ] Maillage croisé effectif dans les deux sens avec « Refus & prévention »
- [ ] **`webhook.gs` déployé à la main dans Apps Script** et testé sur un envoi réel
- [ ] Section RGPD publiée dans `/confidentialite`, encart de renvoi sur `/refus`
