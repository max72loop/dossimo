/**
 * Identité de l'éditeur et informations légales de référence.
 *
 * Source unique de vérité pour les mentions légales, les CGV, la politique de
 * confidentialité, le pied de page et les factures (art. 6 III LCEN, art. 242
 * nonies A du CGI).
 *
 * Les champs à `null` sont des mentions qui ne s'appliquent PAS à l'entité
 * actuelle. Ne pas les remplir « pour faire propre » : un numéro inventé sur
 * une facture n'est pas un placeholder, c'est un faux.
 */

const TODO = "[À COMPLÉTER]";

export const editeur = {
  // --- Marque ---
  nomCommercial: "Dossimo",
  domaine: "dossimo.fr",
  siteUrl: "https://dossimo.fr",

  // --- Entité juridique ---
  // Entreprise individuelle : la dénomination est le nom de l'entrepreneur,
  // obligatoirement accompagné de « EI » ou « entrepreneur individuel »
  // (art. R123-237 du code de commerce, en vigueur depuis le 15 mai 2022).
  raisonSociale: "Max Landry (EI)",
  formeJuridique: "Entrepreneur individuel",
  siren: "952242428",
  siret: "95224242800011", // établissement siège (NIC 00011)
  rne: "952242428",
  // RCS : réservé aux commerçants et aux sociétés. Une EI de prestation de
  // services intellectuels n'y est pas immatriculée. `null` => mention omise.
  rcs: null as string | null,
  // TVA intracommunautaire : sans objet sous la franchise en base (voir `tva`).
  // À demander au SIE et renseigner ici en cas de sortie de la franchise.
  tvaIntracom: null as string | null,
  adresse: "80 rue Robespierre, 93170 Bagnolet",
  directeurPublication: "Max Landry",

  // --- Contact ---
  emailContact: "max@dossimo.pro",
  emailRgpd: "max@dossimo.pro", // adresse centralisée pour les demandes RGPD
  // Mention attendue sur un site professionnel. Renseigner uniquement avec un
  // numéro réellement joignable ; ne jamais publier un numéro de démonstration.
  telephone: null as string | null,

  // --- Régime de TVA ---
  // Franchise en base : aucune TVA facturée, mention obligatoire sur la facture.
  // Les prix affichés sont donc à la fois HT et TTC. En cas de sortie de la
  // franchise (dépassement des seuils), passer `taux` à 20 et remplacer la
  // mention : les factures DÉJÀ émises gardent la leur, figée en base.
  tva: {
    taux: 0,
    mention: "TVA non applicable, art. 293 B du CGI",
  },

  // --- Conditions de règlement (mentions obligatoires B2B, art. L441-9 C. com.) ---
  reglement: {
    conditions: "Paiement comptant à la commande, par carte bancaire.",
    penalites:
      "Pénalités de retard : trois fois le taux d'intérêt légal en vigueur.",
    indemnite:
      "Indemnité forfaitaire pour frais de recouvrement : 40 € (art. L441-10 du code de commerce).",
    escompte: "Pas d'escompte pour paiement anticipé.",
  },

  // --- Sous-traitants / hébergement ---
  hebergeur: {
    nom: "Vercel Inc.",
    // Adresse publiée par Vercel dans sa notice de confidentialité depuis le
    // 1er juin 2026.
    adresse: "440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis",
    site: "https://vercel.com",
    contact: "privacy@vercel.com",
    // Vercel ne publie pas de numéro dans ses documents légaux officiels.
    telephone: null as string | null,
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
export const derniereMajLegale = "13 juillet 2026";

/**
 * Vrai tant qu'un champ obligatoire n'est pas renseigné. Sert de garde au
 * bandeau des mentions légales ET au rendu des factures : un document fiscal
 * portant « [À COMPLÉTER] » ne doit jamais sortir.
 *
 * Ne couvre que les champs qui s'appliquent à TOUTE entité (`rcs` et
 * `tvaIntracom` peuvent légitimement valoir `null`).
 */
export function mentionsIncompletes(): boolean {
  const requis: (string | null)[] = [
    editeur.raisonSociale,
    editeur.siret,
    editeur.adresse,
    editeur.directeurPublication,
  ];
  return requis.some((v) => !v || v.includes(TODO));
}
