import { describe, it, expect } from "vitest";

import {
  renderRecapPdf,
  renderChecklistPdf,
  renderControlePdf,
  renderAhCeePdf,
} from "@/lib/pack/render";
import type { DossierComplet } from "@/lib/dossier/get-dossier";
import type { RegleMetierResolue } from "@/lib/rules/regles-metier";

/**
 * Smoke test de la Phase 1b : les documents du pack doivent se rendre pour un
 * geste PAC (sans bloc `travaux`). Le risque réel est un accès direct à
 * `c.travaux.*` qui planterait le rendu — on vérifie ici qu'un PDF non vide
 * sort de chaque route documentaire.
 */
const reglePac: RegleMetierResolue = {
  version: 1,
  versionFormulaire: "BAR-TH-171 vA78.4",
  pieces: [
    { id: "devis_signe", label: "Devis signé", description: "…", obligatoire: true },
    { id: "facture", label: "Facture", description: "…", obligatoire: true },
  ],
  mentions: [
    "Type et modèle de la pompe à chaleur (marque et référence)",
    "Efficacité énergétique saisonnière (ETAS) et régime de température",
  ],
  condition: {
    tva_taux: 0.055,
    anciennete_min_ans: 2,
    prime: { forfait: { grande_precarite: 4500, precaire: 3500, classique: 2500 } },
  },
};

function dossierPac(): DossierComplet {
  return {
    dossier: { dispositif: "cee", created_at: "2026-06-01", statut: "nouveau" },
    artisan: { entreprise: "Chaleur & Co", siret: "12345678900011" },
    caracteristiques: {
      geste: "pac_air_eau",
      fiche: "BAR-TH-171",
      beneficiaire: {
        nom: "Durand", prenom: "Paul", adresse: "8 rue du Four",
        code_postal: "94000", commune: "Créteil", email: null, telephone: null,
        occupation: "proprietaire_occupant", precarite: "precaire",
      },
      logement: { type: "maison", annee_construction: 1990, residence: "principale", surface_habitable: 110 },
      // Pas de bloc `travaux` : c'est tout l'enjeu du geste PAC.
      pac: {
        type_pac: "air_eau", fiche: "BAR-TH-171", etas: 132, puissance_kw: 9,
        temperature: "basse", marque: "Atlantic", reference: "Alfea Excellia",
        regulateur_classe: "IV",
      },
      montants: { ht: 12000, ttc: 12660, prime_estime: 3500 },
      rge: { numero: "QB/54321", domaine: "QualiPAC", date_debut: "2024-01-01", date_fin: "2027-12-31" },
    },
    dates: { visite_technique: "2026-05-01", devis: "2026-05-10", debut_travaux: "2026-06-01", fin_travaux: "2026-06-03", facture: "2026-06-05" },
    regle: reglePac,
  } as unknown as DossierComplet;
}

describe("rendu du pack — geste PAC air/eau (Phase 1b)", () => {
  it("récapitulatif : PDF non vide", async () => {
    const buf = await renderRecapPdf(dossierPac());
    expect(buf.length).toBeGreaterThan(1000);
  });

  it("checklist : PDF non vide", async () => {
    const buf = await renderChecklistPdf(dossierPac());
    expect(buf.length).toBeGreaterThan(1000);
  });

  it("rapport de contrôle : PDF non vide", async () => {
    const buf = await renderControlePdf(dossierPac());
    expect(buf.length).toBeGreaterThan(1000);
  });

  it("attestation sur l'honneur CEE : PDF non vide", async () => {
    const buf = await renderAhCeePdf(dossierPac(), {
      titre: "Attestation sur l'honneur — CEE PAC air/eau",
      arrete: "annexe 7-1",
      version: "2026-04 (P6)",
      variant: "p6",
      ficheRef: "BAR-TH-171 vA78.4",
    });
    expect(buf.length).toBeGreaterThan(1000);
  });
});

function dossierCet(): DossierComplet {
  const base = dossierPac();
  return {
    ...base,
    caracteristiques: {
      ...base.caracteristiques,
      geste: "cet",
      fiche: "BAR-TH-148",
      pac: undefined,
      cet: {
        type_cet: "accumulation", fiche: "BAR-TH-148", cop: 3.1,
        profil_soutirage: "L", volume_l: 200, marque: "Atlantic", reference: "Calypso",
      },
    },
  } as unknown as DossierComplet;
}

describe("rendu du pack — geste chauffe-eau thermodynamique (BAR-TH-148)", () => {
  it("récapitulatif : PDF non vide", async () => {
    expect((await renderRecapPdf(dossierCet())).length).toBeGreaterThan(1000);
  });
  it("checklist : PDF non vide", async () => {
    expect((await renderChecklistPdf(dossierCet())).length).toBeGreaterThan(1000);
  });
  it("rapport de contrôle : PDF non vide", async () => {
    expect((await renderControlePdf(dossierCet())).length).toBeGreaterThan(1000);
  });
  it("attestation sur l'honneur CEE : PDF non vide", async () => {
    const buf = await renderAhCeePdf(dossierCet(), {
      titre: "Attestation sur l'honneur — CEE CET",
      arrete: "annexe 7-1",
      version: "2026-04 (P6)",
      variant: "p6",
      ficheRef: "BAR-TH-148",
    });
    expect(buf.length).toBeGreaterThan(1000);
  });
});

function dossierBois(): DossierComplet {
  const base = dossierPac();
  return {
    ...base,
    caracteristiques: {
      ...base.caracteristiques,
      geste: "bois",
      fiche: "BAR-TH-112",
      pac: undefined,
      bois: {
        type_bois: "appareil", fiche: "BAR-TH-112", combustible: "granules",
        rendement: 91, emissions_co: 180, marque: "MCZ", reference: "Suite",
      },
    },
  } as unknown as DossierComplet;
}

describe("rendu du pack — geste appareil de chauffage au bois (BAR-TH-112)", () => {
  it("récapitulatif : PDF non vide", async () => {
    expect((await renderRecapPdf(dossierBois())).length).toBeGreaterThan(1000);
  });
  it("checklist : PDF non vide", async () => {
    expect((await renderChecklistPdf(dossierBois())).length).toBeGreaterThan(1000);
  });
  it("rapport de contrôle : PDF non vide", async () => {
    expect((await renderControlePdf(dossierBois())).length).toBeGreaterThan(1000);
  });
  it("attestation sur l'honneur CEE : PDF non vide", async () => {
    const buf = await renderAhCeePdf(dossierBois(), {
      titre: "Attestation sur l'honneur — CEE bois",
      arrete: "annexe 7-1",
      version: "2026-04 (P6)",
      variant: "p6",
      ficheRef: "BAR-TH-112",
    });
    expect(buf.length).toBeGreaterThan(1000);
  });
});

function dossierSolaire(): DossierComplet {
  const base = dossierPac();
  return {
    ...base,
    caracteristiques: {
      ...base.caracteristiques,
      geste: "solaire_thermique",
      fiche: "BAR-TH-101",
      pac: undefined,
      solaire: {
        type_solaire: "cesi", fiche: "BAR-TH-101", appoint: "electrique_joule",
        fluide: "eau_glycolee", surface_capteurs_m2: 4.5, profil_soutirage: "L",
        efficacite_ecs: 46, nb_ballons: 1, volume_ballon_l: 300,
        classe_ballon: "B", certification: "solar_keymark",
        marque: "Viessmann", reference: "Vitosol 200-FM",
      },
    },
    regle: {
      ...reglePac,
      versionFormulaire: "BAR-TH-101 vA78-3 (a compter du 01/01/2026)",
      mentions: [
        "Fiche CEE : {fiche}",
        "Surface hors-tout totale des capteurs : {surface} m²",
      ],
      condition: { tva_taux: 0.055, anciennete_min_ans: 2, surface_capteurs_min: 2 },
    },
  } as unknown as DossierComplet;
}

describe("rendu du pack — chauffe-eau solaire individuel (BAR-TH-101)", () => {
  it("récapitulatif : PDF non vide", async () => {
    expect((await renderRecapPdf(dossierSolaire())).length).toBeGreaterThan(1000);
  });
  it("checklist : PDF non vide", async () => {
    expect((await renderChecklistPdf(dossierSolaire())).length).toBeGreaterThan(1000);
  });
  it("rapport de contrôle : PDF non vide", async () => {
    expect((await renderControlePdf(dossierSolaire())).length).toBeGreaterThan(1000);
  });
  it("attestation sur l'honneur CEE : PDF non vide", async () => {
    const buf = await renderAhCeePdf(dossierSolaire(), {
      titre: "Attestation sur l'honneur — CEE chauffe-eau solaire individuel",
      arrete: "annexe 7-1",
      version: "2026-04 (P6)",
      variant: "p6",
      ficheRef: "BAR-TH-101",
    });
    expect(buf.length).toBeGreaterThan(1000);
  });
});
