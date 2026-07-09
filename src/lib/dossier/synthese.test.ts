import { describe, it, expect } from "vitest";

import {
  formatDuree,
  syntheseDossier,
  type PieceSynthese,
} from "@/lib/dossier/synthese";
import type { Finding, RapportControle } from "@/lib/rules/types";
import type { StatutDossier } from "@/lib/database.types";

function finding(severite: Finding["severite"], code: string): Finding {
  return { code, categorie: "technique", severite, titre: code, detail: "" };
}

function rapport(findings: Finding[]): RapportControle {
  const nbBloquants = findings.filter((f) => f.severite === "bloquant").length;
  return {
    findings,
    nbBloquants,
    nbAvertissements: findings.filter((f) => f.severite === "avertissement").length,
    nbConformes: findings.filter((f) => f.severite === "ok").length,
    conforme: nbBloquants === 0,
  };
}

const CONFORME = rapport([finding("ok", "a"), finding("ok", "b")]);

function synthese(opts: {
  rapport?: RapportControle;
  pieces?: PieceSynthese[];
  statut?: StatutDossier;
  mentionsTotal?: number;
}) {
  return syntheseDossier({
    rapport: opts.rapport ?? CONFORME,
    pieces: opts.pieces ?? [],
    statut: opts.statut ?? "nouveau",
    mentionsTotal: opts.mentionsTotal ?? 6,
  });
}

const devisOk: PieceSynthese = { type: "devis", lue: true, nbEcarts: 0 };
const factureOk: PieceSynthese = { type: "facture", lue: true, nbEcarts: 0 };

describe("complétude", () => {
  it("un dossier conforme sans pièce ni dépôt vaut le poids des contrôles", () => {
    const s = synthese({});
    expect(s.pourcentage).toBe(40);
    expect(s.nbActionsRestantes).toBe(3);
  });

  it("atteint 100 % quand les quatre critères sont satisfaits", () => {
    const s = synthese({
      pieces: [devisOk, factureOk],
      statut: "pret_depot",
    });
    expect(s.pourcentage).toBe(100);
    expect(s.nbActionsRestantes).toBe(0);
    expect(s.piecesCompletes).toBe(true);
  });

  it("le pourcentage et le nombre d'actions restent cohérents", () => {
    const s = synthese({ pieces: [devisOk] });
    expect(s.pourcentage).toBe(60);
    expect(s.nbActionsRestantes).toBe(2);
    expect(s.actions.filter((a) => a.fait)).toHaveLength(2);
  });

  it("un point bloquant retire le poids des contrôles", () => {
    const s = synthese({
      rapport: rapport([finding("bloquant", "x")]),
      pieces: [devisOk, factureOk],
      statut: "pret_depot",
    });
    expect(s.pourcentage).toBe(60);
    expect(s.actions.find((a) => a.id === "controles")?.fait).toBe(false);
  });

  it("une étape de parcours au-delà de « prêt à déposer » compte comme faite", () => {
    expect(synthese({ statut: "depose" }).actions.at(-1)?.fait).toBe(true);
    expect(synthese({ statut: "en_traitement" }).actions.at(-1)?.fait).toBe(false);
  });

  it("une pièce avec écart ne valide pas son critère", () => {
    const s = synthese({ pieces: [{ type: "devis", lue: true, nbEcarts: 2 }] });
    expect(s.pourcentage).toBe(40);
    expect(s.piecesCompletes).toBe(false);
    expect(s.actions.find((a) => a.id === "devis")?.label).toContain("2 écarts");
  });

  it("une pièce illisible ne valide pas son critère", () => {
    const s = synthese({ pieces: [{ type: "facture", lue: false, nbEcarts: 0 }] });
    expect(s.pourcentage).toBe(40);
    expect(s.actions.find((a) => a.id === "facture")?.label).toContain("lisible");
  });
});

describe("niveau de risque", () => {
  it("faible quand aucun bloquant, aucun avertissement, aucun écart", () => {
    expect(synthese({ pieces: [devisOk] }).risque).toBe("faible");
  });

  it("élevé dès qu'un point bloquant existe", () => {
    expect(synthese({ rapport: rapport([finding("bloquant", "x")]) }).risque).toBe("eleve");
  });

  it("moyen sur un simple avertissement", () => {
    expect(
      synthese({ rapport: rapport([finding("avertissement", "x")]) }).risque,
    ).toBe("moyen");
  });

  it("moyen quand une pièce présente un écart avec la saisie", () => {
    expect(
      synthese({ pieces: [{ type: "devis", lue: true, nbEcarts: 1 }] }).risque,
    ).toBe("moyen");
  });

  it("un bloquant prime sur un écart", () => {
    const s = synthese({
      rapport: rapport([finding("bloquant", "x"), finding("avertissement", "y")]),
      pieces: [{ type: "devis", lue: true, nbEcarts: 3 }],
    });
    expect(s.risque).toBe("eleve");
  });
});

describe("mentions vérifiées", () => {
  it("aucune mention vérifiée tant que le devis n'est pas lu", () => {
    expect(synthese({}).mentionsVerifiees).toBe(0);
    expect(synthese({ pieces: [factureOk] }).mentionsVerifiees).toBe(0);
  });

  it("toutes les mentions quand le devis est lu sans écart", () => {
    const s = synthese({ pieces: [devisOk], mentionsTotal: 6 });
    expect(s.mentionsVerifiees).toBe(6);
    expect(s.mentionsTotal).toBe(6);
  });

  it("retire une mention par écart, sans passer sous zéro", () => {
    expect(
      synthese({ pieces: [{ type: "devis", lue: true, nbEcarts: 2 }] }).mentionsVerifiees,
    ).toBe(4);
    expect(
      synthese({ pieces: [{ type: "devis", lue: true, nbEcarts: 9 }] }).mentionsVerifiees,
    ).toBe(0);
  });
});

describe("temps gagné", () => {
  it("dérive du nombre de contrôles réellement exécutés", () => {
    // 5 documents × 15 min + 2 contrôles × 3 min
    expect(synthese({}).minutesGagnees).toBe(81);
  });
});

describe("formatDuree", () => {
  it("formate heures et minutes", () => {
    expect(formatDuree(100)).toBe("≈ 1 h 40");
    expect(formatDuree(120)).toBe("≈ 2 h");
    expect(formatDuree(45)).toBe("≈ 45 min");
    expect(formatDuree(65)).toBe("≈ 1 h 05");
  });
});
