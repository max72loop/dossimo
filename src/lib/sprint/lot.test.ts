import { describe, it, expect } from "vitest";

import { jourParis, jourParisMoins, DELAI_RELANCE_JOURS, PLAFOND_QUOTIDIEN } from "./lot";

describe("jourParis", () => {
  it("rend le jour de Paris, pas celui du serveur", () => {
    // 31/12/2026 23:30 UTC = 01/01/2027 00:30 à Paris : marquer « envoyé » à
    // 00h30 doit compter pour le 1er, sinon le plafond du jour est faussé.
    expect(jourParis(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
    // En heure d'été, 22h30 UTC = 00h30 le lendemain à Paris.
    expect(jourParis(new Date("2026-07-15T22:30:00Z"))).toBe("2026-07-16");
  });
});

describe("jourParisMoins (borne de la relance J+5)", () => {
  it("recule du nombre de jours demandé", () => {
    expect(jourParisMoins(5, new Date("2026-07-16T10:00:00Z"))).toBe("2026-07-11");
    expect(jourParisMoins(0, new Date("2026-07-16T10:00:00Z"))).toBe("2026-07-16");
  });

  it("franchit correctement un changement de mois", () => {
    expect(jourParisMoins(5, new Date("2026-08-03T10:00:00Z"))).toBe("2026-07-29");
  });

  it("la borne J+5 exclut un contact envoyé il y a 4 jours et retient celui de 5 jours", () => {
    // Le lot relance filtre sur `date_envoi <= jourParisMoins(5)`. On vérifie la
    // borne elle-même : c'est elle qui décide qui est relancé trop tôt.
    const maintenant = new Date("2026-07-16T10:00:00Z");
    const borne = jourParisMoins(DELAI_RELANCE_JOURS, maintenant);
    const envoyeIlYA4Jours = "2026-07-12";
    const envoyeIlYA5Jours = "2026-07-11";
    expect(envoyeIlYA4Jours <= borne).toBe(false);
    expect(envoyeIlYA5Jours <= borne).toBe(true);
  });
});

describe("constantes de sécurité", () => {
  it("le plafond et le délai restent ceux du plan", () => {
    // Le plafond protège le numéro WhatsApp et la réputation du domaine ; le
    // relever se décide, ne se subit pas au détour d'un refactor.
    expect(PLAFOND_QUOTIDIEN).toBe(40);
    expect(DELAI_RELANCE_JOURS).toBe(5);
  });
});
