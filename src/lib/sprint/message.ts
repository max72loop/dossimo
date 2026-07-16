/**
 * Rendu des messages du sprint de prospection (plan v3, section 10).
 *
 * Deux canaux, un squelette commun, l'accroche choisie selon le domaine RGE.
 * Tout est en texte brut : ces messages sont copiés-collés à la main par un
 * humain (WhatsApp Business, Gmail), jamais envoyés par un outil de masse.
 *
 * Salutation : « Bonjour, » pour tout le monde, jamais de prénom.
 *
 * `prospects_dossimo` vient de l'annuaire public ADEME et n'a pas de colonne
 * prénom. `name` y porte quasi toujours une raison sociale (« AC ETANCHEITE »,
 * « RJA », « ELITE ENERGIES »). Une version précédente tentait d'en extraire un
 * prénom quand la valeur « ressemblait à une personne » : sur le fichier réel,
 * les 20 salutations personnalisées d'un lot de 40 étaient fausses, sans
 * exception (« Bonjour Ac, », « Bonjour Renov, », « Bonjour Sav, »). Sur la
 * première ligne d'un message à froid, ça ne passe pas pour une erreur de
 * fichier mais pour un publipostage bâclé.
 *
 * La personnalisation exigée par le plan (§5) passe donc par la ville et le
 * métier, qui sont fiables, et non par un prénom qu'on ne possède pas.
 */

import type { Accroche } from "./accroches";
import { CODE_LANCEMENT } from "@/lib/lancement";

/** Salutation unique. Le fichier ne porte aucun prénom : il n'y a rien à deviner. */
export const SALUTATION = "Bonjour,";

/**
 * Signature. Précédée d'une ligne vide supplémentaire à l'assemblage (`\n` en
 * plus du `\n\n` qui sépare les paragraphes) : elle se détache du corps au lieu
 * de se lire comme un paragraphe de plus.
 */
const SIGNATURE = "Max Landry, Dossimo · dossimo.app";

/** Bloc source + opposition. C'est lui qui rend un e-mail non sollicité licite. */
const MENTIONS =
  "Vos coordonnées proviennent de l'annuaire public des professionnels RGE (ADEME). Pour ne plus recevoir de message : répondez STOP.";

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

/**
 * Lien d'essai, schéma inclus. Le `https://` n'est pas cosmétique : sans lui,
 * Gmail et Outlook ne transforment pas un domaine nu suivi d'une query
 * (`dossimo.app/demo?utm_source=email`) en lien cliquable, et le message laisse
 * au destinataire une URL à recopier à la main — ce que personne ne fait. Pour
 * une campagne dont le seul but est le clic vers /demo, ça la vide de son objet.
 */
const DEMO = "https://dossimo.app/demo";

/** Message WhatsApp de premier contact (RGPD : source + STOP possibles à l'oral). */
export function messageWhatsApp(params: {
  ville: string | null;
  metier: string;
  accroche: Accroche;
}): string {
  const lieu = [params.ville?.trim(), params.metier].filter(Boolean).join(", ");
  return [
    `${SALUTATION} je vous trouve sur l'annuaire public des pros RGE (${lieu}).`,
    params.accroche.texte,
    "J'ai créé Dossimo pour ça : vous envoyez la photo de votre devis, il monte le dossier MaPrimeRénov'/CEE et signale ce qui ferait refuser la prime avant le dépôt. Pas un mandataire : vous gardez votre client et la prime entière.",
    `L'essai est gratuit, 2 minutes avec un devis : ${DEMO}?utm_source=whatsapp`,
    "Ça vous parle ? (Un mot et je n'insiste pas, promis.)",
  ].join("\n\n");
}

/**
 * Relance unique J+5, texte repris de la section 10 du plan v3.
 *
 * Une seule relance par contact, les deux canaux (plan §6 : « une seule relance
 * par contact »). La porte de sortie explicite (« dites-le-moi et je ne vous
 * réécris pas ») fait partie du message : c'est elle qui rend une relance non
 * sollicitée acceptable.
 */
export function messageRelanceWhatsApp(): string {
  return [
    `${SALUTATION} je me permets une seule relance.`,
    `Si vous avez un devis sous la main, le test prend 2 minutes et vous montre ce qu'un instructeur verrait : ${DEMO}?utm_source=whatsapp`,
    "Sinon, dites-le-moi et je ne vous réécris pas. Bonne journée !",
  ].join("\n\n");
}

/**
 * Relance e-mail J+5. Même texte que le canal WhatsApp, plus le bloc source +
 * STOP : le plan ne le remet pas sur la relance, mais un e-mail non sollicité
 * doit le porter à chaque envoi, pas seulement au premier.
 *
 * Objet identique à celui du premier contact, volontairement : le fil se
 * regroupe naturellement dans la boîte du destinataire, sans « Re: » postiche
 * qui simulerait une réponse qu'il n'a jamais écrite.
 */
export function messageRelanceEmail(params: { accroche: Accroche }): { objet: string; corps: string } {
  const corps = [
    `${SALUTATION} je me permets une seule relance.`,
    `Si vous avez un devis sous la main, le test prend 2 minutes et vous montre ce qu'un instructeur verrait : ${DEMO}?utm_source=email`,
    "Sinon, dites-le-moi et je ne vous réécris pas. Bonne journée !",
    `\n${SIGNATURE}`,
    MENTIONS,
  ].join("\n\n");
  return { objet: params.accroche.objet, corps };
}

/**
 * Message e-mail de premier contact. Le bloc source + STOP rend l'envoi licite.
 *
 * `offre` est optionnelle : le prix vient de la grille facturée et l'échéance du
 * module de lancement. Quand elle est absente (offre expirée, ou grille illisible
 * parce que la base n'a pas répondu), le paragraphe saute entièrement plutôt que
 * d'annoncer un tarif inventé ou une remise périmée.
 *
 * Le message se termine par une question : le taux de réponse est l'indicateur du
 * sprint (§11), or une signature seule n'invite personne à répondre.
 */
export function messageEmail(params: {
  accroche: Accroche;
  offre?: { remise: string; plein: string; fin: string } | null;
}): { objet: string; corps: string } {
  const { offre } = params;
  const corps = [
    SALUTATION,
    `Un dossier MaPrimeRénov' ou CEE refusé, c'est la prime perdue et le montage à refaire. ${params.accroche.texte}`,
    "J'ai créé Dossimo pour ça : vous envoyez votre devis (PDF ou photo), il recopie les informations, monte le dossier et vous sort un rapport de contrôle avant dépôt. Sans mandataire : vous gardez votre client et 100 % de la prime.",
    `Essai gratuit avec un de vos devis, deux minutes : ${DEMO}?utm_source=email`,
    ...(offre
      ? [
          `Pour le lancement, le premier dossier est à ${offre.remise} au lieu de ${offre.plein} avec le code ${CODE_LANCEMENT}, jusqu'au ${offre.fin}. Un paiement fixe par dossier, jamais un pourcentage sur la prime.`,
        ]
      : []),
    "Vous avez un devis en cours sur lequel vous avez un doute ? Répondez-moi, c'est moi qui lis.",
    `\n${SIGNATURE}`,
    MENTIONS,
  ].join("\n\n");
  return { objet: params.accroche.objet, corps };
}
