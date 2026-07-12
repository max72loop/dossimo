import { describe, it, expect } from "vitest";

import { controlerAvisImposition } from "@/lib/rules/controle-avis";
import { categoriePour, plafondPour, zoneDeCodePostal } from "@/lib/rules/plafonds";
import type { CeeIsolationCaracteristiques } from "@/lib/dossier/get-dossier";
import type { AvisImposition } from "@/lib/piece/avis-imposition";
import type { Finding } from "@/lib/rules/types";
import type { PlafondRessources } from "@/lib/database.types";

/** Barème 2026 réel (migration 0017), réduit aux lignes utiles aux cas ci-dessous. */
const ligne = (
  zone: "idf" | "hors_idf",
  personnes: number,
  grande: number,
  precaire: number,
): PlafondRessources =>
  ({
    id: `${zone}-${personnes}`,
    annee: 2026,
    zone,
    personnes,
    plafond_grande_precarite: grande,
    plafond_precaire: precaire,
    actif: true,
    created_at: "2026-01-01T00:00:00Z",
  }) as PlafondRessources;

const PLAFONDS: PlafondRessources[] = [
  ligne("hors_idf", 1, 17363, 22259),
  ligne("hors_idf", 4, 35676, 45735),
  ligne("hors_idf", 5, 40835, 52348),
  ligne("hors_idf", 0, 5151, 6598), // par personne supplémentaire
  ligne("idf", 4, 49455, 60208),
];

const carac = (
  precarite: CeeIsolationCaracteristiques["beneficiaire"]["precarite"],
  codePostal = "33000",
): CeeIsolationCaracteristiques =>
  ({
    beneficiaire: {
      nom: "Martin",
      prenom: "Claire",
      code_postal: codePostal,
      precarite,
    },
  }) as CeeIsolationCaracteristiques;

const avis = (over: Partial<AvisImposition> = {}): AvisImposition => ({
  revenu_fiscal_reference: 30000,
  annee_revenus: 2025,
  foyer_personnes: 4,
  nombre_parts: 3,
  declarant: "MARTIN Claire",
  hors_sujet: false,
  ...over,
});

const juger = (
  precarite: CeeIsolationCaracteristiques["beneficiaire"]["precarite"],
  a: Partial<AvisImposition> = {},
  codePostal = "33000",
): Finding[] =>
  controlerAvisImposition({
    caracteristiques: carac(precarite, codePostal),
    avis: avis(a),
    plafonds: PLAFONDS,
    anneeCourante: 2026,
  });

const code = (fs: Finding[], c: string) => fs.find((f) => f.code === c);

describe("plafonds de ressources", () => {
  it("reconnaît l'Île-de-France au code postal", () => {
    expect(zoneDeCodePostal("93100")).toBe("idf");
    expect(zoneDeCodePostal("75011")).toBe("idf");
    expect(zoneDeCodePostal("33000")).toBe("hors_idf");
    expect(zoneDeCodePostal("59000")).toBe("hors_idf");
  });

  it("étend le barème au-delà de 5 personnes par l'incrément", () => {
    // 7 personnes = plafond 5 personnes + 2 × incrément.
    const p = plafondPour(PLAFONDS, "hors_idf", 7);
    expect(p?.grande_precarite).toBe(40835 + 2 * 5151);
    expect(p?.precaire).toBe(52348 + 2 * 6598);
  });

  it("ne conclut pas quand le barème ne couvre pas le cas", () => {
    // Ligne « 2 personnes » absente de ce barème réduit, et 2 ≤ 5 : pas d'extrapolation.
    expect(plafondPour(PLAFONDS, "hors_idf", 2)).toBeNull();
    expect(plafondPour(PLAFONDS, "idf", 7)).toBeNull(); // pas d'incrément IDF ici
    expect(plafondPour(PLAFONDS, "hors_idf", 0)).toBeNull();
  });

  it("classe le RFR dans la bonne catégorie", () => {
    const p = { grande_precarite: 35676, precaire: 45735 };
    expect(categoriePour(30000, p)).toBe("grande_precarite");
    expect(categoriePour(35676, p)).toBe("grande_precarite"); // borne incluse
    expect(categoriePour(40000, p)).toBe("precaire");
    expect(categoriePour(45736, p)).toBe("classique");
  });
});

describe("contrôle de l'avis d'imposition", () => {
  it("confirme une catégorie de revenus exacte", () => {
    // 30 000 € pour 4 personnes hors IDF : sous le plafond très modeste (35 676 €).
    const f = code(juger("grande_precarite"), "avis_revenus")!;
    expect(f.severite).toBe("ok");
  });

  it("BLOQUE une précarité surestimée : la prime serait recalculée à la baisse", () => {
    // C'est le motif de refus que rien d'autre ne peut voir : la saisie est cohérente
    // avec elle-même, seul l'avis la contredit.
    const f = code(juger("grande_precarite", { revenu_fiscal_reference: 44000 }), "avis_revenus")!;
    expect(f.severite).toBe("bloquant");
    expect(f.titre).toContain("trop favorable");
    expect(f.detail).toContain("recalculée à la baisse");
  });

  it("AVERTIT d'une précarité sous-estimée : le client perd de l'argent", () => {
    // 30 000 € pour 4 personnes = très modeste. Le dossier déclare « classique » :
    // personne ne le refusera, mais le client touchera moins que son dû.
    const f = code(juger("classique"), "avis_revenus")!;
    expect(f.severite).toBe("avertissement");
    expect(f.titre).toContain("trop prudente");
  });

  it("applique les plafonds d'Île-de-France sur un dossier francilien", () => {
    // 44 000 € pour 4 personnes : « précaire » hors IDF (plafond 35 676 €), mais
    // « grande précarité » en IDF (plafond 49 455 €). Le code postal change le verdict.
    const hors = code(juger("grande_precarite", { revenu_fiscal_reference: 44000 }, "33000"), "avis_revenus")!;
    const idf = code(juger("grande_precarite", { revenu_fiscal_reference: 44000 }, "93100"), "avis_revenus")!;
    expect(hors.severite).toBe("bloquant");
    expect(idf.severite).toBe("ok");
  });

  it("refuse un document qui n'est pas un avis d'imposition", () => {
    const fs = juger("grande_precarite", { hors_sujet: true });
    expect(code(fs, "avis_hors_sujet")?.severite).toBe("bloquant");
    // Et ne prétend rien juger d'autre sur un document qu'il n'a pas compris.
    expect(code(fs, "avis_revenus")).toBeUndefined();
  });

  it("relève un avis qui n'est pas au nom du bénéficiaire", () => {
    expect(
      code(juger("grande_precarite", { declarant: "DUPONT Jean" }), "avis_declarant")
        ?.severite,
    ).toBe("bloquant");
  });

  it("accepte « MARTIN Claire » pour une bénéficiaire nommée Claire Martin", () => {
    expect(code(juger("grande_precarite", { declarant: "MARTIN Claire" }), "avis_declarant")).toBeUndefined();
  });

  it("relève un avis trop ancien", () => {
    expect(
      code(juger("grande_precarite", { annee_revenus: 2022 }), "avis_perime")?.severite,
    ).toBe("bloquant");
  });

  it("n'accuse pas quand le RFR n'a pas pu être lu", () => {
    // Une lecture ratée n'est pas une fraude : on avertit, on ne bloque pas.
    const fs = juger("grande_precarite", { revenu_fiscal_reference: null });
    expect(code(fs, "avis_illisible")?.severite).toBe("avertissement");
    expect(fs.some((f) => f.severite === "bloquant")).toBe(false);
  });

  it("n'accuse pas quand la composition du foyer est illisible", () => {
    // Sans le nombre de personnes, aucun plafond n'est applicable : ne rien conclure
    // vaut mieux que conclure au hasard — le plafond varie du simple au double.
    const fs = juger("grande_precarite", { foyer_personnes: null });
    expect(code(fs, "avis_foyer_illisible")?.severite).toBe("avertissement");
    expect(code(fs, "avis_revenus")).toBeUndefined();
  });

  it("ne bloque pas un dossier quand le barème est indisponible", () => {
    const fs = controlerAvisImposition({
      caracteristiques: carac("grande_precarite"),
      avis: avis(),
      plafonds: [],
      anneeCourante: 2026,
    });
    expect(code(fs, "avis_bareme_absent")?.severite).toBe("avertissement");
  });
});
