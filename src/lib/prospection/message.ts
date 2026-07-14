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
  return `Dossimo, ${editeur.raisonSociale}, ${editeur.adresse}. Service indépendant d'aide à la préparation de dossier, non affilié à l'Anah ni à France Rénov'.`;
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

/** Corps prêt à envoyer pour un prospect donné. */
export function corpsPourProspect(
  gabarit: string,
  prospect: {
    prenom: string | null;
    source: string;
    unsubscribe_token: string;
  },
): string {
  return rendre(gabarit, {
    salutation: salutation(prospect.prenom),
    source: prospect.source,
    lien_demo: lienDemo(prospect.unsubscribe_token),
    lien_desinscription: lienDesinscription(prospect.unsubscribe_token),
    mentions_legales: mentionsLegales(),
  });
}
