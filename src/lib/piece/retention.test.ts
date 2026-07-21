import { describe, it, expect } from "vitest";

import {
  estPurgeable,
  RETENTION_APRES_LIVRAISON_JOURS,
  RETENTION_MAX_JOURS,
} from "@/lib/piece/retention";

/**
 * La décision de purge est le filet RGPD du produit : une pièce gardée trop
 * longtemps est une infraction, une pièce purgée trop tôt casse le contrôle
 * anti-refus. On borne donc les deux fenêtres par un cas conservé et un cas
 * purgé, comme toute règle dure du repo.
 */

const NOW = new Date("2026-07-21T12:00:00.000Z");
const JOUR = 24 * 60 * 60 * 1000;
const ilYA = (jours: number) => new Date(NOW.getTime() - jours * JOUR).toISOString();

describe("estPurgeable — dossier livré", () => {
  it("conserve une pièce livrée il y a moins que la fenêtre", () => {
    expect(
      estPurgeable(
        {
          created_at: ilYA(RETENTION_APRES_LIVRAISON_JOURS + 10),
          delivered_at: ilYA(RETENTION_APRES_LIVRAISON_JOURS - 1),
        },
        NOW,
      ),
    ).toBe(false);
  });

  it("purge une pièce livrée au-delà de la fenêtre", () => {
    expect(
      estPurgeable(
        {
          created_at: ilYA(RETENTION_APRES_LIVRAISON_JOURS + 10),
          delivered_at: ilYA(RETENTION_APRES_LIVRAISON_JOURS + 1),
        },
        NOW,
      ),
    ).toBe(true);
  });
});

describe("estPurgeable — dossier jamais livré (plafond absolu)", () => {
  it("conserve une pièce récente d'un dossier non livré", () => {
    expect(
      estPurgeable(
        { created_at: ilYA(RETENTION_MAX_JOURS - 1), delivered_at: null },
        NOW,
      ),
    ).toBe(false);
  });

  it("purge une pièce d'un dossier abandonné au-delà du plafond", () => {
    expect(
      estPurgeable(
        { created_at: ilYA(RETENTION_MAX_JOURS + 1), delivered_at: null },
        NOW,
      ),
    ).toBe(true);
  });
});

describe("estPurgeable — le plafond rattrape un dossier livré récemment mais très ancien", () => {
  it("purge sur l'âge de dépôt même si la livraison est récente", () => {
    // Cas limite : pièce déposée il y a plus que le plafond, mais dossier
    // « livré » hier. La branche livraison ne déclenche pas ; le plafond, si.
    expect(
      estPurgeable(
        { created_at: ilYA(RETENTION_MAX_JOURS + 5), delivered_at: ilYA(1) },
        NOW,
      ),
    ).toBe(true);
  });
});
