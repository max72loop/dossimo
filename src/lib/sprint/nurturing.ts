/**
 * Nurturing mensuel : « Le point réglementaire du mois en 5 lignes »
 * (plan de lancement v3, section 7).
 *
 * Après la relance J+5, un contact silencieux sort de la prospection active mais
 * reste dans le fichier. À partir d'août, il reçoit un e-mail par mois, court et
 * utile. Pas de vente : l'objectif est de rester dans le paysage jusqu'à la
 * fenêtre de septembre sans griller le fichier.
 *
 * Le contenu est ÉDITORIAL et vient de la veille réglementaire (§8 du CLAUDE.md,
 * vérification mensuelle des versions Cerfa et des fiches CEE). Il n'est ni
 * généré ni deviné : une évolution réglementaire inventée envoyée à 300 artisans
 * produirait exactement le refus que Dossimo prétend éviter, et coûterait la
 * crédibilité du fichier. D'où `EDITIONS` vide par défaut : tant que l'édition du
 * mois n'est pas écrite à la main ici, la console refuse de composer un lot de
 * nurturing plutôt que d'envoyer une coquille.
 */

import { SALUTATION } from "./message";

/** Guides réellement publiés. Typé pour qu'une édition ne puisse pas lier un 404. */
export const GUIDES = {
  "eviter-refus-maprimerenov": "Éviter un refus MaPrimeRénov'",
  "mentions-obligatoires-devis-rge": "Les mentions obligatoires d'un devis RGE",
  "devis-cee-conforme": "Un devis CEE conforme",
  "devis-maprimerenov-conforme": "Un devis MaPrimeRénov' conforme",
} as const;

export type SlugGuide = keyof typeof GUIDES;

export type EditionNurturing = {
  /** Mois civil visé, format `YYYY-MM` (ex. « 2026-08 »). */
  mois: string;
  /** Objet de l'e-mail. Court, sans promesse commerciale. */
  objet: string;
  /**
   * Le corps : cinq lignes maximum (le nom de la rubrique est un engagement
   * tenu, pas une figure de style). Une évolution, une mention piège.
   */
  lignes: string[];
  /** Guide du site vers lequel renvoyer, choisi parmi les pages publiées. */
  guide: SlugGuide;
};

/**
 * Éditions mensuelles, une par mois civil, à écrire à la main depuis la veille
 * réglementaire. Ajouter l'édition du mois AVANT d'ouvrir l'onglet Nurturing.
 *
 * Exemple de forme attendue (à ne pas envoyer tel quel, les faits sont à vérifier
 * dans la veille du mois) :
 *
 *   {
 *     mois: "2026-08",
 *     objet: "Le point réglementaire du mois : ...",
 *     lignes: ["...", "...", "...", "...", "..."],
 *     guide: "mentions-obligatoires-devis-rge",
 *   }
 */
export const EDITIONS: EditionNurturing[] = [];

/** Mois civil courant au format `YYYY-MM`, en heure de Paris (jamais heure serveur). */
export function moisParis(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit" })
    .format(d)
    .slice(0, 7);
}

/** Premier jour du mois civil courant, format `YYYY-MM-DD` (borne d'éligibilité). */
export function debutDuMoisParis(d: Date = new Date()): string {
  return `${moisParis(d)}-01`;
}

/** L'édition du mois demandé, ou null si elle n'a pas encore été écrite. */
export function editionDuMois(mois: string): EditionNurturing | null {
  return EDITIONS.find((e) => e.mois === mois) ?? null;
}

const SITE = "dossimo.app";

/**
 * Rend l'e-mail de nurturing. Signature d'une ligne, bloc source + STOP conservé
 * (l'envoi reste non sollicité, chaque message doit porter la sortie), aucun
 * argumentaire de vente : c'est ce qui distingue le nurturing de la prospection.
 */
export function messageNurturing(params: { edition: EditionNurturing }): { objet: string; corps: string } {
  const { edition } = params;
  const corps = [
    SALUTATION,
    edition.lignes.join("\n"),
    `Le détail est ici : ${SITE}/${edition.guide}?utm_source=nurturing`,
    "Max Landry, Dossimo · dossimo.app",
    "Vos coordonnées proviennent de l'annuaire public des professionnels RGE (ADEME). Pour ne plus recevoir de message : répondez STOP.",
  ].join("\n\n");
  return { objet: edition.objet, corps };
}
