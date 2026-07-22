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
    dates: { offre_cee: "2026-03-08", visite_technique: "2026-03-05", devis: "2026-03-10", debut_travaux: "2026-04-01", fin_travaux: "2026-04-05", facture: "2026-04-10", ...over.dates },
    regle: over.regle === undefined ? regleCombles() : over.regle,
  } as unknown as DossierComplet;
}

/**
 * Caractéristiques communes SANS le bloc `travaux`. `createDossierCeeIsolation`
 * construit `travaux` OU `pac`/`cet`/`bois`, jamais les deux : les fixtures des
 * gestes non-isolation doivent refléter cette forme, sinon elles masquent tout
 * lecteur qui suppose `travaux` présent.
 */
function baseSansTravaux() {
  const base = dossier();
  const carac = { ...base.caracteristiques } as Record<string, unknown>;
  delete carac.travaux;
  return { base, carac };
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

describe("controlerDossier — rôle actif et incitatif (offre CEE avant le devis)", () => {
  it("offre CEE antérieure au devis : conforme, antériorité confirmée", () => {
    // La fixture de référence porte offre_cee 2026-03-08, devis 2026-03-10.
    const r = controlerDossier(dossier(), AUJ);
    expect(r.conforme).toBe(true);
    expect(codes(dossier())).toContain("chrono_offre_cee:ok");
  });

  it("offre CEE postérieure au devis : bloquant (motif de refus irrattrapable)", () => {
    const over = { dates: { offre_cee: "2026-03-12", devis: "2026-03-10" } };
    const r = controlerDossier(dossier(over), AUJ);
    expect(r.conforme).toBe(false);
    expect(codes(dossier(over))).toContain("chrono_offre_cee:bloquant");
  });

  it("offre CEE non renseignée en CEE : bloquant (antériorité invérifiable)", () => {
    const over = { dates: { offre_cee: null } };
    const r = controlerDossier(dossier(over), AUJ);
    expect(r.conforme).toBe(false);
    expect(codes(dossier(over))).toContain("chrono_offre_cee:bloquant");
  });

  it("même jour que le devis : conforme (l'offre n'a pas à précéder strictement)", () => {
    const over = { dates: { offre_cee: "2026-03-10", devis: "2026-03-10" } };
    expect(codes(dossier(over))).toContain("chrono_offre_cee:ok");
    expect(controlerDossier(dossier(over), AUJ).conforme).toBe(true);
  });

  it("sans objet en MaPrimeRénov' : aucun finding, même offre CEE absente", () => {
    const over = {
      dispositif: "maprimerenov" as const,
      regle: regleCombles({ anciennete_min_ans: 15 }),
      logement: { annee_construction: 1985 },
      dates: { offre_cee: null },
    };
    const cs = codes(dossier(over));
    expect(cs.some((c) => c.startsWith("chrono_offre_cee"))).toBe(false);
    expect(controlerDossier(dossier(over), AUJ).conforme).toBe(true);
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
  const { base, carac } = baseSansTravaux();
  return {
    ...base,
    caracteristiques: {
      ...carac,
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
  const { base, carac } = baseSansTravaux();
  return {
    ...base,
    caracteristiques: {
      ...carac,
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
  const { base, carac } = baseSansTravaux();
  return {
    ...base,
    caracteristiques: {
      ...carac,
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

/* ------------------- Chauffe-eau solaire individuel (BAR-TH-101) ---------- */

function regleSolaire(
  over: Partial<RegleMetierResolue["condition"]> = {},
): RegleMetierResolue {
  return {
    version: 1,
    versionFormulaire: "BAR-TH-101 vA78-3 (a compter du 01/01/2026)",
    pieces: [],
    mentions: [],
    condition: {
      tva_taux: 0.055,
      anciennete_min_ans: 2,
      surface_capteurs_min: 2,
      ...over,
    },
  };
}

function dossierSolaire(
  over: { solaire?: Record<string, unknown>; regle?: RegleMetierResolue | null } = {},
): DossierComplet {
  const { base, carac } = baseSansTravaux();
  return {
    ...base,
    caracteristiques: {
      ...carac,
      geste: "solaire_thermique",
      fiche: "BAR-TH-101",
      solaire: {
        type_solaire: "cesi",
        fiche: "BAR-TH-101",
        appoint: "electrique_joule",
        fluide: "eau_glycolee",
        surface_capteurs_m2: 4,
        profil_soutirage: "L",
        efficacite_ecs: 45,
        nb_ballons: 1,
        volume_ballon_l: 300,
        classe_ballon: "B",
        certification: "solar_keymark",
        marque: "Viessmann",
        reference: "Vitosol 200-FM",
        ...over.solaire,
      },
    },
    regle: over.regle === undefined ? regleSolaire() : over.regle,
  } as unknown as DossierComplet;
}

const codesSolaire = (d: DossierComplet) =>
  controlerDossier(d, AUJ).findings.map((f) => `${f.code}:${f.severite}`);

describe("controlerDossier — chauffe-eau solaire individuel (BAR-TH-101)", () => {
  it("CESI de référence : conforme, efficacité et surface ok", () => {
    const r = controlerDossier(dossierSolaire(), AUJ);
    expect(r.conforme).toBe(true);
    const cs = codesSolaire(dossierSolaire());
    expect(cs).toContain("technique_efficacite_ecs:ok");
    expect(cs).toContain("technique_surface_capteurs:ok");
  });

  it("efficacité ECS insuffisante en appoint électrique (< 37 % au profil L) : bloquant", () => {
    const d = dossierSolaire({ solaire: { efficacite_ecs: 35 } });
    expect(controlerDossier(d, AUJ).conforme).toBe(false);
    expect(codesSolaire(d)).toContain("technique_efficacite_ecs:bloquant");
  });

  it("le seuil suit l'appoint : 45 % passe en électrique, échoue en autre énergie", () => {
    const electrique = dossierSolaire();
    const autre = dossierSolaire({ solaire: { appoint: "autre" } });
    // Même efficacité (45 %), même profil (L) : seul l'appoint change. Sans
    // croisement appoint × profil, un CESI électrique conforme serait refusé.
    expect(codesSolaire(electrique)).toContain("technique_efficacite_ecs:ok");
    expect(codesSolaire(autre)).toContain("technique_efficacite_ecs:bloquant");
  });

  it("le seuil suit le profil : 38 % passe en XL, échoue en XXL (appoint électrique)", () => {
    const xl = dossierSolaire({ solaire: { efficacite_ecs: 38, profil_soutirage: "XL" } });
    const xxl = dossierSolaire({ solaire: { efficacite_ecs: 38, profil_soutirage: "XXL" } });
    expect(codesSolaire(xl)).toContain("technique_efficacite_ecs:ok");
    expect(codesSolaire(xxl)).toContain("technique_efficacite_ecs:bloquant");
  });

  it("surface de capteurs sous 2 m² : bloquant", () => {
    const d = dossierSolaire({ solaire: { surface_capteurs_m2: 1.5 } });
    expect(controlerDossier(d, AUJ).conforme).toBe(false);
    expect(codesSolaire(d)).toContain("technique_surface_capteurs:bloquant");
  });

  it("aucune surface maximale : 25 m² de capteurs reste conforme", () => {
    // Le plafond de 20 m² est le périmètre de la qualification QualiSol, pas un
    // critère de la fiche : le contrôler refuserait des dossiers valides.
    const d = dossierSolaire({ solaire: { surface_capteurs_m2: 25 } });
    expect(codesSolaire(d)).toContain("technique_surface_capteurs:ok");
    expect(controlerDossier(d, AUJ).conforme).toBe(true);
  });

  it("efficacite_ecs_min de la règle surcharge la matrice codée", () => {
    const d = dossierSolaire({ regle: regleSolaire({ efficacite_ecs_min: 50 }) });
    expect(controlerDossier(d, AUJ).conforme).toBe(false);
    expect(codesSolaire(d)).toContain("technique_efficacite_ecs:bloquant");
  });

  it("ballon <= 500 L de classe D : bloquant (classe C exigée)", () => {
    const d = dossierSolaire({ solaire: { classe_ballon: "D" } });
    expect(controlerDossier(d, AUJ).conforme).toBe(false);
    expect(codesSolaire(d)).toContain("technique_classe_ballon:bloquant");
  });

  it("ballon > 500 L : la classe n'est pas exigée, aucun finding", () => {
    const d = dossierSolaire({
      solaire: { volume_ballon_l: 600, classe_ballon: null },
    });
    expect(codesSolaire(d).some((c) => c.startsWith("technique_classe_ballon"))).toBe(false);
    expect(controlerDossier(d, AUJ).conforme).toBe(true);
  });

  it("appoint ou profil manquant : avertissement, jamais un seuil supposé", () => {
    const d = dossierSolaire({ solaire: { profil_soutirage: undefined } });
    expect(codesSolaire(d)).toContain("technique_efficacite_ecs:avertissement");
    expect(controlerDossier(d, AUJ).conforme).toBe(true);
  });

  it("ne déclenche aucun contrôle d'isolation, ETAS, COP ni rendement sur un CESI", () => {
    const cs = codesSolaire(dossierSolaire());
    expect(cs.some((c) => c.startsWith("technique_resistance"))).toBe(false);
    expect(cs.some((c) => c.startsWith("technique_etas"))).toBe(false);
    expect(cs.some((c) => c.startsWith("technique_cop"))).toBe(false);
    expect(cs.some((c) => c.startsWith("technique_rendement"))).toBe(false);
  });
});

describe("controlerDossier — non-cumul CEE PAC / solaire thermique (2026)", () => {
  const nonCumul = (d: DossierComplet) =>
    controlerDossier(d, AUJ).findings.find((f) => f.code === "eligibilite_non_cumul_solaire");

  it("alerte (sans bloquer) sur un dossier CEE de PAC air/eau, en citant le solaire", () => {
    const d = dossierPac();
    const f = nonCumul(d);
    expect(f?.severite).toBe("avertissement");
    expect(f?.detail).toContain("BAR-TH-101");
    // Non détectable automatiquement (règle inter-dossiers) : on alerte, on ne bloque
    // pas. Le dossier reste déposable.
    expect(controlerDossier(d, AUJ).conforme).toBe(true);
  });

  it("alerte sur un dossier CEE de chauffe-eau solaire, en citant la PAC", () => {
    const f = nonCumul(dossierSolaire());
    expect(f?.severite).toBe("avertissement");
    expect(f?.detail).toContain("BAR-TH-171");
  });

  it("ne s'applique pas aux gestes hors PAC / solaire (isolation, CET, bois)", () => {
    expect(nonCumul(dossier())).toBeUndefined(); // CEE combles isolation
    expect(nonCumul(dossierCet())).toBeUndefined();
    expect(nonCumul(dossierBois())).toBeUndefined();
  });

  it("ne s'applique pas en MaPrimeRénov' : ce non-cumul régit la seule valorisation CEE", () => {
    const mprPac = {
      ...dossierPac(),
      dossier: { dispositif: "maprimerenov", created_at: "2026-06-01" },
    } as unknown as DossierComplet;
    expect(nonCumul(mprPac)).toBeUndefined();
  });
});
