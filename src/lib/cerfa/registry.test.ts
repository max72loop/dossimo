import { describe, it, expect } from "vitest";

import {
  resolveCerfaTemplate,
  revueValidee,
  type CerfaTemplate,
} from "@/lib/cerfa/registry";

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

/**
 * La promesse « anti-refus » ne peut pas être auto-décernée : un modèle ne se dit
 * vérifié qu'après une revue four-eyes signée et consignée (CHANGELOG-cerfa.md).
 * Le sens du défaut compte — un modèle ajouté sans champ `revue` doit être traité
 * comme NON validé, jamais l'inverse.
 */
describe("revueValidee — garde-fou de la promesse de conformité", () => {
  const base: CerfaTemplate = {
    id: "test",
    dispositif: "cee",
    fiches: ["BAR-EN-101"],
    titre: "Test",
    arrete: "annexe 7-1",
    version: "2026-04 (P6)",
    effectiveFrom: "2026-04-01",
    effectiveTo: null,
    official: false,
    kind: "preparation",
    strategy: "preparation",
  };

  it("refuse : un modèle sans revue signée n'est pas validé", () => {
    expect(revueValidee(base)).toBe(false);
  });

  it("accepte : un modèle dont la revue est signée", () => {
    expect(
      revueValidee({
        ...base,
        revue: {
          valideeLe: "2026-07-25",
          valideePar: "Max Landry",
          obligeReference: "Obligé test",
        },
      }),
    ).toBe(true);
  });

  it("refuse aussi pour un modèle officiel : l'overlay est mesuré à la main", () => {
    // Pas de passe-droit au `kind: "officiel"`. Le PDF vient de l'administration,
    // mais les coordonnées de surimpression sont de nous : une valeur posée dans
    // la mauvaise case est le même défaut qu'un modèle reproduit de travers.
    expect(revueValidee({ ...base, official: true, kind: "officiel" })).toBe(false);
  });

  it("aucun modèle du registre ne se dit vérifié aujourd'hui", () => {
    // Se retournera le jour où une revue sera signée : c'est le but, le test
    // devra alors être mis à jour EN MÊME TEMPS que l'entrée du changelog.
    const r = resolveCerfaTemplate("cee", "BAR-EN-101", "2026-07-25");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(revueValidee(r.template)).toBe(false);
  });
});

/**
 * L'erreur que la revue du 2026-07-25 a mise au jour : présenter un document
 * rédigé par Dossimo comme le document réglementaire. L'annexe 7 réserve
 * l'émission de l'AH au demandeur, donc un document que Dossimo DESSINE ne peut
 * jamais être `officiel` — seul un vrai fichier officiel rempli peut l'être.
 */
describe("un document produit par Dossimo ne peut pas se déclarer officiel", () => {
  it("tout modèle `officiel` s'appuie sur un fichier officiel réel", () => {
    for (const fiche of [null, "BAR-EN-101", "BAR-TH-171", "BAR-TH-148", "BAR-TH-112", "BAR-TH-101"]) {
      for (const dispositif of ["cee", "maprimerenov"] as const) {
        const r = resolveCerfaTemplate(dispositif, fiche, "2026-07-25");
        if (!r.ok) continue;
        const t = r.template;
        if (t.kind === "officiel") {
          expect(t.strategy).not.toBe("preparation");
          expect(t.file).toBeTruthy();
        }
        // Réciproque : une fiche de préparation ne se prétend jamais officielle.
        if (t.strategy === "preparation") {
          expect(t.kind).toBe("preparation");
          expect(t.official).toBe(false);
        }
      }
    }
  });
});
