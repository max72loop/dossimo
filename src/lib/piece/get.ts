import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { DossierComplet } from "@/lib/dossier/get-dossier";
import type { PieceJustificative } from "@/lib/database.types";
import { comparerPiece, type Comparaison } from "@/lib/piece/compare";
import type { ExtractedPiece } from "@/lib/piece/extract";

export interface PieceAvecEcarts {
  piece: PieceJustificative;
  comparaisons: Comparaison[];
}

/**
 * Charge les pièces d'un dossier (auth-scopé, RLS) et recalcule la comparaison
 * pièce ↔ saisie à partir de l'extraction persistée.
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

  return (pieces ?? []).map((piece) => ({
    piece,
    comparaisons:
      piece.extraction_statut === "ok" && piece.extraction_json
        ? comparerPiece(
            data,
            piece.extraction_json as unknown as ExtractedPiece,
            piece.type,
          )
        : [],
  }));
}
