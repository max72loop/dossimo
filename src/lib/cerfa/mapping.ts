import type { DossierComplet } from "@/lib/dossier/get-dossier";
import { LOGEMENT_TYPES, TYPES_ISOLATION } from "@/lib/dossier/cee-isolation";

/** Valeurs à injecter dans les champs de l'attestation, indexées par nom de champ. */
export type CerfaValues = Record<string, string | boolean>;

const frDate = (s: string | null): string =>
  !s ? "" : new Date(s).toLocaleDateString("fr-FR");

const eur = (n: number | null): string =>
  n == null ? "" : n.toLocaleString("fr-FR", { minimumFractionDigits: 2 });

/**
 * Mappe la saisie unique du dossier vers les champs de l'attestation sur
 * l'honneur CEE. Toutes les valeurs viennent de la même source → cohérence
 * garantie avec le reste du pack (§4).
 */
export function mapDossierToAhCee(data: DossierComplet): CerfaValues {
  const c = data.caracteristiques;
  const dates = data.dates;
  const travaux = TYPES_ISOLATION[c.travaux.type_isolation];

  const anneeCourante = new Date().getFullYear();
  const isolant =
    [c.travaux.isolant_marque, c.travaux.isolant_reference]
      .filter(Boolean)
      .join(" ") || c.travaux.isolant_type;

  return {
    beneficiaire_nom_prenom: `${c.beneficiaire.prenom} ${c.beneficiaire.nom}`,
    beneficiaire_adresse: c.beneficiaire.adresse,
    beneficiaire_cp_commune: `${c.beneficiaire.code_postal} ${c.beneficiaire.commune}`,
    logement_type: LOGEMENT_TYPES[c.logement.type],
    logement_annee: String(c.logement.annee_construction),
    logement_plus_2_ans: anneeCourante - c.logement.annee_construction > 2,
    pro_raison_sociale: data.artisan?.entreprise ?? "",
    pro_siret: data.artisan?.siret ?? "",
    pro_rge_numero: c.rge.numero,
    pro_rge_domaine: c.rge.domaine,
    travaux_fiche: c.fiche,
    travaux_nature: travaux.label,
    travaux_surface: String(c.travaux.surface_isolee_m2),
    travaux_resistance: String(c.travaux.resistance_thermique_r),
    travaux_isolant: isolant,
    travaux_epaisseur: c.travaux.epaisseur_mm ? String(c.travaux.epaisseur_mm) : "",
    date_devis: frDate(dates.devis),
    date_debut: frDate(dates.debut_travaux),
    date_fin: frDate(dates.fin_travaux),
    date_facture: frDate(dates.facture),
    montant_ht: eur(c.montants.ht),
    atteste_exactitude: true,
    signature_lieu: c.beneficiaire.commune,
    signature_date: frDate(dates.facture ?? dates.devis),
  };
}

/**
 * Mappe le dossier vers le bloc « mandant » du mandat MaPrimeRénov'
 * (Cerfa 16089*02). On ne pré-remplit que le client (mandant) : le mandataire
 * reste au choix du client, conformément au positionnement Dossimo.
 */
export function mapDossierToMandatMpr(data: DossierComplet): CerfaValues {
  const b = data.caracteristiques.beneficiaire;
  return {
    mandant_nom_prenom: `${b.prenom} ${b.nom}`,
    mandant_adresse: b.adresse,
    mandant_cp: b.code_postal,
    mandant_commune: b.commune,
    mandant_tel: b.telephone ?? "",
    mandant_mel: b.email ?? "",
  };
}
