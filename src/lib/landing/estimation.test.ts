import { describe, expect, it } from "vitest";

import { composerEstimation } from "@/lib/landing/estimation";
import { estimationSchema, gesteAuM2 } from "@/lib/landing/estimation-refs";

/**
 * Le simulateur public affiche des montants d'aide à des inconnus, sans compte
 * et sans garde-fou humain. Deux fautes y sont bien plus graves qu'ailleurs :
 * annoncer une prime à un ménage qui n'y a pas droit, et transformer un
 * « je ne sais pas » en « 0 € ». Les deux sont couvertes ici.
 */

// CEE : le violet et le rose partagent le même tarif (le CEE ne les distingue pas).
const BAREME_M2 = {
  par_m2: { grande_precarite: 13, precaire: 11, intermediaire: 7, superieur: 7 },
};

// MaPrimeRénov' : le violet (intermediaire) a un forfait, le rose (superieur) non.
const BAREME_FORFAIT = {
  forfait: { grande_precarite: 5000, precaire: 4000, intermediaire: 3000 },
};

const ligne = (r: ReturnType<typeof composerEstimation>, d: "cee" | "maprimerenov") =>
  r.lignes.find((l) => l.dispositif === d)!;

describe("estimation publique — barème au m²", () => {
  it("cas conforme : applique le taux du profil à la surface", () => {
    const r = composerEstimation(BAREME_M2, null, "jaune", 95);
    expect(ligne(r, "cee").montant).toBe(11 * 95);
    expect(ligne(r, "cee").base).toContain("11 €/m²");
  });

  it("le profil bleu lit bien la bande « grande précarité »", () => {
    const r = composerEstimation(BAREME_M2, null, "bleu", 100);
    expect(ligne(r, "cee").montant).toBe(1300);
  });

  it("applique le plafond quand le produit le dépasse", () => {
    const r = composerEstimation({ ...BAREME_M2, plafond: 1000 }, null, "bleu", 500);
    expect(ligne(r, "cee").montant).toBe(1000);
    expect(ligne(r, "cee").base).toContain("plafonné");
  });

  it("sans surface : non estimable, et surtout pas zéro", () => {
    const r = composerEstimation(BAREME_M2, null, "jaune", undefined);
    expect(ligne(r, "cee").montant).toBeNull();
  });
});

describe("estimation publique — profil rose (la règle qui protège)", () => {
  /**
   * Le modèle interne distingue désormais le violet (`intermediaire`, éligible) du
   * rose (`superieur`, non éligible). La garde reste : `mprEligible` à `false` pour
   * le rose, pour qu'aucun montant MaPrimeRénov' ne s'affiche à un ménage qui n'y a
   * pas droit — la prime que l'outil promet d'éviter en refus.
   */
  it("cas de refus : le rose n'obtient AUCUN montant MaPrimeRénov'", () => {
    const r = composerEstimation(BAREME_M2, BAREME_FORFAIT, "rose", 95);
    expect(ligne(r, "maprimerenov").montant).toBeNull();
    expect(ligne(r, "maprimerenov").base).toContain("revenus supérieurs");
  });

  it("le violet, lui, obtient bien le montant du profil intermédiaire", () => {
    const r = composerEstimation(BAREME_M2, BAREME_FORFAIT, "violet", 95);
    expect(ligne(r, "maprimerenov").montant).toBe(3000);
  });

  it("le rose garde son estimation CEE : les CEE ignorent violet et rose", () => {
    const r = composerEstimation(BAREME_M2, BAREME_FORFAIT, "rose", 95);
    expect(ligne(r, "cee").montant).toBe(7 * 95);
  });
});

describe("estimation publique — couples sans barème", () => {
  it("aucun barème des deux côtés : deux lignes nulles et un total nul", () => {
    const r = composerEstimation(null, null, "jaune", 95);
    expect(r.lignes.every((l) => l.montant === null)).toBe(true);
    expect(r.total).toBeNull();
  });

  it("un seul dispositif estimable : le total ne compte que lui", () => {
    const r = composerEstimation(BAREME_M2, null, "jaune", 95);
    expect(r.total).toBe(11 * 95);
    expect(ligne(r, "maprimerenov").montant).toBeNull();
  });

  it("les deux estimables : le total les additionne", () => {
    const r = composerEstimation(BAREME_M2, BAREME_FORFAIT, "bleu", 100);
    expect(r.total).toBe(1300 + 5000);
  });

  it("profil absent du barème : non estimable plutôt qu'inventé", () => {
    const r = composerEstimation({ forfait: { grande_precarite: 4000 } }, null, "violet", undefined);
    expect(ligne(r, "cee").montant).toBeNull();
  });
});

describe("validation de la saisie", () => {
  it("un geste au m² exige une surface", () => {
    const res = estimationSchema.safeParse({ geste: "combles_perdus", profil: "jaune" });
    expect(res.success).toBe(false);
  });

  it("un geste au forfait s'en passe", () => {
    const res = estimationSchema.safeParse({ geste: "pac_air_eau", profil: "jaune" });
    expect(res.success).toBe(true);
  });

  it("refuse une surface nulle ou aberrante", () => {
    expect(estimationSchema.safeParse({ geste: "murs", profil: "bleu", surface: 0 }).success).toBe(false);
    expect(estimationSchema.safeParse({ geste: "murs", profil: "bleu", surface: 5000 }).success).toBe(false);
  });

  it("refuse un geste inconnu", () => {
    expect(estimationSchema.safeParse({ geste: "piscine", profil: "bleu" }).success).toBe(false);
  });

  it("gesteAuM2 sépare bien isolation et forfaits", () => {
    expect(gesteAuM2("combles_perdus")).toBe(true);
    expect(gesteAuM2("pac_air_eau")).toBe(false);
  });
});
