import { describe, it, expect } from "vitest";

import { estimerPrime } from "@/lib/dossier/prime";
import type { DossierComplet } from "@/lib/dossier/get-dossier";

function dossier(opts: {
  dispositif?: "cee" | "maprimerenov";
  precarite?: string;
  surface?: number;
  prime?: unknown;
}): DossierComplet {
  return {
    dossier: { dispositif: opts.dispositif ?? "cee" },
    artisan: null,
    caracteristiques: {
      beneficiaire: { precarite: opts.precarite ?? "precaire" },
      travaux: { surface_isolee_m2: opts.surface ?? 95 },
    },
    dates: {},
    regle:
      opts.prime === undefined
        ? { condition: { prime: { par_m2: { intermediaire: 5, precaire: 8, grande_precarite: 10 } } } }
        : opts.prime === null
          ? null
          : { condition: { prime: opts.prime } },
  } as unknown as DossierComplet;
}

describe("estimerPrime", () => {
  it("calcule euro/m² × surface selon la catégorie de revenus", () => {
    const e = estimerPrime(dossier({ precarite: "precaire", surface: 95 }));
    expect(e?.montant).toBe(760); // 8 × 95
  });

  it("utilise le bon taux pour grande précarité", () => {
    const e = estimerPrime(dossier({ precarite: "grande_precarite", surface: 60 }));
    expect(e?.montant).toBe(600); // 10 × 60
  });

  it("applique le plafond quand il est défini", () => {
    const e = estimerPrime(
      dossier({ precarite: "precaire", surface: 200, prime: { par_m2: { precaire: 8 }, plafond: 1000 } }),
    );
    expect(e?.montant).toBe(1000); // 8 × 200 = 1600, plafonné à 1000
  });

  it("renvoie null sans barème", () => {
    expect(estimerPrime(dossier({ prime: null }))).toBeNull();
  });

  it("renvoie null si la catégorie n'a pas de taux", () => {
    const e = estimerPrime(dossier({ precarite: "intermediaire", prime: { par_m2: { precaire: 8 } } }));
    expect(e).toBeNull();
  });

  it("rose (superieur) en MaPrimeRénov' : aucun forfait, donc non estimable", () => {
    // Le barème MPR ne porte pas de clé `superieur` : le rose n'est pas éligible au
    // parcours par geste. On ne doit pas afficher la prime du violet à un rose.
    const e = estimerPrime(
      dossier({
        dispositif: "maprimerenov",
        precarite: "superieur",
        prime: { forfait: { grande_precarite: 4000, precaire: 3000, intermediaire: 2000 } },
      }),
    );
    expect(e).toBeNull();
  });

  it("violet (intermediaire) : estime au forfait de sa bande (CESI 2000)", () => {
    const e = estimerPrime(
      dossier({
        dispositif: "maprimerenov",
        precarite: "intermediaire",
        surface: 0,
        prime: { forfait: { grande_precarite: 4000, precaire: 3000, intermediaire: 2000 } },
      }),
    );
    expect(e?.montant).toBe(2000);
  });

  it("rose (superieur) en CEE : estimé, car le CEE ignore violet et rose", () => {
    const e = estimerPrime(
      dossier({
        dispositif: "cee",
        precarite: "superieur",
        surface: 100,
        prime: { par_m2: { grande_precarite: 13, precaire: 11, intermediaire: 7, superieur: 7 } },
      }),
    );
    expect(e?.montant).toBe(700);
  });

  it("le dispositif est reporté dans le résultat", () => {
    expect(estimerPrime(dossier({ dispositif: "maprimerenov" }))?.dispositif).toBe("MaPrimeRénov'");
  });

  it("forfait : montant fixe selon le profil, indépendant de la surface (PAC)", () => {
    const forfait = { forfait: { intermediaire: 2500, precaire: 3500, grande_precarite: 4500 } };
    const e = estimerPrime(dossier({ precarite: "grande_precarite", surface: 0, prime: forfait }));
    expect(e?.montant).toBe(4500);
    expect(e?.base).toMatch(/forfait/);
  });

  it("forfait : renvoie null si le profil n'a pas de montant", () => {
    const e = estimerPrime(dossier({ precarite: "superieur", prime: { forfait: { precaire: 3500 } } }));
    expect(e).toBeNull();
  });
});
