import type { DossierComplet } from "@/lib/dossier/get-dossier";
import { TYPES_ISOLATION } from "@/lib/dossier/cee-isolation";
import { dateFr } from "@/lib/pack/format";
import type { Finding, RapportControle } from "@/lib/rules/types";

const TVA_ISOLATION = 0.055; // taux réduit rénovation énergétique

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const jour = 86_400_000;

/**
 * Contrôle déterministe d'un dossier CEE isolation.
 * @param today date de référence (injectable pour les tests).
 */
export function controlerDossierCeeIsolation(
  data: DossierComplet,
  today: Date = new Date(),
): RapportControle {
  const { caracteristiques: c, dates } = data;
  const findings: Finding[] = [];
  const add = (f: Finding) => findings.push(f);

  const dDevis = parseDate(dates.devis);
  const dVisite = parseDate(dates.visite_technique);
  const dDebut = parseDate(dates.debut_travaux);
  const dFin = parseDate(dates.fin_travaux);
  const dFacture = parseDate(dates.facture);
  const dRgeFin = parseDate(c.rge.date_fin);
  const dRgeDebut = parseDate(c.rge.date_debut);

  // ---------------------------------------------------------------------
  // Chronologie
  // ---------------------------------------------------------------------
  if (dVisite && dDevis && dVisite > dDevis) {
    add({
      code: "chrono_visite_devis",
      categorie: "chronologie",
      severite: "avertissement",
      titre: "Visite technique postérieure au devis",
      detail:
        "La visite technique est datée après le devis. Vérifiez la cohérence : la visite précède normalement le devis.",
    });
  }

  if (dDevis && dDebut) {
    if (dDebut < dDevis) {
      add({
        code: "chrono_devis_travaux",
        categorie: "chronologie",
        severite: "bloquant",
        titre: "Travaux commencés avant la signature du devis",
        detail:
          "Le début des travaux est antérieur au devis signé. C'est un motif de refus : l'engagement (devis + offre CEE) doit précéder les travaux.",
      });
    } else {
      add({
        code: "chrono_devis_travaux",
        categorie: "chronologie",
        severite: "ok",
        titre: "Devis antérieur au début des travaux",
        detail: "L'engagement précède bien les travaux.",
      });
    }
  } else {
    add({
      code: "chrono_devis_travaux_incomplet",
      categorie: "chronologie",
      severite: "avertissement",
      titre: "Chronologie devis/travaux incomplète",
      detail:
        "Date de devis ou de début des travaux manquante : impossible de vérifier l'antériorité de l'engagement.",
    });
  }

  if (dDebut && dFin && dFin < dDebut) {
    add({
      code: "chrono_debut_fin",
      categorie: "chronologie",
      severite: "bloquant",
      titre: "Fin des travaux antérieure au début",
      detail: "La date de fin des travaux précède la date de début.",
    });
  }

  if (dFin && dFacture && dFacture < dFin) {
    add({
      code: "chrono_fin_facture",
      categorie: "chronologie",
      severite: "avertissement",
      titre: "Facture antérieure à la fin des travaux",
      detail:
        "La facture est datée avant la fin des travaux. Une facture se établit normalement après achèvement.",
    });
  }

  if (dFacture && dFacture.getTime() - today.getTime() > jour) {
    add({
      code: "chrono_facture_futur",
      categorie: "chronologie",
      severite: "avertissement",
      titre: "Date de facture dans le futur",
      detail: "La date de facture est postérieure à aujourd'hui.",
    });
  }

  // ---------------------------------------------------------------------
  // Qualification RGE
  // ---------------------------------------------------------------------
  if (dRgeFin && dDevis) {
    if (dRgeFin < dDevis) {
      add({
        code: "rge_validite",
        categorie: "rge",
        severite: "bloquant",
        titre: "Qualification RGE expirée à la date du devis",
        detail: `La qualification RGE (valable jusqu'au ${dateFr(c.rge.date_fin)}) était expirée à la signature du devis. La qualification doit être valide à cette date.`,
      });
    } else {
      add({
        code: "rge_validite",
        categorie: "rge",
        severite: "ok",
        titre: "Qualification RGE valide à la date du devis",
        detail: "La qualification RGE couvre la date de signature du devis.",
      });
    }
  } else if (!dRgeFin) {
    add({
      code: "rge_date_fin_manquante",
      categorie: "rge",
      severite: "avertissement",
      titre: "Date de fin de validité RGE manquante",
      detail: "Impossible de vérifier la validité de la qualification RGE.",
    });
  }

  if (dRgeDebut && dDevis && dDevis < dRgeDebut) {
    add({
      code: "rge_debut",
      categorie: "rge",
      severite: "bloquant",
      titre: "Devis antérieur au début de validité RGE",
      detail:
        "Le devis a été signé avant la prise d'effet de la qualification RGE.",
    });
  }

  // ---------------------------------------------------------------------
  // Éligibilité du logement (> 2 ans à la date d'engagement)
  // ---------------------------------------------------------------------
  const anneeRef = (dDevis ?? today).getFullYear();
  const age = anneeRef - c.logement.annee_construction;
  if (age < 2) {
    add({
      code: "eligibilite_anciennete",
      categorie: "eligibilite",
      severite: "bloquant",
      titre: "Logement de moins de 2 ans",
      detail: `Le logement (construit en ${c.logement.annee_construction}) doit être achevé depuis plus de 2 ans à la date d'engagement pour être éligible aux CEE.`,
    });
  } else {
    add({
      code: "eligibilite_anciennete",
      categorie: "eligibilite",
      severite: "ok",
      titre: "Ancienneté du logement conforme",
      detail: `Logement construit en ${c.logement.annee_construction} (> 2 ans).`,
    });
  }

  // ---------------------------------------------------------------------
  // Performance technique (R minimal)
  // ---------------------------------------------------------------------
  const rMin = TYPES_ISOLATION[c.travaux.type_isolation].r_min;
  if (c.travaux.resistance_thermique_r < rMin) {
    add({
      code: "technique_resistance",
      categorie: "technique",
      severite: "bloquant",
      titre: "Résistance thermique R insuffisante",
      detail: `R = ${c.travaux.resistance_thermique_r} m²·K/W, en dessous du minimum de ${rMin} attendu pour ce poste (${TYPES_ISOLATION[c.travaux.type_isolation].label}).`,
    });
  } else {
    add({
      code: "technique_resistance",
      categorie: "technique",
      severite: "ok",
      titre: "Résistance thermique R conforme",
      detail: `R = ${c.travaux.resistance_thermique_r} ≥ ${rMin} m²·K/W.`,
    });
  }

  if (!c.travaux.isolant_marque || !c.travaux.isolant_reference) {
    add({
      code: "technique_produit",
      categorie: "pieces",
      severite: "avertissement",
      titre: "Marque ou référence de l'isolant manquante",
      detail:
        "La marque et la référence de l'isolant sont obligatoires sur le devis et la facture. Complétez-les pour éviter un refus.",
    });
  }

  // ---------------------------------------------------------------------
  // Cohérence des montants
  // ---------------------------------------------------------------------
  const { ht, ttc, prime_estime } = c.montants;
  if (ttc < ht) {
    add({
      code: "montants_ttc_ht",
      categorie: "montants",
      severite: "bloquant",
      titre: "Montant TTC inférieur au HT",
      detail: `TTC (${ttc} €) inférieur au HT (${ht} €).`,
    });
  } else if (ht > 0) {
    const taux = ttc / ht - 1;
    if (Math.abs(taux - TVA_ISOLATION) > 0.005) {
      add({
        code: "montants_tva",
        categorie: "montants",
        severite: "avertissement",
        titre: "Taux de TVA inhabituel",
        detail: `Le taux de TVA implicite est de ${(taux * 100).toFixed(1)} %. Les travaux d'isolation relèvent en principe du taux réduit de 5,5 %.`,
      });
    }
  }

  if (prime_estime != null && prime_estime > ttc) {
    add({
      code: "montants_prime",
      categorie: "montants",
      severite: "avertissement",
      titre: "Prime estimée supérieure au coût des travaux",
      detail: `La prime CEE estimée (${prime_estime} €) dépasse le montant TTC (${ttc} €).`,
    });
  }

  // ---------------------------------------------------------------------
  // Synthèse
  // ---------------------------------------------------------------------
  const nbBloquants = findings.filter((f) => f.severite === "bloquant").length;
  const nbAvertissements = findings.filter(
    (f) => f.severite === "avertissement",
  ).length;

  return {
    findings,
    nbBloquants,
    nbAvertissements,
    conforme: nbBloquants === 0,
  };
}
