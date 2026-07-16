import { describe, expect, it } from "vitest";

import { masquerPii, validerPlan, type QueryPlan } from "./nl-query";

const base: QueryPlan = {
  table: "dossiers",
  select: [],
  filters: [],
  order: null,
  limit: null,
  aggregate: null,
};

describe("validerPlan — garde-fou de la liste blanche", () => {
  it("accepte une table et des colonnes connues", () => {
    const res = validerPlan({
      ...base,
      select: ["statut", "dispositif"],
      filters: [{ column: "statut", op: "eq", value: "livre" }],
      aggregate: { groupBy: ["dispositif"], metric: "count", column: null },
    });
    expect(res.ok).toBe(true);
  });

  it("rejette une table hors liste blanche (ex. secrets/auth)", () => {
    const res = validerPlan({ ...base, table: "auth.users" });
    expect(res.ok).toBe(false);
  });

  it("rejette une colonne inconnue dans select", () => {
    const res = validerPlan({ ...base, select: ["mot_de_passe"] });
    expect(res.ok).toBe(false);
  });

  it("rejette une colonne inconnue dans un filtre", () => {
    const res = validerPlan({
      ...base,
      filters: [{ column: "token_secret", op: "eq", value: "x" }],
    });
    expect(res.ok).toBe(false);
  });

  it("rejette une colonne d'une AUTRE table (pas de fuite inter-table)", () => {
    // `email` existe sur artisans, pas sur dossiers.
    const res = validerPlan({ ...base, table: "dossiers", select: ["email"] });
    expect(res.ok).toBe(false);
  });

  it("rejette une colonne d'agrégat inconnue", () => {
    const res = validerPlan({
      ...base,
      aggregate: { groupBy: ["colonne_bidon"], metric: "count", column: null },
    });
    expect(res.ok).toBe(false);
  });

  it("rejette une somme sans colonne à agréger", () => {
    // Sans cette garde, le calcul mappait chaque ligne sur Number(0) et
    // renvoyait « 0 » au lieu d'échouer : une somme jamais calculée, annoncée
    // comme un résultat.
    const res = validerPlan({
      ...base,
      table: "paiements",
      aggregate: { groupBy: [], metric: "sum", column: null },
    });
    expect(res.ok).toBe(false);
  });

  it("accepte une somme sur une colonne numérique", () => {
    const res = validerPlan({
      ...base,
      table: "paiements",
      aggregate: { groupBy: ["statut"], metric: "sum", column: "montant" },
    });
    expect(res.ok).toBe(true);
  });
});

describe("masquerPii — aucune donnée personnelle ne part vers le LLM", () => {
  it("masque les colonnes nominatives des leads", () => {
    const masque = masquerPii(
      {
        colonnes: ["id", "email", "nom", "source"],
        lignes: [{ id: "1", email: "jean@exemple.fr", nom: "Dupont", source: "landing" }],
        tronque: false,
      },
      "leads",
    );
    expect(masque.lignes[0].email).toBe("[masqué]");
    expect(masque.lignes[0].nom).toBe("[masqué]");
    // Ce qui n'identifie personne reste lisible : le LLM en a besoin pour rédiger.
    expect(masque.lignes[0].source).toBe("landing");
    expect(masque.lignes[0].id).toBe("1");
  });

  it("masque e-mail, téléphone et SIRET des artisans", () => {
    const masque = masquerPii(
      {
        colonnes: ["email", "telephone", "siret", "ville"],
        lignes: [
          { email: "a@b.fr", telephone: "0600000000", siret: "12345678900011", ville: "Reims" },
        ],
        tronque: false,
      },
      "artisans",
    );
    expect(masque.lignes[0].email).toBe("[masqué]");
    expect(masque.lignes[0].telephone).toBe("[masqué]");
    expect(masque.lignes[0].siret).toBe("[masqué]");
    expect(masque.lignes[0].ville).toBe("Reims");
  });

  it("conserve les null tels quels", () => {
    // Un null masqué en « [masqué] » ferait croire à une valeur existante.
    const masque = masquerPii(
      { colonnes: ["email"], lignes: [{ email: null }], tronque: false },
      "leads",
    );
    expect(masque.lignes[0].email).toBeNull();
  });

  it("laisse intactes les tables sans donnée personnelle", () => {
    const resultat = {
      colonnes: ["statut"],
      lignes: [{ statut: "livre" }],
      tronque: false,
    };
    expect(masquerPii(resultat, "dossiers")).toEqual(resultat);
  });
});
