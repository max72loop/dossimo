import type { DossierComplet } from "@/lib/dossier/get-dossier";
import { TYPES_ISOLATION, familleDeGeste } from "@/lib/dossier/cee-isolation";
import { DOMAINE_ATTENDU_LABEL } from "@/lib/verification/domaines";
import { dateFr } from "@/lib/pack/format";
import type { Finding, RapportControle } from "@/lib/rules/types";

const TVA_ISOLATION_DEFAUT = 0.055; // taux réduit rénovation énergétique (repli)
const ANCIENNETE_MIN_DEFAUT = 2; // années (repli)

/**
 * R minimal par poste d'isolation — REPLI UNIQUEMENT, quand aucune règle active
 * n'existe pour le couple (dispositif, type_travaux). La source de vérité est
 * `regles_metier.condition_json.r_min` (migration 0004), éditable dans
 * /admin/regles : elle gagne toujours, voir `rMin` plus bas.
 *
 * Ces valeurs vivaient dans `TYPES_ISOLATION` (référentiel de SAISIE), d'où le
 * formulaire les tirait aussi pour afficher son indication. Le formulaire lit
 * désormais la base (`fetchSeuilsIsolation`) : les deux affichages ne peuvent
 * plus diverger. Le repli reste ici, avec les autres replis du moteur, parce que
 * le moteur doit rester best-effort et jamais bloquant faute de règle.
 *
 * Si un arrêté change un seuil : corriger `regles_metier`, PAS cette constante.
 * Elle ne sert que le cas dégradé « aucune règle en base ».
 */
const R_MIN_DEFAUT: Record<string, number> = {
  combles_perdus: 7,
  rampants_toiture: 6,
  murs: 3.7,
  plancher_bas: 3,
};

/**
 * Surface hors-tout minimale des capteurs d'un CESI (BAR-TH-101). REPLI, comme
 * `R_MIN_DEFAUT` : `condition_json.surface_capteurs_min` gagne.
 *
 * La fiche ne fixe AUCUN maximum. Le plafond de 20 m² qu'on lit un peu partout
 * est le périmètre de la qualification QualiSol CESI, pas un critère
 * d'éligibilité : le contrôler ici refuserait des dossiers valides.
 */
const SOLAIRE_SURFACE_CAPTEURS_MIN_DEFAUT = 2;

/**
 * Efficacité énergétique ECS minimale d'un CESI (règlement UE 814/2013), par
 * énergie d'appoint et profil de soutirage — REPLI, surchargeable par
 * `condition_json.efficacite_ecs_min`.
 *
 * Le seuil dépend des DEUX dimensions, et l'écart entre les deux appoints va du
 * simple au triple : appliquer le seuil « autre énergie » à un appoint
 * électrique refuserait la quasi-totalité des CESI conformes du marché.
 *
 * Le CESI ne se qualifie PAS par une productivité de capteurs : ce critère
 * (>= 600 W/m²) appartient au BAR-TH-143, le système solaire combiné.
 */
const SOLAIRE_EFFICACITE_ECS_MIN_DEFAUT: Record<
  "electrique_joule" | "autre",
  Record<"M" | "L" | "XL" | "XXL", number>
> = {
  electrique_joule: { M: 36, L: 37, XL: 38, XXL: 60 },
  autre: { M: 95, L: 100, XL: 110, XXL: 120 },
};

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const jour = 86_400_000;

/**
 * Contrôle déterministe d'un dossier (CEE ou MaPrimeRénov', tous gestes).
 * @param today date de référence (injectable pour les tests).
 */
export function controlerDossier(
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
    (c.travaux?.type_isolation ? R_MIN_DEFAUT[c.travaux.type_isolation] ?? 0 : 0);

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
  // Identité entreprise (SIRENE) + qualification RGE (annuaires officiels)
  // ---------------------------------------------------------------------
  const verif = c.verification;
  const famille = familleDeGeste(c.geste ?? "isolation");

  // Vérification du SIRET auprès de l'Annuaire des Entreprises (SIRENE).
  if (verif && verif.entreprise.statut !== "non_verifie") {
    const nom = verif.entreprise.denomination;
    const suffixeNom = nom ? ` (${nom})` : "";
    if (verif.entreprise.statut === "actif") {
      add({
        code: "entreprise_siret",
        categorie: "entreprise",
        severite: "ok",
        titre: "Entreprise active au répertoire SIRENE",
        detail: `SIRET ${verif.siret} confirmé${suffixeNom} et actif au répertoire officiel des entreprises.`,
      });
    } else if (verif.entreprise.statut === "ferme") {
      add({
        code: "entreprise_siret",
        categorie: "entreprise",
        severite: "bloquant",
        titre: "Établissement fermé au répertoire SIRENE",
        detail: `Le SIRET ${verif.siret}${suffixeNom} correspond à un établissement fermé. Une facture émise par un établissement cessé est un motif de refus.`,
      });
    } else if (verif.entreprise.statut === "introuvable") {
      add({
        code: "entreprise_siret",
        categorie: "entreprise",
        severite: "bloquant",
        titre: "SIRET introuvable au répertoire SIRENE",
        detail: `Le SIRET ${verif.siret} n'existe pas au répertoire officiel des entreprises. Vérifiez la saisie : un SIRET erroné bloque le dossier.`,
      });
    } else if (verif.entreprise.statut === "indisponible") {
      add({
        code: "entreprise_siret",
        categorie: "entreprise",
        severite: "avertissement",
        titre: "SIRET non vérifié (annuaire indisponible)",
        detail:
          "L'Annuaire des Entreprises était injoignable au moment du contrôle. Le SIRET n'a pas pu être confirmé automatiquement ; vérifiez-le manuellement.",
      });
    }
  }

  // Qualification RGE via l'annuaire ADEME / France Rénov'. Quand l'annuaire a
  // tranché, il fait autorité sur les dates RGE auto-déclarées (voir plus bas).
  const rgeRegistreTranche =
    verif != null &&
    (verif.rge.statut === "couvert" ||
      verif.rge.statut === "expire" ||
      verif.rge.statut === "domaine_absent" ||
      verif.rge.statut === "aucune");

  if (verif && verif.rge.statut !== "non_verifie") {
    const q = verif.rge.retenue;
    const domaineLabel = DOMAINE_ATTENDU_LABEL[famille];
    if (verif.rge.statut === "couvert") {
      add({
        code: "rge_annuaire",
        categorie: "rge",
        severite: "ok",
        titre: "Qualification RGE confirmée à l'annuaire officiel",
        detail: `${q?.qualification || "Qualification RGE"}${q?.domaine ? ` — ${q.domaine}` : ""}${q?.organisme ? ` (${q.organisme})` : ""} : valide à la date du devis dans l'annuaire RGE ADEME / France Rénov'.`,
      });
    } else if (verif.rge.statut === "expire") {
      add({
        code: "rge_annuaire",
        categorie: "rge",
        severite: "bloquant",
        titre: "Qualification RGE expirée à la date du devis (annuaire officiel)",
        detail: `Une qualification RGE « ${domaineLabel} » existe pour ce SIRET mais n'était pas valide à la date du devis selon l'annuaire officiel. La qualification doit couvrir cette date.`,
      });
    } else if (verif.rge.statut === "domaine_absent") {
      add({
        code: "rge_annuaire",
        categorie: "rge",
        severite: "bloquant",
        titre: "Aucune qualification RGE pour ce type de geste (annuaire officiel)",
        detail: `L'entreprise a des qualifications RGE, mais aucune pour le domaine « ${domaineLabel} » requis par ce geste. Le dispositif exige une qualification RGE du bon domaine à la date du devis.`,
      });
    } else if (verif.rge.statut === "aucune") {
      add({
        code: "rge_annuaire",
        categorie: "rge",
        severite: "bloquant",
        titre: "Aucune qualification RGE trouvée pour ce SIRET (annuaire officiel)",
        detail:
          "L'annuaire RGE ADEME / France Rénov' ne recense aucune qualification RGE pour ce SIRET. Sans qualification RGE valide au moment du devis, le dossier sera refusé.",
      });
    } else if (verif.rge.statut === "indisponible") {
      add({
        code: "rge_annuaire",
        categorie: "rge",
        severite: "avertissement",
        titre: "Qualification RGE non vérifiée (annuaire indisponible)",
        detail:
          "L'annuaire RGE était injoignable au moment du contrôle. La qualification n'a pas pu être confirmée automatiquement ; vérifiez-la manuellement.",
      });
    }
  }

  // Contrôle de repli sur les dates RGE AUTO-DÉCLARÉES : seulement si l'annuaire
  // officiel n'a pas tranché (mode dégradé, dossier antérieur au contrôle,
  // panne réseau). Sinon l'annuaire, plus fiable, prime.
  if (!rgeRegistreTranche) {
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
  if (geste === "bois") {
    // Appareil de chauffage au bois : rendement énergétique. Seuil selon le
    // combustible (granulés ~80 %, bûches ~75 %), surchargeable par la règle
    // métier (rendement_min).
    const rendementMin =
      cond?.rendement_min ?? (c.bois?.combustible === "buches" ? 75 : 80);
    const rendement = c.bois?.rendement;
    if (rendement == null) {
      add({
        code: "technique_rendement",
        categorie: "technique",
        severite: "avertissement",
        titre: "Rendement non renseigné",
        detail: "Le rendement énergétique de l'appareil est nécessaire pour vérifier son éligibilité.",
      });
    } else if (rendement < rendementMin) {
      add({
        code: "technique_rendement",
        categorie: "technique",
        severite: "bloquant",
        titre: "Rendement insuffisant",
        detail: `Rendement = ${rendement} %, en dessous du minimum de ${rendementMin} % attendu (combustible ${c.bois?.combustible ?? "?"}).`,
      });
    } else {
      add({
        code: "technique_rendement",
        categorie: "technique",
        severite: "ok",
        titre: "Rendement conforme",
        detail: `Rendement = ${rendement} % >= ${rendementMin} % (combustible ${c.bois?.combustible ?? "?"}).`,
      });
    }
    if (!c.bois?.marque || !c.bois?.reference) {
      add({
        code: "technique_produit",
        categorie: "pieces",
        severite: "avertissement",
        titre: "Marque ou référence de l'appareil manquante",
        detail: "La marque et la référence de l'appareil (label Flamme Verte) sont obligatoires sur le devis et la facture.",
      });
    }
  } else if (geste === "cet") {
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
  } else if (geste === "solaire_thermique") {
    // Chauffe-eau solaire individuel (BAR-TH-101). Deux critères de fiche :
    // l'efficacité énergétique ECS (croisée appoint × profil de soutirage) et la
    // surface hors-tout des capteurs.
    const s = c.solaire;
    const surfaceMin =
      typeof cond?.surface_capteurs_min === "number"
        ? cond.surface_capteurs_min
        : SOLAIRE_SURFACE_CAPTEURS_MIN_DEFAUT;
    const surface = s?.surface_capteurs_m2;
    if (surface == null) {
      add({
        code: "technique_surface_capteurs",
        categorie: "technique",
        severite: "avertissement",
        titre: "Surface de capteurs non renseignée",
        detail:
          "La surface hors-tout des capteurs est nécessaire pour vérifier l'éligibilité du chauffe-eau solaire.",
      });
    } else if (surface < surfaceMin) {
      add({
        code: "technique_surface_capteurs",
        categorie: "technique",
        severite: "bloquant",
        titre: "Surface de capteurs insuffisante",
        detail: `Surface hors-tout = ${surface} m², en dessous du minimum de ${surfaceMin} m² exigé par le BAR-TH-101.`,
      });
    } else {
      add({
        code: "technique_surface_capteurs",
        categorie: "technique",
        severite: "ok",
        titre: "Surface de capteurs conforme",
        detail: `Surface hors-tout = ${surface} m² >= ${surfaceMin} m².`,
      });
    }

    const efficacite = s?.efficacite_ecs;
    // Le seuil dépend de l'appoint ET du profil : sans l'un des deux, on ne
    // peut pas le déterminer, et on se tait plutôt que d'en supposer un.
    const seuilTable =
      s?.appoint && s?.profil_soutirage
        ? SOLAIRE_EFFICACITE_ECS_MIN_DEFAUT[s.appoint][s.profil_soutirage]
        : null;
    const efficaciteMin = cond?.efficacite_ecs_min ?? seuilTable;
    if (efficacite == null || efficaciteMin == null) {
      add({
        code: "technique_efficacite_ecs",
        categorie: "technique",
        severite: "avertissement",
        titre: "Efficacité énergétique ECS non contrôlable",
        detail:
          "L'efficacité énergétique pour le chauffage de l'eau, l'énergie de l'appoint et le profil de soutirage sont nécessaires pour vérifier l'éligibilité du chauffe-eau solaire.",
      });
    } else if (efficacite < efficaciteMin) {
      add({
        code: "technique_efficacite_ecs",
        categorie: "technique",
        severite: "bloquant",
        titre: "Efficacité énergétique ECS insuffisante",
        detail: `Efficacité = ${efficacite} %, en dessous du minimum de ${efficaciteMin} % attendu (appoint ${s?.appoint === "electrique_joule" ? "électrique à effet Joule" : "autre énergie"}, profil ${s?.profil_soutirage ?? "?"}).`,
      });
    } else {
      add({
        code: "technique_efficacite_ecs",
        categorie: "technique",
        severite: "ok",
        titre: "Efficacité énergétique ECS conforme",
        detail: `Efficacité = ${efficacite} % >= ${efficaciteMin} % (profil ${s?.profil_soutirage ?? "?"}).`,
      });
    }

    // Ballon <= 500 L : classe d'efficacité C a minima (règlement UE 812/2013).
    // Au-delà de 500 L, la fiche n'exige pas de classe : ne rien réclamer.
    if (s?.volume_ballon_l != null && s.volume_ballon_l <= 500) {
      const classe = (s.classe_ballon ?? "").trim().toUpperCase();
      const CLASSES_ADMISES = ["A+++", "A++", "A+", "A", "B", "C"];
      if (!classe) {
        add({
          code: "technique_classe_ballon",
          categorie: "technique",
          severite: "avertissement",
          titre: "Classe d'efficacité du ballon non renseignée",
          detail: `Le ballon fait ${s.volume_ballon_l} L (<= 500 L) : le BAR-TH-101 exige une classe d'efficacité énergétique C a minima.`,
        });
      } else if (!CLASSES_ADMISES.includes(classe)) {
        add({
          code: "technique_classe_ballon",
          categorie: "technique",
          severite: "bloquant",
          titre: "Classe d'efficacité du ballon insuffisante",
          detail: `Classe ${classe} pour un ballon de ${s.volume_ballon_l} L : le BAR-TH-101 exige la classe C a minima.`,
        });
      }
    }

    if (!s?.certification) {
      add({
        code: "technique_certification",
        categorie: "pieces",
        severite: "avertissement",
        titre: "Certification des capteurs non renseignée",
        detail:
          "Les capteurs doivent être certifiés CSTBat ou Solar Keymark (ou justifier d'une équivalence par un organisme accrédité). Le justificatif est exigé au contrôle.",
      });
    }
    if (!s?.marque || !s?.reference) {
      add({
        code: "technique_produit",
        categorie: "pieces",
        severite: "avertissement",
        titre: "Marque ou référence du chauffe-eau solaire manquante",
        detail:
          "À défaut de porter toutes les caractéristiques techniques, la facture doit mentionner la marque et la référence de l'équipement, complétées par un document du fabricant.",
      });
    }
  } else {
    // Isolation. Le bloc `travaux` est le bloc technique de cette famille ; son
    // absence signale une donnée incohérente (geste isolation sans ses
    // caractéristiques), signalée comme les autres blocs techniques absents.
    const t = c.travaux;
    if (!t) {
      add({
        code: "technique_resistance",
        categorie: "technique",
        severite: "avertissement",
        titre: "Caractéristiques techniques de l'isolation manquantes",
        detail:
          "Surface, résistance thermique R et isolant ne sont pas renseignés : la conformité technique n'a pas pu être contrôlée.",
      });
    } else if (t.resistance_thermique_r < rMin) {
      add({
        code: "technique_resistance",
        categorie: "technique",
        severite: "bloquant",
        titre: "Résistance thermique R insuffisante",
        detail: `R = ${t.resistance_thermique_r} m²·K/W, en dessous du minimum de ${rMin} attendu pour ce poste (${TYPES_ISOLATION[t.type_isolation].label}).`,
      });
    } else {
      add({
        code: "technique_resistance",
        categorie: "technique",
        severite: "ok",
        titre: "Résistance thermique R conforme",
        detail: `R = ${t.resistance_thermique_r} >= ${rMin} m²·K/W.`,
      });
    }

    if (t && (!t.isolant_marque || !t.isolant_reference)) {
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
  const nbConformes = findings.filter((f) => f.severite === "ok").length;

  return {
    findings,
    nbBloquants,
    nbAvertissements,
    nbConformes,
    conforme: nbBloquants === 0,
  };
}
