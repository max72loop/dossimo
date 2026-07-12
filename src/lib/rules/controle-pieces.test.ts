import { describe, it, expect } from "vitest";

import {
  controlerPieces as controlerPiecesFamille,
  fusionnerRapport,
  type PieceControlee,
} from "@/lib/rules/controle-pieces";
import type { Comparaison } from "@/lib/piece/compare";
import type { MentionVerifiee } from "@/lib/piece/mentions";
import type { ExtractedPiece } from "@/lib/piece/extract";
import type { Finding, RapportControle } from "@/lib/rules/types";

const codes = (fs: Finding[]) => fs.map((f) => `${f.code}:${f.severite}`);

/** Sauf mention contraire, les cas portent sur un dossier d'isolation. */
const controlerPieces = (pieces: PieceControlee[]) =>
  controlerPiecesFamille(pieces, "isolation");

const ok = (champ: string): Comparaison => ({
  champ,
  saisie: "x",
  piece: "x",
  statut: "ok",
});
const ecart = (champ: string): Comparaison => ({
  champ,
  saisie: "95 m²",
  piece: "80 m²",
  statut: "ecart",
});

const mention = (
  over: Partial<MentionVerifiee> & Pick<MentionVerifiee, "statut">,
): MentionVerifiee => ({
  mention: "Certification de l'isolant (ACERMI ou équivalent)",
  verbatim: null,
  confiance: 0.95,
  ...over,
});

const extrait = (over: Partial<ExtractedPiece> = {}): ExtractedPiece =>
  ({
    beneficiaire_nom: "Claire Martin",
    adresse: "12 rue des Lilas",
    code_postal: "93100",
    surface_isolee_m2: 95,
    resistance_thermique_r: 7.5,
    isolant_marque: "Isover",
    isolant_reference: "IBR 300",
    montant_ht: 4200,
    montant_ttc: 4431,
    date: "10/03/2026",
    rge_numero: "QB/12345",
    fiche: "BAR-EN-101",
    ...over,
  }) as ExtractedPiece;

function piece(over: Partial<PieceControlee> = {}): PieceControlee {
  return {
    type: "devis",
    lue: true,
    comparaisons: [ok("Surface isolée"), ok("Montant TTC")],
    mentions: [mention({ statut: "presente" })],
    extraction: extrait(),
    ...over,
  };
}

describe("mentions obligatoires", () => {
  it("mention absente d'un document lisible : bloquant", () => {
    const fs = controlerPieces([
      piece({ mentions: [mention({ statut: "absente", confiance: 0.95 })] }),
    ]);
    expect(codes(fs)).toContain("piece_mention_absente:bloquant");
    // Le motif de refus est nommé, pas seulement signalé.
    const f = fs.find((x) => x.code === "piece_mention_absente")!;
    expect(f.detail).toContain("ACERMI");
  });

  it("mention absente d'un document ILLISIBLE : avertissement, pas bloquant", () => {
    // Confiance de lecture basse : « je n'ai pas su lire » n'est pas « ce n'est
    // pas écrit ». On ne condamne pas un dossier sur un scan flou.
    const fs = controlerPieces([
      piece({ mentions: [mention({ statut: "absente", confiance: 0.2 })] }),
    ]);
    expect(codes(fs)).toContain("piece_mention_illisible:avertissement");
    expect(codes(fs)).not.toContain("piece_mention_absente:bloquant");
  });

  it("mention divergente : bloquant, avec le verbatim du document", () => {
    const fs = controlerPieces([
      piece({
        mentions: [
          mention({
            statut: "divergente",
            mention: "Résistance thermique R = 7 m²·K/W",
            verbatim: "R = 6,5 m²·K/W",
          }),
        ],
      }),
    ]);
    const f = fs.find((x) => x.code === "piece_mention_divergente")!;
    expect(f.severite).toBe("bloquant");
    expect(f.detail).toContain("6,5");
  });

  it("toutes les mentions présentes : contrôle conforme", () => {
    const fs = controlerPieces([piece()]);
    expect(codes(fs)).toContain("piece_mentions:ok");
  });

  it("mentions non vérifiées (pièce antérieure) : aucun finding de mention", () => {
    const fs = controlerPieces([piece({ mentions: null })]);
    expect(codes(fs).filter((c) => c.startsWith("piece_mention"))).toEqual([]);
  });
});

describe("écarts pièce ↔ saisie", () => {
  it("écart sur un champ critique : bloquant", () => {
    const fs = controlerPieces([piece({ comparaisons: [ecart("Surface isolée")] })]);
    expect(codes(fs)).toContain("piece_ecart:bloquant");
  });

  it("écart sur un champ de rapprochement flou : avertissement seulement", () => {
    // La marque est comparée par rapprochement de texte : un écart y est un doute
    // à lever, pas une contradiction établie. Ne pas bloquer sur du fuzzy.
    const fs = controlerPieces([piece({ comparaisons: [ecart("Marque isolant")] })]);
    expect(codes(fs)).toContain("piece_ecart:avertissement");
    expect(codes(fs)).not.toContain("piece_ecart:bloquant");
  });

  it("pièce illisible : avertissement, et aucun jugement de fond", () => {
    const fs = controlerPieces([
      piece({ lue: false, comparaisons: [], mentions: null, extraction: null }),
    ]);
    expect(codes(fs)).toEqual(["piece_illisible:avertissement"]);
  });

  it("pièce cohérente : contrôle conforme", () => {
    expect(codes(controlerPieces([piece()]))).toContain("piece_coherence:ok");
  });
});

describe("concordance devis ↔ facture", () => {
  const devis = piece({ type: "devis", extraction: extrait() });

  it("la facture reprend le devis : conforme", () => {
    const fs = controlerPieces([
      devis,
      piece({ type: "facture", extraction: extrait() }),
    ]);
    expect(codes(fs)).toContain("piece_devis_facture:ok");
  });

  it("la facture contredit le devis : bloquant, divergences nommées", () => {
    const fs = controlerPieces([
      devis,
      piece({
        type: "facture",
        extraction: extrait({ surface_isolee_m2: 80, montant_ttc: 5200 }),
      }),
    ]);
    const f = fs.find((x) => x.code === "piece_devis_facture")!;
    expect(f.severite).toBe("bloquant");
    expect(f.detail).toContain("Surface isolée");
    expect(f.detail).toContain("Montant TTC");
  });

  it("un champ non lu d'un côté ne fabrique pas de divergence", () => {
    const fs = controlerPieces([
      devis,
      piece({ type: "facture", extraction: extrait({ surface_isolee_m2: null }) }),
    ]);
    expect(codes(fs)).toContain("piece_devis_facture:ok");
  });

  it("un seul document déposé : rien à confronter", () => {
    expect(codes(controlerPieces([devis]))).not.toContain("piece_devis_facture:ok");
  });

  it("tolère les micro-écarts d'arrondi sur les montants", () => {
    const fs = controlerPieces([
      devis,
      piece({ type: "facture", extraction: extrait({ montant_ttc: 4431.5 }) }),
    ]);
    expect(codes(fs)).toContain("piece_devis_facture:ok");
  });
});

describe("devis ↔ facture, hors isolation", () => {
  /** Devis de PAC : aucun champ d'isolation, les caractéristiques sont dans `pac_*`. */
  const exPac = (over: Partial<ExtractedPiece> = {}): ExtractedPiece =>
    extrait({
      surface_isolee_m2: null,
      resistance_thermique_r: null,
      isolant_marque: null,
      isolant_reference: null,
      fiche: "BAR-TH-171",
      pac_etas: 145,
      pac_puissance_kw: 8,
      pac_marque: "Atlantic",
      pac_reference: "Alfea Excellia",
      ...over,
    });

  it("confronte les caractéristiques de la PAC, pas celles de l'isolation", () => {
    const fs = controlerPiecesFamille(
      [
        piece({ extraction: exPac() }),
        piece({ type: "facture", extraction: exPac({ pac_etas: 126 }) }),
      ],
      "pac_air_eau",
    );
    const f = fs.find((x) => x.code === "piece_devis_facture")!;
    expect(f.severite).toBe("bloquant");
    expect(f.detail).toContain("ETAS");
  });

  it("un devis de PAC conforme ne déclenche rien : les champs d'isolation sont ignorés", () => {
    // Le piège : avant le multi-geste, `surface_isolee_m2: null` des deux côtés
    // passait, mais toute confrontation utile était muette. Ici l'ETAS et la
    // puissance concordent, et c'est CELA qui doit être constaté.
    const fs = controlerPiecesFamille(
      [piece({ extraction: exPac() }), piece({ type: "facture", extraction: exPac() })],
      "pac_air_eau",
    );
    expect(codes(fs)).toContain("piece_devis_facture:ok");
  });

  it("un écart de COP entre devis et facture est bloquant (CET)", () => {
    const exCet = (cop: number): ExtractedPiece =>
      extrait({
        surface_isolee_m2: null,
        resistance_thermique_r: null,
        cet_cop: cop,
        cet_volume_l: 200,
      });
    const fs = controlerPiecesFamille(
      [
        piece({ extraction: exCet(3.2) }),
        piece({ type: "facture", extraction: exCet(2.4) }),
      ],
      "cet",
    );
    const f = fs.find((x) => x.code === "piece_devis_facture")!;
    expect(f.severite).toBe("bloquant");
    expect(f.detail).toContain("COP");
  });

  it("un écart de rendement entre devis et facture est bloquant (bois)", () => {
    const exBois = (rendement: number): ExtractedPiece =>
      extrait({
        surface_isolee_m2: null,
        resistance_thermique_r: null,
        bois_rendement: rendement,
      });
    const fs = controlerPiecesFamille(
      [
        piece({ extraction: exBois(87) }),
        piece({ type: "facture", extraction: exBois(72) }),
      ],
      "bois",
    );
    const f = fs.find((x) => x.code === "piece_devis_facture")!;
    expect(f.severite).toBe("bloquant");
    expect(f.detail).toContain("Rendement");
  });
});

describe("sévérité des écarts techniques hors isolation", () => {
  it("un écart d'ETAS avec la saisie vaut refus, pas simple avertissement", () => {
    const fs = controlerPiecesFamille(
      [piece({ comparaisons: [ecart("ETAS")] })],
      "pac_air_eau",
    );
    expect(codes(fs)).toContain("piece_ecart:bloquant");
  });

  it("un écart de marque reste un avertissement", () => {
    const fs = controlerPiecesFamille(
      [piece({ comparaisons: [ecart("Marque PAC")] })],
      "pac_air_eau",
    );
    expect(codes(fs)).toContain("piece_ecart:avertissement");
  });
});

describe("fusionnerRapport", () => {
  const base: RapportControle = {
    findings: [
      { code: "a", categorie: "technique", severite: "ok", titre: "", detail: "" },
    ],
    nbBloquants: 0,
    nbAvertissements: 0,
    nbConformes: 1,
    conforme: true,
  };

  it("un bloquant venu des pièces rend le dossier non conforme", () => {
    // C'est tout l'enjeu : le rapport livré à l'artisan doit voir les documents
    // qu'il s'apprête à déposer, pas seulement sa saisie.
    const r = fusionnerRapport(base, [
      {
        code: "piece_mention_absente",
        categorie: "pieces",
        severite: "bloquant",
        titre: "",
        detail: "",
      },
    ]);
    expect(r.conforme).toBe(false);
    expect(r.nbBloquants).toBe(1);
    expect(r.findings).toHaveLength(2);
  });

  it("sans pièce, le rapport est inchangé", () => {
    const r = fusionnerRapport(base, []);
    expect(r.conforme).toBe(true);
    expect(r.nbConformes).toBe(1);
  });
});
