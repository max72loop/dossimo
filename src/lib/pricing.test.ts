import { describe, it, expect } from "vitest";

import {
  selectTier,
  computeQuote,
  grilleAffichee,
  labelEuros,
  MAX_PRICE_RATIO,
} from "@/lib/pricing";
import type { PricingTier } from "@/lib/database.types";

/** Paliers seedés par la migration 0012 (bornes en cents, inclusives). */
const TIERS: PricingTier[] = [
  {
    id: "t1",
    name: "Essentiel",
    aid_min_cents: 0,
    aid_max_cents: 99999,
    price_cents: 4900,
    active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "t2",
    name: "Pivot",
    aid_min_cents: 100000,
    aid_max_cents: 500000,
    price_cents: 14900,
    active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "t3",
    name: "Premium",
    aid_min_cents: 500001,
    aid_max_cents: null,
    price_cents: 24900,
    active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
];

describe("selectTier — bornes de paliers", () => {
  it("Essentiel juste sous 1000 €", () => {
    expect(selectTier(99999, TIERS)?.name).toBe("Essentiel");
  });

  it("Pivot dès 1000 € pile et jusqu'à 5000 € pile", () => {
    expect(selectTier(100000, TIERS)?.name).toBe("Pivot");
    expect(selectTier(300000, TIERS)?.name).toBe("Pivot");
    expect(selectTier(500000, TIERS)?.name).toBe("Pivot");
  });

  it("Premium au-delà de 5000 €", () => {
    expect(selectTier(500001, TIERS)?.name).toBe("Premium");
    expect(selectTier(1_000_000, TIERS)?.name).toBe("Premium");
  });

  it("ignore les paliers inactifs", () => {
    const inactifs = TIERS.map((t) => ({ ...t, active: false }));
    expect(selectTier(300000, inactifs)).toBeNull();
  });

  it("aide hors de tout palier → null", () => {
    expect(selectTier(-1, TIERS)).toBeNull();
  });
});

describe("computeQuote — prix + garde-fou 12 %", () => {
  it("retourne le palier et son prix", () => {
    const q = computeQuote(300000, TIERS);
    expect(q.tier?.name).toBe("Pivot");
    expect(q.priceCents).toBe(14900);
  });

  it("lève price_warning quand le prix dépasse 12 % de l'aide", () => {
    // Essentiel 49 € sur une aide de 300 € → 4900 > 0,12 × 30000 (3600).
    const q = computeQuote(30000, TIERS);
    expect(q.priceCents).toBe(4900);
    expect(q.priceWarning).toBe(true);
  });

  it("pas de warning quand le prix reste sous 12 %", () => {
    // Essentiel 49 € sur 900 € → 4900 < 0,12 × 90000 (10800).
    expect(computeQuote(90000, TIERS).priceWarning).toBe(false);
    // Premium 249 € sur 6000 € → largement sous le seuil.
    expect(computeQuote(600000, TIERS).priceWarning).toBe(false);
  });

  it("frontière du seuil de 12 % (comparaison stricte)", () => {
    // 4900 = 12 % × 40833,33 : le premier entier SANS warning est 40834
    // (0,12 × 40834 = 4900,08 ≥ 4900), et 40833 déclenche encore le warning.
    expect(MAX_PRICE_RATIO).toBe(0.12);
    expect(computeQuote(40834, TIERS).priceWarning).toBe(false);
    expect(computeQuote(40833, TIERS).priceWarning).toBe(true);
  });

  it("aide hors palier → prix null, pas de warning", () => {
    const q = computeQuote(-1, TIERS);
    expect(q.tier).toBeNull();
    expect(q.priceCents).toBeNull();
    expect(q.priceWarning).toBe(false);
  });
});

describe("labelEuros", () => {
  it("compacte les montants entiers", () => {
    expect(labelEuros(4900)).toBe("49 €");
    expect(labelEuros(24900)).toBe("249 €");
  });

  it("garde les centimes quand nécessaire", () => {
    expect(labelEuros(11900)).toBe("119 €");
    expect(labelEuros(1250)).toBe("12,50 €");
  });
});

describe("grilleAffichee — ce que la vitrine annonce", () => {
  it("annonce la grille réellement facturée, palier haut compris", () => {
    // Le bug corrigé : la landing et les CGV promettaient « de 49 € à 149 € » via
    // une grille codée en dur, alors que le checkout facturait jusqu'à 249 €.
    // La vitrine lit désormais les mêmes paliers que le checkout.
    const g = grilleAffichee(TIERS)!;
    expect(g.minLabel).toBe("49 €");
    expect(g.maxLabel).toBe("249 €");
    expect(g.paliers).toEqual(["49 €", "149 €", "249 €"]);
    expect(g.lignes).toEqual([
      {
        name: "Essentiel",
        aidLabel: "Moins de 1\u202f000 € d’aide",
        priceLabel: "49 €",
      },
      {
        name: "Pivot",
        aidLabel: "De 1\u202f000 € à 5\u202f000 € d’aide",
        priceLabel: "149 €",
      },
      {
        name: "Premium",
        aidLabel: "Plus de 5\u202f000 € d’aide",
        priceLabel: "249 €",
      },
    ]);
  });

  it("ignore les paliers désactivés", () => {
    const g = grilleAffichee(
      TIERS.map((t) => (t.price_cents === 24900 ? { ...t, active: false } : t)),
    )!;
    expect(g.maxLabel).toBe("149 €");
    expect(g.paliers).toEqual(["49 €", "149 €"]);
    expect(g.lignes).toHaveLength(2);
  });

  it("null si aucun palier : l'appelant tait le prix plutôt que d'en inventer un", () => {
    expect(grilleAffichee([])).toBeNull();
    expect(grilleAffichee(TIERS.map((t) => ({ ...t, active: false })))).toBeNull();
  });
});
