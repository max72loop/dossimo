import { describe, it, expect } from "vitest";

import { parseNombreFr } from "@/lib/piece/num";

describe("parseNombreFr", () => {
  it("lit les formats FR courants d'un devis", () => {
    expect(parseNombreFr("4 200,00 €")).toBe(4200);
    expect(parseNombreFr("4 200,50 €")).toBe(4200.5);
    expect(parseNombreFr("7,5")).toBe(7.5);
    expect(parseNombreFr("95 m²")).toBe(95);
    expect(parseNombreFr("4200")).toBe(4200);
  });

  it("ignore les espaces fins et insécables des séparateurs de milliers", () => {
    expect(parseNombreFr("28 450 €")).toBe(28450);
    expect(parseNombreFr("28 450 €")).toBe(28450);
  });

  it("lit le point de milliers, que parseFloat divisait par mille", () => {
    // Le bug de production : un RFR de 28 450 € lu 28,45 € classait le ménage en
    // grande précarité et validait un dossier faux.
    expect(parseNombreFr("28.450")).toBe(28450);
    expect(parseNombreFr("1.234.567")).toBe(1234567);
    expect(parseNombreFr("4.200,50 €")).toBe(4200.5);
  });

  it("garde le point décimal quand ce n'est pas un groupement de milliers", () => {
    // « 4.2 » est une résistance thermique, pas 4 200. Le groupement exige des
    // groupes de trois chiffres exactement.
    expect(parseNombreFr("4.2")).toBe(4.2);
    expect(parseNombreFr("12.34")).toBe(12.34);
    expect(parseNombreFr("4.2000")).toBe(4.2);
  });

  it("garde un décimal à trois chiffres commençant par zéro", () => {
    // Aucun groupement de milliers ne commence par un zéro : « 0.125 » est un
    // décimal, jamais 125.
    expect(parseNombreFr("0.125")).toBe(0.125);
    expect(parseNombreFr("0,125")).toBe(0.125);
  });

  it("tranche l'ambiguïté par le dernier séparateur quand les deux sont présents", () => {
    expect(parseNombreFr("4.200,50")).toBe(4200.5);
    expect(parseNombreFr("1,234.56")).toBe(1234.56);
    expect(parseNombreFr("1.234,5")).toBe(1234.5);
  });

  it("lit la virgule de milliers à l'anglaise quand elle est répétée", () => {
    expect(parseNombreFr("1,234,567")).toBe(1234567);
  });

  it("accepte les nombres déjà typés", () => {
    expect(parseNombreFr(4200.5)).toBe(4200.5);
    expect(parseNombreFr(0)).toBe(0);
    expect(parseNombreFr(NaN)).toBeNull();
    expect(parseNombreFr(Infinity)).toBeNull();
  });

  it("porte le signe négatif", () => {
    expect(parseNombreFr("-28.450")).toBe(-28450);
    expect(parseNombreFr("-7,5 €")).toBe(-7.5);
  });

  it("rend null sur ce qui ne porte aucun nombre", () => {
    expect(parseNombreFr(null)).toBeNull();
    expect(parseNombreFr("")).toBeNull();
    expect(parseNombreFr("néant")).toBeNull();
    expect(parseNombreFr("—")).toBeNull();
    expect(parseNombreFr({})).toBeNull();
    expect(parseNombreFr(true)).toBeNull();
  });
});
