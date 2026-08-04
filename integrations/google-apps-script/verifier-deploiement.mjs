/**
 * Vérifie que le déploiement Apps Script en ligne correspond bien à `webhook.gs`.
 *
 * Pourquoi ce script existe : le code de l'application et le script Apps Script
 * vivent dans deux mondes séparés. Ajouter un `type` dans `webhook.gs` et
 * pousser sur Vercel ne déploie RIEN côté Google : il faut recoller le fichier
 * dans l'éditeur et republier à la main. Tant que ce n'est pas fait, le script
 * répond `unsupported_type`, l'application journalise l'erreur et renvoie quand
 * même « c'est bien arrivé » à l'artisan (l'envoi d'e-mail n'est jamais
 * bloquant). Autrement dit : l'écran ment sans que personne le voie.
 *
 * Deux étapes, dans cet ordre :
 *
 *   1. sonde (par défaut) : envoie un `type` volontairement inconnu. Aucun
 *      e-mail ne part. Valide l'URL et le secret.
 *   2. `--envoyer <email>` : envoie une VRAIE demande de refus. Deux e-mails
 *      partent alors (notification interne + confirmation à l'adresse donnée).
 *      C'est la seule preuve que le handler `refus_demande` est déployé.
 *
 * Usage (PowerShell) :
 *   $env:GOOGLE_APPS_SCRIPT_WEBHOOK_URL="https://script.google.com/.../exec"
 *   $env:GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET="..."
 *   node integrations/google-apps-script/verifier-deploiement.mjs
 *   node integrations/google-apps-script/verifier-deploiement.mjs --envoyer max@dossimo.pro
 *
 * Les valeurs de production se récupèrent dans Vercel > Settings > Environment
 * Variables. Ne les écrivez nulle part sur le disque.
 */

const url = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL;
const secret = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET;

if (!url || !secret) {
  console.error(
    "GOOGLE_APPS_SCRIPT_WEBHOOK_URL et GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET doivent être définis.",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const indexEnvoyer = args.indexOf("--envoyer");
const destinataire = indexEnvoyer === -1 ? null : args[indexEnvoyer + 1];

if (indexEnvoyer !== -1 && !destinataire) {
  console.error("--envoyer attend une adresse e-mail de destination.");
  process.exit(1);
}

/**
 * Le script Apps Script répond toujours 200 avec un corps JSON : `ok` porte le
 * verdict, pas le code HTTP. Une redirection vers une page de connexion Google
 * (déploiement mal réglé) renvoie du HTML, d'où le repli sur le texte brut.
 */
async function appeler(payload) {
  const reponse = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret, ...payload }),
    redirect: "follow",
  });
  const texte = await reponse.text();
  try {
    return { statut: reponse.status, corps: JSON.parse(texte) };
  } catch {
    return { statut: reponse.status, corps: null, texte: texte.slice(0, 200) };
  }
}

/* --- Étape 1 : la sonde, sans e-mail --- */

const sonde = await appeler({ type: "__sonde_deploiement__" });

if (sonde.corps === null) {
  console.error(`✗ Réponse non JSON (HTTP ${sonde.statut}). Extrait : ${sonde.texte}`);
  console.error(
    "  Le déploiement n'est probablement pas en « Qui a accès : Tout le monde ».",
  );
  process.exit(1);
}
if (sonde.corps.error === "unauthorized") {
  console.error("✗ Secret refusé : DOSSIMO_WEBHOOK_SECRET côté Apps Script ne correspond pas.");
  process.exit(1);
}
if (sonde.corps.error !== "unsupported_type") {
  console.error(`✗ Réponse inattendue à la sonde : ${JSON.stringify(sonde.corps)}`);
  process.exit(1);
}

console.log("✓ URL joignable et secret accepté.");

if (!destinataire) {
  console.log(
    "\nLa sonde ne dit PAS si le handler `refus_demande` est déployé : un ancien\n" +
      "script répond exactement pareil sur un type inconnu. Pour trancher :\n" +
      "  node integrations/google-apps-script/verifier-deploiement.mjs --envoyer <votre-email>\n" +
      "Deux e-mails partiront réellement.",
  );
  process.exit(0);
}

/* --- Étape 2 : une vraie demande de refus, deux e-mails --- */

const essai = await appeler({
  type: "refus_demande",
  email: destinataire,
  telephone: "—",
  aide: "cee",
  geste: "Test de déploiement",
  date_notification: "—",
  motif_libre:
    "Message de test envoyé par verifier-deploiement.mjs. Aucune demande réelle, rien n'a été écrit en base.",
  utm_source: "verification",
  utm_medium: "script",
  utm_campaign: "deploiement",
});

if (essai.corps?.ok === true) {
  console.log(`✓ Handler \`refus_demande\` déployé. Deux e-mails envoyés (dont un à ${destinataire}).`);
  process.exit(0);
}

if (essai.corps?.error === "unsupported_type") {
  console.error(
    "✗ Handler `refus_demande` ABSENT du déploiement en ligne.\n" +
      "  Les demandes déposées sur /refus sont bien enregistrées en base, mais ni la\n" +
      "  notification interne ni la confirmation à l'artisan ne partent.\n" +
      "  Correctif : recoller webhook.gs dans l'éditeur Apps Script, puis\n" +
      "  Déployer > Gérer les déploiements > modifier > Nouvelle version.",
  );
  process.exit(1);
}

console.error(`✗ Échec de l'envoi : ${JSON.stringify(essai.corps)}`);
process.exit(1);
