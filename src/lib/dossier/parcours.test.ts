import { describe, it, expect } from "vitest";

import { PARCOURS, STATUTS_VALIDES, indexEtape, ETAPE_PAR_STATUT } from "@/lib/dossier/parcours";

describe("parcours du dossier", () => {
  it("ordonne les 5 étapes du plus tôt au plus tard", () => {
    expect(PARCOURS.map((e) => e.statut)).toEqual([
      "nouveau", "en_traitement", "pret_depot", "depose", "livre",
    ]);
  });

  it("indexEtape reflète l'ordre du parcours", () => {
    expect(indexEtape("nouveau")).toBe(0);
    expect(indexEtape("depose")).toBeGreaterThan(indexEtape("pret_depot"));
    expect(indexEtape("livre")).toBe(4);
  });

  it("STATUTS_VALIDES contient exactement les 5 états", () => {
    expect(STATUTS_VALIDES.size).toBe(5);
    expect(STATUTS_VALIDES.has("depose")).toBe(true);
  });

  it("chaque étape a un libellé et un style", () => {
    for (const e of PARCOURS) {
      expect(e.label.length).toBeGreaterThan(0);
      expect(ETAPE_PAR_STATUT[e.statut]).toBe(e);
    }
  });
});
