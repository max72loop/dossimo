import { describe, expect, it } from "vitest";

import {
  dansLaFenetre,
  debutJourParis,
  joursEntre,
  jourParis,
  minutesParis,
  plafondDuJour,
} from "@/lib/prospection/cadence";

// Campagne relancée le 2026-07-18 (samedi), envoi 7j/7, plafond nominal 40.
const CAMPAGNE = { debut: "2026-07-18", fin: "2026-09-30", capMax: 40 };

describe("plafondDuJour — montée en charge, envoi 7 jours sur 7", () => {
  it("monte par paliers calendaires, week-end compris", () => {
    // 18 juillet 2026 = samedi, premier jour de campagne.
    expect(plafondDuJour({ ...CAMPAGNE, jour: "2026-07-18" })).toBe(15); // samedi
    expect(plafondDuJour({ ...CAMPAGNE, jour: "2026-07-19" })).toBe(25); // dimanche
    expect(plafondDuJour({ ...CAMPAGNE, jour: "2026-07-20" })).toBe(35); // lundi
    expect(plafondDuJour({ ...CAMPAGNE, jour: "2026-07-21" })).toBe(40);
    // Au-delà du dernier palier, le plafond de la campagne prend le relais.
    expect(plafondDuJour({ ...CAMPAGNE, jour: "2026-07-22" })).toBe(40);
    expect(plafondDuJour({ ...CAMPAGNE, jour: "2026-07-26" })).toBe(40); // dimanche suivant
  });

  it("n'envoie rien hors de la fenêtre de campagne", () => {
    expect(plafondDuJour({ ...CAMPAGNE, jour: "2026-07-17" })).toBe(0); // veille
    expect(plafondDuJour({ ...CAMPAGNE, jour: "2026-10-01" })).toBe(0); // lendemain de fin
  });

  it("ne dépasse jamais le plafond de la campagne, même en début de rampe", () => {
    // Plafond abaissé à 5 en cours de route (bounces en hausse) : la rampe, qui
    // dirait 40 au 4e jour, ne doit pas passer devant.
    expect(
      plafondDuJour({ ...CAMPAGNE, capMax: 5, jour: "2026-07-21" }),
    ).toBe(5);
  });
});

describe("fenêtre horaire — heure de Paris, tous les jours", () => {
  it("ouvre à 9h30 et ferme à 18h30, heure de Paris", () => {
    // 07:00 UTC = 09:00 à Paris (CEST) : trop tôt.
    expect(dansLaFenetre(new Date("2026-07-20T07:00:00Z"))).toBe(false);
    // 07:30 UTC = 09:30 à Paris : ouverture.
    expect(dansLaFenetre(new Date("2026-07-20T07:30:00Z"))).toBe(true);
    expect(dansLaFenetre(new Date("2026-07-20T14:00:00Z"))).toBe(true);
    // 16:30 UTC = 18:30 à Paris : dernière minute.
    expect(dansLaFenetre(new Date("2026-07-20T16:30:00Z"))).toBe(true);
    expect(dansLaFenetre(new Date("2026-07-20T16:31:00Z"))).toBe(false);
  });

  it("accepte un tick de fin de journée retardé par le planificateur", () => {
    // Cas réel du 2026-07-19 : exécution demandée à 16:00 UTC, lancée à 16:11,
    // soit 18h11 à Paris. L'ancienne fermeture à 17h30 la refusait alors qu'il
    // restait 23 messages en file.
    expect(dansLaFenetre(new Date("2026-07-19T16:11:00Z"))).toBe(true);
  });

  it("reste ouverte le week-end (décision : prospection 7j/7)", () => {
    expect(dansLaFenetre(new Date("2026-07-18T12:00:00Z"))).toBe(true); // samedi 14h
    expect(dansLaFenetre(new Date("2026-07-19T12:00:00Z"))).toBe(true); // dimanche 14h
  });

  it("date et heure de Paris, pas celles du serveur", () => {
    // 23h30 UTC le 15 = 01h30 le 16 à Paris. Un envoi compté sur le mauvais jour
    // ferait sauter le plafond quotidien.
    const t = new Date("2026-07-15T23:30:00Z");
    expect(jourParis(t)).toBe("2026-07-16");
    expect(minutesParis(t)).toBe(90);
  });
});

describe("joursEntre — jours calendaires bornes incluses", () => {
  it("compte les jours bornes incluses", () => {
    expect(joursEntre("2026-07-19", "2026-07-19")).toBe(1);
    expect(joursEntre("2026-07-19", "2026-07-22")).toBe(4);
    expect(joursEntre("2026-07-22", "2026-07-19")).toBe(0);
  });

  it("traverse un changement de mois", () => {
    expect(joursEntre("2026-07-30", "2026-08-02")).toBe(4);
  });
});

describe("debutJourParis — borne de comptage du plafond", () => {
  it("renvoie minuit à Paris, soit 22h UTC la veille en été", () => {
    const t = new Date("2026-07-20T10:14:00Z"); // 12h14 à Paris
    expect(debutJourParis(t).toISOString()).toBe("2026-07-19T22:00:00.000Z");
  });

  it("borne la journée parisienne, pas la journée UTC", () => {
    // 23h30 UTC le 19 = 01h30 le 20 à Paris : la journée à compter est celle du
    // 20, pas celle du 19. Une borne UTC laisserait le compteur repartir de zéro
    // en plein milieu de la soirée parisienne.
    const t = new Date("2026-07-19T23:30:00Z");
    expect(debutJourParis(t).toISOString()).toBe("2026-07-19T22:00:00.000Z");
  });

  it("suit l'heure d'hiver (UTC+1)", () => {
    const t = new Date("2026-12-10T12:00:00Z");
    expect(debutJourParis(t).toISOString()).toBe("2026-12-09T23:00:00.000Z");
  });

  it("tient au passage à l'heure d'hiver", () => {
    // Le 2026-10-25 Paris passe de UTC+2 à UTC+1 à 03h locale. Minuit à Paris ce
    // jour-là est donc encore à UTC+2 : 2026-10-24T22:00Z. Un offset relu sur
    // minuit UTC (déjà en UTC+1) donnerait 23h et fausserait le comptage.
    const t = new Date("2026-10-25T12:00:00Z");
    expect(debutJourParis(t).toISOString()).toBe("2026-10-24T22:00:00.000Z");
  });
});
