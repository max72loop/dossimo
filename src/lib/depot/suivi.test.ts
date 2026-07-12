import { describe, it, expect } from "vitest";

import { suivrePieces } from "@/lib/depot/suivi";
import type { DossierComplet } from "@/lib/dossier/get-dossier";
import type { PieceJustificative, TypePiece } from "@/lib/database.types";

/**
 * Dossier MaPrimeRénov' : réclame au bénéficiaire identité, avis d'imposition,
 * titre de propriété et RIB (4 pièces).
 */
const mpr = {
  dossier: { dispositif: "maprimerenov" },
  caracteristiques: {
    geste: "isolation",
    fiche: "BAR-EN-101",
    beneficiaire: {
      nom: "Martin",
      prenom: "Claire",
      code_postal: "33000",
      occupation: "proprietaire_occupant",
      precarite: "grande_precarite",
    },
    travaux: { fiche: "BAR-EN-101", surface_isolee_m2: 95, resistance_thermique_r: 7.5 },
  },
  regle: null,
} as unknown as DossierComplet;

/** Dossier CEE, ménage classique : rien à réclamer au client. */
const cee = {
  dossier: { dispositif: "cee" },
  caracteristiques: {
    geste: "isolation",
    fiche: "BAR-EN-101",
    beneficiaire: {
      nom: "Martin",
      prenom: "Claire",
      code_postal: "33000",
      occupation: "proprietaire_occupant",
      precarite: "classique",
    },
    travaux: { fiche: "BAR-EN-101", surface_isolee_m2: 95, resistance_thermique_r: 7.5 },
  },
  regle: null,
} as unknown as DossierComplet;

const piece = (
  type: TypePiece,
  createdAt: string,
  deposant: "artisan" | "beneficiaire" = "beneficiaire",
): PieceJustificative =>
  ({ id: type + createdAt, type, deposant, created_at: createdAt }) as PieceJustificative;

describe("suivi des pièces du bénéficiaire", () => {
  it("compte ce qui est attendu et ce qui est arrivé", () => {
    const s = suivrePieces(mpr, [piece("avis_imposition", "2026-07-10T10:00:00Z")], null);
    expect(s.attendues).toBe(4);
    expect(s.recues).toBe(1);
    expect(s.complet).toBe(false);
  });

  it("jamais ouvert : tout est nouveau", () => {
    // Le bon défaut : mieux vaut signaler une pièce déjà vue que taire celle qui
    // fait basculer le dossier en refus.
    const s = suivrePieces(mpr, [piece("rib", "2026-07-10T10:00:00Z")], null);
    expect(s.nouvelles).toBe(1);
  });

  it("ne signale que ce qui est arrivé DEPUIS le dernier passage", () => {
    const s = suivrePieces(
      mpr,
      [
        piece("rib", "2026-07-10T10:00:00Z"), // vue
        piece("avis_imposition", "2026-07-12T09:00:00Z"), // nouvelle
      ],
      "2026-07-11T00:00:00Z",
    );
    expect(s.recues).toBe(2);
    expect(s.nouvelles).toBe(1);
  });

  it("ignore les pièces de l'artisan : le devis n'est pas une nouvelle du client", () => {
    const s = suivrePieces(
      mpr,
      [piece("devis", "2026-07-12T09:00:00Z", "artisan")],
      null,
    );
    expect(s.recues).toBe(0);
    expect(s.nouvelles).toBe(0);
  });

  it("deux avis d'imposition ne font pas deux pièces reçues", () => {
    // Le client se trompe de fichier, en redépose un autre : la checklist ne doit
    // pas compter deux fois la même case.
    const s = suivrePieces(
      mpr,
      [
        piece("avis_imposition", "2026-07-10T10:00:00Z"),
        piece("avis_imposition", "2026-07-11T10:00:00Z"),
      ],
      null,
    );
    expect(s.recues).toBe(1);
    expect(s.attendues).toBe(4);
  });

  it("dossier complet quand les 4 pièces sont là", () => {
    const s = suivrePieces(
      mpr,
      [
        piece("piece_identite", "2026-07-10T10:00:00Z"),
        piece("avis_imposition", "2026-07-10T10:01:00Z"),
        piece("titre_propriete", "2026-07-10T10:02:00Z"),
        piece("rib", "2026-07-10T10:03:00Z"),
      ],
      null,
    );
    expect(s.recues).toBe(4);
    expect(s.complet).toBe(true);
  });

  it("un dossier qui ne réclame rien au client est complet, pas « en attente »", () => {
    const s = suivrePieces(cee, [], null);
    expect(s.attendues).toBe(0);
    expect(s.complet).toBe(true);
    expect(s.nouvelles).toBe(0);
  });
});
