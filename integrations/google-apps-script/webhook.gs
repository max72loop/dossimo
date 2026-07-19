/**
 * Envoi des messages de prospection Dossimo, depuis le compte Google Workspace
 * max@dossimo.pro. À coller dans le MÊME projet Apps Script que les leads : le
 * routeur ci-dessous dispatche selon `type`.
 *
 * Deux choses que ce script fait et que MailApp seul ne sait pas faire :
 *
 *  1. l'en-tête `List-Unsubscribe` + `List-Unsubscribe-Post` (RFC 8058), qui donne
 *     à Gmail son bouton natif « Se désabonner ». C'est la meilleure protection
 *     contre le bouton « Signaler comme spam », qui coûte de la réputation à tout
 *     le domaine ;
 *  2. un plafond quotidien côté script. Si le secret du webhook fuitait, la boîte
 *     deviendrait un relais de spam ouvert. Le plafond borne les dégâts.
 *
 * Prérequis : activer le service avancé Gmail (Éditeur > Services > Gmail API).
 * Sans lui, on retombe sur MailApp, sans l'en-tête (dégradé, mais l'envoi part).
 */

var PLAFOND_QUOTIDIEN = 60; // marge au-dessus des 40 pilotés par l'application
var EXPEDITEUR = "Max Landry";
// Adresse expéditrice, en dur. On ne peut PAS la déduire via
// Session.getEffectiveUser() : dans une web app en accès « Tout le monde »,
// Google interdit cet appel (confidentialité) et le script plante avant l'envoi.
// Le script tourne sous ce compte de toute façon ; Gmail n'enverra que sous lui.
var EXPEDITEUR_EMAIL = "max@dossimo.pro";

function doPost(event) {
  try {
    if (!event || !event.postData || !event.postData.contents) {
      return jsonResponse({ ok: false, error: "missing_post_data" });
    }

    var payload = JSON.parse(event.postData.contents || "{}");
    var expectedSecret = PropertiesService.getScriptProperties()
      .getProperty("DOSSIMO_WEBHOOK_SECRET");

    if (!expectedSecret || payload.secret !== expectedSecret) {
      return jsonResponse({ ok: false, error: "unauthorized" });
    }

    if (payload.type === "landing_lead") {
      return envoyerNotificationLead(payload);
    }
    if (payload.type === "prospection_send") {
      return envoyerProspection(payload);
    }
    return jsonResponse({ ok: false, error: "unsupported_type" });
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: "internal_error" });
  }
}

function envoyerProspection(payload) {
  var to = String(payload.to || "").trim();
  var subject = String(payload.subject || "").trim();
  var body = String(payload.body || "");
  var html = String(payload.html || "");
  var unsubscribeUrl = String(payload.unsubscribeUrl || "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return jsonResponse({ ok: false, error: "invalid_recipient" });
  }
  if (!subject || !body) {
    return jsonResponse({ ok: false, error: "empty_message" });
  }
  // Un corps de prospection sans lien de désinscription serait illicite. Le refus
  // est ici volontairement dur : c'est le dernier point de contrôle avant Gmail.
  if (!unsubscribeUrl || body.indexOf(unsubscribeUrl) === -1) {
    return jsonResponse({ ok: false, error: "missing_unsubscribe" });
  }
  if (!plafondDisponible()) {
    return jsonResponse({ ok: false, error: "daily_cap_reached" });
  }

  // On tente l'envoi brut (avec en-tête List-Unsubscribe), et à défaut on
  // retombe sur MailApp. Si les DEUX échouent, on renvoie le détail des erreurs
  // plutôt qu'un « internal_error » muet : c'est la seule façon de diagnostiquer
  // un envoi qui ne part pas sans fouiller les journaux Apps Script.
  var erreurs = [];
  var envoye = false;
  try {
    envoyerBrutAvecEnTetes(to, subject, body, html, unsubscribeUrl);
    envoye = true;
  } catch (erreurGmail) {
    erreurs.push("gmail: " + erreurGmail);
    try {
      var options = {
        to: to,
        replyTo: EXPEDITEUR_EMAIL,
        name: EXPEDITEUR,
        subject: subject,
        body: body,
      };
      if (html) options.htmlBody = html;
      MailApp.sendEmail(options);
      envoye = true;
    } catch (erreurMailApp) {
      erreurs.push("mailapp: " + erreurMailApp);
    }
  }

  if (!envoye) {
    return jsonResponse({ ok: false, error: "send_failed", detail: erreurs.join(" | ") });
  }

  incrementerCompteur();
  return jsonResponse({ ok: true });
}

/**
 * Message RFC 822 brut : seul moyen de poser des en-têtes personnalisés.
 * Avec `html`, on part en multipart/alternative (texte + HTML) ; sans, en texte
 * seul. La partie texte vient en premier, la HTML en second : un client affiche
 * la DERNIÈRE partie qu'il sait rendre, donc le HTML là où c'est possible, le
 * texte en repli.
 */
function envoyerBrutAvecEnTetes(to, subject, body, html, unsubscribeUrl) {
  var from = EXPEDITEUR_EMAIL;
  var entetes = [
    "From: " + EXPEDITEUR + " <" + from + ">",
    "To: " + to,
    "Subject: " + encoderSujet(subject),
    "MIME-Version: 1.0",
    "List-Unsubscribe: <" + unsubscribeUrl + ">, <mailto:" + from + "?subject=STOP>",
    "List-Unsubscribe-Post: List-Unsubscribe=One-Click",
  ];

  var lignes;
  if (html) {
    var b = "dossimo_boundary_alt";
    lignes = entetes.concat([
      'Content-Type: multipart/alternative; boundary="' + b + '"',
      "",
      "--" + b,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      base64Plie(body),
      "--" + b,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      base64Plie(html),
      "--" + b + "--",
    ]);
  } else {
    lignes = entetes.concat([
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      base64Plie(body),
    ]);
  }

  Gmail.Users.Messages.send(
    { raw: Utilities.base64EncodeWebSafe(lignes.join("\r\n"), Utilities.Charset.UTF_8) },
    "me",
  );
}

/**
 * Encode en base64 et plie à 76 caractères par ligne (RFC 2045). Une ligne base64
 * unique de plusieurs kilo-octets dépasse la limite SMTP de 998 caractères et
 * certains serveurs récepteurs la rejettent ou la tronquent.
 */
function base64Plie(texte) {
  return Utilities.base64Encode(texte, Utilities.Charset.UTF_8).replace(/(.{76})/g, "$1\r\n");
}

/** Un sujet non-ASCII doit être encodé (RFC 2047), sinon il arrive en charabia. */
function encoderSujet(subject) {
  return "=?UTF-8?B?" + Utilities.base64Encode(subject, Utilities.Charset.UTF_8) + "?=";
}

function cleDuJour() {
  return "PROSPECTION_" + Utilities.formatDate(new Date(), "Europe/Paris", "yyyy-MM-dd");
}

function plafondDisponible() {
  var props = PropertiesService.getScriptProperties();
  var envoyes = Number(props.getProperty(cleDuJour()) || "0");
  return envoyes < PLAFOND_QUOTIDIEN;
}

function incrementerCompteur() {
  var props = PropertiesService.getScriptProperties();
  var cle = cleDuJour();
  var envoyes = Number(props.getProperty(cle) || "0");
  props.setProperty(cle, String(envoyes + 1));
}

/* ---------------------------------------------------------------- Leads --- */
/* Repris de leads-webhook.gs : un seul déploiement, un seul point d'entrée. */

function envoyerNotificationLead(payload) {
  var NOTIFICATION_EMAIL = "max@dossimo.pro";
  var email = String(payload.email || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ ok: false, error: "invalid_email" });
  }

  var entreprise = clean(payload.entreprise) || "—";
  var telephone = clean(payload.telephone) || "—";
  var message = clean(payload.message);

  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    replyTo: email,
    name: "Dossimo",
    subject: "Nouveau lead Dossimo · " + (entreprise === "—" ? email : entreprise),
    body: [
      "Nouveau prospect depuis la landing.",
      "",
      "Email      : " + email,
      "Entreprise : " + entreprise,
      "Téléphone  : " + telephone,
      message ? "Message    : " + message : null,
    ].filter(Boolean).join("\n"),
  });

  MailApp.sendEmail({
    to: email,
    replyTo: NOTIFICATION_EMAIL,
    name: "Dossimo",
    subject: "On monte votre premier dossier avec vous · Dossimo",
    body: [
      "Bonjour,",
      "",
      "Merci de votre intérêt pour Dossimo. On revient vers vous très vite pour",
      "monter avec vous votre premier dossier MaPrimeRénov' ou CEE.",
      "",
      "Rappel : vous déposez vous-même, nous vérifions avant. Vous gardez votre",
      "client et l'intégralité de votre prime.",
      "",
      "Une question ? Répondez directement à cet e-mail : max@dossimo.pro.",
      "",
      "Max Landry, Dossimo",
    ].join("\n"),
  });

  return jsonResponse({ ok: true });
}

function clean(value) {
  return String(value || "").trim().slice(0, 2000);
}

function jsonResponse(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
