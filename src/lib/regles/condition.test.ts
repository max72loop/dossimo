import { describe, it, expect } from "vitest";

import { fusionnerCondition, parsePrime } from "@/lib/regles/condition";

describe("parsePrime", () => {
  it("accepte le mode forfait (chauffage)", () => {
    const r = parsePrime('{"forfait":{"classique":2500,"precaire":3500,"grande_precarite":4500}}');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ forfait: { classique: 2500, precaire: 3500, grande_precarite: 4500 } });
  });

  it("accepte le mode par_m2 (isolation)", () => {
    const r = parsePrime('{"par_m2":{"classique":10,"precaire":15,"grande_precarite":20}}');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ par_m2: { classique: 10, precaire: 15, grande_precarite: 20 } });
  });

  it("vide → pas de barème (undefined)", () => {
    expect(parsePrime("{}")).toEqual({ ok: true, value: undefined });
    expect(parsePrime("")).toEqual({ ok: true, value: undefined });
  });

  it("JSON invalide → erreur", () => {
    expect(parsePrime("{oops").ok).toBe(false);
  });
});

describe("fusionnerCondition", () => {
  it("préserve un barème forfait quand on édite un seuil (régression PAC)", () => {
    const base = {
      etas_min: 111,
      tva_taux: 0.055,
      anciennete_min_ans: 2,
      prime: { forfait: { classique: 2500, precaire: 3500, grande_precarite: 4500 } },
    };
    // L'éditeur PAC ne renvoie que etas_min ; les autres seuils partent à null.
    const out = fusionnerCondition(
      base,
      { r_min: null, etas_min: 126, cop_min: null, rendement_min: null, tva_taux: 0.055, anciennete_min_ans: 2 },
      base.prime,
    );
    expect(out.etas_min).toBe(126);
    expect(out.prime).toEqual({ forfait: { classique: 2500, precaire: 3500, grande_precarite: 4500 } });
  });

  it("null retire la clé, undefined la laisse inchangée", () => {
    const out = fusionnerCondition(
      { r_min: 7, tva_taux: 0.055, cop_min: 3 },
      { r_min: null, tva_taux: undefined },
      undefined,
    );
    expect(out.r_min).toBeUndefined(); // retiré
    expect(out.tva_taux).toBe(0.055); // inchangé
    expect(out.cop_min).toBe(3); // clé d'un autre geste, jamais touchée
  });

  it("ne réintroduit pas les seuils d'autres gestes lors d'une édition isolation", () => {
    const out = fusionnerCondition(
      { r_min: 7, tva_taux: 0.055 },
      { r_min: 8, etas_min: null, cop_min: null, rendement_min: null },
      { par_m2: { classique: 10 } },
    );
    expect(out.r_min).toBe(8);
    expect(out.etas_min).toBeUndefined();
    expect(out.cop_min).toBeUndefined();
    expect(out.prime).toEqual({ par_m2: { classique: 10 } });
  });

  it("prime undefined retire le barème existant (l'admin a vidé le champ)", () => {
    const out = fusionnerCondition(
      { r_min: 7, prime: { par_m2: { classique: 10 } } },
      { r_min: 7 },
      undefined,
    );
    expect(out.prime).toBeUndefined();
  });
});
