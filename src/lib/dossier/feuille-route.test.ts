import { describe, it, expect } from "vitest";

import { ajouterMois, feuilleRoute } from "@/lib/dossier/feuille-route";
import type { DossierComplet } from "@/lib/dossier/get-dossier";

function dossier(opts: {
  dispositif?: "cee" | "maprimerenov";
  dates?: Partial<DossierComplet["dates"]>;
}): DossierComplet {
  return {
    dossier: { dispositif: opts.dispositif ?? "cee" },
    artisan: null,
    caracteristiques: {},
    dates: {
      visite_technique: null,
      devis: "2026-03-12",
      debut_travaux: null,
      fin_travaux: null,
      facture: null,
      ...opts.dates,
    },
    regle: null,
  } as unknown as DossierComplet;
}

describe("ajouterMois", () => {
  it("ajoute des mois simples", () => {
    expect(ajouterMois("2026-05-05", 3)).toBe("2026-08-05");
  });

  it("borne au dernier jour du mois cible (31 janv. + 1 mois → 28 févr.)", () => {
    expect(ajouterMois("2026-01-31", 1)).toBe("2026-02-28");
  });

  it("gère le passage d'année", () => {
    expect(ajouterMois("2026-11-30", 3)).toBe("2027-02-28");
  });
});

describe("feuilleRoute — CEE", () => {
  it("place l'échéance de dépôt obligé à 3 mois après la facture", () => {
    const fr = feuilleRoute(
      dossier({ dates: { facture: "2026-05-05" } }),
      new Date("2026-07-19T12:00:00Z"),
    );
    expect(fr.prochaine?.echeance?.date).toBe("2026-08-05");
  });

  it("passe l'échéance en alerte quand il reste ≤ 21 jours (cas conforme mais urgent)", () => {
    const fr = feuilleRoute(
      dossier({ dates: { facture: "2026-05-05" } }), // échéance 2026-08-05
      new Date("2026-07-19T12:00:00Z"), // 17 jours restants
    );
    expect(fr.prochaine?.echeance?.joursRestants).toBe(17);
    expect(fr.prochaine?.echeance?.urgence).toBe("proche");
  });

  it("reste calme quand l'échéance est lointaine", () => {
    const fr = feuilleRoute(
      dossier({ dates: { facture: "2026-05-05" } }), // échéance 2026-08-05
      new Date("2026-06-01T12:00:00Z"),
    );
    expect(fr.prochaine?.echeance?.urgence).toBe("calme");
  });

  it("signale une échéance dépassée (cas de refus : fenêtre légale expirée)", () => {
    const fr = feuilleRoute(
      dossier({ dates: { facture: "2026-05-05" } }), // échéance 2026-08-05
      new Date("2026-09-01T12:00:00Z"),
    );
    expect(fr.prochaine?.echeance?.joursRestants).toBeLessThan(0);
    expect(fr.prochaine?.echeance?.urgence).toBe("depasse");
  });

  it("sans facture : pas d'échéance, l'action est de facturer", () => {
    const fr = feuilleRoute(dossier({ dates: { facture: null } }), new Date("2026-07-19T12:00:00Z"));
    expect(fr.prochaine?.echeance).toBeNull();
    expect(fr.prochaine?.titre).toMatch(/facturer/i);
  });

  it("pointe vers l'obligé comme destinataire", () => {
    const fr = feuilleRoute(dossier({}), new Date("2026-07-19T12:00:00Z"));
    expect(fr.destinataire).toMatch(/obligé/i);
  });
});

describe("feuilleRoute — MaPrimeRénov'", () => {
  it("avant travaux : l'échéance est la date de début de travaux (demande avant chantier)", () => {
    const fr = feuilleRoute(
      dossier({ dispositif: "maprimerenov", dates: { debut_travaux: "2026-08-10" } }),
      new Date("2026-07-19T12:00:00Z"),
    );
    expect(fr.prochaine?.titre).toMatch(/maprimerenov\.gouv\.fr/i);
    expect(fr.prochaine?.echeance?.date).toBe("2026-08-10");
  });

  it("après travaux : le solde, sans échéance dure", () => {
    const fr = feuilleRoute(
      dossier({
        dispositif: "maprimerenov",
        dates: { debut_travaux: "2026-05-01", fin_travaux: "2026-05-10", facture: "2026-05-12" },
      }),
      new Date("2026-07-19T12:00:00Z"),
    );
    expect(fr.prochaine?.titre).toMatch(/solde/i);
    expect(fr.prochaine?.echeance).toBeNull();
  });
});
