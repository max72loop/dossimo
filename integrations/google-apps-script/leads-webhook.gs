const NOTIFICATION_EMAIL = "max@dossimo.pro";

/**
 * Web app Google Apps Script pour les leads Dossimo.
 * À déployer en choisissant « Exécuter en tant que : moi ».
 */
function doPost(event) {
  try {
    // Le bouton « Exécuter » de l'éditeur n'envoie aucun événement HTTP.
    // Le vrai test doit passer par l'URL /exec du déploiement Web App.
    if (!event || !event.postData || !event.postData.contents) {
      return jsonResponse({ ok: false, error: "missing_post_data" });
    }

    const payload = JSON.parse(event.postData.contents || "{}");
    const expectedSecret = PropertiesService.getScriptProperties()
      .getProperty("DOSSIMO_WEBHOOK_SECRET");

    if (!expectedSecret || payload.secret !== expectedSecret) {
      return jsonResponse({ ok: false, error: "unauthorized" });
    }
    if (payload.type !== "landing_lead") {
      return jsonResponse({ ok: false, error: "unsupported_type" });
    }

    const email = String(payload.email || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ ok: false, error: "invalid_email" });
    }

    const entreprise = clean(payload.entreprise) || "—";
    const telephone = clean(payload.telephone) || "—";
    const message = clean(payload.message);

    MailApp.sendEmail({
      to: NOTIFICATION_EMAIL,
      replyTo: email,
      name: "Dossimo",
      subject: `Nouveau lead Dossimo — ${entreprise === "—" ? email : entreprise}`,
      body: [
        "Nouveau prospect depuis la landing.",
        "",
        `Email      : ${email}`,
        `Entreprise : ${entreprise}`,
        `Téléphone  : ${telephone}`,
        message ? `Message    : ${message}` : null,
      ].filter(Boolean).join("\n"),
    });

    MailApp.sendEmail({
      to: email,
      replyTo: NOTIFICATION_EMAIL,
      name: "Dossimo",
      subject: "On prépare votre premier dossier — Dossimo",
      body: [
        "Bonjour,",
        "",
        "Merci de votre intérêt pour Dossimo. On revient vers vous très vite pour",
        "préparer avec vous votre premier dossier MaPrimeRénov' ou CEE — offert —",
        "et vous montrer le contrôle anti-refus en conditions réelles.",
        "",
        "Rappel : vous déposez vous-même, nous vérifions avant. Vous gardez votre",
        "client et l'intégralité de votre prime.",
        "",
        "Une question ? Répondez directement à cet e-mail : max@dossimo.pro.",
        "",
        "— L'équipe Dossimo",
      ].join("\n"),
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: "internal_error" });
  }
}

function clean(value) {
  return String(value || "").trim().slice(0, 2000);
}

function jsonResponse(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
