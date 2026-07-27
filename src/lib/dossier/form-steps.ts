import type { Path } from "react-hook-form";

import type { CeeIsolationInput } from "@/lib/dossier/cee-isolation";

export type ChampDossier = Path<CeeIsolationInput>;
export type EtapeDossierId = "dispositif" | "entreprise" | "beneficiaire" | "logement" | "travaux" | "dates";

export const ETAPES_DOSSIER: { id: EtapeDossierId; titre: string; champs: ChampDossier[] }[] = [
  { id: "dispositif", titre: "Dispositif", champs: ["dispositif", "geste"] },
  { id: "entreprise", titre: "Entreprise", champs: ["entreprise", "siret", "rge_numero", "rge_domaine", "rge_date_debut", "rge_date_fin", "signataire_nom", "signataire_prenom", "email", "telephone", "sous_traitance", "sous_traitant_nom", "sous_traitant_prenom", "sous_traitant_raison_sociale", "sous_traitant_siret"] },
  { id: "beneficiaire", titre: "Bénéficiaire", champs: ["client_nom", "client_prenom", "client_adresse", "client_code_postal", "client_commune", "client_email", "client_telephone", "occupation", "precarite"] },
  { id: "logement", titre: "Logement", champs: ["logement_type", "logement_annee_construction", "logement_residence", "logement_surface_habitable"] },
  { id: "travaux", titre: "Travaux", champs: ["type_isolation", "surface_isolee_m2", "isolant_type", "resistance_thermique_r", "isolant_marque", "isolant_reference", "epaisseur_mm", "isolation_pare_vapeur", "pac_etas", "pac_puissance_kw", "pac_temperature", "pac_marque", "pac_reference", "pac_regulateur", "pac_regulateur_classe", "pac_note_dimensionnement", "pac_deporte_consomme_energie", "pac_surface_chauffee_m2", "pac_usage", "pac_systeme_deporte", "pac_deporte_marque", "pac_deporte_reference", "pac_reference_modele", "pac_numero_agrement", "cet_efficacite_ecs", "cet_cop", "cet_profil_soutirage", "cet_volume_l", "cet_marque", "cet_reference", "bois_combustible", "bois_rendement", "bois_emissions_co", "bois_marque", "bois_reference", "solaire_appoint", "solaire_fluide", "solaire_surface_capteurs_m2", "solaire_profil_soutirage", "solaire_efficacite_ecs", "solaire_nb_ballons", "solaire_volume_ballon_l", "solaire_classe_ballon", "solaire_certification", "solaire_couvre_totalite_ecs", "solaire_capteurs_non_hybrides", "solaire_marque", "solaire_reference"] },
  { id: "dates", titre: "Dates & montants", champs: ["date_visite_technique", "date_devis", "date_debut_travaux", "date_fin_travaux", "date_facture", "facture_reference", "montant_ht", "montant_ttc", "montant_prime_estime", "montant_aides_publiques"] },
];

export function etapesPourSaisie(assiste: boolean, valeurs: Record<string, string>) {
  if (!assiste) return ETAPES_DOSSIER;
  const incompletes = ETAPES_DOSSIER.filter((etape) =>
    etape.champs.some((champ) => !valeurs[champ]),
  );
  return incompletes.length ? incompletes : [ETAPES_DOSSIER.at(-1)!];
}
