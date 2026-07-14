import { describe, expect, it } from "vitest";

import {
  dansLaFenetre,
  estJourOuvre,
  joursOuvresEntre,
  jourParis,
  minutesParis,
  plafondDuJour,
} from "@/lib/prospection/cadence";

const CAMPAGNE = { debut: "2026-07-15", fin: "2026-07-24", capMax: 40 };

describe("plafondDuJour — montée en charge d'une boîte neuve", () => {
  it("monte par paliers sur les premiers jours ouvrés", () => {
    // 15 juillet 2026 = mercredi, premier jour de campagne.
    expect(plafondDuJour({ ...CAMPAGNE, jour: "2026-07-15" })).toBe(10);
    expect(plafondDuJour({ ...CAMPAGNE, jour: "2026-07-16" })).toBe(15);
    expect(plafondDuJour({ ...CAMPAGNE, jour: "2026-07-17" })).toBe(20);
    // Le week-end ne compte pas : lundi 20 est le 4e jour OUVRÉ, pas le 6e.
    expect(plafondDuJour({ ...CAMPAGNE, jour: "2026-07-20" })).toBe(30);
    expect(plafondDuJour({ ...CAMPAGNE, jour: "2026-07-21" })).toBe(40);
    expect(plafondDuJour({ ...CAMPAGNE, jour: "2026-07-24" })).toBe(40);
  });

  it("n'envoie rien le week-end", () => {
    expect(plafondDuJour({ ...CAMPAGNE, jour: "2026-07-18" })).toBe(0); // samedi
    expect(plafondDuJour({ ...CAMPAGNE, jour: "2026-07-19" })).toBe(0); // dimanche
  });

  it("n'envoie rien hors de la fenêtre de campagne", () => {
    expect(plafondDuJour({ ...CAMPAGNE, jour: "2026-07-14" })).toBe(0);
    expect(plafondDuJour({ ...CAMPAGNE, jour: "2026-07-27" })).toBe(0);
  });

  it("ne dépasse jamais le plafond de la campagne, même en début de rampe", () => {
    // Plafond abaissé à 5 en cours de route (bounces en hausse) : la rampe, qui
    // dirait 30 au 4e jour, ne doit pas passer devant.
    expect(
      plafondDuJour({ ...CAMPAGNE, capMax: 5, jour: "2026-07-20" }),
    ).toBe(5);
  });
});

describe("fenêtre horaire — tout est calculé en heure de Paris", () => {
  it("ouvre à 9h30 et ferme à 17h30, heure de Paris", () => {
    // 07:00 UTC = 09:00 à Paris (CEST) : trop tôt.
    expect(dansLaFenetre(new Date("2026-07-15T07:00:00Z"))).toBe(false);
    // 07:30 UTC = 09:30 à Paris : ouverture.
    expect(dansLaFenetre(new Date("2026-07-15T07:30:00Z"))).toBe(true);
    expect(dansLaFenetre(new Date("2026-07-15T14:00:00Z"))).toBe(true);
    // 15:30 UTC = 17:30 à Paris : dernière minute.
    expect(dansLaFenetre(new Date("2026-07-15T15:30:00Z"))).toBe(true);
    expect(dansLaFenetre(new Date("2026-07-15T15:31:00Z"))).toBe(false);
  });

  it("reste fermée le samedi et le dimanche", () => {
    expect(dansLaFenetre(new Date("2026-07-18T12:00:00Z"))).toBe(false);
    expect(dansLaFenetre(new Date("2026-07-19T12:00:00Z"))).toBe(false);
  });

  it("date et heure de Paris, pas celles du serveur", () => {
    // 23h30 UTC le 15 = 01h30 le 16 à Paris. Un envoi compté sur le mauvais jour
    // ferait sauter le plafond quotidien.
    const t = new Date("2026-07-15T23:30:00Z");
    expect(jourParis(t)).toBe("2026-07-16");
    expect(minutesParis(t)).toBe(90);
  });
});

describe("jours ouvrés", () => {
  it("compte les jours ouvrés bornes incluses", () => {
    expect(joursOuvresEntre("2026-07-15", "2026-07-15")).toBe(1);
    expect(joursOuvresEntre("2026-07-15", "2026-07-20")).toBe(4);
    expect(joursOuvresEntre("2026-07-20", "2026-07-15")).toBe(0);
  });

  it("reconnaît le week-end", () => {
    expect(estJourOuvre("2026-07-17")).toBe(true); // vendredi
    expect(estJourOuvre("2026-07-18")).toBe(false); // samedi
    expect(estJourOuvre("2026-07-19")).toBe(false); // dimanche
  });
});
