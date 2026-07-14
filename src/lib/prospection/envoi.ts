import "server-only";

/**
 * Transport des messages de prospection.
 *
 * On réutilise le Web App Google Apps Script déjà en place pour les leads
 * (`integrations/google-apps-script/`) : il s'exécute sous le compte Google
 * Workspace `max@dossimo.pro` et envoie via Gmail. Aucun mot de passe
 * d'application, aucun SMTP, aucune dépendance de plus, et l'envoi est signé
 * DKIM par Google dès que le domaine est authentifié dans la console Admin.
 *
 * Le message part en `text/plain`. Pas de HTML, pas de pixel de suivi : ce qui
 * distingue un envoi 1:1 d'un publipostage aux yeux d'un filtre anti-spam, c'est
 * exactement ça.
 */

export type ResultatEnvoi = { ok: true } | { ok: false; erreur: string };

export async function envoyerMessage(params: {
  to: string;
  objet: string;
  corps: string;
  /** Alimente l'en-tête List-Unsubscribe : le bouton natif « Se désabonner » de Gmail. */
  lienDesinscription: string;
}): Promise<ResultatEnvoi> {
  const url = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL;
  const secret = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET;
  if (!url || !secret) {
    return { ok: false, erreur: "Webhook Google Apps Script non configuré." };
  }

  try {
    const reponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        secret,
        type: "prospection_send",
        to: params.to,
        subject: params.objet,
        body: params.corps,
        unsubscribeUrl: params.lienDesinscription,
      }),
      cache: "no-store",
    });

    const resultat = (await reponse.json()) as { ok?: boolean; error?: string };
    if (!reponse.ok || !resultat.ok) {
      return {
        ok: false,
        erreur: `Apps Script: ${resultat.error || reponse.status}`,
      };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: `Apps Script injoignable: ${String(err)}` };
  }
}
