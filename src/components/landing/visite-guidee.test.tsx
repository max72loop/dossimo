import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { VisiteGuidee } from "@/components/landing/visite-guidee";
import { VISITE } from "@/lib/landing/visite";

/**
 * La promesse tenue ici n'est pas cosmétique : la vitrine n'appelle Supademo
 * qu'après un clic. Un futur remaniement qui monterait l'`iframe` d'entrée casse ce
 * test, et c'est le but — sinon la régression est invisible à l'œil (la page a
 * exactement la même allure) et ne se voit que dans l'onglet réseau.
 */
describe("VisiteGuidee", () => {
  const html = renderToStaticMarkup(<VisiteGuidee />);

  it("ne charge aucun contenu tiers avant le clic", () => {
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain(VISITE.embed);
  });

  it("affiche une affiche locale qui annonce la visite", () => {
    expect(html).toContain(VISITE.titre);
    expect(html).toContain("Lancer la visite guidée");
  });

  it("laisse toujours un chemin hors iframe et nomme l’hébergeur", () => {
    expect(html).toContain(VISITE.lien);
    expect(html).toContain(VISITE.hebergeur);
  });
});
