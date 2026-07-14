# Prospection par e-mail

> Campagne B2B vers les artisans RGE, expédiée depuis `max@dossimo.pro`.
> **Un seul message par artisan, aucune relance.** 40 e-mails par jour au
> plafond, montée en charge progressive, file de validation humaine avant tout
> envoi.
>
> Fenêtre de campagne : **du mercredi 15 juillet (après-midi) au vendredi 24
> juillet 2026**, pour que le message arrive avant la fin du code DOSSIMO50, le
> dimanche 26 (`src/lib/stripe/actions.ts`).

## 1. Principe directeur

Ce système n'est pas un outil d'e-mailing de masse et ne doit jamais le devenir.
Il imite un envoi manuel : **texte brut, une adresse humaine, un destinataire à
la fois, espacé dans la journée**. Ce qui trahit l'automatisation (HTML maquetté,
pixel de suivi, envoi en rafale, `no-reply@`) dégrade la délivrabilité et
transforme une boîte neuve en boîte grillée en une semaine.

Conséquences, non négociables :

- **Pas de HTML**, `text/plain` uniquement.
- **Pas de pixel de suivi.** Le taux d'ouverture n'est pas mesuré : la CNIL le
  soumet au consentement et les pixels sont un signal de spam. Seul le clic est
  journalisé, via un jeton dans le lien.
- **Prospection et transactionnel ne partagent rien.** Un signalement en spam sur
  la prospection ne doit jamais pouvoir empêcher un artisan de recevoir son pack.

## 2. Transport : le Web App Google Apps Script

L'envoi passe par le script déjà en place (`integrations/google-apps-script/`),
qui s'exécute sous le compte Workspace `max@dossimo.pro`. Pas de SMTP, pas de mot
de passe d'application, pas de dépendance supplémentaire, et un envoi signé DKIM
par Google dès que le domaine est authentifié.

Le script (`webhook.gs`) route selon `type` : `landing_lead` (existant) et
`prospection_send` (nouveau). Il pose l'en-tête `List-Unsubscribe` +
`List-Unsubscribe-Post` via le service avancé Gmail, ce qui donne à Gmail son
bouton natif « Se désabonner » : la meilleure protection contre le bouton
« Signaler comme spam », qui, lui, coûte de la réputation à tout le domaine.

Deux garde-fous côté script : il **refuse** un message dont le corps ne contient
pas le lien de désinscription (un envoi sans moyen d'opposition serait illicite),
et il tient son propre plafond quotidien, pour borner les dégâts si le secret du
webhook fuitait.

## 3. DNS à poser sur `dossimo.pro` — bloquant

Sans ces quatre enregistrements, les messages partent en indésirables.

```
MX      dossimo.pro           → enregistrements MX Google Workspace
TXT     dossimo.pro           → v=spf1 include:_spf.google.com ~all
TXT     google._domainkey     → clé DKIM 2048 bits générée dans la console Admin
TXT     _dmarc                → v=DMARC1; p=none; rua=mailto:dmarc@dossimo.pro; adkim=s; aspf=s
```

DKIM doit être **activé** dans la console Google après publication de la clé
(l'onglet « Authentifier l'e-mail » reste inactif tant qu'on ne clique pas). DMARC
démarre en `p=none` (observation), puis passe à `p=quarantine`.

Point de vigilance : `dossimo.pro` redirige en 301 vers `dossimo.app`. Les filtres
consultent le domaine d'envoi ; une vraie page servie sur `dossimo.pro` vaudrait
mieux qu'une redirection.

## 4. Montée en charge

Une boîte neuve qui envoie 40 messages le premier jour se fait classer. Le
plafond quotidien est donc calculé (`src/lib/prospection/cadence.ts`), pas fixe :

| Jour ouvré de campagne | Date | Plafond |
|---|---|---|
| 1 | mer. 15/07 | 10 |
| 2 | jeu. 16/07 | 15 |
| 3 | ven. 17/07 | 20 |
| 4 | lun. 20/07 | 30 |
| 5 et suivants | 21 → 24/07 | 40 |

Soit environ 235 artisans touchés sur la fenêtre. Le plafond haut vit dans
`prospection_campagnes.daily_cap_max` : il peut être abaissé sans redéploiement si
les bounces montent, et la rampe ne le dépasse jamais.

## 5. Modèle de données

Migration `0032_prospection.sql`. Trois garanties portées par le **schéma**, pas
par le code applicatif :

- `prospects.source` est `NOT NULL` : on ne peut pas importer une adresse sans
  savoir où on l'a trouvée (RGPD art. 14, voir §8) ;
- l'index unique `(campagne_id, prospect_id)` rend un **second envoi
  structurellement impossible** ;
- `prospection_suppressions` ne se purge jamais et est consultée avant tout
  envoi : un désinscrit reste désinscrit même si sa fiche prospect disparaît,
  sinon le prochain import le re-solliciterait.

Toutes les tables sont en RLS fermée, sans policy : la prospection est pilotée
exclusivement en service-role (routes de cron, actions admin). Aucun client, même
authentifié, n'y a accès.

## 6. Cadence

Vercel Cron ne descend pas sous une exécution par jour en plan Hobby, et une
fonction serverless ne peut pas s'étaler sur huit heures. Le tempo vient donc de
`.github/workflows/prospection.yml` :

- `GET /api/prospection/prepare` — une fois par jour ouvré à 8h15, prépare la file
  du jour en `en_attente`. Idempotent.
- `GET /api/prospection/tick` — toutes les dix minutes, envoie **au plus un
  message**, et saute un tick sur cinq au hasard pour ne pas tomber sur des
  minutes régulières.

Les deux routes exigent `Authorization: Bearer $CRON_SECRET` et se ferment
d'elles-mêmes si le secret n'est pas configuré : une route d'envoi ouverte est un
relais de spam offert au premier venu.

La fenêtre (9h30-17h30, jours ouvrés, heure de **Paris**) et le plafond sont
revérifiés à chaque tick : le planificateur peut déborder ou décaler sans
conséquence. Tout est calculé en heure de Paris, jamais en heure serveur, sinon un
envoi « 9h30 » partirait à 11h30 en été et le plafond quotidien se compterait à
cheval sur deux journées.

## 7. File de validation

`/admin/prospection` affiche les messages du jour **tels qu'ils partiront**, corps
complet, un par un. Un bouton valide tout le lot, un autre écarte un message.

`preparerFile` ne crée que des `en_attente` ; le tick n'envoie que du `valide`.
Rien ne franchit cette barrière sans un clic humain. C'est ce qui empêche qu'un
prénom mal importé (« Bonjour SARL DUPONT, ») parte chez quarante artisans.

Deux garde-fous en amont, testés : `nettoyerPrenom` refuse ce qui n'est pas un
prénom (raison sociale, chiffres, trois mots) et retombe sur « Bonjour, » ; et le
rendu **échoue** plutôt que de produire un corps contenant une variable non
substituée.

Réservation optimiste à l'envoi : le message passe en `envoye` **avant** l'appel
réseau. Si deux ticks se chevauchent, le second ne trouve plus rien. Un envoi
perdu se rejoue à la main ; un double envoi chez un artisan ne se rattrape pas.

## 8. Réponses, désinscriptions, bounces

Sans relance, il n'y a rien à annuler : les réponses et les `mailer-daemon`
arrivent dans la boîte `max@dossimo.pro` et se traitent à la main. Pas de lecture
IMAP automatique dans cette version.

**Un bounce dur doit être ajouté à la liste de suppression sans traîner** : une
adresse morte qu'on continue de solliciter est un aller simple vers le dossier
spam. C'est le seul geste manuel réellement critique de la campagne.

La désinscription, elle, est automatique et sans friction :

- lien `/desinscription/<jeton>` en pied de message, page publique, un bouton ;
- `POST /api/prospection/desinscription?token=…` pour le bouton natif de Gmail.

L'écriture passe par un POST, jamais par la simple visite du lien : les
passerelles antivirus visitent les liens des messages entrants, et un GET qui
désinscrirait aurait désinscrit l'artisan avant même qu'il ait lu le message.

## 9. Conformité (CNIL / RGPD)

La prospection B2B est permise **sans consentement préalable** à trois conditions
cumulatives : le message est en rapport avec la profession du destinataire,
l'expéditeur est clairement identifié, et un moyen d'opposition simple est fourni.
Les trois sont remplies. Base légale : **intérêt légitime**.

Mais l'adresse d'un artisan indépendant reste une donnée personnelle, et elle n'a
pas été collectée auprès de lui : l'**article 14 du RGPD** impose de lui dire, dès
le premier contact, qui traite ses données, pourquoi, **d'où vient son adresse**,
et comment s'y opposer. D'où le champ `source` obligatoire à l'import, repris
littéralement dans le pied du message.

Restent à faire, hors code :

- une section « prospection commerciale » dans la politique de confidentialité
  (finalité, base légale, source, conservation 3 ans après le dernier contact,
  droits) ;
- l'inscription du traitement au registre.

## 10. Le message

Objet en minuscules, sans « % », sans « gratuit », sans point d'exclamation :

> `Vos dossiers MaPrimeRénov', montés à votre place`

Le corps vit **en base** (`prospection_campagnes.corps`), pas dans le code : la
copie doit pouvoir être corrigée entre deux journées d'envoi sans redéploiement.
Variables : `{{salutation}}`, `{{lien_demo}}`, `{{lien_desinscription}}`,
`{{source}}`, `{{mentions_legales}}`.

Le bloc après `--` n'est pas décoratif : identité, source de l'adresse, opposition.
C'est lui qui rend l'envoi licite et qui, en pratique, transforme un signalement en
spam en simple désinscription.

Le message annonce « DOSSIMO50, jusqu'au 26 juillet », sans date de début : le code
est actif depuis son introduction et expire le 26 (`src/lib/stripe/actions.ts`).
Annoncer une ouverture au 21 aurait retardé la campagne d'une semaine et empêché
toute montée en charge avant la fin de la promo.

## 11. Mise en route

Dans l'ordre, avant le premier envoi :

1. **DNS** (§3) : SPF, DKIM activé, DMARC sur `dossimo.pro`.
2. **Apps Script** : déployer `webhook.gs`, activer le service avancé Gmail,
   renseigner `GOOGLE_APPS_SCRIPT_WEBHOOK_URL` et `…_SECRET` dans Vercel.
3. **Migration** : `npx supabase db push` (crée les tables et la campagne).
4. **Secrets GitHub** du dépôt : `CRON_SECRET` (identique à Vercel) et `SITE_URL`
   (`https://dossimo.app`).
5. **Import** de la liste dans `/admin/prospection`, en renseignant d'où viennent
   les adresses.
6. **Préparer la file**, relire les dix messages, valider. Les envois s'étalent
   ensuite tout seuls jusqu'à 17h30.
7. **Test à blanc** recommandé : importer d'abord votre propre adresse, préparer,
   valider, vérifier le message reçu (mise en page, lien de désinscription, bouton
   natif Gmail) avant d'importer la vraie liste.

## 12. Reste à trancher

- Qualité de la liste : au-delà de 3 % d'adresses invalides, une validation
  syntaxe + MX avant import devient nécessaire.
- Page d'accueil réelle sur `dossimo.pro` plutôt qu'une redirection 301.
- Le message est long pour de la prospection froide. Une version resserrée de
  moitié se teste facilement en modifiant `prospection_campagnes.corps` en cours
  de campagne.
