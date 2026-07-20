import { piecesAttendues } from "@/lib/depot/pieces-attendues";
import type { DossierComplet } from "@/lib/dossier/get-dossier";
import type { PieceJustificative } from "@/lib/database.types";

/**
 * Où en sont les pièces du bénéficiaire, vu de l'artisan.
 *
 * Le client dépose quand il veut, depuis son téléphone, sans que l'artisan soit
 * là. Sans ce suivi, une pièce qui arrive n'existe pour personne : l'artisan la
 * découvre en rouvrant le dossier, par hasard — alors que cette pièce vient
 * peut-être de faire basculer son dossier en refus certain (un avis d'imposition
 * qui contredit la catégorie de revenus déclarée).
 *
 * Pur : la vue lui donne les lignes, il rend un état. Testable sans base.
 */
export interface SuiviPieces {
  /** Nombre de pièces que CE dossier réclame au bénéficiaire. 0 = aucune. */
  attendues: number;
  /** Combien sont arrivées. */
  recues: number;
  /**
   * Arrivées depuis le dernier passage de l'artisan sur le dossier. C'est le
   * seul chiffre qui appelle une action : le reste, il l'a déjà vu.
   */
  nouvelles: number;
  complet: boolean;
}

export function suivrePieces(
  data: DossierComplet,
  pieces: readonly PieceJustificative[],
  vuesAt: string | null,
): SuiviPieces {
  const attendues = piecesAttendues(data);
  if (attendues.length === 0) {
    return { attendues: 0, recues: 0, nouvelles: 0, complet: true };
  }

  const types = new Set(attendues.map((a) => a.type as string));
  const duClient = pieces.filter(
    (p) => p.deposant === "beneficiaire" && types.has(p.type),
  );

  // Jamais ouvert depuis que les pièces existent : tout est nouveau. C'est le bon
  // défaut, mieux vaut signaler une pièce déjà vue que taire celle qui bloque.
  const seuil = vuesAt ? new Date(vuesAt).getTime() : 0;

  // `nouvelles` et `recues` se comptent dans la MÊME unité, la pièce attendue, sinon
  // l'artisan lit « 2 nouvelles » sur « 1 sur 1 reçue » dès qu'un client envoie le
  // recto et le verso de sa carte d'identité.
  const nouvelles = new Set(
    duClient
      .filter((p) => new Date(p.created_at).getTime() > seuil)
      .map((p) => p.type),
  ).size;

  // Une pièce par type attendu : deux fichiers pour un même document ne font pas
  // deux pièces reçues (une carte d'identité recto-verso reste une carte d'identité).
  const recues = new Set(duClient.map((p) => p.type)).size;

  return {
    attendues: attendues.length,
    recues,
    nouvelles,
    complet: recues >= attendues.length,
  };
}
