import { afterEach, describe, expect, it, vi } from "vitest";

import { domaineCouvreGeste } from "@/lib/verification/domaines";
import { evaluerRge, verifierEntreprise } from "@/lib/verification/verifier";
import type { QualificationRge } from "@/lib/verification/types";

afterEach(() => {
  vi.unstubAllEnvs();
});

const isolationCombles = "Isolation des combles perdus";
const isolationMursExt = "Isolation des murs par l'extérieur";
const pacChauffage = "Pompe à chaleur : chauffage";
const cet = "Chauffe-Eau Thermodynamique";
const poeleBois = "Poêle ou insert bois";
const etudeBois = "Etude bois énergie";

describe("domaineCouvreGeste", () => {
  it("associe les domaines d'isolation à la famille isolation", () => {
    expect(domaineCouvreGeste(isolationCombles, "isolation")).toBe(true);
    expect(domaineCouvreGeste(isolationMursExt, "isolation")).toBe(true);
    expect(domaineCouvreGeste(pacChauffage, "isolation")).toBe(false);
  });

  it("associe la PAC, le CET et le bois aux bonnes familles", () => {
    expect(domaineCouvreGeste(pacChauffage, "pac_air_eau")).toBe(true);
    expect(domaineCouvreGeste(cet, "cet")).toBe(true);
    expect(domaineCouvreGeste(poeleBois, "bois")).toBe(true);
  });

  it("ne prend PAS une étude bois pour une qualif de travaux bois", () => {
    expect(domaineCouvreGeste(etudeBois, "bois")).toBe(false);
  });
});

function qualif(over: Partial<QualificationRge> = {}): QualificationRge {
  return {
    numero: "8611",
    qualification: "Qualibat 7131",
    domaine: isolationCombles,
    meta_domaine: null,
    organisme: "Qualibat",
    date_debut: "2020-01-01",
    date_fin: "2030-12-31",
    ...over,
  };
}

describe("evaluerRge", () => {
  it("aucune qualif -> statut aucune", () => {
    expect(evaluerRge([], "isolation", "2024-06-01").statut).toBe("aucune");
  });

  it("qualif d'un autre domaine -> domaine_absent", () => {
    const res = evaluerRge([qualif({ domaine: pacChauffage })], "isolation", "2024-06-01");
    expect(res.statut).toBe("domaine_absent");
  });

  it("qualif du bon domaine couvrant la date -> couvert", () => {
    const res = evaluerRge([qualif()], "isolation", "2024-06-01");
    expect(res.statut).toBe("couvert");
    expect(res.retenue?.numero).toBe("8611");
  });

  it("qualif du bon domaine expirée à la date du devis -> expire", () => {
    const res = evaluerRge(
      [qualif({ date_debut: "2019-01-01", date_fin: "2022-12-31" })],
      "isolation",
      "2024-06-01",
    );
    expect(res.statut).toBe("expire");
  });

  it("sans date de devis, retient la qualif du bon domaine -> couvert", () => {
    expect(evaluerRge([qualif()], "isolation", null).statut).toBe("couvert");
  });
});

describe("verifierEntreprise", () => {
  it("mode off : ne vérifie rien (aucun appel réseau)", async () => {
    vi.stubEnv("DOSSIMO_VERIFICATION_MODE", "off");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const v = await verifierEntreprise({
      siret: "12345678900011",
      famille: "isolation",
      dateDevis: "2024-06-01",
    });
    expect(v.entreprise.statut).toBe("non_verifie");
    expect(v.rge.statut).toBe("non_verifie");
    expect(v.effectuee_le).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("mode demo : accepte un SIRET fictif sans réseau", async () => {
    vi.stubEnv("DOSSIMO_VERIFICATION_MODE", "demo");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const v = await verifierEntreprise({
      siret: "99999999999999",
      famille: "pac_air_eau",
      dateDevis: "2024-06-01",
    });
    expect(v.mode).toBe("demo");
    expect(v.entreprise.statut).toBe("actif");
    expect(v.rge.statut).toBe("couvert");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("SIRET de démo dédié reconnu même en mode reel (sans réseau)", async () => {
    vi.stubEnv("DOSSIMO_VERIFICATION_MODE", "reel");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const v = await verifierEntreprise({
      siret: "11111111111111",
      famille: "isolation",
      dateDevis: "2024-06-01",
    });
    expect(v.entreprise.statut).toBe("actif");
    expect(v.entreprise.denomination).toContain("Dossimo");
    expect(v.rge.statut).toBe("couvert");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
