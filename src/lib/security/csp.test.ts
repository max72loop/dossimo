import { describe, expect, it } from "vitest";

import { VISITE } from "@/lib/landing/visite";
import { construireCsp } from "@/lib/security/csp";

/**
 * Ce que ces tests attrapent : une `iframe` livrée sans son `frame-src`. La visite
 * guidée est partie en production le 2026-07-30 avec ce trou — rien ne cassait au
 * build, rien ne cassait aux tests, et le visiteur voyait « Ce contenu est bloqué ».
 * Le premier test relie donc la politique à la source du tiers, pas à une chaîne
 * recopiée : changer d'hébergeur de démo sans ouvrir la politique casse ici.
 */
describe("construireCsp", () => {
  const directives = (csp: string) => csp.split("; ");
  const directive = (csp: string, nom: string) =>
    directives(csp).find((d) => d.startsWith(`${nom} `));

  it("autorise en cadre l'hébergeur de la visite guidée, et lui seul", () => {
    const frameSrc = directive(construireCsp({ nonce: "n" }), "frame-src");

    expect(frameSrc).toBe(`frame-src 'self' ${VISITE.origine}`);
  });

  it("garde le socle restrictif", () => {
    const csp = construireCsp({ nonce: "n" });

    expect(directives(csp)).toContain("default-src 'self'");
    expect(directives(csp)).toContain("frame-ancestors 'none'");
    expect(directives(csp)).toContain("object-src 'none'");
    expect(csp).not.toContain("frame-src *");
    expect(csp).not.toContain("'unsafe-inline' 'self'");
  });

  it("porte le nonce et ne concède `unsafe-eval` qu'en développement", () => {
    expect(construireCsp({ nonce: "abc" })).toContain("'nonce-abc'");
    expect(construireCsp({ nonce: "abc" })).not.toContain("'unsafe-eval'");
    expect(construireCsp({ nonce: "abc", isDev: true })).toContain("'unsafe-eval'");
  });
});
