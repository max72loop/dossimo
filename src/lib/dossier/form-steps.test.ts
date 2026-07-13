import { describe, expect, it } from "vitest";

import { ETAPES_DOSSIER, etapesPourSaisie } from "@/lib/dossier/form-steps";

describe("étapes du nouveau dossier", () => {
  it("conserve toutes les étapes en saisie manuelle", () => {
    expect(etapesPourSaisie(false, {}).map((etape) => etape.id)).toEqual([
      "dispositif", "entreprise", "beneficiaire", "logement", "travaux", "dates",
    ]);
  });

  it("fait réellement commencer le parcours prérempli par l'étape incomplète", () => {
    const dispositifComplet = Object.fromEntries(
      ETAPES_DOSSIER[0].champs.map((champ) => [champ, "prérempli"]),
    );
    const etapes = etapesPourSaisie(true, dispositifComplet);

    expect(etapes[0]).toMatchObject({ id: "entreprise", titre: "Entreprise" });
  });

  it("garde une étape de relecture quand toutes les informations sont présentes", () => {
    const tout = Object.fromEntries(
      ETAPES_DOSSIER.flatMap((etape) => etape.champs.map((champ) => [champ, "prérempli"])),
    );
    expect(etapesPourSaisie(true, tout).map((etape) => etape.id)).toEqual(["dates"]);
  });
});
