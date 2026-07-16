import { describe, it, expect } from "vitest";

import {
  EDITIONS,
  GUIDES,
  editionDuMois,
  messageNurturing,
  moisParis,
  debutDuMoisParis,
  type EditionNurturing,
} from "./nurturing";

const EDITION: EditionNurturing = {
  mois: "2026-08",
  objet: "Le point réglementaire du mois : les mentions du devis",
  lignes: ["Ligne une.", "Ligne deux.", "Ligne trois.", "Ligne quatre.", "Ligne cinq."],
  guide: "mentions-obligatoires-devis-rge",
};

describe("moisParis / debutDuMoisParis", () => {
  it("rend le mois civil de Paris, pas celui du serveur", () => {
    // 31/12/2026 23:30 UTC = 01/01/2027 00:30 à Paris : le mois a déjà tourné.
    expect(moisParis(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01");
    expect(debutDuMoisParis(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
  });

  it("rend le mois courant en heure d'été", () => {
    // 31/07/2026 23:30 UTC = 01/08/2026 01:30 à Paris (UTC+2).
    expect(moisParis(new Date("2026-07-31T23:30:00Z"))).toBe("2026-08");
    expect(debutDuMoisParis(new Date("2026-08-16T10:00:00Z"))).toBe("2026-08-01");
  });
});

describe("editionDuMois", () => {
  it("ne rend rien tant que l'édition du mois n'est pas écrite", () => {
    // Cas nominal du dépôt : le contenu est éditorial, il vient de la veille
    // réglementaire. Une édition absente doit vider le lot, pas le remplir.
    expect(EDITIONS).toHaveLength(0);
    expect(editionDuMois("2026-08")).toBeNull();
  });
});

describe("messageNurturing", () => {
  it("rend les cinq lignes, le guide, la signature et le STOP", () => {
    const { objet, corps } = messageNurturing({ salutation: "Bonjour Alain,", edition: EDITION });
    expect(objet).toBe(EDITION.objet);
    expect(corps).toContain("Bonjour Alain,");
    expect(corps).toContain("Ligne cinq.");
    expect(corps).toContain("dossimo.app/mentions-obligatoires-devis-rge?utm_source=nurturing");
    expect(corps).toContain("Max Landry, Dossimo");
    expect(corps).toContain("STOP");
    expect(corps).toContain("annuaire public");
  });

  it("ne vend rien : ni prix, ni essai, ni relance commerciale", () => {
    // Le nurturing sert à rester dans le paysage sans griller le fichier (§7).
    // Un argumentaire de vente ici transforme un rappel utile en spam.
    const { corps } = messageNurturing({ salutation: "Bonjour,", edition: EDITION });
    expect(corps).not.toMatch(/49\s?€|essai gratuit|2 minutes|mandataire/i);
  });

  it("ne peut lier qu'un guide réellement publié", () => {
    // `guide` est typé sur les slugs de GUIDES : une page inexistante ne
    // compile pas. On vérifie que la liste ne dérive pas vers des URL absolues.
    for (const slug of Object.keys(GUIDES)) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
