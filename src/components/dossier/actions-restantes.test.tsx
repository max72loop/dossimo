import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ActionsRestantes } from "@/components/dossier/actions-restantes";
import type { SyntheseDossier } from "@/lib/dossier/synthese";

function synthese(nbBloquants: number): SyntheseDossier {
  return {
    nbBloquants,
    nbControlesPasses: 4,
    nbActionsRestantes: 1,
    actions: [
      {
        id: "controles",
        label: `Corriger ${nbBloquants} points bloquants`,
        detail: "Des corrections sont nécessaires.",
        fait: nbBloquants === 0,
      },
    ],
  } as SyntheseDossier;
}

describe("ActionsRestantes", () => {
  it("ne montre jamais l'encart vert quand un point bloquant existe", () => {
    const html = renderToStaticMarkup(<ActionsRestantes synthese={synthese(4)} />);
    expect(html).toContain("Corriger 4 points bloquants");
    expect(html).not.toContain("contrôles automatiques");
  });

  it("peut rassurer quand aucun point bloquant ne subsiste", () => {
    const html = renderToStaticMarkup(<ActionsRestantes synthese={synthese(0)} />);
    expect(html).toContain("contrôles automatiques");
    expect(html).toContain("4 points conformes");
  });
});
