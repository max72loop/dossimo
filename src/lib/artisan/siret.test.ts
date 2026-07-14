import { describe, expect, it } from "vitest";

import { formaterSiret, normaliserSiret, siretValide } from "@/lib/artisan/siret";

describe("siretValide", () => {
  it("accepte un SIRET dont la clé de Luhn est correcte", () => {
    expect(siretValide("73282932000074")).toBe(true);
  });

  it("accepte une saisie espacée ou pointée", () => {
    expect(siretValide("732 829 320 00074")).toBe(true);
    expect(siretValide("732.829.320.00074")).toBe(true);
  });

  it("refuse un SIRET dont la clé de contrôle est fausse", () => {
    expect(siretValide("73282932000075")).toBe(false);
  });

  it("refuse un nombre de chiffres incorrect", () => {
    expect(siretValide("7328293200007")).toBe(false);
    expect(siretValide("732829320000741")).toBe(false);
  });

  it("refuse une saisie non numérique", () => {
    expect(siretValide("7328293200007A")).toBe(false);
    expect(siretValide("")).toBe(false);
  });

  it("accepte la dérogation La Poste, non conforme à Luhn", () => {
    expect(siretValide("35600000000048")).toBe(true);
  });
});

describe("normaliserSiret", () => {
  it("retire les séparateurs de saisie", () => {
    expect(normaliserSiret("732 829-320.00074")).toBe("73282932000074");
  });
});

describe("formaterSiret", () => {
  it("groupe le SIREN et le NIC", () => {
    expect(formaterSiret("73282932000074")).toBe("732 829 320 00074");
  });

  it("laisse la valeur intacte si elle n'a pas 14 chiffres", () => {
    expect(formaterSiret("1234")).toBe("1234");
  });
});
