# Supabase — la base de données Dossimo

Document de référence du back-end. **À lire avant d'écrire la moindre migration.**
Le modèle de données est décrit dans `CLAUDE.md` §7 ; ce fichier décrit la
mécanique, les pièges, et l'histoire des incidents qui expliquent pourquoi
certaines choses sont écrites comme elles le sont.

---

## 1. Les cinq règles

1. **Jamais l'éditeur SQL de Supabase pour appliquer une migration.** Toujours
   `npx supabase db push`. Une migration passée à la main est appliquée sans être
   enregistrée : l'historique ment, et la réparation coûte dix fois le temps
   gagné. C'est exactement ce qui a détruit `0025` (voir §5).
2. **Migrations additives une fois en prod.** Pas de `DROP` sans plan écrit. Pour
   retirer une règle métier, la passer `actif = false` : la table `regles_metier`
   a un drapeau et un numéro de version faits pour ça, s'en servir plutôt que de
   `delete` (ce que `0008` a fait, et la règle est perdue).
3. **Ne jamais réécrire une migration déjà appliquée.** Créer la suivante. Le
   numéro est enregistré chez le distant : le modifier fait diverger local et
   prod.
4. **Avant tout `create or replace function`, lire la version COURANTE de la
   fonction**, pas la migration qui l'a créée. Trois régressions du projet
   viennent de là (§5).
5. **Une bonne pratique s'applique partout, pas à un endroit.** C'est le défaut
   récurrent de ce schéma : `revoke` des grants, `pg_temp` en fin de
   `search_path`, `source not null`, grants par colonne — chaque idée a été
   trouvée puis appliquée à une seule table. Si vous corrigez un motif, cherchez
   ses jumeaux (`grep`) et corrigez-les aussi, ou notez pourquoi non.

## 2. Commandes

```bash
npx supabase migration new <nom>   # nouvelle migration (numérotée)
npx supabase db push               # applique les migrations au projet lié
npx supabase db reset              # rejoue TOUT l'historique en local
npm run test                       # les règles métier ont des tests, les lancer
```

`db reset` est le test de vérité de l'historique : s'il casse, le schéma n'est
plus reproductible et un nouvel environnement (CI, nouveau poste, restauration)
est impossible à monter. **Le faire tourner après toute migration.**

## 3. Carte du schéma

27 tables dans `public`, six domaines.

| Domaine | Tables | Migrations |
|---|---|---|
| Cœur dossiers | `artisans`, `dossiers`, `regles_metier`, `pieces_justificatives`, `leads`, `plafonds_ressources`, `obliges`, `retours_depot` | 0001-0003, 0017, 0020 |
| Pricing / parrainage | `pricing_tiers`, `referrals`, `referral_credits`, `credit_applications` | 0012, 0013, 0015 |
| Facturation | `factures`, `facture_compteurs`, `paiements` | 0001, 0014 |
| Dépôt bénéficiaire | `liens_depot`, `reminder_schedules`, `reminder_logs` | 0017, 0026-0029, 0041 |
| Devis | `quote_gestures`, `quote_gesture_fields`, `quote_templates`, `generated_quotes`, `user_quote_templates` | 0021-0023, 0028 |
| Prospection | `prospection_campagnes`, `prospects`, `prospection_messages`, `prospection_evenements`, `prospection_suppressions`, `prospects_dossimo` | 0032-0034, 0037, 0039 |
| Sécurité | `auth_rate_limits` | 0030, 0036 |

**Aucune vue.** Tous les agrégats sont faits en TypeScript.

### Deux pièges de nommage à connaître

- **`dossiers.statut` ET `dossiers.status`** coexistent, à une lettre près.
  `statut` = parcours métier (`statut_dossier`), `status` = facturation
  (`dossier_billing_status`). Rien ne les tient cohérents. Lire deux fois.
- **L'ordre de l'enum `statut_dossier` ne suit pas le parcours métier.** `0007` a
  ajouté `pret_depot` et `depose` en fin d'enum, donc l'ordre de tri physique est
  `nouveau < en_traitement < livre < pret_depot < depose`, alors que le parcours
  réel est `nouveau → en_traitement → pret_depot → depose → livre`. **Ne jamais
  faire `order by statut` ni `statut > 'x'`** : trier dans le code.

## 4. Sécurité — le modèle

**Toutes les tables ont RLS activé.** Trois profils :

- **RLS + policy propriétaire** : l'artisan voit ses lignes, via
  `artisan_id in (select id from artisans where user_id = auth.uid())`.
- **RLS + policy de lecture** sur les référentiels (`regles_metier`,
  `pricing_tiers`, `plafonds_ressources`, `obliges`, `quote_*`).
- **RLS SANS policy** = service-role uniquement. C'est **intentionnel** pour
  `leads`, `prospects*`, `facture_compteurs`, `auth_rate_limits`. Une table sans
  policy n'est pas une table oubliée.

Un seul accès `anon` dans tout le schéma : `pricing_tiers` en lecture
(`0015`), pour que la vitrine et le checkout lisent la même grille.

### Ce qu'il faut savoir avant d'écrire du SQL

- **Supabase accorde `grant all` à `anon`/`authenticated` par défaut sur
  `public`.** La RLS seule ferme la porte. Ajouter un `revoke all ... from anon,
  authenticated` en ceinture sur toute table de données personnelles.
- **Une policy borne la LIGNE, pas la COLONNE.** `0031` a dû corriger une faille
  où un artisan réécrivait son propre `credit_balance_cents` via PostgREST : la
  policy l'autorisait sur sa ligne. Le correctif est `revoke update` + `grant
  update (col, col, ...)`. Appliqué à `artisans` (`0031`) **et à `dossiers`
  (`0045`, 7 colonnes ouvertes, tout le reste verrouillé)**.
- **`SECURITY DEFINER` contourne la RLS** : la fonction doit revérifier la
  propriété elle-même. Toutes celles du projet le font, garder l'habitude.
- **`set search_path = public, pg_temp` sur toute `SECURITY DEFINER`.** Si
  `pg_temp` n'est pas mentionné, il est cherché **en premier** : un appelant peut
  créer `pg_temp.artisans` et détourner la fonction. Le mettre en **dernier**.
  Ajouter `extensions` si la fonction touche pgcrypto (`gen_random_bytes`).
- **`revoke ... from public` retire aussi le droit à `service_role`**, qui n'est
  pas superutilisateur. Toujours faire le couple `revoke` **puis**
  `grant execute ... to service_role`. `0014` avait oublié le second (corrigé en
  `0040`).
- Après un changement de droits, `notify pgrst, 'reload schema';` — PostgREST met
  le schéma en cache.

## 5. Les incidents, et ce qu'ils ont appris

À lire : ils expliquent des fichiers qui paraissent absurdes.

### `0024` et `0025` ne sont pas du SQL (réparés le 2026-07-16)

`0024` contenait `c'est bon`, `0025` contenait un message d'erreur PostgreSQL,
tous deux collés par accident depuis l'éditeur SQL. `db reset` cassait en erreur
de syntaxe : **l'historique entier était irrejouable.** Les deux sont désormais
des no-op documentés. On ne les a ni supprimés ni renumérotés parce que la prod a
déjà leurs numéros enregistrés. Le contenu réel de `0025` vit dans `0027`.

### `0030` enregistrée sans être exécutée → auth cassée

`0030` figurait dans `schema_migrations` sans avoir jamais tourné. Ni la table
`auth_rate_limits` ni la fonction `consume_auth_rate_limit` n'existaient ; le
rate-limit échouant **en mode fermé**, plus personne ne pouvait se connecter.
`0036` la rejoue. **Leçon : « c'est écrit dans une migration » ne veut pas dire
« c'est en base ».** Vérifier.

### La chaîne 0034 → 0036 → 0038 → 0040 : `create or replace` écrase en silence

1. `0034` ajoute `source` à `handle_new_artisan_user` (attribution d'acquisition).
2. `0036` répare le rate-limit en « rejouant 0030 à l'identique » → recrée la
   fonction **sans `source`**. La 0034 est perdue, sans erreur.
3. `0038` répare le `search_path` en repartant de la version 0036 → toujours sans
   `source`. L'attribution était morte depuis deux migrations.
4. `0040` restaure `source` **et** le `search_path` ensemble.

**Leçon (règle 4) : avant un `create or replace`, lire l'état courant de la
fonction, pas la migration d'origine.** Deux réparations successives ont détruit
une fonctionnalité que personne ne surveillait.

### La révocation du lien de dépôt ne révoquait rien (corrigé en `0041`)

Le token était dérivé du seul `dossier_id` : un seul token possible par dossier,
pour toujours. Révoquer puis regénérer ressuscitait l'URL fuitée, qui donne accès
à un avis d'imposition, un RIB et une pièce d'identité. Corrigé par un **nonce**
stocké dans `liens_depot`, neuf à chaque nouveau lien. Voir `src/lib/depot/lien.ts`.

### `prospects_dossimo` vivait hors migrations (corrigé en `0039`)

La table était créée à la main ; `0033` et `0037` ne faisaient qu'y ajouter des
colonnes, en s'auto-ignorant si elle était absente. La prod marchait, tout
environnement neuf cassait. `0039` la crée dans sa forme finale, après elles.
**Leçon : si le code interroge une table, une migration doit la créer.**

## 6. Dérive de conventions — l'état des lieux

Le schéma a deux âges. Ni l'un ni l'autre n'est « faux » ; il faut juste savoir
lequel on lit.

| | 0001-0020 | 0021-0041 |
|---|---|---|
| Langue | français (`dossiers`, `liens_depot`) | anglais (`quote_gestures`, `reminder_logs`) |
| Énumérations | vrais `create type ... as enum` | `text` + `check` |
| Idempotence | `if not exists` systématique | irrégulier (`0021`, `0028` créent nu) |
| `auth.uid()` | `(select auth.uid())` (optimisé) | `auth.uid()` nu (réévalué par ligne) |

**Pour une nouvelle migration** : `create table if not exists`,
`drop policy if exists` avant `create policy`, `(select auth.uid())` dans les
policies, argent en **cents (integer)**, et `text + check` pour les
énumérations (un `alter type ... add value` ne peut pas être annulé dans une
transaction, l'enum est un piège à long terme).

## 7. Les types TypeScript

`src/lib/database.types.ts` est **écrit à la main**. Il n'y a pas de script de
régénération, donc **rien n'empêche mécaniquement la dérive** — c'est ce qui a
laissé le catalogue de `nl-query.ts` ignorer 2 statuts sur 5 pendant 31
migrations.

**Toute migration qui touche une colonne doit mettre ce fichier à jour dans le
même commit.** La régénération officielle serait :

```bash
npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
```

mais elle écraserait les commentaires métier du fichier, qui ont de la valeur.
Tant qu'on maintient à la main : le faire, sérieusement.

## 8. Dette connue, non traitée

À prendre au sérieux, ce n'est pas une liste de souhaits.

- **Purge des pièces justificatives : faite** (cron `/api/cron/purge-pieces`,
  logique `src/lib/piece/retention.ts`). La purge passe par le service-role, pas
  par une migration : le SQL de Supabase ne peut pas supprimer un objet du bucket
  `pieces`, donc un `delete` en base laisserait le fichier orphelin. Fenêtres de
  rétention (90 j après livraison, plafond 180 j) **à faire valider juridiquement**.
- **Le bénéficiaire n'a aucun droit exerçable** : il dépose ses pièces via une
  URL et n'existe pas en base. Ni accès, ni rectification, ni effacement.
- **Son nom est figé à vie** dans `factures.lignes_json`, que le trigger
  `factures_immuables` protège de tout UPDATE, y compris en service-role.
- **Pas de purge** de `leads`, `prospects`, `auth_rate_limits` (CNIL : ~3 ans
  après dernier contact en prospection B2B).
- **`expire_old_credits` n'est câblée à aucun cron** : `credit_balance_cents`
  dérive dès qu'un crédit expire.
- **FK sans index** : `dossiers.tier_id`, `generated_quotes.*`,
  `referrals.referee_first_dossier_id`.
- **`paiements.montant` est un `numeric`** alors que la convention est « argent en
  cents (integer) » ; `emettre_facture` reconvertit (`round(montant * 100)`), au
  point exact où la loi exige l'exactitude.
- **`reminder_logs` est du code mort** (aucune écriture) ; `leads` est écrite mais
  jamais lue par l'app.

## 9. Checklist avant d'ouvrir une PR qui touche la base

- [ ] `npx supabase db reset` passe de bout en bout
- [ ] `npm run test` passe (chaque règle dure a un cas conforme + un cas de refus)
- [ ] `src/lib/database.types.ts` reflète le changement
- [ ] RLS activée sur toute table neuve, + `revoke` si données personnelles
- [ ] `search_path` avec `pg_temp` en dernier sur toute `SECURITY DEFINER`
- [ ] `revoke` accompagné de son `grant ... to service_role`
- [ ] Aucun `create or replace function` écrit sans avoir lu l'état courant
- [ ] Le seuil / prix / barème ajouté vit dans `regles_metier` ou `pricing_tiers`,
      pas dans un composant (CLAUDE.md §10 et §11)
