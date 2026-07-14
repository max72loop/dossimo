# Envoi d'e-mails avec Google Apps Script

Cette intégration envoie les e-mails depuis le compte Google qui déploie le
script, sans SMTP, mot de passe d'application ni fournisseur externe. Un seul
script, `webhook.gs`, sert deux usages :

- `landing_lead` : notification interne + confirmation au prospect qui laisse ses
  coordonnées sur la landing ;
- `prospection_send` : un message de prospection, envoyé à un artisan.

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

## Garde-fous

Le script refuse tout message de prospection dont le corps ne contient pas le
lien de désinscription qu'on lui passe : un envoi de prospection sans moyen
d'opposition serait illicite, et c'est ici le dernier point de contrôle avant
Gmail.

Il tient aussi son propre compteur quotidien (`PLAFOND_QUOTIDIEN`, 60). Le rythme
réel (40/jour, montée en charge comprise) est piloté par l'application ; ce
plafond-ci n'existe que pour borner les dégâts si le secret du webhook fuitait,
car la boîte deviendrait alors un relais de spam ouvert.
