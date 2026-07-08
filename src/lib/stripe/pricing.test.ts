import { describe, it, expect } from "vitest";

import { prixCentsPourPrime, labelEuros } from "@/lib/stripe/pricing";

describe("tarification par palier", () => {
  it("petit dossier (prime < 800) : 49 €", () => {
    expect(prixCentsPourPrime(480)).toBe(4900);
    expect(prixCentsPourPrime(600)).toBe(4900);
    expect(prixCentsPourPrime(799)).toBe(4900);
  });

  it("dossier standard (800 à 2500) : 99 €", () => {
    expect(prixCentsPourPrime(800)).toBe(9900);
    expect(prixCentsPourPrime(1900)).toBe(9900);
    expect(prixCentsPourPrime(2499)).toBe(9900);
  });

  it("gros dossier (>= 2500) : 149 €", () => {
    expect(prixCentsPourPrime(2500)).toBe(14900);
    expect(prixCentsPourPrime(5000)).toBe(14900);
  });

  it("prime non estimable : forfait par défaut (99 €)", () => {
    expect(prixCentsPourPrime(null)).toBe(9900);
    expect(prixCentsPourPrime(undefined)).toBe(9900);
  });

  it("libellé en euros sans décimales inutiles", () => {
    expect(labelEuros(4900)).toBe("49 €");
    expect(labelEuros(14900)).toBe("149 €");
  });
});
