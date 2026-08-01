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

  // Un champ absent de `champs` est invisible à `etapesPourSaisie` : l'étape peut
  // être jugée complète et sautée sans que la question ait été posée. Les sept
  // dossiers CEE en base étaient tous sans date d'engagement d'offre CEE.
  it("l'étape des dates porte les deux champs de l'offre CEE", () => {
    const dates = ETAPES_DOSSIER.find((etape) => etape.id === "dates")!;
    expect(dates.champs).toContain("date_offre_cee");
    expect(dates.champs).toContain("offre_cee_anterieure");
  });

  it("garde une étape de relecture quand toutes les informations sont présentes", () => {
    const tout = Object.fromEntries(
      ETAPES_DOSSIER.flatMap((etape) => etape.champs.map((champ) => [champ, "prérempli"])),
    );
    expect(etapesPourSaisie(true, tout).map((etape) => etape.id)).toEqual(["dates"]);
  });
});
