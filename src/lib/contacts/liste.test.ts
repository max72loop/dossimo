import { describe, it, expect } from "vitest";

import { clauseRecherche, debutDuMoisParis } from "./liste";

/**
 * La recherche de la console construit une clause `or` de PostgREST par
 * concaténation. C'est le seul endroit de la refonte où une saisie utilisateur
 * entre dans une syntaxe de requête : si l'échappement lâche, la requête ne
 * plante pas, elle change de sens, et l'écran affiche calmement les mauvais
 * contacts. D'où ces tests.
 */
describe("clauseRecherche", () => {
  it("cherche sur les colonnes lisibles", () => {
    const c = clauseRecherche("Dijon");
    expect(c).toContain("denomination.ilike.*Dijon*");
    expect(c).toContain("city.ilike.*Dijon*");
    expect(c).toContain("code_postal.ilike.*Dijon*");
  });

  it("ajoute le SIREN quand la saisie contient assez de chiffres", () => {
    expect(clauseRecherche("922217336")).toContain("siren.ilike.*922217336*");
    // Un SIREN se cherche aussi tel qu'il s'affiche, espaces compris.
    expect(clauseRecherche("922 217 336")).toContain("siren.ilike.*922217336*");
  });

  it("n'ajoute pas de clause SIREN sur deux chiffres", () => {
    // « 21 » est un début de code postal bien plus souvent qu'un SIREN : la
    // clause ferait remonter des centaines de contacts sans rapport.
    expect(clauseRecherche("21")).not.toContain("siren.ilike");
  });

  it("neutralise les caractères qui sont la syntaxe de `or`", () => {
    // Sans nettoyage, la virgule ouvre une nouvelle condition et la parenthèse
    // un groupe : la requête resterait valide et répondrait à autre chose.
    const c = clauseRecherche("SARL Dupont, (Nord)*");
    expect(c).not.toContain("(");
    expect(c).not.toContain(")");
    // Les blancs laissés par les caractères retirés sont compactés : sans ça,
    // « Dupont   Nord » ne correspondrait à aucune dénomination réelle.
    expect(c).toContain("denomination.ilike.*SARL Dupont Nord*");
    // Une seule condition par colonne : cinq colonnes, quatre séparateurs.
    expect(c.split(",")).toHaveLength(5);
  });
});

describe("debutDuMoisParis", () => {
  it("rend le 1er du mois courant", () => {
    expect(debutDuMoisParis(new Date("2026-08-17T12:00:00Z"))).toBe("2026-08-01");
  });

  it("compte en heure de Paris, pas en UTC", () => {
    // 31 juillet 23 h 30 UTC, c'est déjà le 1er août à Paris. Calculé en UTC, le
    // filtre « nouveaux ce mois » retiendrait juillet pendant deux heures chaque
    // fin de mois.
    expect(debutDuMoisParis(new Date("2026-07-31T23:30:00Z"))).toBe("2026-08-01");
  });
});
