import { describe, it, expect } from "vitest";

import { mentionsTemplates } from "@/lib/pack/pieces-cee-isolation";
import type { DossierComplet } from "@/lib/dossier/get-dossier";

/**
 * Les mentions exigées sont confrontées au document réel par `controle-pieces.ts`,
 * et une mention absente d'un document lisible vaut REFUS. Une mention mal formée,
 * ou empruntée à un autre geste, est donc un refus fabriqué de toutes pièces : ces
 * cas verrouillent la porte.
 */

const dossier = (
  caracteristiques: Record<string, unknown>,
  regle: unknown = null,
): DossierComplet =>
  ({ caracteristiques, regle }) as unknown as DossierComplet;

const isolation = dossier({
  geste: "isolation",
  fiche: "BAR-EN-101",
  travaux: { fiche: "BAR-EN-101", surface_isolee_m2: 95, resistance_thermique_r: 7.5 },
});

const pac = dossier({
  geste: "pac_air_eau",
  fiche: "BAR-TH-171",
  pac: { fiche: "BAR-TH-171", etas: 145, puissance_kw: 8, temperature: "basse" },
});

const cet = dossier({
  geste: "cet",
  fiche: "BAR-TH-148",
  cet: { fiche: "BAR-TH-148", cop: 3.2, profil_soutirage: "L", volume_l: 200 },
});

const bois = (emissions_co: number | null) =>
  dossier({
    geste: "bois",
    fiche: "BAR-TH-112",
    bois: { fiche: "BAR-TH-112", combustible: "granules", rendement: 87, emissions_co },
  });

const solaire = (over: Record<string, unknown> = {}) =>
  dossier({
    geste: "solaire_thermique",
    fiche: "BAR-TH-101",
    solaire: {
      fiche: "BAR-TH-101",
      appoint: "electrique_joule",
      fluide: "eau_glycolee",
      surface_capteurs_m2: 4,
      profil_soutirage: "L",
      efficacite_ecs: 45,
      nb_ballons: 1,
      volume_ballon_l: 300,
      classe_ballon: "B",
      ...over,
    },
  });

describe("mentionsTemplates", () => {
  it("interpole les valeurs du dossier d'isolation", () => {
    const ms = mentionsTemplates(isolation);
    expect(ms).toContain("Surface isolée : 95 m²");
    expect(ms).toContain("Résistance thermique R = 7.5 m²·K/W");
    expect(ms).toContain("Fiche CEE : BAR-EN-101");
  });

  it("un dossier PAC n'exige AUCUNE mention d'isolation", () => {
    // Le bug qu'on ferme : servir les mentions de l'isolation à une PAC revenait à
    // exiger une certification ACERMI et une surface isolée sur un devis de pompe à
    // chaleur. Toutes revenaient « absentes » du document — donc bloquantes — sur un
    // dossier pourtant conforme.
    const ms = mentionsTemplates(pac);
    const joint = ms.join(" | ");
    expect(joint).not.toMatch(/ACERMI/i);
    expect(joint).not.toMatch(/isolant/i);
    expect(joint).not.toMatch(/[Ss]urface isolée/);
  });

  it("un dossier PAC exige ses propres caractéristiques", () => {
    const ms = mentionsTemplates(pac);
    expect(ms).toContain("Efficacité énergétique saisonnière (ETAS) : 145 %");
    expect(ms).toContain("Puissance thermique : 8 kW");
    expect(ms).toContain("Fiche CEE : BAR-TH-171");
  });

  it("un dossier CET exige son COP, son volume et son profil de soutirage", () => {
    const ms = mentionsTemplates(cet);
    expect(ms).toContain("COP (norme EN 16147) : 3.2");
    expect(ms).toContain("Volume du ballon : 200 L");
    expect(ms).toContain("Profil de soutirage : L");
  });

  it("un dossier bois exige son rendement et son combustible", () => {
    const ms = mentionsTemplates(bois(300));
    expect(ms).toContain("Rendement énergétique : 87 %");
    expect(ms).toContain("Émissions de monoxyde de carbone : 300 mg/Nm³");
  });

  it("un dossier solaire exige les mentions littérales du BAR-TH-101", () => {
    const ms = solaire();
    const out = mentionsTemplates(ms);
    expect(out).toContain("Fiche CEE : BAR-TH-101");
    expect(out).toContain("Surface hors-tout totale des capteurs : 4 m²");
    expect(out).toContain(
      "Efficacité énergétique pour le chauffage de l'eau (profil L) : 45 %",
    );
    expect(out).toContain("Capacité de stockage de chaque ballon : 300 L");
    expect(out).toContain("Nature du fluide circulant dans les capteurs : Eau glycolée");
  });

  it("un dossier solaire n'exige AUCUNE mention d'isolation ni de CET", () => {
    const joint = mentionsTemplates(solaire()).join(" | ");
    expect(joint).not.toMatch(/ACERMI/i);
    expect(joint).not.toMatch(/isolant/i);
    expect(joint).not.toMatch(/COP/);
  });

  it("ballon > 500 L : la mention de classe d'efficacité n'est pas exigée", () => {
    // La fiche ne l'exige qu'au-dessous de 500 L. Sans classe au dossier, la
    // mention tombe au lieu d'exiger « Classe d'efficacité énergétique :  ».
    const out = mentionsTemplates(solaire({ volume_ballon_l: 600, classe_ballon: null }));
    expect(out.some((m) => m.includes("Classe d'efficacité"))).toBe(false);
    expect(out.every((m) => !m.includes("{"))).toBe(true);
  });

  it("aucune mention amputée quand la donnée manque au dossier", () => {
    // Émissions de CO non saisies : on n'exige pas « Émissions de CO :  mg/Nm³ »,
    // qu'aucun document ne pourra jamais porter.
    const ms = mentionsTemplates(bois(null));
    expect(ms.some((m) => m.includes("monoxyde"))).toBe(false);
    expect(ms.every((m) => !m.includes("{") && !m.includes("  "))).toBe(true);
  });

  it("une règle métier en base prime sur le repli codé", () => {
    const ms = mentionsTemplates(
      dossier(
        { geste: "isolation", fiche: "BAR-EN-101", travaux: { fiche: "BAR-EN-101", surface_isolee_m2: 95, resistance_thermique_r: 7.5 } },
        { mentions: ["Mention maison : {surface} m²"] },
      ),
    );
    expect(ms).toEqual(["Mention maison : 95 m²"]);
  });

  it("une règle métier dont les placeholders ne collent pas au geste n'exige rien d'amputé", () => {
    // Garde-fou : une règle isolation restée active sur un dossier PAC ne doit pas
    // produire « Surface isolée :  m² » et bloquer le dossier.
    const ms = mentionsTemplates(
      dossier(
        { geste: "pac_air_eau", fiche: "BAR-TH-171", pac: { fiche: "BAR-TH-171", etas: 145, puissance_kw: 8, temperature: "basse" } },
        { mentions: ["Surface isolée : {surface} m²", "Fiche CEE : {fiche}"] },
      ),
    );
    expect(ms).toEqual(["Fiche CEE : BAR-TH-171"]);
  });
});
