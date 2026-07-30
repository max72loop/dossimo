import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { PiecesJustificatives } from "@/components/dossier/pieces-justificatives";
import type { PieceAvecEcarts } from "@/lib/piece/get";
import type { PieceJustificative, TypePiece } from "@/lib/database.types";

// La zone est un composant client : le routeur et les Server Actions n'existent
// pas dans un rendu de test, et `piece/actions` tirerait tout le client Supabase.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {} }),
}));
vi.mock("@/lib/piece/actions", () => ({
  uploadPiece: vi.fn(),
  deletePiece: vi.fn(),
}));

function piece(
  type: TypePiece,
  extraction_statut: "ok" | "echec" | "en_attente",
): PieceAvecEcarts {
  return {
    piece: {
      id: `p-${type}`,
      type,
      nom_fichier: `${type}.pdf`,
      extraction_statut,
      extraction_erreur: null,
    } as unknown as PieceJustificative,
    comparaisons: [],
    mentions: null,
  };
}

describe("PiecesJustificatives", () => {
  it("propose en raccourci les pièces que le dossier attend encore", () => {
    const html = renderToStaticMarkup(
      <PiecesJustificatives
        dossierId="d1"
        initial={[]}
        nbMentions={7}
        manquants={[
          { type: "qualification_rge", label: "Certificat RGE" },
          { type: "photo_avant", label: "Photo avant travaux" },
        ]}
      />,
    );
    expect(html).toContain("Il vous reste à déposer");
    expect(html).toContain("Certificat RGE");
    expect(html).toContain("Photo avant travaux");
  });

  it("accepte plusieurs fichiers d'un coup", () => {
    const html = renderToStaticMarkup(
      <PiecesJustificatives dossierId="d1" initial={[]} nbMentions={7} />,
    );
    expect(html).toContain("multiple");
    expect(html).toContain("Glissez vos documents ici");
  });

  /**
   * Le raccourci disparaît quand il n'y a plus rien à réclamer : une rubrique
   * « il vous reste à déposer » vide dirait le contraire de ce qu'elle montre.
   */
  it("ne montre aucun raccourci quand le dossier est complet", () => {
    const html = renderToStaticMarkup(
      <PiecesJustificatives dossierId="d1" initial={[]} nbMentions={7} manquants={[]} />,
    );
    expect(html).not.toContain("Il vous reste à déposer");
  });

  /**
   * Régression : le test valait `extraction_statut !== "ok"`, or une photo ou un
   * certificat ne sont jamais lus et restent donc « en_attente ». L'artisan lisait
   * « Lecture automatique impossible · document illisible » sur un document
   * parfaitement net qu'on n'avait jamais cherché à lire.
   */
  it("ne déclare pas illisible une pièce qu'on ne lit pas", () => {
    const html = renderToStaticMarkup(
      <PiecesJustificatives
        dossierId="d1"
        initial={[piece("qualification_rge", "en_attente")]}
        nbMentions={7}
      />,
    );
    expect(html).not.toContain("Lecture automatique impossible");
    expect(html).toContain("Reçue et rangée dans le dossier");
  });

  it("signale en revanche une lecture qui a échoué sur un devis", () => {
    const html = renderToStaticMarkup(
      <PiecesJustificatives
        dossierId="d1"
        initial={[piece("devis", "echec")]}
        nbMentions={7}
      />,
    );
    expect(html).toContain("Lecture automatique impossible");
  });
});
