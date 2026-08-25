/**
 * Rendu du message de prospection, en texte brut.
 *
 * Le gabarit vit en base (`prospection_campagnes.corps`), pas ici : la copie doit
 * pouvoir être corrigée sans redéploiement. Ce module se charge de la substitution
 * et, surtout, des deux garde-fous qui évitent l'accident d'envoi :
 *
 *  - `nettoyerPrenom` refuse ce qui n'est pas un prénom (raison sociale, SIRET,
 *    « SARL DUPONT ») et retombe sur « Bonjour, ». Un fichier importé contient
 *    toujours quelques lignes où la colonne prénom porte le nom de l'entreprise ;
 *  - `rendre` refuse de produire un corps où subsiste une variable non substituée.
 *    Mieux vaut une erreur d'envoi qu'un « Bonjour {{prenom}}, » chez un artisan.
 */

import { editeur } from "@/lib/legal/editeur";
import { MENTION_INDEPENDANCE_PHRASE } from "@/lib/legal/mentions";
import { ACCROCHES } from "@/lib/sprint/accroches";

/** Mots qui trahissent une raison sociale glissée dans la colonne prénom. */
const FORMES_JURIDIQUES =
  /\b(sarl|sas|sasu|eurl|sci|sa|ei|eirl|snc|scop|entreprise|societe|société|ets|etablissements|établissements)\b/i;

/**
 * Normalise un prénom importé, ou renvoie `null` si la valeur n'en est pas un.
 * En cas de doute, on renvoie `null` : « Bonjour, » ne choque personne, « Bonjour
 * SARL DUPONT BATIMENT, » grille l'expéditeur.
 */
export function nettoyerPrenom(brut: string | null | undefined): string | null {
  const valeur = (brut ?? "").trim().replace(/\s+/g, " ");
  if (valeur.length < 2 || valeur.length > 30) return null;
  if (/\d/.test(valeur)) return null;
  if (FORMES_JURIDIQUES.test(valeur)) return null;
  // Un prénom composé reste un prénom ; trois mots ou plus, c'est autre chose.
  if (valeur.split(" ").length > 2) return null;

  return valeur
    .toLocaleLowerCase("fr-FR")
    .split(/([ -])/)
    .map((part) =>
      part === " " || part === "-"
        ? part
        : part.charAt(0).toLocaleUpperCase("fr-FR") + part.slice(1),
    )
    .join("");
}

export function salutation(prenom: string | null | undefined): string {
  const propre = nettoyerPrenom(prenom);
  return propre ? `Bonjour ${propre},` : "Bonjour,";
}

/**
 * Bloc d'identification en pied de message. Ce n'est pas de la décoration : c'est
 * lui qui rend l'envoi licite (identité de l'expéditeur, art. 6 LCEN) et qui, en
 * pratique, transforme un « signaler comme spam » en simple désinscription.
 */
export function mentionsLegales(): string {
  return `Dossimo, ${editeur.raisonSociale}, ${editeur.adresse}. ${MENTION_INDEPENDANCE_PHRASE}`;
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://dossimo.app"
  );
}

/** Lien d'essai, porteur du jeton : c'est ainsi qu'on attribue un clic sans mouchard. */
export function lienDemo(token: string): string {
  return `${siteUrl()}/demo?p=${token}`;
}

export function lienDesinscription(token: string): string {
  return `${siteUrl()}/desinscription/${token}`;
}

/**
 * Pixel de suivi d'ouverture, servi en première partie depuis dossimo.app. Le
 * jeton est le même que celui du lien de démo : il attribue l'ouverture au bon
 * prospect. N'existe que dans la version HTML (le texte brut ne charge pas d'image).
 */
export function lienPixel(token: string): string {
  return `${siteUrl()}/api/prospection/pixel?t=${token}`;
}

/**
 * Mentions périmées qui ne doivent plus quitter la boîte.
 *
 * La copie du premier contact vit en base (`prospection_campagnes.corps`), donc un
 * déploiement ne la corrige pas : le 01/08/2026, le retrait du code DOSSIMO50 des
 * fichiers laissait la campagne automatique continuer à l'annoncer. Un e-mail qui
 * promet une remise qu'aucun coupon Stripe n'honore est pire qu'un e-mail muet,
 * d'où ce contrôle : on refuse d'envoyer et on le dit, plutôt que de promettre.
 */
const MENTIONS_PERIMEES = [/DOSSIMO50/i];

/** La mention périmée trouvée dans un corps, ou `null` si le texte est sain. */
export function mentionPerimee(texte: string): string | null {
  const trouvee = MENTIONS_PERIMEES.find((motif) => motif.test(texte));
  return trouvee ? trouvee.source : null;
}

export type VariablesMessage = Record<string, string>;

/**
 * Substitue `{{variable}}` et refuse tout corps incomplet.
 *
 * @throws si une variable reste non substituée après rendu.
 */
export function rendre(gabarit: string, variables: VariablesMessage): string {
  const rendu = gabarit.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, cle: string) => {
    const valeur = variables[cle];
    if (valeur == null) return `{{${cle}}}`; // laissé en place -> détecté ci-dessous
    return valeur;
  });

  const restantes = rendu.match(/\{\{\s*\w+\s*\}\}/g);
  if (restantes) {
    throw new Error(
      `Variables non substituées : ${[...new Set(restantes)].join(", ")}`,
    );
  }
  return rendu.trim() + "\n";
}

/** Phrase métier injectée dans le corps. Sans domaine RGE, l'accroche générique. */
export function accrocheParDefaut(): string {
  return ACCROCHES.generique.texte;
}

/** Corps prêt à envoyer pour un prospect donné. */
export function corpsPourProspect(
  gabarit: string,
  prospect: {
    prenom: string | null;
    source: string;
    unsubscribe_token: string;
    /** Phrase métier (isolation, PAC…). Défaut : accroche générique. */
    accroche?: string;
  },
): string {
  return rendre(gabarit, {
    salutation: salutation(prospect.prenom),
    source: prospect.source,
    lien_demo: lienDemo(prospect.unsubscribe_token),
    lien_desinscription: lienDesinscription(prospect.unsubscribe_token),
    mentions_legales: mentionsLegales(),
    accroche: prospect.accroche ?? accrocheParDefaut(),
  });
}

/**
 * Version HTML du message (design validé avec la marque : bandeau logo, 3 étapes,
 * bouton). Envoyée en multipart avec le texte (`prospection_campagnes.corps`) en
 * repli.
 *
 * La structure HTML n'est pas dérivable du texte brut, d'où ce gabarit en dur.
 * Toute modification de fond (accroche, CTA, mentions) doit être répercutée AUX
 * DEUX endroits : le corps en base ET ici. Un `db reset` rejoue le seed 0032
 * puis 0056 (retrait DOSSIMO50) puis 0059 (copie courte + {{accroche}}).
 *
 * Pas d'offre de lancement : DOSSIMO50 a expiré le 31 juillet 2026.
 * Réintroduire un tarif seulement s'il est lu depuis `pricing_tiers`.
 */
function echapperHtml(valeur: string): string {
  return valeur
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const GABARIT_HTML = `<!-- dossimo -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#E7E2D6;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px;max-width:600px;border-collapse:collapse;background:#FBF9F3;border:1px solid #E2DDD1;border-radius:12px;overflow:hidden;">
  <tr><td style="background:#16202B;padding:26px 40px;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;"><tr>
      <td><img src="{{logo}}" width="150" alt="dossimo" style="display:block;width:150px;height:auto;border:0;"></td>
      <td align="right" style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#9AA1A9;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">MaPrimeR&eacute;nov' &middot; CEE</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:34px 40px 40px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#16202B;">
    <p style="margin:0 0 18px;font-size:16px;line-height:1.62;">{{salutation}}</p>
    <p style="margin:0 0 22px;font-size:16px;line-height:1.62;">Un dossier MaPrimeR&eacute;nov' ou CEE refus&eacute;, c'est la prime perdue et le montage &agrave; refaire. {{accroche}}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:0 0 24px;"><tr><td style="background:#F3F0E9;border:1px solid #E2DDD1;border-radius:10px;padding:22px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:0 0 14px;"><tr>
        <td width="34" valign="top"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="26" height="26" align="center" valign="middle" style="width:26px;height:26px;background:#35507F;border-radius:13px;color:#FBF9F3;font-size:13px;font-weight:700;">1</td></tr></table></td>
        <td valign="top" style="font-size:15px;line-height:1.5;color:#16202B;padding-top:2px;">Vous envoyez le devis, PDF ou photo depuis le chantier.</td>
      </tr></table>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:0 0 14px;"><tr>
        <td width="34" valign="top"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="26" height="26" align="center" valign="middle" style="width:26px;height:26px;background:#35507F;border-radius:13px;color:#FBF9F3;font-size:13px;font-weight:700;">2</td></tr></table></td>
        <td valign="top" style="font-size:15px;line-height:1.5;color:#16202B;padding-top:2px;">Dossimo recopie et contr&ocirc;le les mentions, la chronologie et la validit&eacute; RGE.</td>
      </tr></table>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;"><tr>
        <td width="34" valign="top"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="26" height="26" align="center" valign="middle" style="width:26px;height:26px;background:#35507F;border-radius:13px;color:#FBF9F3;font-size:13px;font-weight:700;">3</td></tr></table></td>
        <td valign="top" style="font-size:15px;line-height:1.5;color:#16202B;padding-top:2px;">Vous recevez le pack pr&ecirc;t &agrave; d&eacute;poser. Vous relisez, vous d&eacute;posez.</td>
      </tr></table>
    </td></tr></table>
    <p style="margin:0 0 28px;font-size:16px;line-height:1.62;">Pas de mandataire : le client et la prime restent les v&ocirc;tres. Dossimo ne d&eacute;pose jamais &agrave; votre place.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:0 0 8px;"><tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:8px;background:#35507F;">
        <a href="{{lien_demo}}" style="display:inline-block;padding:16px 40px;font-size:16px;font-weight:600;color:#FBF9F3;text-decoration:none;border-radius:8px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Tester en 2 minutes&nbsp;&nbsp;&rarr;</a>
      </td></tr></table>
    </td></tr></table>
    <p style="margin:0 0 28px;font-size:13px;line-height:1.5;color:#5B636D;text-align:center;">Sans engagement. Un paiement fixe par dossier, jamais un pourcentage sur la prime.</p>
    <p style="margin:0 0 28px;font-size:16px;line-height:1.62;">Vous avez un devis en cours sur lequel vous avez un doute ? R&eacute;pondez-moi, c'est moi qui lis.</p>
    <p style="margin:0 0 4px;font-size:16px;line-height:1.6;"><strong>Max Landry</strong>, Dossimo</p>
    <p style="margin:0 0 22px;font-size:15px;line-height:1.6;"><a href="mailto:max@dossimo.pro" style="color:#35507F;text-decoration:none;">max@dossimo.pro</a></p>
    <div style="height:1px;background:#E2DDD1;margin:8px 0 18px;"></div>
    <p style="margin:0 0 6px;font-size:12px;line-height:1.55;color:#9AA1A9;">{{mentions_legales}}</p>
    <p style="margin:0 0 6px;font-size:12px;line-height:1.55;color:#9AA1A9;">Votre adresse professionnelle : {{source}}.</p>
    <p style="margin:0;font-size:12px;line-height:1.55;color:#9AA1A9;"><a href="{{lien_desinscription}}" style="color:#5B636D;text-decoration:underline;">Se d&eacute;sinscrire</a> de tout message de ma part.</p>
  </td></tr>
</table>
</td></tr></table>
<img src="{{lien_pixel}}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;overflow:hidden;">`;

/** Corps HTML prêt à envoyer pour un prospect donné (repli texte : `corpsPourProspect`). */
export function corpsHtmlPourProspect(prospect: {
  prenom: string | null;
  source: string;
  unsubscribe_token: string;
  accroche?: string;
}): string {
  return rendre(GABARIT_HTML, {
    logo: `${siteUrl()}/brand/dossimo-logo-nuit.png`,
    salutation: echapperHtml(salutation(prospect.prenom)),
    source: echapperHtml(prospect.source),
    lien_demo: lienDemo(prospect.unsubscribe_token),
    lien_desinscription: lienDesinscription(prospect.unsubscribe_token),
    lien_pixel: lienPixel(prospect.unsubscribe_token),
    mentions_legales: echapperHtml(mentionsLegales()),
    accroche: echapperHtml(prospect.accroche ?? accrocheParDefaut()),
  });
}
