import { describe, it, expect } from "vitest";

import { comparerPiece, nbEcarts } from "@/lib/piece/compare";
import type { DossierComplet } from "@/lib/dossier/get-dossier";
import type { ExtractedPiece } from "@/lib/piece/extract";

const data = {
  caracteristiques: {
    beneficiaire: { nom: "Martin", prenom: "Claire", code_postal: "93100" },
    travaux: { surface_isolee_m2: 95, resistance_thermique_r: 7.5, isolant_marque: "Isover", isolant_reference: "IBR 300" },
    montants: { ht: 4200, ttc: 4620 },
    rge: { numero: "QB/12345" },
  },
  dates: { devis: "2025-03-10", facture: "2025-04-10" },
} as unknown as DossierComplet;

const exOk: ExtractedPiece = {
  beneficiaire_nom: "Claire Martin", code_postal: "93100", surface_isolee_m2: 95,
  resistance_thermique_r: 7.5, isolant_marque: "Isover", isolant_reference: "IBR 300",
  montant_ht: 4200, montant_ttc: 4620, date: "2025-03-10", rge_numero: "QB/12345",
} as ExtractedPiece;

const champ = (rs: ReturnType<typeof comparerPiece>, nom: string) =>
  rs.find((r) => r.champ.startsWith(nom));

describe("comparerPiece", () => {
  it("pièce identique à la saisie : aucun écart", () => {
    const rs = comparerPiece(data, exOk, "devis");
    expect(nbEcarts(rs)).toBe(0);
  });

  it("surface divergente : écart détecté", () => {
    const rs = comparerPiece(data, { ...exOk, surface_isolee_m2: 80 }, "devis");
    expect(champ(rs, "Surface")?.statut).toBe("ecart");
    expect(nbEcarts(rs)).toBe(1);
  });

  it("montant TTC divergent : écart détecté", () => {
    const rs = comparerPiece(data, { ...exOk, montant_ttc: 4431 }, "devis");
    expect(champ(rs, "Montant TTC")?.statut).toBe("ecart");
  });

  it("champ non lu (null) : statut absent, pas écart", () => {
    const rs = comparerPiece(data, { ...exOk, surface_isolee_m2: null }, "devis");
    expect(champ(rs, "Surface")?.statut).toBe("absent");
    expect(nbEcarts(rs)).toBe(0);
  });

  it("tolère les micro-écarts de surface (< 0,5 m²)", () => {
    const rs = comparerPiece(data, { ...exOk, surface_isolee_m2: 95.3 }, "devis");
    expect(champ(rs, "Surface")?.statut).toBe("ok");
  });
});
