import "server-only";

import type { DossierComplet } from "@/lib/dossier/get-dossier";
import { fetchRegleActive } from "@/lib/rules/regles-metier";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Dossier FICTIF servant à produire le pack d'exemple public (`/exemple`).
 *
 * Pourquoi il existe : la vitrine décrivait le pack sans jamais le montrer, et
 * le seul moyen de le voir était de créer un compte, monter un dossier et
 * payer. Un artisan qui découvre Dossimo veut d'abord savoir ce qu'il achète.
 *
 * Trois garde-fous, tous délibérés :
 *
 * 1. **Le bénéficiaire est ouvertement fictif** (« Martin Exemple », rue de
 *    l'Exemple). Aucune donnée réelle ne peut sortir par cette porte : la route
 *    publique n'accepte AUCUN paramètre et ne lit jamais la table `dossiers`.
 * 2. **Le barème vient de la base**, pas de constantes recopiées ici. Le pack
 *    d'exemple affiche donc la prime réellement en vigueur, et suit un
 *    changement de barème sans qu'on y touche (CLAUDE.md §8, AGENTS.md). Si la
 *    règle est injoignable, `regle` vaut `null` et les documents se rendent
 *    sans montant plutôt qu'avec un montant périmé.
 * 3. **Le pack d'exemple exclut l'attestation de pré-contrôle et le Cerfa.**
 *    Ce sont les deux pièces qui se signent et se déposent ; un spécimen
 *    téléchargeable librement est une pièce qu'on peut tenter de faire passer
 *    pour un vrai contrôle. Le pack public se limite aux pièces descriptives
 *    (récapitulatif, rapport, checklist).
 *
 * Le geste retenu est l'isolation de combles perdus : le couple le mieux seedé
 * (barème CEE et MPR présents pour les trois profils) et celui que la vitrine
 * met en scène.
 */

/** Date de référence du dossier d'exemple. Figée : le pack doit être reproductible. */
const REF = {
  offreCee: "2026-05-05",
  devis: "2026-05-12",
  visite: "2026-05-04",
  debutTravaux: "2026-06-08",
  finTravaux: "2026-06-10",
  facture: "2026-06-12",
  creation: "2026-05-12",
} as const;

/**
 * Date de référence du contrôle de l'exemple, injectée dans `controlerDossier`.
 *
 * Sans elle, le rapport d'exemple dériverait avec l'horloge : la validité RGE et
 * les délais se calculent par rapport à « aujourd'hui », et le même document
 * afficherait d'autres constats dans six mois. Un exemple doit être reproductible.
 */
export const DATE_CONTROLE_EXEMPLE = new Date("2026-06-15T00:00:00");

/**
 * Construit le dossier d'exemple, barème lu en base.
 *
 * Client service-role assumé : `regles_metier` n'est pas exposée à `anon`
 * (seule `pricing_tiers` l'est, migration 0015) et on ne va pas ouvrir une
 * table de règles au public pour afficher une brochure. La lecture est
 * strictement bornée au couple (cee, combles_perdus).
 */
export async function dossierExemple(): Promise<DossierComplet> {
  let regle = null;
  try {
    regle = await fetchRegleActive(createAdminClient(), "cee", "combles_perdus");
  } catch {
    // Base injoignable : le pack sort sans barème. Une brochure sans montant
    // reste honnête ; une brochure avec un montant inventé, non.
    regle = null;
  }

  return {
    dossier: {
      id: "exemple",
      dispositif: "cee",
      type_travaux: "combles_perdus",
      statut: "livre",
      created_at: REF.creation,
    },
    artisan: {
      entreprise: "Exemple Isolation",
      nom: "Exemple",
      prenom: "Camille",
      siret: "00000000000000",
      email: "contact@exemple-isolation.fr",
      telephone: null,
      ville: "Bagnolet",
      qualification_rge: "QualiBat 7131",
    },
    caracteristiques: {
      geste: "isolation",
      fiche: "BAR-EN-101",
      beneficiaire: {
        nom: "Exemple",
        prenom: "Martin",
        adresse: "12 rue de l'Exemple",
        code_postal: "93170",
        commune: "Bagnolet",
        email: null,
        telephone: null,
        occupation: "proprietaire_occupant",
        precarite: "precaire",
      },
      logement: {
        type: "maison",
        annee_construction: 1978,
        residence: "principale",
        surface_habitable: 105,
      },
      travaux: {
        fiche: "BAR-EN-101",
        type_isolation: "combles_perdus",
        surface_isolee_m2: 95,
        isolant_type: "Laine de verre soufflée",
        isolant_marque: "Exemple",
        isolant_reference: "EX-300",
        resistance_thermique_r: 7.5,
        epaisseur_mm: 300,
      },
      montants: { ht: 4200, ttc: 4431, prime_estime: null },
      rge: {
        numero: "E-000000",
        domaine: "Isolation des combles et toitures",
        date_debut: "2024-01-01",
        date_fin: "2027-12-31",
      },
    },
    dates: {
      offre_cee: REF.offreCee,
      visite_technique: REF.visite,
      devis: REF.devis,
      debut_travaux: REF.debutTravaux,
      fin_travaux: REF.finTravaux,
      facture: REF.facture,
    },
    regle,
  } as unknown as DossierComplet;
}
