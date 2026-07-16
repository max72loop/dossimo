/**
 * Rendu des messages du sprint de prospection (plan v3, section 10).
 *
 * Deux canaux, un squelette commun, l'accroche choisie selon le domaine RGE.
 * Tout est en texte brut : ces messages sont copiés-collés à la main par un
 * humain (WhatsApp Business, Gmail), jamais envoyés par un outil de masse.
 *
 * La table `prospects_dossimo` n'a pas de colonne prénom : `name` est tantôt une
 * personne (« ALAIN RIFFAUT »), tantôt une raison sociale (« APPLICATIONS
 * MODERNES D'ELECTRICITE »). On produit une salutation best-effort, et la page
 * admin affiche le nom brut pour correction avant envoi.
 */

import type { Accroche } from "./accroches";

/** Formes juridiques qui trahissent une raison sociale glissée dans `name`. */
const FORMES_JURIDIQUES =
  /\b(sarl|sas|sasu|eurl|sci|sa|ei|eirl|snc|scop|entreprise|societe|société|ets|etablissements|établissements|batiment|bâtiment|renovation|rénovation|isolation|energie|énergie|elec|electricite|électricité|chauffage|construction|travaux|habitat|services?)\b/i;

/**
 * Salutation best-effort à partir de `name`. Renvoie « Bonjour Prénom, » quand
 * `name` ressemble à une personne (un ou deux mots, sans forme juridique ni
 * chiffre), sinon « Bonjour, » : un « Bonjour SARL DUPONT, » grille l'expéditeur,
 * un « Bonjour, » ne choque personne. Le prénom retenu est le premier mot.
 */
export function saluer(name: string | null | undefined): string {
  const valeur = (name ?? "").trim().replace(/\s+/g, " ");
  const mots = valeur.split(" ");
  // Un prénom porte au moins une voyelle : « VGMS », « SNC », « MDB » sont des
  // acronymes d'entreprise, pas des prénoms.
  const aUneVoyelle = /[aeiouyàâäéèêëïîôöùûü]/i.test(mots[0]);
  const estPersonne =
    valeur.length >= 2 &&
    valeur.length <= 40 &&
    mots.length <= 2 &&
    aUneVoyelle &&
    !/\d/.test(valeur) &&
    !FORMES_JURIDIQUES.test(valeur);
  if (!estPersonne) return "Bonjour,";
  const prenom = mots[0].toLocaleLowerCase("fr-FR");
  return `Bonjour ${prenom.charAt(0).toLocaleUpperCase("fr-FR")}${prenom.slice(1)},`;
}

/**
 * Normalise un numéro français au format international sans « + » pour wa.me
 * (ex. « 06 80 26 45 56 » → « 33680264556 »). Renvoie null si ce n'est pas un
 * mobile/fixe français exploitable : un lien wa.me faux vaut moins que pas de lien.
 */
export function normaliserTelephoneFr(phone: string | null | undefined): string | null {
  const chiffres = (phone ?? "").replace(/[^\d+]/g, "");
  if (!chiffres) return null;
  let n = chiffres.replace(/^\+/, "");
  if (n.startsWith("0033")) n = n.slice(4);
  else if (n.startsWith("33")) n = n.slice(2);
  else if (n.startsWith("0")) n = n.slice(1);
  // Après retrait du préfixe, un numéro français a 9 chiffres (indicatif 1 à 9).
  if (!/^[1-9]\d{8}$/.test(n)) return null;
  return `33${n}`;
}

/** Lien wa.me ouvrant la conversation pré-remplie, ou null si numéro inexploitable. */
export function lienWhatsApp(phone: string | null | undefined, message: string): string | null {
  const num = normaliserTelephoneFr(phone);
  if (!num) return null;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

const DEMO = "dossimo.app/demo";

/** Message WhatsApp de premier contact (RGPD : source + STOP possibles à l'oral). */
export function messageWhatsApp(params: {
  salutation: string;
  ville: string | null;
  metier: string;
  accroche: Accroche;
}): string {
  const lieu = [params.ville?.trim(), params.metier].filter(Boolean).join(", ");
  return [
    `${params.salutation} je vous trouve sur l'annuaire public des pros RGE (${lieu}).`,
    params.accroche.texte,
    "J'ai créé Dossimo pour ça : vous envoyez la photo de votre devis, il monte le dossier MaPrimeRénov'/CEE et signale ce qui ferait refuser la prime avant le dépôt. Pas un mandataire : vous gardez votre client et la prime entière.",
    `L'essai est gratuit, 2 minutes avec un devis : ${DEMO}?utm_source=whatsapp`,
    "Ça vous parle ? (Un mot et je n'insiste pas, promis.)",
  ].join("\n\n");
}

/** Message e-mail de premier contact. Le bloc source + STOP rend l'envoi licite. */
export function messageEmail(params: {
  salutation: string;
  accroche: Accroche;
}): { objet: string; corps: string } {
  const corps = [
    params.salutation,
    `Un dossier MaPrimeRénov' ou CEE refusé, c'est la prime perdue et le montage à refaire. ${params.accroche.texte}`,
    "J'ai créé Dossimo pour ça : vous envoyez votre devis (PDF ou photo), il recopie les informations, monte le dossier et vous sort un rapport de contrôle avant dépôt. Sans mandataire : vous gardez votre client et 100 % de la prime. Paiement fixe par dossier, à partir de 49 €.",
    `Essai gratuit avec un de vos devis (2 minutes) : ${DEMO}?utm_source=email`,
    "Je suis joignable en direct à ce mail, c'est moi qui réponds.",
    "Max Landry, Dossimo · dossimo.app",
    "Vos coordonnées proviennent de l'annuaire public des professionnels RGE (ADEME). Pour ne plus recevoir de message : répondez STOP.",
  ].join("\n\n");
  return { objet: params.accroche.objet, corps };
}
