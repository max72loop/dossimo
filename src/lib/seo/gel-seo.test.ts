import { describe, expect, it } from "vitest";

import { estGeleSeo } from "./gel-seo";

const PENDANT_LE_GEL = new Date("2026-09-07T12:00:00Z");
const APRES_LE_GEL = new Date("2026-10-02T00:00:00Z");

describe("estGeleSeo", () => {
  it("gèle une page du tableau de seo/hermes.md pendant la fenêtre", () => {
    expect(estGeleSeo("checklist-avant-depot", PENDANT_LE_GEL)).toBe(true);
  });

  it("ne gèle jamais une page hors du tableau", () => {
    expect(estGeleSeo("eviter-refus-maprimerenov", PENDANT_LE_GEL)).toBe(false);
  });

  it("libère toutes les pages à la date de fin", () => {
    expect(estGeleSeo("checklist-avant-depot", APRES_LE_GEL)).toBe(false);
  });
});
