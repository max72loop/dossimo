import { describe, it, expect } from "vitest";

import { controlerDossier } from "@/lib/rules/controle-dossier";
import type { DossierComplet } from "@/lib/dossier/get-dossier";
import type { RegleMetierResolue } from "@/lib/rules/regles-metier";

const AUJ = new Date("2026-07-01T00:00:00");

/** Règle CEE combles par défaut (comme seedée). */
function regleCombles(over: Partial<RegleMetierResolue["condition"]> = {}): RegleMetierResolue {
  return {
    version: 1,
    versionFormulaire: "BAR-EN-101 vA64.6",
    pieces: [],
    mentions: [],
    condition: { r_min: 7, tva_taux: 0.055, anciennete_min_ans: 2, ...over },
  };
}

/** Dossier conforme de référence (CEE combles), surchargable. */
function dossier(over: {
  dispositif?: "cee" | "maprimerenov";
  regle?: RegleMetierResolue | null;
  travaux?: Record<string, unknown>;
  dates?: Record<string, unknown>;
  logement?: Record<string, unknown>;
  montants?: Record<string, unknown>;
  rge?: Record<string, unknown>;
} = {}): DossierComplet {
  return {
    dossier: { dispositif: over.dispositif ?? "cee", created_at: "2026-06-01" },
    artisan: null,
    caracteristiques: {
      fiche: "BAR-EN-101",
      beneficiaire: {
        nom: "Martin", prenom: "Claire", adresse: "12 rue des Lilas",
        code_postal: "93100", commune: "Montreuil", email: null, telephone: null,
        occupation: "proprietaire_occupant", precarite: "precaire",
      },
      logement: { type: "maison", annee_construction: 1985, residence: "principale", surface_habitable: 90, ...over.logement },
      travaux: {
        type_isolation: "combles_perdus", fiche: "BAR-EN-101", surface_isolee_m2: 95,
        isolant_type: "laine de verre", isolant_marque: "Isover", isolant_reference: "IBR 300",
        resistance_thermique_r: 7.5, epaisseur_mm: 300, ...over.travaux,
      },
      montants: { ht: 4200, ttc: 4431, prime_estime: 1800, ...over.montants },
      rge: { numero: "QB/12345", domaine: "Qualibat 7131", date_debut: "2024-01-01", date_fin: "2027-12-31", ...over.rge },
    },
    dates: { visite_technique: "2026-03-05", devis: "2026-03-10", debut_travaux: "2026-04-01", fin_travaux: "2026-04-05", facture: "2026-04-10", ...over.dates },
    regle: over.regle === undefined ? regleCombles() : over.regle,
  } as unknown as DossierComplet;
}

const codes = (d: DossierComplet) =>
  controlerDossier(d, AUJ).findings.map((f) => `${f.code}:${f.severite}`);

describe("controlerDossier", () => {
  it("dossier de référence : conforme, aucun bloquant", () => {
    const r = controlerDossier(dossier(), AUJ);
    expect(r.conforme).toBe(true);
    expect(r.nbBloquants).toBe(0);
  });

  it("travaux commencés avant le devis : bloquant", () => {
    const r = controlerDossier(
      dossier({ dates: { devis: "2026-04-10", debut_travaux: "2026-04-01" } }),
      AUJ,
    );
    expect(r.conforme).toBe(false);
    expect(codes(dossier({ dates: { devis: "2026-04-10", debut_travaux: "2026-04-01" } })))
      .toContain("chrono_devis_travaux:bloquant");
  });

  it("RGE expirée à la date du devis : bloquant", () => {
    const r = controlerDossier(dossier({ rge: { date_fin: "2025-01-01" } }), AUJ);
    expect(r.conforme).toBe(false);
    expect(codes(dossier({ rge: { date_fin: "2025-01-01" } }))).toContain("rge_validite:bloquant");
  });

  it("R insuffisant selon le seuil de la règle : bloquant", () => {
    const r = controlerDossier(dossier({ travaux: { resistance_thermique_r: 6 } }), AUJ);
    expect(r.conforme).toBe(false);
    expect(codes(dossier({ travaux: { resistance_thermique_r: 6 } }))).toContain("technique_resistance:bloquant");
  });

  it("seuil R piloté par la règle : R=4 conforme si r_min=3 (planchers)", () => {
    const r = controlerDossier(
      dossier({ travaux: { resistance_thermique_r: 4 }, regle: regleCombles({ r_min: 3 }) }),
      AUJ,
    );
    expect(codes(dossier({ travaux: { resistance_thermique_r: 4 }, regle: regleCombles({ r_min: 3 }) })))
      .toContain("technique_resistance:ok");
    expect(r.conforme).toBe(true);
  });

  it("ancienneté : logement 2018 conforme en CEE (2 ans) mais bloqué en MPR (15 ans)", () => {
    const cee = controlerDossier(dossier({ logement: { annee_construction: 2018 } }), AUJ);
    expect(cee.conforme).toBe(true);

    const mpr = controlerDossier(
      dossier({ dispositif: "maprimerenov", logement: { annee_construction: 2018 }, regle: regleCombles({ anciennete_min_ans: 15 }) }),
      AUJ,
    );
    expect(mpr.conforme).toBe(false);
  });

  it("MPR sans règle active pour le geste : bloquant (non éligible)", () => {
    const r = controlerDossier(dossier({ dispositif: "maprimerenov", regle: null }), AUJ);
    expect(r.conforme).toBe(false);
    expect(codes(dossier({ dispositif: "maprimerenov", regle: null }))).toContain("eligibilite_dispositif:bloquant");
  });

  it("taux de TVA inhabituel : avertissement (non bloquant)", () => {
    // TTC = HT * 1.10 -> 10 % au lieu de 5,5 %
    const r = controlerDossier(dossier({ montants: { ht: 4200, ttc: 4620 } }), AUJ);
    expect(r.conforme).toBe(true);
    expect(codes(dossier({ montants: { ht: 4200, ttc: 4620 } }))).toContain("montants_tva:avertissement");
  });

  it("TTC inférieur au HT : bloquant", () => {
    const r = controlerDossier(dossier({ montants: { ht: 4200, ttc: 4000 } }), AUJ);
    expect(r.conforme).toBe(false);
  });
});

/** Règle CEE pompe à chaleur air/eau (forfait, sans etas_min figé). */
function reglePac(over: Partial<RegleMetierResolue["condition"]> = {}): RegleMetierResolue {
  return {
    version: 1,
    versionFormulaire: "BAR-TH-171 vA78.4",
    pieces: [],
    mentions: [],
    condition: {
      tva_taux: 0.055,
      anciennete_min_ans: 2,
      prime: { forfait: { grande_precarite: 4500, precaire: 3500, classique: 2500 } },
      ...over,
    },
  };
}

/** Dossier PAC air/eau de référence (conforme), surchargeable. */
function dossierPac(over: { pac?: Record<string, unknown>; regle?: RegleMetierResolue | null } = {}): DossierComplet {
  const base = dossier();
  return {
    ...base,
    caracteristiques: {
      ...base.caracteristiques,
      geste: "pac_air_eau",
      fiche: "BAR-TH-171",
      pac: {
        type_pac: "air_eau", fiche: "BAR-TH-171", etas: 130, puissance_kw: 8,
        temperature: "basse", marque: "Atlantic", reference: "Alfea Excellia",
        regulateur_classe: "IV", ...over.pac,
      },
    },
    regle: over.regle === undefined ? reglePac() : over.regle,
  } as unknown as DossierComplet;
}

const codesPac = (d: DossierComplet) =>
  controlerDossier(d, AUJ).findings.map((f) => `${f.code}:${f.severite}`);

describe("controlerDossier — PAC air/eau (BAR-TH-171)", () => {
  it("PAC de référence : conforme, ETAS ok", () => {
    const r = controlerDossier(dossierPac(), AUJ);
    expect(r.conforme).toBe(true);
    expect(codesPac(dossierPac())).toContain("technique_etas:ok");
  });

  it("ETAS insuffisante en basse température (< 126 %) : bloquant", () => {
    const r = controlerDossier(dossierPac({ pac: { etas: 120 } }), AUJ);
    expect(r.conforme).toBe(false);
    expect(codesPac(dossierPac({ pac: { etas: 120 } }))).toContain("technique_etas:bloquant");
  });

  it("seuil ETAS piloté par le régime : 115 % conforme en moyenne/haute (>= 111 %)", () => {
    const r = controlerDossier(
      dossierPac({ pac: { etas: 115, temperature: "moyenne_haute" } }),
      AUJ,
    );
    expect(codesPac(dossierPac({ pac: { etas: 115, temperature: "moyenne_haute" } })))
      .toContain("technique_etas:ok");
    expect(r.conforme).toBe(true);
  });

  it("etas_min de la règle surcharge le défaut régime : 128 requis => 126 bloqué", () => {
    const r = controlerDossier(
      dossierPac({ pac: { etas: 126 }, regle: reglePac({ etas_min: 128 }) }),
      AUJ,
    );
    expect(r.conforme).toBe(false);
  });

  it("classe de régulateur manquante : avertissement (non bloquant)", () => {
    const r = controlerDossier(dossierPac({ pac: { regulateur_classe: null } }), AUJ);
    expect(r.conforme).toBe(true);
    expect(codesPac(dossierPac({ pac: { regulateur_classe: null } })))
      .toContain("technique_regulateur:avertissement");
  });

  it("ne déclenche aucun contrôle d'isolation (R) sur une PAC", () => {
    const cs = codesPac(dossierPac());
    expect(cs.some((c) => c.startsWith("technique_resistance"))).toBe(false);
  });
});

/** Règle CEE chauffe-eau thermodynamique (forfait, sans cop_min figé). */
function regleCet(over: Partial<RegleMetierResolue["condition"]> = {}): RegleMetierResolue {
  return {
    version: 1,
    versionFormulaire: "BAR-TH-148",
    pieces: [],
    mentions: [],
    condition: {
      tva_taux: 0.055,
      anciennete_min_ans: 2,
      prime: { forfait: { grande_precarite: 1200, precaire: 900, classique: 600 } },
      ...over,
    },
  };
}

function dossierCet(over: { cet?: Record<string, unknown>; regle?: RegleMetierResolue | null } = {}): DossierComplet {
  const base = dossier();
  return {
    ...base,
    caracteristiques: {
      ...base.caracteristiques,
      geste: "cet",
      fiche: "BAR-TH-148",
      cet: {
        type_cet: "accumulation", fiche: "BAR-TH-148", cop: 3.0,
        profil_soutirage: "L", volume_l: 200, marque: "Atlantic", reference: "Calypso",
        ...over.cet,
      },
    },
    regle: over.regle === undefined ? regleCet() : over.regle,
  } as unknown as DossierComplet;
}

const codesCet = (d: DossierComplet) =>
  controlerDossier(d, AUJ).findings.map((f) => `${f.code}:${f.severite}`);

describe("controlerDossier — chauffe-eau thermodynamique (BAR-TH-148)", () => {
  it("CET de référence : conforme, COP ok", () => {
    const r = controlerDossier(dossierCet(), AUJ);
    expect(r.conforme).toBe(true);
    expect(codesCet(dossierCet())).toContain("technique_cop:ok");
  });

  it("COP insuffisant (< 2,5) : bloquant", () => {
    const r = controlerDossier(dossierCet({ cet: { cop: 2.2 } }), AUJ);
    expect(r.conforme).toBe(false);
    expect(codesCet(dossierCet({ cet: { cop: 2.2 } }))).toContain("technique_cop:bloquant");
  });

  it("cop_min de la règle surcharge le défaut : 3,2 requis => 3,0 bloqué", () => {
    const r = controlerDossier(
      dossierCet({ cet: { cop: 3.0 }, regle: regleCet({ cop_min: 3.2 }) }),
      AUJ,
    );
    expect(r.conforme).toBe(false);
  });

  it("ne déclenche aucun contrôle d'isolation (R) ni ETAS sur un CET", () => {
    const cs = codesCet(dossierCet());
    expect(cs.some((c) => c.startsWith("technique_resistance"))).toBe(false);
    expect(cs.some((c) => c.startsWith("technique_etas"))).toBe(false);
  });
});

/** Règle CEE appareil de chauffage au bois (forfait, sans rendement_min figé). */
function regleBois(over: Partial<RegleMetierResolue["condition"]> = {}): RegleMetierResolue {
  return {
    version: 1,
    versionFormulaire: "BAR-TH-112",
    pieces: [],
    mentions: [],
    condition: {
      tva_taux: 0.055,
      anciennete_min_ans: 2,
      prime: { forfait: { grande_precarite: 900, precaire: 700, classique: 500 } },
      ...over,
    },
  };
}

function dossierBois(over: { bois?: Record<string, unknown>; regle?: RegleMetierResolue | null } = {}): DossierComplet {
  const base = dossier();
  return {
    ...base,
    caracteristiques: {
      ...base.caracteristiques,
      geste: "bois",
      fiche: "BAR-TH-112",
      bois: {
        type_bois: "appareil", fiche: "BAR-TH-112", combustible: "granules",
        rendement: 90, emissions_co: 200, marque: "MCZ", reference: "Suite",
        ...over.bois,
      },
    },
    regle: over.regle === undefined ? regleBois() : over.regle,
  } as unknown as DossierComplet;
}

const codesBois = (d: DossierComplet) =>
  controlerDossier(d, AUJ).findings.map((f) => `${f.code}:${f.severite}`);

describe("controlerDossier — appareil de chauffage au bois (BAR-TH-112)", () => {
  it("appareil de référence : conforme, rendement ok", () => {
    const r = controlerDossier(dossierBois(), AUJ);
    expect(r.conforme).toBe(true);
    expect(codesBois(dossierBois())).toContain("technique_rendement:ok");
  });

  it("rendement insuffisant en granulés (< 80 %) : bloquant", () => {
    const r = controlerDossier(dossierBois({ bois: { rendement: 78 } }), AUJ);
    expect(r.conforme).toBe(false);
    expect(codesBois(dossierBois({ bois: { rendement: 78 } }))).toContain("technique_rendement:bloquant");
  });

  it("seuil selon combustible : 76 % conforme en bûches (>= 75 %)", () => {
    const r = controlerDossier(
      dossierBois({ bois: { rendement: 76, combustible: "buches" } }),
      AUJ,
    );
    expect(codesBois(dossierBois({ bois: { rendement: 76, combustible: "buches" } })))
      .toContain("technique_rendement:ok");
    expect(r.conforme).toBe(true);
  });

  it("rendement_min de la règle surcharge le défaut : 92 requis => 90 bloqué", () => {
    const r = controlerDossier(
      dossierBois({ bois: { rendement: 90 }, regle: regleBois({ rendement_min: 92 }) }),
      AUJ,
    );
    expect(r.conforme).toBe(false);
  });

  it("ne déclenche aucun contrôle d'isolation, ETAS ni COP sur un appareil bois", () => {
    const cs = codesBois(dossierBois());
    expect(cs.some((c) => c.startsWith("technique_resistance"))).toBe(false);
    expect(cs.some((c) => c.startsWith("technique_etas"))).toBe(false);
    expect(cs.some((c) => c.startsWith("technique_cop"))).toBe(false);
  });
});
