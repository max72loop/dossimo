# Envoi d'e-mails avec Google Apps Script

Cette intégration envoie les e-mails depuis le compte Google qui déploie le
script, sans SMTP, mot de passe d'application ni fournisseur externe. **Tout
l'e-mail sortant de Dossimo passe par ici**, à la seule exception des messages
d'authentification, expédiés par Supabase Auth. Un seul script, `webhook.gs`,
sert trois usages :

- `landing_lead` : notification interne + confirmation au prospect qui laisse ses
  coordonnées sur la landing ;
- `prospection_send` : un message de prospection, envoyé à un artisan ;
- `refus_demande` : notification interne + confirmation à l'artisan qui dépose
  une demande de diagnostic sur `/refus`.

Un projet Apps Script n'a qu'un seul `doPost`. Ne déployez donc **que**
`webhook.gs` : il route selon le champ `type`.

## Déploiement

1. Connectez-vous à [Google Apps Script](https://script.google.com/) avec
   `max@dossimo.pro`, puis créez un projet.
2. Copiez `webhook.gs` dans le fichier `Code.gs` du projet.
3. **Éditeur > Services > + > Gmail API** : ajoutez le service avancé Gmail.
   Il est nécessaire pour poser l'en-tête `List-Unsubscribe` (le bouton natif
   « Se désabonner » de Gmail). Sans lui, le script retombe sur `MailApp` et
   l'envoi part quand même, mais sans cet en-tête.
4. Dans **Paramètres du projet > Propriétés du script**, ajoutez
   `DOSSIMO_WEBHOOK_SECRET` avec une valeur aléatoire longue.
5. **Déployer > Nouveau déploiement > Application Web**. Choisissez
   **Exécuter en tant que : moi**, **Qui a accès : Tout le monde**, puis
   autorisez l'accès. Le secret protège les appels reçus.
6. Copiez l'URL terminant par `/exec` dans la variable Vercel
   `GOOGLE_APPS_SCRIPT_WEBHOOK_URL`, et la même valeur secrète dans
   `GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET`. Redéployez Dossimo.

Ne lancez pas `doPost` avec le bouton **Exécuter** de l'éditeur : ce bouton
n'envoie pas de requête HTTP.

## Après CHAQUE modification de `webhook.gs`

Coller le fichier ne suffit pas. Il faut **Déployer > Gérer les déploiements >
crayon > Version : Nouvelle version > Déployer**, sinon l'URL `/exec` continue de
servir l'ancien code, indéfiniment.

C'est le piège central de cette intégration : le dépôt et le déploiement en ligne
peuvent diverger sans qu'aucun test, aucun build et aucun écran ne s'en aperçoive.
Un `type` ajouté ici et pas là-bas reçoit `unsupported_type` ; l'application
journalise l'erreur mais répond quand même « votre demande est bien arrivée »,
parce que l'envoi d'e-mail n'est jamais bloquant (c'est voulu : on ne perd pas une
demande à cause du courrier). Le message ne part simplement jamais.

## Vérifier ce qui est réellement en ligne

```bash
# Valeurs à prendre dans Vercel > Settings > Environment Variables, jamais sur disque.
GOOGLE_APPS_SCRIPT_WEBHOOK_URL=... GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET=... \
  node integrations/google-apps-script/verifier-deploiement.mjs
```

La sonde valide l'URL et le secret sans envoyer un seul e-mail. Elle ne dit pas
quels `type` sont déployés : un vieux script répond pareil sur un type inconnu.
Pour trancher sur un handler, il faut un envoi réel :

```bash
node integrations/google-apps-script/verifier-deploiement.mjs --envoyer max@dossimo.pro
```

Deux e-mails partent alors pour de bon. `ok: true` = handler en ligne,
`unsupported_type` = le déploiement est en retard sur le dépôt.

## Le secret manque en Preview

`GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET` n'est défini que sur l'environnement
Production. Le code exige les deux variables : sur un déploiement de preview, les
formulaires enregistrent bien en base mais n'envoient aucun e-mail (avertissement
en journal). Tester un formulaire sur une preview ne prouve donc rien sur les
e-mails.

## Garde-fous

Le script refuse tout message de prospection dont le corps ne contient pas le
lien de désinscription qu'on lui passe : un envoi de prospection sans moyen
d'opposition serait illicite, et c'est ici le dernier point de contrôle avant
Gmail.

Il tient aussi son propre compteur quotidien (`PLAFOND_QUOTIDIEN`, 60). Le rythme
réel (40/jour, montée en charge comprise) est piloté par l'application ; ce
plafond-ci n'existe que pour borner les dégâts si le secret du webhook fuitait,
car la boîte deviendrait alors un relais de spam ouvert.
