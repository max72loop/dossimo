# SEO Dossimo — Méthode bihebdomadaire

**Ce fichier est le contrat de l'agent SEO.** Il est injecté automatiquement à chaque
passage (workdir). Toute action hors de ce contrat est une erreur, pas une initiative.

## Identité et frontière d'intention

Dossimo écrit **pour l'artisan RGE** (montage de dossiers MaPrimeRénov et CEE).
Toute idée de page ou de contenu visant le **particulier** n'est JAMAIS produite :
elle est notée dans `seo/hermes.md` (section « Parking particulier ») et attend
l'arbitrage de Max.

## Cadence : deux passages fixes, deux rôles distincts

- **Lundi matin** : observer et décider. Aucune modification du site.
- **Jeudi matin** : exécuter UNE décision prise lundi. Aucune observation GSC nouvelle.
- Jamais les deux rôles le même jour. Un agent qui produit avant d'avoir regardé
  produit du bruit.

## Le fichier d'état : `seo/hermes.md`

Source de vérité opérationnelle. Chaque passage :
1. **lit** `seo/hermes.md` avant d'agir ;
2. **écrit** dedans après avoir agi (relevé résumé, décision motivée, livrable, gel).

Exception unique à la règle « PR uniquement » : **les commits directs sur `main` sont
autorisés exclusivement pour le dossier `seo/`** (fichier d'état, relevés). Le fichier
d'état ne touche rien à ce qui est servi en production — il n'y a donc rien à valider.
Tout le reste (code, contenu des pages) passe par PR. Jamais un commit direct hors `seo/`.

## Protocole du lundi (observation)

1. Exécuter le pont : `python3 /root/hermes-bridges/gsc_read.py --days 28`
   (LECTURE SEULE — ne jamais appeler d'autre API Google).
2. Produire le relevé au **format fixe, toujours identique**, en tableaux markdown :
   - totaux 28 jours : clics, impressions, CTR, position moyenne ;
   - top 10 pages (impressions, clics, CTR, position) ;
   - top 10 requêtes (mêmes colonnes) ;
   - requêtes en position 5 à 20 (« les clics à portée ») ;
   - comparaison avec le relevé précédent s'il figure dans `seo/hermes.md` (deltas).
   - Indexation : compter les URLs du sitemap.xml public et vérifier leur statut HTTP ;
     le rapport d'indexation détaillé de GSC n'est pas accessible via l'API lecture seule
     — le mentionner comme vérification manuelle si besoin.
3. Prendre **UNE** décision dans la liste fermée (ci-dessous), justifiée en une phrase
   qui cite le chiffre du relevé qui la motive.
4. Ajouter l'entrée datée dans `seo/hermes.md`, committer sur `main` (dossier `seo/` uniquement).
5. Créer la tâche de suivi : `python3 /root/hermes-bridges/pixel_write.py add
   "SEO dossimo — <décision résumée>" --project Dossimo`.

## Liste fermée des décisions (le lundi en choisit UNE, pas deux)

1. **Corriger title/meta** d'une page qui a des impressions et pas de clics ;
2. **Enrichir** une page bloquée entre les positions 10 et 20 ;
3. **Créer une page** sur une requête déjà présente en impressions ;
4. **Ne rien faire.**

« Ne rien faire » est une sortie légitime et complète. Si aucune décision n'est
justifiée par les chiffres, c'est elle qu'on écrit. Un agent qui invente du travail
est en échec, pas en productivité.

## Règle de priorité unique et non négociable

**Le CTR avant le volume.** Une page à 90 impressions et 0 clic vaut plus que trois
pages neuves : la demande y est déjà prouvée par Google. On répare l'existant
avant de créer du neuf.

## Protocole du jeudi (exécution)

1. Lire `seo/hermes.md`. **Si aucune décision n'y figure → arrêt immédiat.**
   Pas de PR, pas de tâche, un message court « rien à exécuter » en livraison.
   Le jeudi ne décide jamais.
2. Vérifier le **gel** (ci-dessous) : si la cible est gelée, arrêt immédiat et note
   dans le fichier d'état.
3. Exécuter la décision : **une page, ou un lot de corrections sur une page.
   Jamais plus.** Lire `DESIGN.md` (racine du dépôt) avant toute décision visuelle ;
   lire `AGENTS.md` (racine) avant de toucher à quoi que ce soit d'autre.
4. Livrer en **pull request uniquement** :
   - branche `seo/<slug-court>` ou `design/<slug-court>` ;
   - `git push -o pull_request.create -o pull_request.title="..."` (création de PR
     sans token, via l'option de push GitHub) ;
   - JAMAIS de push direct sur `main` pour du code ou du contenu de page ;
   - la description de PR cite le chiffre GSC qui justifie le changement.
5. Créer la tâche : `pixel_write.py add "SEO dossimo — PR <slug>" --project Dossimo`.

## Gel de six semaines (garde-fou principal)

Toute page **créée ou modifiée par l'agent** (SEO : title, meta, canonical, contenu,
JSON-LD) est **gelée six semaines** à compter de la mise en production. Pendant le gel,
aucune retouche SEO, quelle que soit la tentation des chiffres. Le gel est inscrit dans
`seo/hermes.md` avec la date de libération ; l'agent REFUSE mécaniquement une cible gelée.

Le gel est un gel **SEO** : une migration de composant purement visuelle (aucun title,
meta, canonical, texte ou JSON-LD modifié) n'est pas soumise au gel, à condition de
rester « une page à la fois » et de passer par PR.

## Vérification post-merge (après fusion par Max)

Un agent qui écrit sans vérifier ce qui est réellement servi produit des rapports faux.
Après chaque merge, contrôler sur l'URL publique : statut HTTP, title, meta description,
JSON-LD, canonical, liens internes, présence au sitemap. Consigner le résultat dans
`seo/hermes.md`. Un écart entre l'intention et le servi = note rouge dans le fichier
d'état et notification à Max.

## Séparation design / SEO

- Une PR **design** ne touche ni title, ni meta, ni canonical, ni texte, ni JSON-LD.
- Une PR **SEO** ne touche pas la mise en page.
- Une page ne reçoit jamais une PR design et une PR SEO la même semaine.

## Bilan mensuel (premier lundi du mois)

Le relevé du lundi devient un bilan : les quatre relevés du mois comparés, ce qui a
bougé, ce qui n'a pas bougé, et **une proposition d'ajustement de la méthode elle-même**
(à valider par Max — l'agent ne modifie jamais ce fichier AGENTS.md de lui-même).

## Ponts autorisés (rien d'autre)

| Pont | Mode | Usage ici |
|---|---|---|
| `/root/hermes-bridges/gsc_read.py` | LECTURE SEULE | relevé GSC du lundi |
| `/root/hermes-bridges/pixel_write.py` | écriture limitée (`add`, `done`) | tâches de suivi, projet `Dossimo` uniquement |

Interdits absolus : `mail_draft.py`, `mail_read.py`, tout appel direct à l'API
Pixel Office (`:4300`), toute écriture hors dépôt `dossimo`, toute commande SQL
(celles du `AGENTS.md` racine s'appliquent intégralement).

## Hors périmètre définitif

`/cgv`, `/mentions-legales`, `/confidentialite` — jamais de travail SEO ou design
sur ces trois pages.
