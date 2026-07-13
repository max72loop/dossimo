# Notification des leads avec Google Apps Script

Cette intégration envoie les e-mails depuis le compte Google qui déploie le
script, sans SMTP, mot de passe d'application ou fournisseur d'e-mail externe.

1. Connectez-vous à [Google Apps Script](https://script.google.com/) avec
   `max@dossimo.pro`, puis créez un projet.
2. Copiez `leads-webhook.gs` dans le fichier `Code.gs` du projet.
3. Dans **Paramètres du projet > Propriétés du script**, ajoutez
   `DOSSIMO_WEBHOOK_SECRET` avec une valeur aléatoire longue.
4. Cliquez **Déployer > Nouveau déploiement > Application Web**. Choisissez
   **Exécuter en tant que : moi**, **Qui a accès : Tout le monde**, puis
   autorisez l'accès à l'application Web. Le secret protège les appels reçus.
5. Copiez l'URL terminant par `/exec` dans la variable Vercel
   `GOOGLE_APPS_SCRIPT_WEBHOOK_URL`.
6. Ajoutez la même valeur secrète dans Vercel sous
   `GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET`, puis redéployez Dossimo.

Le script n'accepte qu'un payload `landing_lead` protégé par le secret. Il
envoie une notification à `max@dossimo.pro` et une confirmation au prospect.
