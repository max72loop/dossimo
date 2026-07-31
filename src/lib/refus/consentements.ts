import { editeur } from "@/lib/legal/editeur";

/**
 * Textes de consentement du formulaire de diagnostic `/refus`.
 *
 * SOURCE UNIQUE, partagée entre l'affichage et le stockage. Le formulaire rend
 * exactement `CONSENTEMENT_CONTACT.texte`, et la Server Action fige ce même
 * texte dans `refus_demandes.consentements_texte` avec sa version. Un
 * consentement dont on ne sait plus à quoi il se rapportait n'en est pas un :
 * c'est pourquoi on stocke le libellé lui-même, pas seulement une case cochée.
 *
 * Un seul consentement en lot 1. Le second, sur le traitement d'un document
 * déposé, n'a pas d'objet sans upload : il arrivera avec lui au lot 2
 * (docs/cluster-refus.md § 4). Le tableau `CONSENTEMENTS` existe pour que
 * l'ajout du second ne demande aucune modification de la Server Action.
 */

/**
 * Version des textes ci-dessous. À incrémenter dès qu'un libellé change, sinon
 * deux consentements de teneur différente se retrouvent sous la même version et
 * la traçabilité est perdue. Format : date du jour où le texte a été arrêté.
 */
export const CONSENTEMENTS_VERSION = "2026-07-30";

export interface Consentement {
  /** Clé stable, utilisée comme nom de champ et comme clé de stockage. */
  readonly id: "contact";
  /** Libellé exact affiché à côté de la case. Jamais reformulé à l'affichage. */
  readonly texte: string;
  /** Une case non cochée bloque la soumission. */
  readonly obligatoire: boolean;
}

export const CONSENTEMENT_CONTACT: Consentement = {
  id: "contact",
  texte:
    `J'accepte d'être recontacté par ${editeur.nomCommercial} à propos de ma demande de diagnostic, ` +
    `à l'adresse e-mail que je viens de renseigner. Mes données sont conservées trois ans après ` +
    `notre dernier contact et je peux demander à tout moment leur accès, leur rectification ou ` +
    `leur effacement à ${editeur.emailRgpd}.`,
  obligatoire: true,
};

export const CONSENTEMENTS: readonly Consentement[] = [CONSENTEMENT_CONTACT];

/**
 * Instantané à écrire en base : la version, et le texte exact de chaque
 * consentement accepté. On ne stocke pas les cases refusées : une case
 * obligatoire non cochée n'aboutit pas à une ligne, et le lot 1 n'en a pas
 * d'optionnelle.
 */
export function instantaneConsentements(): {
  version: string;
  textes: Record<string, string>;
} {
  return {
    version: CONSENTEMENTS_VERSION,
    textes: Object.fromEntries(CONSENTEMENTS.map((c) => [c.id, c.texte])),
  };
}
