import { describe, it, expect } from "vitest";

import { destinationApresAuth } from "@/lib/auth/redirect";

describe("destinationApresAuth", () => {
  it("honore un next interne pointant vers l'espace dossiers", () => {
    expect(destinationApresAuth("/dossiers")).toBe("/dossiers");
    expect(destinationApresAuth("/dossiers/nouveau")).toBe("/dossiers/nouveau");
  });

  it("préserve la query du next (reprise du brouillon d'essai)", () => {
    expect(destinationApresAuth("/dossiers/nouveau?reprise=essai")).toBe(
      "/dossiers/nouveau?reprise=essai",
    );
  });

  it("retombe sur /dossiers quand next est absent", () => {
    expect(destinationApresAuth()).toBe("/dossiers");
    expect(destinationApresAuth("")).toBe("/dossiers");
  });

  it("refuse un open-redirect ou une destination hors périmètre", () => {
    expect(destinationApresAuth("//evil.com")).toBe("/dossiers");
    expect(destinationApresAuth("https://evil.com")).toBe("/dossiers");
    expect(destinationApresAuth("/admin")).toBe("/dossiers");
  });
});
