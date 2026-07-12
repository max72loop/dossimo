import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { DossierComplet } from "@/lib/dossier/get-dossier";
import type { PieceJustificative } from "@/lib/database.types";
import { comparerPiece, type Comparaison } from "@/lib/piece/compare";
import type { ExtractedPiece } from "@/lib/piece/extract";
import type { MentionVerifiee } from "@/lib/piece/mentions";
import type { PieceControlee } from "@/lib/rules/controle-pieces";

export interface PieceAvecEcarts {
  piece: PieceJustificative;
  /** Écarts entre les valeurs lues sur la pièce et la saisie unique. */
  comparaisons: Comparaison[];
  /**
   * Mentions obligatoires relevées sur la pièce. `null` = contrôle non effectué
   * (pièce antérieure à la vérification des mentions, ou lecture en échec) —
   * à distinguer d'un tableau vide, qui signifie « aucune mention exigée ».
   */
  mentions: MentionVerifiee[] | null;
}

/**
 * Charge les pièces d'un dossier (auth-scopé, RLS) et recalcule la comparaison
 * pièce ↔ saisie à partir de l'extraction persistée. Les mentions, elles, sont
 * relues telles quelles : elles constatent l'état du document, pas celui de la
 * saisie, et n'ont donc pas à être recalculées.
 */
export async function getDossierPieces(
  data: DossierComplet,
): Promise<PieceAvecEcarts[]> {
  const supabase = await createClient();
  const { data: pieces } = await supabase
    .from("pieces_justificatives")
    .select("*")
    .eq("dossier_id", data.dossier.id)
    .order("created_at", { ascending: true });

  return versEcarts(data, pieces ?? []);
}

/**
 * Lignes de la base → pièces comparées à la saisie. Pur : aucune requête.
 *
 * Séparé de `getDossierPieces` pour que la LISTE des dossiers puisse charger toutes
 * les pièces en UNE requête puis les répartir, au lieu d'un aller-retour par ligne.
 */
export function versEcarts(
  data: DossierComplet,
  pieces: readonly PieceJustificative[],
): PieceAvecEcarts[] {
  return pieces.map((piece) => ({
    piece,
    // Seuls le devis et la facture portent les caractéristiques du chantier : ce sont
    // les seuls à confronter à la saisie. Un avis d'imposition ou un RIB n'a rien à
    // comparer ici (l'avis est jugé par `controle-avis.ts`, sur d'autres critères).
    comparaisons:
      (piece.type === "devis" || piece.type === "facture") &&
      piece.extraction_statut === "ok" &&
      piece.extraction_json
        ? comparerPiece(
            data,
            piece.extraction_json as unknown as ExtractedPiece,
            piece.type,
          )
        : [],
    mentions: piece.mentions_json
      ? (piece.mentions_json as unknown as MentionVerifiee[])
      : null,
  }));
}

/**
 * Adapte les pièces chargées vers la vue que le moteur de règles attend. Le moteur
 * (`controlerPieces`) reste pur et ignorant de la base : c'est ici, et ici seulement,
 * que la ligne SQL devient un objet contrôlable.
 */
export function versControle(pieces: readonly PieceAvecEcarts[]): PieceControlee[] {
  return pieces.map(({ piece, comparaisons, mentions }) => ({
    type: piece.type,
    lue: piece.extraction_statut === "ok",
    comparaisons,
    mentions,
    extraction:
      piece.extraction_statut === "ok" && piece.extraction_json
        ? (piece.extraction_json as unknown as ExtractedPiece)
        : null,
  }));
}
