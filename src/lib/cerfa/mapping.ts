import type { DossierComplet } from "@/lib/dossier/get-dossier";
import { LOGEMENT_TYPES, posteLabel } from "@/lib/dossier/cee-isolation";

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
  // Les champs `travaux_*` de l'AH à champs (AH_CEE_FIELDS) décrivent une
  // isolation : surface, résistance R, isolant, épaisseur. Les gestes PAC / CET /
  // bois n'ont pas de bloc `travaux` et résolvent leurs propres modèles (fiches
  // BAR-TH), rendus par reproduction. On laisse donc ces champs vides plutôt que
  // d'y écrire des valeurs d'un autre geste : une AH fausse fabriquerait le motif
  // de refus que Dossimo prétend éviter (CLAUDE.md §8).
  const t = c.travaux;

  const anneeCourante = new Date().getFullYear();
  const isolant = t
    ? [t.isolant_marque, t.isolant_reference].filter(Boolean).join(" ") ||
      t.isolant_type
    : "";

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
    travaux_nature: posteLabel(c),
    travaux_surface: t ? String(t.surface_isolee_m2) : "",
    travaux_resistance: t ? String(t.resistance_thermique_r) : "",
    travaux_isolant: isolant,
    travaux_epaisseur: t?.epaisseur_mm ? String(t.epaisseur_mm) : "",
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
