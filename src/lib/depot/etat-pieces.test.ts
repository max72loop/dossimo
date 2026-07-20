import { describe, expect, it } from "vitest";

import {
  etatDesPieces,
  motifDeRejet,
  piecesARelancer,
  type FichierDepose,
} from "@/lib/depot/etat-pieces";
import type { PieceAttendue } from "@/lib/depot/pieces-attendues";

const IDENTITE: PieceAttendue = {
  type: "piece_identite",
  titre: "Votre pièce d'identité",
  aide: "Carte d'identité (recto-verso) ou passeport.",
};
const AVIS: PieceAttendue = {
  type: "avis_imposition",
  titre: "Votre dernier avis d'imposition",
  aide: "L'avis complet reçu cette année.",
};

let horloge = 0;
function fichier(
  type: string,
  validationStatus: FichierDepose["validationStatus"] = "submitted",
  rejectionReason: string | null = null,
): FichierDepose {
  horloge += 1;
  return {
    id: `${type}-${horloge}`,
    type,
    nomFichier: `${type}-${horloge}.jpg`,
    validationStatus,
    rejectionReason,
    createdAt: new Date(horloge * 1000).toISOString(),
  };
}

describe("etatDesPieces", () => {
  it("sans aucun fichier, la pièce est manquante", () => {
    const [etat] = etatDesPieces([IDENTITE], []);
    expect(etat.statut).toBe("manquante");
    expect(etat.fichiers).toHaveLength(0);
  });

  it("garde TOUS les fichiers d'un même type (recto-verso d'une carte d'identité)", () => {
    const recto = fichier("piece_identite");
    const verso = fichier("piece_identite");
    const [etat] = etatDesPieces([IDENTITE], [recto, verso]);

    // Le cas de refus historique : la Map keyée par type n'en gardait qu'un seul.
    expect(etat.fichiers.map((f) => f.id)).toEqual([recto.id, verso.id]);
    expect(etat.statut).toBe("en_attente");
  });

  it("ne mélange pas les types", () => {
    const etats = etatDesPieces(
      [IDENTITE, AVIS],
      [fichier("piece_identite"), fichier("avis_imposition"), fichier("piece_identite")],
    );
    expect(etats[0].fichiers).toHaveLength(2);
    expect(etats[1].fichiers).toHaveLength(1);
  });

  it("un seul fichier validé suffit à satisfaire la pièce", () => {
    const [etat] = etatDesPieces(
      [IDENTITE],
      [fichier("piece_identite", "approved"), fichier("piece_identite", "submitted")],
    );
    expect(etat.statut).toBe("validee");
  });

  it("la pièce est à revoir seulement si TOUS ses fichiers sont rejetés", () => {
    const [tousRejetes] = etatDesPieces(
      [IDENTITE],
      [
        fichier("piece_identite", "rejected", "Illisible"),
        fichier("piece_identite", "rejected", "Coupée"),
      ],
    );
    expect(tousRejetes.statut).toBe("a_revoir");

    // Un rejet suivi d'un renvoi encore en attente : la pièce n'est plus « à revoir »,
    // la balle est dans le camp de l'artisan.
    const [renvoye] = etatDesPieces(
      [IDENTITE],
      [fichier("piece_identite", "rejected", "Illisible"), fichier("piece_identite")],
    );
    expect(renvoye.statut).toBe("en_attente");
  });

  it("une pièce rejetée puis re-validée n'est plus à relancer", () => {
    const etats = etatDesPieces(
      [IDENTITE],
      [fichier("piece_identite", "rejected", "Floue"), fichier("piece_identite", "approved")],
    );
    expect(piecesARelancer(etats)).toHaveLength(0);
  });
});

describe("piecesARelancer", () => {
  it("relance tout ce qui n'est pas validé, y compris ce qui attend une revue", () => {
    const etats = etatDesPieces(
      [IDENTITE, AVIS],
      [fichier("avis_imposition", "approved")],
    );
    expect(piecesARelancer(etats).map((e) => e.attendue.type)).toEqual([
      "piece_identite",
    ]);
  });
});

describe("motifDeRejet", () => {
  it("rend le motif du rejet le plus récent", () => {
    const [etat] = etatDesPieces(
      [IDENTITE],
      [
        fichier("piece_identite", "rejected", "Illisible"),
        fichier("piece_identite", "rejected", "Il manque le verso"),
      ],
    );
    expect(motifDeRejet(etat)).toBe("Il manque le verso");
  });

  it("ne rend aucun motif tant que la pièce n'est pas entièrement rejetée", () => {
    const [etat] = etatDesPieces(
      [IDENTITE],
      [fichier("piece_identite", "rejected", "Illisible"), fichier("piece_identite")],
    );
    expect(motifDeRejet(etat)).toBeNull();
  });
});
