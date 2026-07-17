import { describe, it, expect } from "vitest";

import { resolveCerfaTemplate } from "@/lib/cerfa/registry";

/**
 * Le registre décide sur QUEL modèle réglementaire une attestation est produite.
 * Générer sur un mauvais modèle, c'est fabriquer soi-même le motif de refus
 * qu'on prétend éviter (CLAUDE.md §8) — d'où ces cas sur la résolution du CESI,
 * dont la fiche voisine de deux autres fiches solaires non modélisées.
 */
describe("resolveCerfaTemplate — chauffe-eau solaire individuel", () => {
  it("BAR-TH-101 résout l'AH CESI, variante P6 après le 01/04/2026", () => {
    const r = resolveCerfaTemplate("cee", "BAR-TH-101", "2026-07-16");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.template.id).toBe("ah-cee-bar-th-101-p6");
    expect(r.template.ahVariant).toBe("p6");
  });

  it("BAR-TH-101 avant le 01/04/2026 résout la variante P5", () => {
    const r = resolveCerfaTemplate("cee", "BAR-TH-101", "2025-06-01");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.template.id).toBe("ah-cee-bar-th-101-p5");
  });

  it("les fiches solaires non modélisées échouent explicitement", () => {
    // BAR-TH-143 (système solaire combiné) et BAR-TH-168 (dispositif sur appoint
    // séparé) n'ont NI les mêmes critères NI le même cadre technique que le CESI.
    // Les laisser retomber sur le modèle du 101 produirait une attestation qui
    // atteste de caractéristiques que le chantier n'a pas.
    for (const fiche of ["BAR-TH-143", "BAR-TH-168"]) {
      const r = resolveCerfaTemplate("cee", fiche, "2026-07-16");
      expect(r.ok).toBe(false);
    }
  });

  it("ne confond pas BAR-TH-101 avec les fiches des autres gestes", () => {
    const cesi = resolveCerfaTemplate("cee", "BAR-TH-101", "2026-07-16");
    const bois = resolveCerfaTemplate("cee", "BAR-TH-112", "2026-07-16");
    expect(cesi.ok && bois.ok).toBe(true);
    if (!cesi.ok || !bois.ok) return;
    expect(cesi.template.id).not.toBe(bois.template.id);
  });
});
