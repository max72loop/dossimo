import { piecesCeeIsolation } from "@/lib/pack/pieces-cee-isolation";
import type { DossierComplet } from "@/lib/dossier/get-dossier";
import type { TypePiece } from "@/lib/database.types";

/**
 * Ce que le BÉNÉFICIAIRE doit fournir, et lui seul.
 *
 * Les conditions (MaPrimeRénov' ? bailleur ? ménage modeste ?) ne sont pas
 * réécrites ici : elles vivent déjà dans la checklist `piecesCeeIsolation`, pilotée
 * par la règle métier en base. On se contente d'y filtrer les pièces qui relèvent du
 * client plutôt que de l'artisan — deux listes qui divergeraient finiraient par
 * réclamer au client une pièce que le dossier n'exige pas, ou l'inverse.
 *
 * Les identifiants sont ceux de la checklist ET de l'enum `type_piece` (migration
 * 0016) : c'est la clé commune qui permet de cocher la liste quand la pièce arrive.
 */
export const PIECES_BENEFICIAIRE = [
  "piece_identite",
  "avis_imposition",
  "titre_propriete",
  "rib",
  "attestation_bailleur",
] as const satisfies readonly TypePiece[];

export type PieceBeneficiaire = (typeof PIECES_BENEFICIAIRE)[number];

const EST_BENEFICIAIRE = new Set<string>(PIECES_BENEFICIAIRE);

/**
 * Libellés destinés au CLIENT, pas à l'artisan. La checklist parle le langage du
 * métier (« justificatif d'occupation à titre de résidence principale ») ; ici on
 * s'adresse à quelqu'un qui n'a jamais entendu parler de CEE et qui doit comprendre,
 * sur son téléphone, quel papier photographier.
 */
const LIBELLES: Record<PieceBeneficiaire, { titre: string; aide: string }> = {
  piece_identite: {
    titre: "Votre pièce d'identité",
    aide: "Carte d'identité (recto-verso) ou passeport, en cours de validité.",
  },
  avis_imposition: {
    titre: "Votre dernier avis d'imposition",
    aide: "L'avis complet reçu cette année. C'est lui qui détermine le montant de votre aide.",
  },
  titre_propriete: {
    titre: "Un justificatif de propriété",
    aide: "Titre de propriété, acte notarié, ou votre dernière taxe foncière.",
  },
  rib: {
    titre: "Votre RIB",
    aide: "Le compte sur lequel l'aide vous sera versée. À votre nom.",
  },
  attestation_bailleur: {
    titre: "Votre engagement de bailleur",
    aide: "L'attestation par laquelle vous vous engagez à louer le logement après les travaux.",
  },
};

export interface PieceAttendue {
  type: PieceBeneficiaire;
  titre: string;
  aide: string;
}

/** Les pièces que ce dossier-ci réclame au bénéficiaire. Vide si aucune. */
export function piecesAttendues(data: DossierComplet): PieceAttendue[] {
  return piecesCeeIsolation(data)
    .filter((p) => EST_BENEFICIAIRE.has(p.id))
    .map((p) => {
      const type = p.id as PieceBeneficiaire;
      return { type, ...LIBELLES[type] };
    });
}
