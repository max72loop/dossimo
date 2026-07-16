import { describe, expect, it } from "vitest";

import { genererTokenDossier, hacherToken } from "@/lib/depot/lien";

const SECRET = "secret-de-test-assez-long-pour-etre-credible";
const NONCE_A = "nonce-a";
const NONCE_B = "nonce-b";

describe("dérivation du jeton de dépôt", () => {
  it("redonne le même jeton tant que le nonce ne change pas", () => {
    // C'est ce qui permet de réafficher le lien à l'artisan et de le réutiliser
    // dans une relance sans casser l'URL déjà envoyée au bénéficiaire.
    const premier = genererTokenDossier("dossier-1", SECRET, NONCE_A);
    const relance = genererTokenDossier("dossier-1", SECRET, NONCE_A);
    expect(relance).toBe(premier);
    expect(premier.length).toBeGreaterThanOrEqual(40);
  });

  it("donne un jeton DIFFÉRENT dès que le nonce change", () => {
    // Régression, faille de 2026-07-16 : le jeton était dérivé du seul dossier_id,
    // donc identique à chaque génération. Une URL révoquée puis regénérée
    // redevenait valide, et la révocation ne révoquait rien. Le nonce neuf émis à
    // chaque nouveau lien est ce qui rend la révocation définitive : c'est cette
    // propriété-là qu'il faut protéger.
    expect(genererTokenDossier("dossier-1", SECRET, NONCE_A))
      .not.toBe(genererTokenDossier("dossier-1", SECRET, NONCE_B));
  });

  it("isole les dossiers et les secrets", () => {
    expect(genererTokenDossier("dossier-1", SECRET, NONCE_A))
      .not.toBe(genererTokenDossier("dossier-2", SECRET, NONCE_A));
    expect(genererTokenDossier("dossier-1", SECRET, NONCE_A))
      .not.toBe(genererTokenDossier("dossier-1", "autre-secret", NONCE_A));
  });

  it("refuse de dériver sans secret ni nonce", () => {
    // Le repli silencieux sur une chaîne vide produisait des HMAC forgeables.
    expect(() => genererTokenDossier("dossier-1", "", NONCE_A)).toThrow();
    expect(() => genererTokenDossier("dossier-1", SECRET, "")).toThrow();
  });

  it("ne stocke qu'une empreinte différente du jeton", () => {
    const token = genererTokenDossier("dossier-1", SECRET, NONCE_A);
    expect(hacherToken(token)).not.toBe(token);
    expect(hacherToken(token)).toHaveLength(64);
  });
});
