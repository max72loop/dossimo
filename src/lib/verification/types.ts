/**
 * Vérification de l'identité de l'entreprise (SIRET) et de sa qualification RGE
 * contre les annuaires officiels : Annuaire des Entreprises (SIRENE) et annuaire
 * RGE ADEME / France Rénov'.
 *
 * Pourquoi : sans ce contrôle, le SIRET et le RGE saisis à la main ne sont
 * vérifiés que sur leur FORME (14 chiffres, champ non vide). Une entreprise
 * fictive passe alors le contrôle « conforme », et Dossimo certifie une
 * qualification qui n'existe pas — exactement le motif de refus qu'il prétend
 * éviter (CLAUDE.md §4).
 *
 * Le résultat est SÉRIALISABLE et stocké dans le dossier
 * (`caracteristiques.verification`). Le moteur de règles — pur et synchrone — le
 * relit pour en tirer des findings déterministes, sans refaire d'appel réseau.
 */

export type VerificationMode = "reel" | "demo" | "off";

export type StatutSiret =
  | "actif" // établissement ouvert au répertoire SIRENE
  | "ferme" // établissement fermé (cessation)
  | "introuvable" // SIRET absent du répertoire
  | "indisponible" // annuaire injoignable (panne réseau) : contrôle dégradé
  | "non_verifie"; // vérification désactivée (mode « off »)

export type StatutRge =
  | "couvert" // une qualif RGE du bon domaine couvre la date du devis
  | "expire" // qualif du bon domaine trouvée mais expirée à la date du devis
  | "domaine_absent" // qualifs RGE présentes, mais aucune pour le domaine du geste
  | "aucune" // aucune qualif RGE pour ce SIRET
  | "indisponible"
  | "non_verifie";

// NB : ces formes sont déclarées en `type` (et non `interface`) à dessein : le
// résultat est stocké dans une colonne `Json` Supabase, et seuls les alias de
// type littéral obtiennent la signature d'index implicite qui les rend
// assignables à `Json` (une `interface` échouerait à la compilation).
export type QualificationRge = {
  /** Code de qualification (ex. « 8611 »). */
  numero: string;
  /** Libellé de la qualification (ex. « Qualibat 7131 — Isolation thermique »). */
  qualification: string;
  /** Domaine RGE tel que publié par l'ADEME (ex. « Isolation des combles perdus »). */
  domaine: string;
  meta_domaine: string | null;
  organisme: string | null;
  /** Début de validité (ISO AAAA-MM-JJ), si connu. */
  date_debut: string | null;
  /** Fin de validité (ISO AAAA-MM-JJ), si connue. */
  date_fin: string | null;
};

export type VerificationEntreprise = {
  mode: VerificationMode;
  /** Date de la vérification (ISO) ; null si non effectuée (mode « off »). */
  effectuee_le: string | null;
  /** SIRET vérifié (14 chiffres). */
  siret: string;
  entreprise: {
    statut: StatutSiret;
    /** Raison sociale officielle telle que retournée par l'annuaire. */
    denomination: string | null;
  };
  rge: {
    statut: StatutRge;
    /** Qualification retenue (celle couvrant date + domaine) si `couvert`/`expire`. */
    retenue: QualificationRge | null;
    /** Toutes les qualifs RGE trouvées pour ce SIRET (info + préremplissage). */
    qualifications: QualificationRge[];
  };
};
