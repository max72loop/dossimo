import { describe, expect, it } from "vitest";

import { GESTES, regleToGeste, type RegleSeo } from "@/lib/seo/gestes";

/**
 * Lignes conformes au seed de `regles_metier` pour la pompe à chaleur air/eau
 * (migration 0009, barèmes réalignés sur les quatre profils par 0046). Elles
 * servent de double du contenu réel de la table : si la projection cesse de
 * refléter ce que la règle dit, le test tombe.
 */
const REGLES_PAC: RegleSeo[] = [
  {
    dispositif: "cee",
    type_travaux: "pac_air_eau",
    condition_json: {
      tva_taux: 0.055,
      anciennete_min_ans: 2,
      prime: {
        forfait: {
          grande_precarite: 4500,
          precaire: 3500,
          intermediaire: 2500,
          superieur: 2500,
        },
      },
    },
    pieces_requises_json: [
      { id: "devis_signe", label: "Devis signé et daté (entreprise RGE)", description: "Devis détaillé signé par le bénéficiaire.", obligatoire: true },
      { id: "note_dimensionnement", label: "Note de dimensionnement", description: "Note de dimensionnement de la PAC remise au bénéficiaire.", obligatoire: true },
    ],
    points_vigilance_json: [
      "Type et modele de la pompe a chaleur (marque et reference)",
      "Efficacite energetique saisonniere (ETAS) et regime de temperature",
    ],
    version_formulaire: "BAR-TH-171 vA78.4 (a compter du 01/01/2026)",
    created_at: "2026-03-10T00:00:00.000Z",
  },
  {
    dispositif: "maprimerenov",
    type_travaux: "pac_air_eau",
    condition_json: {
      tva_taux: 0.055,
      anciennete_min_ans: 15,
      prime: {
        // Pas de clé `superieur` : le rose n'est pas éligible par geste.
        forfait: { grande_precarite: 5000, precaire: 4000, intermediaire: 3000 },
      },
    },
    pieces_requises_json: [
      { id: "devis_signe", label: "Devis signé et daté (entreprise RGE)", description: "Doublon du CEE : ne doit pas produire deux entrées.", obligatoire: true },
      { id: "avis_imposition", label: "Avis d'imposition du bénéficiaire", description: "Justifie le profil de revenus.", obligatoire: true },
    ],
    points_vigilance_json: ["Mention de la qualification RGE (n° et domaine)"],
    version_formulaire: "MaPrimeRenov par geste 2026 (PAC air/eau)",
    created_at: "2026-05-02T00:00:00.000Z",
  },
];

const CONFIG = GESTES.find((geste) => geste.typeTravaux === "pac_air_eau")!;

/**
 * `formatEuros` produit des espaces fines insécables (U+202F, U+00A0), invisibles
 * dans l'éditeur : on normalise avant de comparer, sinon l'assertion échoue sur
 * un caractère qu'on ne voit pas.
 */
const normaliser = (texte: string) => texte.replace(/[\u202F\u00A0]/g, " ");

describe("regleToGeste — page geste dérivée de regles_metier", () => {
  it("refuse de produire une page quand aucune règle n'est active (cas de refus)", () => {
    expect(regleToGeste(CONFIG, [])).toBeNull();
  });

  it("projette les règles actives vers une page conforme (cas conforme)", () => {
    const page = regleToGeste(CONFIG, REGLES_PAC)!;

    expect(page).not.toBeNull();
    expect(page.slug).toBe("pompe-a-chaleur-air-eau");
    expect(page.category).toBe("Par geste");

    // Les pièces des deux dispositifs sont réunies et dédoublonnées par id.
    expect(page.checklist.map((piece) => piece.title)).toEqual([
      "Devis signé et daté (entreprise RGE)",
      "Note de dimensionnement",
      "Avis d'imposition du bénéficiaire",
    ]);

    // La date de vérification suit la règle la plus récente.
    expect(page.updated).toBe("2026-05-02");

    // La version en vigueur vient de la table, jamais du code.
    const versions = page.sections?.find((s) => s.heading.includes("version"));
    expect(versions?.paragraphs.join(" ")).toContain("BAR-TH-171 vA78.4");
    expect(versions?.paragraphs.join(" ")).toContain("MaPrimeRenov par geste 2026");

    // Les conditions chiffrées sont reprises telles quelles.
    const conditions = page.sections?.find((s) => s.heading.includes("conditions"));
    expect(conditions?.paragraphs.join(" ")).toContain("au moins 2 ans");
    expect(conditions?.paragraphs.join(" ")).toContain("au moins 15 ans");
    expect(conditions?.paragraphs.join(" ")).toContain("5,5 %");

    // Le barème est restitué profil par profil, dans les deux dispositifs.
    const bareme = normaliser(page.faq?.find((entry) => entry.question.includes("montant"))!.answer);
    expect(bareme).toContain("4 500,00 €");
    expect(bareme).toContain("très modestes (bleu)");
    expect(bareme).toContain("5 000,00 €");

    // Le rose absent du forfait MPR est traité comme une non-éligibilité,
    // jamais comme une donnée manquante.
    const rose = page.faq?.find((entry) => entry.question.includes("supérieurs"));
    expect(rose?.answer).toContain("Non.");

    // Chaque mention obligatoire devient un motif de refus explicite.
    expect(page.errors.some((e) => e.includes("ETAS"))).toBe(true);
    expect(page.errors.some((e) => e.includes("moins de 2 ans"))).toBe(true);
  });

  it("n'invente aucun profil absent du barème", () => {
    const sansIntermediaire: RegleSeo[] = [
      {
        ...REGLES_PAC[0],
        condition_json: { prime: { forfait: { grande_precarite: 4500 } } },
      },
    ];
    const page = regleToGeste(CONFIG, sansIntermediaire)!;
    const bareme = page.faq?.find((entry) => entry.question.includes("montant"));

    expect(bareme?.answer).toContain("très modestes (bleu)");
    expect(bareme?.answer).not.toContain("intermédiaires");
    expect(bareme?.answer).not.toContain("modestes (jaune)");
  });
});
