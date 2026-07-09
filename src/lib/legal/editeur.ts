/**
 * Identité de l'éditeur et informations légales de référence.
 *
 * Source unique de vérité pour les mentions légales, les CGV, la politique de
 * confidentialité et le pied de page. À compléter une fois l'entité juridique
 * constituée : les champs marqués `À COMPLÉTER` doivent être renseignés avant
 * mise en ligne (obligation légale — art. 6 III LCEN pour les mentions légales).
 */

const TODO = "[À COMPLÉTER]";

export const editeur = {
  // --- Marque ---
  nomCommercial: "Dossimo",
  domaine: "dossimo.fr",
  siteUrl: "https://dossimo.fr",

  // --- Entité juridique (à renseigner) ---
  raisonSociale: TODO, // ex. « Dossimo SAS »
  formeJuridique: TODO, // ex. « SAS au capital de 1 000 € »
  siren: TODO, // 9 chiffres
  siret: TODO, // 14 chiffres (siège)
  rcs: TODO, // ex. « RCS Paris 000 000 000 »
  tvaIntracom: TODO, // ex. « FR00 000000000 »
  adresse: TODO, // siège social
  directeurPublication: TODO, // nom du représentant légal

  // --- Contact ---
  emailContact: "contact@dossimo.fr",
  emailRgpd: "contact@dossimo.fr", // adresse dédiée aux demandes RGPD

  // --- Sous-traitants / hébergement ---
  hebergeur: {
    nom: "Vercel Inc.",
    adresse: "340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis",
    site: "https://vercel.com",
  },
  baseDeDonnees: {
    nom: "Supabase (Supabase Inc.)",
    role: "Base de données et stockage des documents",
    site: "https://supabase.com",
  },
  paiement: {
    nom: "Stripe (Stripe Payments Europe, Ltd.)",
    role: "Traitement des paiements",
    site: "https://stripe.com",
  },
} as const;

/** Date de dernière mise à jour des documents légaux (affichée en tête). */
export const derniereMajLegale = "9 juillet 2026";

/** Vrai tant qu'un champ obligatoire n'est pas renseigné (bandeau d'alerte). */
export function mentionsIncompletes(): boolean {
  return [
    editeur.raisonSociale,
    editeur.siret,
    editeur.adresse,
    editeur.directeurPublication,
  ].some((v) => v === TODO);
}
