import { describe, expect, it } from "vitest";

import {
  devinerType,
  estTypeArtisan,
  LIBELLE_DEPOT,
  LIBELLE_PIECE,
  TYPES_ARTISAN,
  TYPES_LUS,
} from "@/lib/piece/catalogue";
import { PIECES_BENEFICIAIRE } from "@/lib/depot/pieces-attendues";

describe("catalogue des pièces", () => {
  it("nomme chaque type que l'artisan peut déposer", () => {
    for (const type of TYPES_ARTISAN) {
      expect(LIBELLE_PIECE[type]).toBeTruthy();
      expect(LIBELLE_DEPOT[type]).toBeTruthy();
    }
  });

  /**
   * Le partage artisan / bénéficiaire est une règle de sécurité, pas une
   * commodité d'affichage : l'artisan ne doit pas pouvoir verser l'avis
   * d'imposition ou le RIB de son client à sa place. Les deux listes se
   * contredisaient déjà une fois (neuf types acceptés, deux proposés).
   */
  it("n'ouvre à l'artisan aucune pièce qui n'appartient qu'au bénéficiaire", () => {
    for (const type of PIECES_BENEFICIAIRE) {
      expect(estTypeArtisan(type)).toBe(false);
    }
  });

  it("ne fait lire que le devis et la facture", () => {
    expect([...TYPES_LUS].sort()).toEqual(["devis", "facture"]);
  });
});

describe("devinerType", () => {
  it("reconnaît les noms de fichiers courants d'un artisan", () => {
    expect(devinerType("Devis_2026-04-12_Dupont.pdf")).toBe("devis");
    expect(devinerType("FACTURE N°2026-114.pdf")).toBe("facture");
    expect(devinerType("attestation-qualibat-rge.pdf")).toBe("qualification_rge");
    expect(devinerType("fiche technique laine de verre.pdf")).toBe("fiche_technique");
    expect(devinerType("cadre-contribution-oblige.pdf")).toBe("cadre_contribution");
    expect(devinerType("attestation sur l'honneur signée.pdf")).toBe("attestation_honneur");
  });

  it("lit les accents et la casse comme le reste", () => {
    expect(devinerType("FACTURÉ.PDF")).toBe("facture");
    expect(devinerType("Après travaux.jpg")).toBe("photo_apres");
  });

  /**
   * « avant / après » n'est qu'un indice de repli : un devis dont le nom parle de
   * travaux « avant » reste un devis. Le classer en photo l'enverrait au mauvais
   * contrôle et cocherait la mauvaise case de la checklist.
   */
  it("fait primer le nom du document sur l'indice avant / après", () => {
    expect(devinerType("devis-avant-travaux.pdf")).toBe("devis");
    expect(devinerType("photo-avant.jpg")).toBe("photo_avant");
  });

  it("préfère se taire plutôt qu'inventer un type", () => {
    expect(devinerType("IMG_4821.jpg")).toBeNull();
    expect(devinerType("scan0001.pdf")).toBeNull();
  });

  it("ne devine jamais une pièce qui n'est pas à l'artisan", () => {
    // Un avis d'imposition scanné par l'artisan ne doit pas se ranger tout seul :
    // cette pièce ne passe que par le lien de dépôt du bénéficiaire.
    const devine = devinerType("avis-imposition-2025.pdf");
    expect(devine === null || estTypeArtisan(devine)).toBe(true);
  });
});
