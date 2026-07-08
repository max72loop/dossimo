import type { DossierComplet } from "@/lib/dossier/get-dossier";
import { TYPES_ISOLATION } from "@/lib/dossier/cee-isolation";
import { dateFr } from "@/lib/pack/format";
import type { Finding, RapportControle } from "@/lib/rules/types";

const TVA_ISOLATION_DEFAUT = 0.055; // taux réduit rénovation énergétique (repli)
const ANCIENNETE_MIN_DEFAUT = 2; // années (repli)

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

  // Paramètres pilotés par la règle métier éditable (§7/§9.4), avec repli codé.
  const cond = data.regle?.condition;
  const tvaAttendue = cond?.tva_taux ?? TVA_ISOLATION_DEFAUT;
  const ancienneteMin = cond?.anciennete_min_ans ?? ANCIENNETE_MIN_DEFAUT;
  const rMin =
    cond?.r_min ??
    (c.travaux?.type_isolation ? TYPES_ISOLATION[c.travaux.type_isolation].r_min : 0);

  const dispositif = data.dossier.dispositif;
  const dispositifLabel =
    dispositif === "maprimerenov" ? "MaPrimeRénov'" : "CEE";

  // Éligibilité du geste au dispositif : côté MaPrimeRénov', l'absence de règle
  // active pour ce type de travaux = geste non couvert (ex. isolation des murs,
  // sortie du parcours par geste en 2026).
  if (dispositif === "maprimerenov" && !data.regle) {
    add({
      code: "eligibilite_dispositif",
      categorie: "eligibilite",
      severite: "bloquant",
      titre: "Geste non éligible à MaPrimeRénov'",
      detail:
        "Aucune règle MaPrimeRénov' active pour ce type de travaux. En 2026, certains gestes (isolation des murs par ex.) ne sont plus éligibles au parcours par geste.",
    });
  }

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
  if (age < ancienneteMin) {
    add({
      code: "eligibilite_anciennete",
      categorie: "eligibilite",
      severite: "bloquant",
      titre: `Logement de moins de ${ancienneteMin} ans`,
      detail: `Le logement (construit en ${c.logement.annee_construction}) doit être achevé depuis plus de ${ancienneteMin} ans à la date d'engagement pour être éligible à ${dispositifLabel}.`,
    });
  } else {
    add({
      code: "eligibilite_anciennete",
      categorie: "eligibilite",
      severite: "ok",
      titre: "Ancienneté du logement conforme",
      detail: `Logement construit en ${c.logement.annee_construction} (> ${ancienneteMin} ans).`,
    });
  }

  // ---------------------------------------------------------------------
  // Performance technique (seuil piloté par la règle métier, selon le geste)
  // ---------------------------------------------------------------------
  const geste = c.geste ?? "isolation";
  if (geste === "cet") {
    // Chauffe-eau thermodynamique : coefficient de performance (COP) selon le
    // profil de soutirage (EN 16147). Seuil par défaut 2,5, surchargeable par
    // la règle métier (cop_min).
    const copMin = cond?.cop_min ?? 2.5;
    const cop = c.cet?.cop;
    if (cop == null) {
      add({
        code: "technique_cop",
        categorie: "technique",
        severite: "avertissement",
        titre: "COP non renseigné",
        detail: "Le coefficient de performance (COP) est nécessaire pour vérifier l'éligibilité du chauffe-eau thermodynamique.",
      });
    } else if (cop < copMin) {
      add({
        code: "technique_cop",
        categorie: "technique",
        severite: "bloquant",
        titre: "COP insuffisant",
        detail: `COP = ${cop}, en dessous du minimum de ${copMin} attendu (profil de soutirage ${c.cet?.profil_soutirage ?? "?"}).`,
      });
    } else {
      add({
        code: "technique_cop",
        categorie: "technique",
        severite: "ok",
        titre: "COP conforme",
        detail: `COP = ${cop} >= ${copMin} (profil ${c.cet?.profil_soutirage ?? "?"}).`,
      });
    }
    if (!c.cet?.marque || !c.cet?.reference) {
      add({
        code: "technique_produit",
        categorie: "pieces",
        severite: "avertissement",
        titre: "Marque ou référence de l'appareil manquante",
        detail: "La marque et la référence du chauffe-eau thermodynamique sont obligatoires sur le devis et la facture.",
      });
    }
  } else if (geste === "pac_air_eau") {
    // Pompe à chaleur air/eau : efficacité énergétique saisonnière (ETAS).
    // Seuil selon le régime de température (basse ~126 %, moyenne/haute ~111 %),
    // surchargeable par la règle métier.
    const etasMin = cond?.etas_min ?? (c.pac?.temperature === "basse" ? 126 : 111);
    const etas = c.pac?.etas;
    if (etas == null) {
      add({
        code: "technique_etas",
        categorie: "technique",
        severite: "avertissement",
        titre: "ETAS non renseignée",
        detail: "L'efficacité énergétique saisonnière (ETAS) est nécessaire pour vérifier l'éligibilité de la PAC.",
      });
    } else if (etas < etasMin) {
      add({
        code: "technique_etas",
        categorie: "technique",
        severite: "bloquant",
        titre: "ETAS insuffisante",
        detail: `ETAS = ${etas} %, en dessous du minimum de ${etasMin} % attendu pour ce type de pompe à chaleur.`,
      });
    } else {
      add({
        code: "technique_etas",
        categorie: "technique",
        severite: "ok",
        titre: "ETAS conforme",
        detail: `ETAS = ${etas} % >= ${etasMin} %.`,
      });
    }
    if (!c.pac?.regulateur_classe) {
      add({
        code: "technique_regulateur",
        categorie: "technique",
        severite: "avertissement",
        titre: "Classe du régulateur non renseignée",
        detail: "Un régulateur de classe IV à VIII est requis (BAR-TH-171). Renseignez-la et vérifiez la note de dimensionnement.",
      });
    }
  } else {
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
        detail: `R = ${c.travaux.resistance_thermique_r} >= ${rMin} m²·K/W.`,
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
    if (Math.abs(taux - tvaAttendue) > 0.005) {
      add({
        code: "montants_tva",
        categorie: "montants",
        severite: "avertissement",
        titre: "Taux de TVA inhabituel",
        detail: `Le taux de TVA implicite est de ${(taux * 100).toFixed(1)} %. Les travaux d'isolation relèvent en principe du taux réduit de ${(tvaAttendue * 100).toFixed(1).replace(".", ",")} %.`,
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
