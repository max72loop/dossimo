import type { StatutDossier, TypePiece } from "@/lib/database.types";
import { indexEtape } from "@/lib/dossier/parcours";
import type { RapportControle } from "@/lib/rules/types";

/**
 * Synthèse d'affichage de la page résultat : complétude, actions restantes,
 * niveau de risque, métriques de valeur.
 *
 * Ce module NE CALCULE AUCUNE RÈGLE MÉTIER. Il ne fait que dériver, depuis le
 * rapport de contrôle déterministe (`controlerDossier`), les pièces réelles
 * déjà comparées à la saisie et l'étape du parcours, un état lisible d'un coup
 * d'œil. Une seule source pour le hero, la carte « actions restantes » et les
 * métriques : ces trois blocs ne peuvent donc pas se contredire.
 */

// ---------------------------------------------------------------------------
// Complétude
// ---------------------------------------------------------------------------

/**
 * Quatre critères objectifs, chacun pondéré, chacun adossé à UNE action
 * restante. Le pourcentage et le nombre d'actions dérivent de la même liste.
 * Total = 100. Ajuster les poids ici.
 */
const POIDS = {
  controles: 40,
  devis: 20,
  facture: 20,
  depot: 20,
} as const;

/** Étape du parcours à partir de laquelle le dossier est prêt à déposer. */
const ETAPE_PRETE: StatutDossier = "pret_depot";

// ---------------------------------------------------------------------------
// Métriques de valeur
// ---------------------------------------------------------------------------

/**
 * Temps gagné — estimation indicative assumée, pas une mesure. Dossimo produit
 * cinq documents (récapitulatif, checklist, rapport, attestation, pack
 * assemblé), comptés à `MINUTES_PAR_DOCUMENT` de rédaction et de recopie
 * manuelle, et exécute les contrôles anti-refus du rapport, comptés à
 * `MINUTES_PAR_CONTROLE` de vérification à la main. À valider côté produit.
 */
const DOCUMENTS_GENERES = 5;
const MINUTES_PAR_DOCUMENT = 15;
const MINUTES_PAR_CONTROLE = 3;

export type NiveauRisque = "faible" | "moyen" | "eleve";

export const RISQUE_LABEL: Record<NiveauRisque, string> = {
  faible: "Faible",
  moyen: "Moyen",
  eleve: "Élevé",
};

/** Vue minimale d'une pièce réelle, suffisante pour la synthèse. */
export interface PieceSynthese {
  type: TypePiece;
  /** L'extraction automatique a abouti : la pièce a pu être comparée. */
  lue: boolean;
  nbEcarts: number;
}

export interface ActionRestante {
  id: "controles" | "devis" | "facture" | "depot";
  label: string;
  detail: string;
  fait: boolean;
}

export interface SyntheseDossier {
  /** Les quatre critères, faits ou non, dans l'ordre d'exécution. */
  actions: ActionRestante[];
  nbActionsRestantes: number;
  /** Complétude en pourcentage, dérivée des poids des critères satisfaits. */
  pourcentage: number;
  /** Les pièces réelles sont ajoutées et cohérentes avec la saisie. */
  piecesCompletes: boolean;
  risque: NiveauRisque;
  mentionsVerifiees: number;
  mentionsTotal: number;
  minutesGagnees: number;
  /** Contrôles anti-refus passés (findings « ok »). */
  nbControlesPasses: number;
  nbBloquants: number;
  conforme: boolean;
}

function pieceEtat(pieces: readonly PieceSynthese[], type: TypePiece) {
  const trouvees = pieces.filter((p) => p.type === type);
  const lue = trouvees.find((p) => p.lue);
  return {
    presente: trouvees.length > 0,
    lue: lue != null,
    nbEcarts: lue?.nbEcarts ?? 0,
  };
}

/**
 * Accords en genre : « le devis réel », « la facture réelle ». `reel` porte
 * l'adjectif en entier (le féminin double le « l », un simple suffixe donnerait
 * « réele ») ; `accord` suffit pour vérifié(e) et cohérent(e).
 */
const NOM_PIECE = {
  devis: {
    Titre: "Devis",
    defini: "le devis",
    contracte: "du devis",
    pronom: "le",
    reel: "réel",
    accord: "",
  },
  facture: {
    Titre: "Facture",
    defini: "la facture",
    contracte: "de la facture",
    pronom: "la",
    reel: "réelle",
    accord: "e",
  },
} as const;

function actionPiece(
  id: "devis" | "facture",
  etat: ReturnType<typeof pieceEtat>,
): ActionRestante {
  const n = NOM_PIECE[id];
  if (!etat.presente) {
    return {
      id,
      label: `Ajouter ${n.defini} ${n.reel}`,
      detail: `Dossimo relit ${n.defini} et ${n.pronom} compare à votre saisie avant dépôt.`,
      fait: false,
    };
  }
  if (!etat.lue) {
    return {
      id,
      label: `Remplacer ${n.defini} par un document lisible`,
      detail: `La lecture automatique ${n.contracte} a échoué : la cohérence avec la saisie n'a pas pu être vérifiée.`,
      fait: false,
    };
  }
  if (etat.nbEcarts > 0) {
    return {
      id,
      label: `Corriger ${etat.nbEcarts} écart${etat.nbEcarts > 1 ? "s" : ""} entre ${n.defini} et la saisie`,
      detail: `Un écart entre ${n.defini} et le dossier déposé est un motif de refus fréquent.`,
      fait: false,
    };
  }
  return {
    id,
    label: `${n.Titre} vérifié${n.accord} et cohérent${n.accord} avec la saisie`,
    detail: `Aucun écart relevé entre ${n.defini} et votre saisie.`,
    fait: true,
  };
}

export function syntheseDossier({
  rapport,
  pieces,
  statut,
  mentionsTotal,
}: {
  rapport: RapportControle;
  pieces: readonly PieceSynthese[];
  statut: StatutDossier;
  mentionsTotal: number;
}): SyntheseDossier {
  const devis = pieceEtat(pieces, "devis");
  const facture = pieceEtat(pieces, "facture");

  const actions: ActionRestante[] = [
    rapport.nbBloquants === 0
      ? {
          id: "controles",
          label: "Contrôles anti-refus passés",
          detail:
            "Chronologie, qualification RGE, performance technique et cohérence des montants : aucun point bloquant.",
          fait: true,
        }
      : {
          id: "controles",
          label: `Corriger ${rapport.nbBloquants} point${rapport.nbBloquants > 1 ? "s" : ""} bloquant${rapport.nbBloquants > 1 ? "s" : ""}`,
          detail:
            "Ces points entraînent un refus en l'état. Le détail des contrôles les liste un par un.",
          fait: false,
        },
    actionPiece("devis", devis),
    actionPiece("facture", facture),
    {
      id: "depot",
      label: "Placer le dossier sur l'étape « Prêt à déposer »",
      detail:
        "Une fois les pièces de la checklist réunies, dont la preuve du rôle actif et incitatif, avancez le dossier dans le parcours.",
      fait: indexEtape(statut) >= indexEtape(ETAPE_PRETE),
    },
  ];

  const pourcentage = actions.reduce(
    (total, a) => (a.fait ? total + POIDS[a.id] : total),
    0,
  );

  // Un seul indicateur de risque, repris tel quel par le hero et la carte
  // « risque de refus ». Un point bloquant vaut refus ; un écart pièce/saisie
  // ou un point à vérifier appelle une relecture ; sinon le risque est faible.
  const nbEcarts = devis.nbEcarts + facture.nbEcarts;
  const risque: NiveauRisque =
    rapport.nbBloquants > 0
      ? "eleve"
      : nbEcarts > 0 || rapport.nbAvertissements > 0
        ? "moyen"
        : "faible";

  // Mentions obligatoires vérifiées automatiquement : tant qu'aucun devis n'est
  // lu, aucune mention n'est contrôlée. Dès qu'il l'est, on retire une mention
  // par écart relevé. Heuristique explicite, à affiner quand l'extraction
  // remontera la présence mention par mention.
  const mentionsVerifiees = devis.lue
    ? Math.max(0, mentionsTotal - devis.nbEcarts)
    : 0;

  return {
    actions,
    nbActionsRestantes: actions.filter((a) => !a.fait).length,
    pourcentage,
    piecesCompletes: devis.lue && devis.nbEcarts === 0 && facture.lue && facture.nbEcarts === 0,
    risque,
    mentionsVerifiees,
    mentionsTotal,
    minutesGagnees:
      DOCUMENTS_GENERES * MINUTES_PAR_DOCUMENT +
      rapport.findings.length * MINUTES_PAR_CONTROLE,
    nbControlesPasses: rapport.nbConformes,
    nbBloquants: rapport.nbBloquants,
    conforme: rapport.conforme,
  };
}

/** « ≈ 1 h 40 », « ≈ 45 min ». */
export function formatDuree(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `≈ ${m} min`;
  return m === 0 ? `≈ ${h} h` : `≈ ${h} h ${String(m).padStart(2, "0")}`;
}
