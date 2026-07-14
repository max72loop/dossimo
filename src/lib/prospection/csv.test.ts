import { describe, expect, it } from "vitest";

import { decouper, estAdresseGenerique, parserProspects } from "@/lib/prospection/csv";

const SOURCE = "annuaire public des professionnels RGE";

describe("decouper", () => {
  it("gère les guillemets, les guillemets doublés et le séparateur français", () => {
    const csv = `email;entreprise\njean@x.fr;"Dupont ""Le Toit"" ; Fils"`;
    expect(decouper(csv)).toEqual([
      ["email", "entreprise"],
      ["jean@x.fr", 'Dupont "Le Toit" ; Fils'],
    ]);
  });
});

describe("parserProspects", () => {
  it("normalise les adresses et reporte la source par défaut", () => {
    const { lignes } = parserProspects(
      "email,prenom,entreprise\n JEAN@Toiture.FR ,jean,Toiture 62",
      SOURCE,
    );
    expect(lignes).toEqual([
      {
        email: "jean@toiture.fr",
        prenom: "jean",
        nom: null,
        entreprise: "Toiture 62",
        ville: null,
        code_postal: null,
        source: SOURCE,
      },
    ]);
  });

  it("écarte les adresses invalides et les doublons, en le disant", () => {
    const { lignes, rejets } = parserProspects(
      "email\njean@x.fr\npas-une-adresse\njean@x.fr",
      SOURCE,
    );
    expect(lignes).toHaveLength(1);
    expect(rejets.map((r) => r.motif)).toEqual([
      "adresse invalide",
      "doublon dans le fichier",
    ]);
  });

  it("ne personnalise jamais une adresse générique", () => {
    // « Bonjour Contact, » sur contact@ : le prénom de la colonne est ignoré.
    const { lignes } = parserProspects("email,prenom\ncontact@x.fr,Contact", SOURCE);
    expect(lignes[0].prenom).toBeNull();
    expect(estAdresseGenerique("contact@x.fr")).toBe(true);
    expect(estAdresseGenerique("jean.dupont@x.fr")).toBe(false);
  });

  it("refuse un fichier sans colonne email plutôt que d'importer n'importe quoi", () => {
    const { lignes, rejets } = parserProspects("nom,ville\nDupont,Lille", SOURCE);
    expect(lignes).toHaveLength(0);
    expect(rejets[0].motif).toMatch(/email/);
  });
});
