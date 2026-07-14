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

  try {
    envoyerBrutAvecEnTetes(to, subject, body, unsubscribeUrl);
  } catch (error) {
    console.error(error);
    // Repli sans en-tête plutôt que pas d'envoi du tout.
    MailApp.sendEmail({
      to: to,
      replyTo: Session.getEffectiveUser().getEmail(),
      name: EXPEDITEUR,
      subject: subject,
      body: body,
    });
  }

  incrementerCompteur();
  return jsonResponse({ ok: true });
}

/** Message RFC 822 brut : seul moyen de poser des en-têtes personnalisés. */
function envoyerBrutAvecEnTetes(to, subject, body, unsubscribeUrl) {
  var from = Session.getEffectiveUser().getEmail();
  var raw = [
    "From: " + EXPEDITEUR + " <" + from + ">",
    "To: " + to,
    "Subject: " + encoderSujet(subject),
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "List-Unsubscribe: <" + unsubscribeUrl + ">, <mailto:" + from + "?subject=STOP>",
    "List-Unsubscribe-Post: List-Unsubscribe=One-Click",
    "",
    Utilities.base64Encode(body, Utilities.Charset.UTF_8),
  ].join("\r\n");

  Gmail.Users.Messages.send(
    { raw: Utilities.base64EncodeWebSafe(raw, Utilities.Charset.UTF_8) },
    "me",
  );
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
