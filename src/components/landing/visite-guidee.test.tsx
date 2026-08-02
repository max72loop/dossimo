import { existsSync } from "node:fs";
import { join } from "node:path";

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

  /**
   * L'affiche montre une capture de l'app. Deux dérives possibles, toutes deux
   * muettes à l'œil sur une maquette : pointer la capture chez l'hébergeur (la
   * règle « rien du tiers avant le clic » tomberait sans qu'aucune iframe
   * n'apparaisse), ou renommer le fichier dérivé et servir un cadre vide.
   */
  it("sert l'affiche depuis notre domaine, jamais depuis l'hébergeur", () => {
    expect(html).toContain(VISITE.affiche.src);
    expect(html).not.toContain("media.supademo.com");
    expect(
      existsSync(join(process.cwd(), "public", ...VISITE.affiche.src.split("/"))),
    ).toBe(true);
  });

  it("laisse toujours un chemin hors iframe et nomme l’hébergeur", () => {
    expect(html).toContain(VISITE.lien);
    expect(html).toContain(VISITE.hebergeur);
  });
});
