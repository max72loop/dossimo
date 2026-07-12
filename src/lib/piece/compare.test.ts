import { describe, it, expect } from "vitest";

import { comparerPiece, nbEcarts } from "@/lib/piece/compare";
import type { DossierComplet } from "@/lib/dossier/get-dossier";
import type { ExtractedPiece } from "@/lib/piece/extract";

const data = {
  caracteristiques: {
    beneficiaire: { nom: "Martin", prenom: "Claire", code_postal: "93100" },
    travaux: { surface_isolee_m2: 95, resistance_thermique_r: 7.5, isolant_marque: "Isover", isolant_reference: "IBR 300" },
    montants: { ht: 4200, ttc: 4620 },
    rge: { numero: "QB/12345" },
  },
  dates: { devis: "2025-03-10", facture: "2025-04-10" },
} as unknown as DossierComplet;

/**
 * Dossier PAC tel que l'écrit réellement `createDossierCeeIsolation` : le mapping
 * construit `travaux` OU `pac`/`cet`/`bois`, jamais les deux. Un dossier non-isolation
 * n'a donc AUCUN bloc `travaux` — c'est la forme que le comparateur doit encaisser.
 */
const dataPac = {
  caracteristiques: {
    geste: "pac_air_eau",
    fiche: "BAR-TH-171",
    beneficiaire: { nom: "Martin", prenom: "Claire", code_postal: "93100" },
    pac: { type_pac: "air_eau", etas: 145, puissance_kw: 8, marque: "Atlantic", reference: "Alfea" },
    montants: { ht: 4200, ttc: 4620 },
    rge: { numero: "QB/12345" },
  },
  dates: { devis: "2025-03-10", facture: "2025-04-10" },
} as unknown as DossierComplet;

const exOk: ExtractedPiece = {
  beneficiaire_nom: "Claire Martin", code_postal: "93100", surface_isolee_m2: 95,
  resistance_thermique_r: 7.5, isolant_marque: "Isover", isolant_reference: "IBR 300",
  montant_ht: 4200, montant_ttc: 4620, date: "2025-03-10", rge_numero: "QB/12345",
} as ExtractedPiece;

/** Extraction d'un devis de PAC : les champs propres à l'isolation n'y figurent pas. */
const exPac: ExtractedPiece = {
  ...exOk,
  surface_isolee_m2: null, resistance_thermique_r: null,
  isolant_marque: null, isolant_reference: null,
} as ExtractedPiece;

const champ = (rs: ReturnType<typeof comparerPiece>, nom: string) =>
  rs.find((r) => r.champ.startsWith(nom));

describe("comparerPiece", () => {
  it("pièce identique à la saisie : aucun écart", () => {
    const rs = comparerPiece(data, exOk, "devis");
    expect(nbEcarts(rs)).toBe(0);
  });

  it("surface divergente : écart détecté", () => {
    const rs = comparerPiece(data, { ...exOk, surface_isolee_m2: 80 }, "devis");
    expect(champ(rs, "Surface")?.statut).toBe("ecart");
    expect(nbEcarts(rs)).toBe(1);
  });

  it("montant TTC divergent : écart détecté", () => {
    const rs = comparerPiece(data, { ...exOk, montant_ttc: 4431 }, "devis");
    expect(champ(rs, "Montant TTC")?.statut).toBe("ecart");
  });

  it("champ non lu (null) : statut absent, pas écart", () => {
    const rs = comparerPiece(data, { ...exOk, surface_isolee_m2: null }, "devis");
    expect(champ(rs, "Surface")?.statut).toBe("absent");
    expect(nbEcarts(rs)).toBe(0);
  });

  it("tolère les micro-écarts de surface (< 0,5 m²)", () => {
    const rs = comparerPiece(data, { ...exOk, surface_isolee_m2: 95.3 }, "devis");
    expect(champ(rs, "Surface")?.statut).toBe("ok");
  });
});

describe("comparerPiece — gestes sans bloc « travaux » (PAC, CET, bois)", () => {
  /** Extraction d'un devis de PAC bien lu : les caractéristiques sont dans `pac_*`. */
  const exPacLu = {
    ...exPac,
    pac_etas: 145,
    pac_puissance_kw: 8,
    pac_marque: "Atlantic",
    pac_reference: "Alfea",
  } as ExtractedPiece;

  it("ne lève pas sur un dossier PAC", () => {
    expect(() => comparerPiece(dataPac, exPac, "devis")).not.toThrow();
  });

  it("compare les caractéristiques de la PAC, pas celles de l'isolation", () => {
    const rs = comparerPiece(dataPac, exPacLu, "devis");
    expect(rs.map((r) => r.champ)).toEqual([
      "Bénéficiaire", "Code postal",
      "ETAS", "Puissance", "Marque PAC", "Référence PAC",
      "Montant HT", "Montant TTC", "Date devis", "N° RGE",
    ]);
    expect(nbEcarts(rs)).toBe(0);
  });

  it("omet les champs d'isolation, sans les compter « non lus »", () => {
    const rs = comparerPiece(dataPac, exPacLu, "devis");
    expect(champ(rs, "Surface")).toBeUndefined();
    expect(champ(rs, "Résistance")).toBeUndefined();
  });

  it("relève un ETAS de la pièce qui contredit la saisie", () => {
    // Le cœur du geste PAC : un ETAS de 126 % au lieu de 145 % fait basculer
    // l'éligibilité. C'est exactement ce qu'un contrôle isolation-only laissait passer.
    const rs = comparerPiece(dataPac, { ...exPacLu, pac_etas: 126 }, "devis");
    expect(champ(rs, "ETAS")?.statut).toBe("ecart");
    expect(nbEcarts(rs)).toBe(1);
  });

  it("caractéristique PAC non lue : absent, pas écart", () => {
    const rs = comparerPiece(dataPac, { ...exPacLu, pac_etas: null }, "devis");
    expect(champ(rs, "ETAS")?.statut).toBe("absent");
    expect(nbEcarts(rs)).toBe(0);
  });

  it("relève un écart de montant sur un dossier PAC", () => {
    const rs = comparerPiece(dataPac, { ...exPacLu, montant_ttc: 5200 }, "devis");
    expect(champ(rs, "Montant TTC")?.statut).toBe("ecart");
    expect(nbEcarts(rs)).toBe(1);
  });

  it("compare le COP et le volume d'un chauffe-eau thermodynamique", () => {
    const dataCet = {
      caracteristiques: {
        geste: "cet",
        fiche: "BAR-TH-148",
        beneficiaire: { nom: "Martin", prenom: "Claire", code_postal: "93100" },
        cet: { type_cet: "accumulation", cop: 3.2, profil_soutirage: "L", volume_l: 200, marque: "Thermor", reference: null },
        montants: { ht: 4200, ttc: 4620 },
        rge: { numero: "QB/12345" },
      },
      dates: { devis: "2025-03-10", facture: "2025-04-10" },
    } as unknown as DossierComplet;

    const rs = comparerPiece(
      dataCet,
      { ...exPac, cet_cop: 2.4, cet_volume_l: 200, cet_marque: "Thermor" } as ExtractedPiece,
      "devis",
    );
    expect(champ(rs, "COP")?.statut).toBe("ecart");
    expect(champ(rs, "Volume")?.statut).toBe("ok");
    expect(champ(rs, "Marque du chauffe-eau")?.statut).toBe("ok");
  });

  it("compare le rendement d'un appareil de chauffage au bois", () => {
    const dataBois = {
      caracteristiques: {
        geste: "bois",
        fiche: "BAR-TH-112",
        beneficiaire: { nom: "Martin", prenom: "Claire", code_postal: "93100" },
        bois: { type_bois: "appareil", combustible: "granules", rendement: 87, emissions_co: null, marque: "Invicta", reference: null },
        montants: { ht: 4200, ttc: 4620 },
        rge: { numero: "QB/12345" },
      },
      dates: { devis: "2025-03-10", facture: "2025-04-10" },
    } as unknown as DossierComplet;

    const rs = comparerPiece(
      dataBois,
      { ...exPac, bois_rendement: 72, bois_marque: "Invicta" } as ExtractedPiece,
      "devis",
    );
    expect(champ(rs, "Rendement")?.statut).toBe("ecart");
    // Émissions de CO non saisies : rien à confronter, pas de ligne « non lue ».
    expect(champ(rs, "Émissions")).toBeUndefined();
  });
});
