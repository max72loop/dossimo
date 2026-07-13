import { describe, expect, it } from "vitest";

import { genererTokenDossier, hacherToken } from "@/lib/depot/lien";

describe("lien bénéficiaire unique", () => {
  it("recalcule toujours le même jeton pour un dossier", () => {
    const premier = genererTokenDossier("dossier-1", "secret-de-test");
    const relance = genererTokenDossier("dossier-1", "secret-de-test");
    expect(relance).toBe(premier);
    expect(premier.length).toBeGreaterThanOrEqual(40);
  });

  it("isole les dossiers et les secrets", () => {
    expect(genererTokenDossier("dossier-1", "secret-de-test"))
      .not.toBe(genererTokenDossier("dossier-2", "secret-de-test"));
    expect(genererTokenDossier("dossier-1", "secret-de-test"))
      .not.toBe(genererTokenDossier("dossier-1", "autre-secret"));
  });

  it("ne stocke qu'une empreinte différente du jeton", () => {
    const token = genererTokenDossier("dossier-1", "secret-de-test");
    expect(hacherToken(token)).not.toBe(token);
    expect(hacherToken(token)).toHaveLength(64);
  });
});
