import { describe, expect, it } from "vitest";

import {
  RETENTION_CONTACT_SANS_REPONSE_JOURS,
  RETENTION_LEAD_JOURS,
  estContactPurgeable,
  estLeadPurgeable,
} from "./retention";

const MAINTENANT = new Date("2026-08-22T12:00:00Z");

const ilYA = (jours: number) =>
  new Date(MAINTENANT.getTime() - jours * 24 * 60 * 60 * 1000).toISOString();

describe("estContactPurgeable", () => {
  it("ne purge jamais un contact jamais sollicité (actif annuaire)", () => {
    expect(
      estContactPurgeable({ dernierContactLe: null, aRepondu: false }, MAINTENANT),
    ).toBe(false);
  });

  it("ne purge pas un contact récent sans réponse", () => {
    expect(
      estContactPurgeable(
        { dernierContactLe: ilYA(30), aRepondu: false },
        MAINTENANT,
      ),
    ).toBe(false);
  });

  it("purge au-delà de trois ans de silence", () => {
    expect(
      estContactPurgeable(
        { dernierContactLe: ilYA(RETENTION_CONTACT_SANS_REPONSE_JOURS + 1), aRepondu: false },
        MAINTENANT,
      ),
    ).toBe(true);
  });

  it("la borne exacte n'est pas purgeable (> strict)", () => {
    expect(
      estContactPurgeable(
        { dernierContactLe: ilYA(RETENTION_CONTACT_SANS_REPONSE_JOURS), aRepondu: false },
        MAINTENANT,
      ),
    ).toBe(false);
  });

  it("ne purge jamais un contact qui a répondu, même vieux", () => {
    expect(
      estContactPurgeable(
        { dernierContactLe: ilYA(RETENTION_CONTACT_SANS_REPONSE_JOURS + 400), aRepondu: true },
        MAINTENANT,
      ),
    ).toBe(false);
  });
});

describe("estLeadPurgeable", () => {
  it("purge un lead vieux de plus de trois ans non converti", () => {
    expect(
      estLeadPurgeable(
        { createdAt: ilYA(RETENTION_LEAD_JOURS + 1), email: "artisan@exemple.fr" },
        new Set(),
        MAINTENANT,
      ),
    ).toBe(true);
  });

  it("épargne un lead récent", () => {
    expect(
      estLeadPurgeable({ createdAt: ilYA(10), email: "a@b.fr" }, new Set(), MAINTENANT),
    ).toBe(false);
  });

  it("épargne le lead d'un artisan devenu client (insensible à la casse)", () => {
    expect(
      estLeadPurgeable(
        { createdAt: ilYA(RETENTION_LEAD_JOURS + 100), email: "Client@Exemple.fr" },
        new Set(["client@exemple.fr"]),
        MAINTENANT,
      ),
    ).toBe(false);
  });
});
