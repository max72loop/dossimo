import { piecesCeeIsolation, type PieceRequise } from "@/lib/pack/pieces-cee-isolation";
import type { DossierComplet } from "@/lib/dossier/get-dossier";
import type { PieceJustificative, TypePiece } from "@/lib/database.types";

/**
 * La checklist, reliée aux pièces réellement déposées.
 *
 * Jusqu'ici c'étaient deux mondes : d'un côté une liste de cases à cocher inertes,
 * de l'autre des pièces en base. Rien ne disait « la fiche technique est arrivée ».
 * L'artisan cochait dans sa tête, et le « pack complet et vérifié » n'était vérifié
 * que sur le devis et la facture.
 *
 * Le liant tient dans `TYPES` : quel(s) type(s) de pièce satisfont quelle entrée de
 * la checklist. Les identifiants coïncident presque tous (c'était l'intention des
 * migrations 0016 et 0019) ; les deux exceptions sont explicites ici plutôt que
 * devinées ailleurs.
 */

export type Fournisseur = "artisan" | "beneficiaire";

/** Quel(s) type(s) de pièce satisfont chaque entrée de la checklist. */
const TYPES: Record<string, TypePiece[]> = {
  // Artisan
  devis_signe: ["devis"],
  facture: ["facture"],
  qualification_rge: ["qualification_rge"],
  fiche_technique: ["fiche_technique"],
  cadre_contribution: ["cadre_contribution"],
  attestation_honneur: ["attestation_honneur"],
  // Deux clichés, deux pièces : une seule photo ne prouve rien.
  photos: ["photo_avant", "photo_apres"],
  // Bénéficiaire
  piece_identite: ["piece_identite"],
  avis_imposition: ["avis_imposition"],
  titre_propriete: ["titre_propriete"],
  rib: ["rib"],
  attestation_bailleur: ["attestation_bailleur"],
};

/** Ce que le bénéficiaire fournit, et lui seul : l'artisan ne peut pas le déposer. */
const DU_BENEFICIAIRE = new Set([
  "piece_identite",
  "avis_imposition",
  "titre_propriete",
  "rib",
  "attestation_bailleur",
]);

export interface EntreeChecklist extends PieceRequise {
  fournisseur: Fournisseur;
  /** Types qui satisfont l'entrée. Vide = pièce non téléversable (règle inconnue). */
  types: TypePiece[];
  /** Types encore manquants — ce qu'il reste à déposer pour cocher la case. */
  manquants: TypePiece[];
  /** L'entrée est satisfaite : TOUS ses types sont déposés. */
  deposee: boolean;
}

/**
 * La checklist du dossier, chaque entrée sachant si elle est satisfaite. Pure : la
 * vue lui passe les lignes, elle rend un état.
 */
export function checklistDossier(
  data: DossierComplet,
  pieces: readonly PieceJustificative[],
): EntreeChecklist[] {
  // Une pièce rejetée par l'artisan n'est pas une pièce fournie. Compter son seul
  // type cochait la case et affichait le dossier comme réuni, alors que le rejet
  // signifie précisément « recommence ». Les autres statuts (`submitted`, `approved`,
  // et `null` pour les dépôts artisan qui ne passent par aucune revue) comptent :
  // la case dit « c'est arrivé », pas « c'est validé ».
  const presents = new Set(
    pieces.filter((p) => p.validation_status !== "rejected").map((p) => p.type),
  );

  return piecesCeeIsolation(data).map((p) => {
    const types = TYPES[p.id] ?? [];
    const manquants = types.filter((t) => !presents.has(t));
    return {
      ...p,
      fournisseur: DU_BENEFICIAIRE.has(p.id) ? "beneficiaire" : "artisan",
      types,
      manquants,
      // Une entrée sans type connu n'est jamais « déposée » : mieux vaut une case
      // vide qu'une case cochée à tort sur une pièce que personne n'a fournie.
      deposee: types.length > 0 && manquants.length === 0,
    };
  });
}

/** Combien de pièces obligatoires sont réunies, sur combien d'exigées. */
export function completude(entrees: readonly EntreeChecklist[]): {
  reunies: number;
  total: number;
} {
  const obligatoires = entrees.filter((e) => e.obligatoire);
  return {
    reunies: obligatoires.filter((e) => e.deposee).length,
    total: obligatoires.length,
  };
}

/**
 * Résumé de complétude prêt à afficher (feuille de route, page dossier) : le
 * ratio réuni/exigé et les libellés des pièces obligatoires encore manquantes.
 */
export function resumePieces(entrees: readonly EntreeChecklist[]): {
  reunies: number;
  total: number;
  manquantes: string[];
} {
  const { reunies, total } = completude(entrees);
  const manquantes = entrees
    .filter((e) => e.obligatoire && !e.deposee)
    .map((e) => e.label);
  return { reunies, total, manquantes };
}
