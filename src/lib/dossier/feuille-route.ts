import type { Dispositif } from "@/lib/database.types";
import type { DossierComplet } from "@/lib/dossier/get-dossier";
import { depotGuide } from "@/lib/dossier/depot-guide";

/**
 * Feuille de route de dépôt : le chemin daté du dossier, l'échéance légale qui
 * en découle, et le destinataire du pack. Entièrement dérivée des dates déjà
 * saisies (`dates_json`) et du guide de dépôt (`depot-guide.ts`) — aucune
 * nouvelle donnée, aucune règle métier ici : le calcul est déterministe et
 * l'échéance vient de la fenêtre réglementaire du dispositif.
 *
 * Rappel de positionnement (CLAUDE.md §2) : Dossimo ne dépose JAMAIS. La feuille
 * de route dit à l'artisan quoi faire et avant quand, elle ne dépose rien.
 */

/** Fenêtre CEE : le dossier doit parvenir à l'obligé dans les 3 mois de la facture. */
const MOIS_LIMITE_CEE = 3;
/** En deçà de ce nombre de jours restants, l'échéance passe en alerte. */
export const SEUIL_ALERTE_JOURS = 21;
const JOUR_MS = 86_400_000;

export type Urgence = "calme" | "proche" | "depasse";

export interface EtapeRoute {
  titre: string;
  /** Date ISO (yyyy-mm-dd) de l'étape, ou null si non datée / à venir. */
  date: string | null;
  fait: boolean;
  detail?: string;
}

export interface Echeance {
  /** Date limite, ISO yyyy-mm-dd. */
  date: string;
  /** Jours restants avant l'échéance (négatif = dépassée). */
  joursRestants: number;
  urgence: Urgence;
}

export interface ProchaineAction {
  titre: string;
  detail: string;
  /** Qui effectue l'action (jamais Dossimo). */
  qui: string;
  echeance: Echeance | null;
}

export interface FeuilleRoute {
  dispositif: Dispositif;
  etapes: EtapeRoute[];
  prochaine: ProchaineAction | null;
  destinataire: string;
  destinataireDetail: string;
}

/**
 * Ajoute `n` mois à une date ISO en bornant le jour au dernier jour du mois
 * cible (31 janvier + 1 mois → 28/29 février, jamais un 31 février fantôme qui
 * déborderait sur mars). Retourne une date ISO yyyy-mm-dd.
 */
export function ajouterMois(iso: string, n: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  const jour = d.getUTCDate();
  const cible = new Date(d);
  cible.setUTCDate(1);
  cible.setUTCMonth(cible.getUTCMonth() + n);
  const dernierJour = new Date(
    Date.UTC(cible.getUTCFullYear(), cible.getUTCMonth() + 1, 0),
  ).getUTCDate();
  cible.setUTCDate(Math.min(jour, dernierJour));
  return cible.toISOString().slice(0, 10);
}

/** Jours pleins entre `now` et une date ISO (arrondi au supérieur). */
function joursAvant(dateIso: string, now: Date): number {
  const cible = new Date(`${dateIso.slice(0, 10)}T00:00:00Z`).getTime();
  const base = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).getTime();
  return Math.round((cible - base) / JOUR_MS);
}

function echeance(dateIso: string, now: Date): Echeance {
  const joursRestants = joursAvant(dateIso, now);
  const urgence: Urgence =
    joursRestants < 0
      ? "depasse"
      : joursRestants <= SEUIL_ALERTE_JOURS
        ? "proche"
        : "calme";
  return { date: dateIso, joursRestants, urgence };
}

const fait = (iso: string | null, now: Date) =>
  Boolean(iso) && new Date(`${iso!.slice(0, 10)}T00:00:00Z`).getTime() <= now.getTime();

function routeCee(data: DossierComplet, now: Date): Omit<FeuilleRoute, "dispositif" | "destinataire" | "destinataireDetail"> {
  const d = data.dates;
  const guide = depotGuide("cee");
  const brut: (EtapeRoute | null)[] = [
    d.visite_technique
      ? { titre: "Visite technique", date: d.visite_technique, fait: fait(d.visite_technique, now) }
      : null,
    {
      titre: "Devis signé",
      date: d.devis,
      fait: fait(d.devis, now),
      detail:
        "L'offre CEE doit avoir été proposée avant cette signature (antériorité du rôle actif et incitatif).",
    },
    d.debut_travaux
      ? { titre: "Travaux réalisés", date: d.fin_travaux ?? d.debut_travaux, fait: fait(d.fin_travaux ?? d.debut_travaux, now) }
      : null,
    { titre: "Facture émise", date: d.facture, fait: fait(d.facture, now) },
  ];
  const etapes = brut.filter((e): e is EtapeRoute => e !== null);

  const prochaine: ProchaineAction = d.facture
    ? {
        titre: "Transmettre le pack complet à l'obligé",
        detail:
          "Fenêtre légale de dépôt : 3 mois après la date de facture. Passé ce délai, le CEE n'est plus valorisable et la prime est perdue.",
        qui: guide.quiDepose,
        echeance: echeance(ajouterMois(d.facture, MOIS_LIMITE_CEE), now),
      }
    : {
        titre: "Terminer les travaux et facturer",
        detail:
          "La fenêtre de dépôt à l'obligé (3 mois) démarre à la date de facture. Facturez pour figer l'échéance.",
        qui: guide.quiDepose,
        echeance: null,
      };

  return { etapes, prochaine };
}

function routeMpr(data: DossierComplet, now: Date): Omit<FeuilleRoute, "dispositif" | "destinataire" | "destinataireDetail"> {
  const d = data.dates;
  const guide = depotGuide("maprimerenov");
  const travauxCommences = fait(d.debut_travaux, now);

  const brut: (EtapeRoute | null)[] = [
    { titre: "Devis signé", date: d.devis, fait: fait(d.devis, now) },
    {
      titre: "Demande déposée et accord de l'Anah",
      date: null,
      fait: false,
      detail: "À faire par le client AVANT le début des travaux.",
    },
    d.debut_travaux
      ? { titre: "Travaux réalisés", date: d.fin_travaux ?? d.debut_travaux, fait: fait(d.fin_travaux ?? d.debut_travaux, now) }
      : null,
    { titre: "Facture émise", date: d.facture, fait: fait(d.facture, now) },
  ];
  const etapes = brut.filter((e): e is EtapeRoute => e !== null);

  // Avant travaux : le geste critique est la demande, à déposer avant le début
  // du chantier. L'échéance est donc la date de début de travaux prévue.
  const prochaine: ProchaineAction = !travauxCommences
    ? {
        titre: "Le client dépose sa demande sur maprimerenov.gouv.fr",
        detail:
          "La demande doit être faite et acceptée AVANT le début des travaux : c'est le premier motif de refus MaPrimeRénov'.",
        qui: guide.quiDepose,
        echeance: d.debut_travaux ? echeance(d.debut_travaux, now) : null,
      }
    : d.facture
      ? {
          titre: "Le client dépose sa demande de solde avec la facture",
          detail:
            "Une fois le chantier terminé, ce dépôt déclenche le versement de la prime sur le compte du bénéficiaire.",
          qui: guide.quiDepose,
          echeance: null,
        }
      : {
          titre: "Terminer les travaux puis déposer la demande de solde",
          detail:
            "Le versement se déclenche au dépôt du solde, facture à l'appui, par le bénéficiaire.",
          qui: guide.quiDepose,
          echeance: null,
        };

  return { etapes, prochaine };
}

export function feuilleRoute(data: DossierComplet, now: Date = new Date()): FeuilleRoute {
  const dispositif = data.dossier.dispositif;
  const guide = depotGuide(dispositif);
  const base =
    dispositif === "maprimerenov" ? routeMpr(data, now) : routeCee(data, now);
  return {
    dispositif,
    ...base,
    destinataire: guide.destinataire,
    destinataireDetail: guide.destinataireDetail,
  };
}
