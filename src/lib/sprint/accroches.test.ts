import { describe, it, expect } from "vitest";

import { choisirAccroche } from "./accroches";

describe("choisirAccroche — mapping des libellés réels ADEME", () => {
  it("mappe chaque famille de libellé vers son bucket", () => {
    expect(choisirAccroche(["Pompe à chaleur : chauffage"]).bucket).toBe("pac");
    expect(choisirAccroche(["Chauffe-Eau Thermodynamique"]).bucket).toBe("cet");
    expect(choisirAccroche(["Chauffage et/ou eau chaude solaire"]).bucket).toBe("cet");
    expect(choisirAccroche(["Isolation des combles perdus"]).bucket).toBe("isolation");
    expect(choisirAccroche(["Isolation des murs par l'extérieur"]).bucket).toBe("isolation");
    expect(choisirAccroche(["Fenêtres, volets, portes donnant sur l'extérieur"]).bucket).toBe("menuiseries");
    expect(choisirAccroche(["Fenêtres de toit"]).bucket).toBe("menuiseries");
    expect(choisirAccroche(["Poêle ou insert bois"]).bucket).toBe("bois");
    expect(choisirAccroche(["Chaudière bois"]).bucket).toBe("bois");
    expect(choisirAccroche(["Ventilation mécanique"]).bucket).toBe("ventilation");
  });

  it("classe les domaines hors dispositif en générique", () => {
    expect(choisirAccroche(["Chaudière condensation ou micro-cogénération gaz ou fioul"]).bucket).toBe("generique");
    expect(choisirAccroche(["Radiateurs électriques, dont régulation."]).bucket).toBe("generique");
    expect(choisirAccroche(["Panneaux solaires photovoltaïques"]).bucket).toBe("generique");
  });

  it("applique la priorité quand plusieurs buckets coexistent", () => {
    expect(choisirAccroche(["Ventilation mécanique", "Isolation des murs par l'extérieur"]).bucket).toBe("isolation");
    expect(choisirAccroche(["Pompe à chaleur : chauffage", "Chauffe-Eau Thermodynamique"]).bucket).toBe("pac");
    expect(choisirAccroche(["Panneaux solaires photovoltaïques", "Fenêtres de toit"]).bucket).toBe("menuiseries");
  });

  it("tolère casse et espaces multiples (libellés hétérogènes)", () => {
    expect(choisirAccroche(["  ISOLATION DES COMBLES PERDUS "]).bucket).toBe("isolation");
    // Le libellé réel comporte un double espace « toitures  ou plafonds ».
    expect(choisirAccroche(["Isolation par l'intérieur des murs ou rampants de toitures  ou plafonds"]).bucket).toBe("isolation");
  });

  it("signale un libellé inconnu et retombe sur générique, sans deviner", () => {
    const r = choisirAccroche(["Métier improbable XYZ"]);
    expect(r.bucket).toBe("generique");
    expect(r.inconnus).toContain("Métier improbable XYZ");
  });

  it("un tableau vide donne générique sans inconnu", () => {
    const r = choisirAccroche([]);
    expect(r.bucket).toBe("generique");
    expect(r.inconnus).toHaveLength(0);
  });
});
