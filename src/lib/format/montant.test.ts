import { describe, it, expect } from "vitest";

import { formatEuros, formatEurosPdf } from "@/lib/format/montant";

// Espaces insécables écrites en échappement : invisibles dans un éditeur, elles
// se perdent au ré-encodage et le test passerait alors pour de mauvaises raisons.
const NNBSP = "\u202F"; // U+202F, séparateur de milliers
const NBSP = "\u00A0"; // U+00A0, avant le symbole €

describe("formatEuros", () => {
  it("sépare les milliers et garde deux décimales", () => {
    expect(formatEuros(1200)).toBe(`1${NNBSP}200,00${NBSP}€`);
    expect(formatEuros(760)).toBe(`760,00${NBSP}€`);
    expect(formatEuros(1234.5)).toBe(`1${NNBSP}234,50${NBSP}€`);
  });

  it("n'affiche jamais un montant sans séparateur de milliers", () => {
    expect(formatEuros(1200)).not.toContain("1200");
  });

  it("rend un tiret pour une valeur absente", () => {
    expect(formatEuros(null)).toBe("—");
    expect(formatEuros(undefined)).toBe("—");
  });
});

describe("formatEurosPdf", () => {
  it("normalise les espaces insécables, absentes des polices PDF", () => {
    expect(formatEurosPdf(1200)).toBe("1 200,00 €");
    expect(formatEurosPdf(1200)).not.toContain(NNBSP);
    expect(formatEurosPdf(1200)).not.toContain(NBSP);
  });

  it("garde le même format que l'écran, aux espaces près", () => {
    expect(formatEurosPdf(1234.5)).toBe("1 234,50 €");
    expect(formatEurosPdf(null)).toBe("—");
  });
});
