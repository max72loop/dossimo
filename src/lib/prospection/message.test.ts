import { describe, expect, it } from "vitest";

import {
  corpsHtmlPourProspect,
  corpsPourProspect,
  nettoyerPrenom,
  rendre,
  salutation,
} from "@/lib/prospection/message";

describe("nettoyerPrenom — le garde-fou du « Bonjour SARL, »", () => {
  it("normalise la casse d'un prénom importé", () => {
    expect(nettoyerPrenom("JEAN")).toBe("Jean");
    expect(nettoyerPrenom("  marie-claire ")).toBe("Marie-Claire");
    expect(nettoyerPrenom("jean pierre")).toBe("Jean Pierre");
  });

  it("refuse ce qui n'est pas un prénom", () => {
    expect(nettoyerPrenom("SARL Dupont")).toBeNull();
    expect(nettoyerPrenom("Isolation 62")).toBeNull();
    expect(nettoyerPrenom("Ets Martin Frères")).toBeNull();
    expect(nettoyerPrenom("")).toBeNull();
    expect(nettoyerPrenom(null)).toBeNull();
  });

  it("retombe sur « Bonjour, » plutôt que d'insulter le destinataire", () => {
    expect(salutation("jean")).toBe("Bonjour Jean,");
    expect(salutation("SAS Toiture du Nord")).toBe("Bonjour,");
    expect(salutation(null)).toBe("Bonjour,");
  });
});

describe("rendre — aucun message ne part incomplet", () => {
  it("substitue les variables du gabarit", () => {
    expect(rendre("{{salutation}}\nvoici {{quoi}}.", {
      salutation: "Bonjour Jean,",
      quoi: "le pack",
    })).toBe("Bonjour Jean,\nvoici le pack.\n");
  });

  it("refuse d'envoyer un corps où subsiste une variable", () => {
    // Le cas qu'on veut rendre impossible : « Bonjour {{prenom}}, » chez 40 artisans.
    expect(() => rendre("Bonjour {{prenom}},", {})).toThrow(/prenom/);
  });
});

describe("corpsPourProspect", () => {
  const gabarit =
    "{{salutation}}\n\nEssai : {{lien_demo}}\n\n--\n{{mentions_legales}}\nVotre adresse : {{source}}.\nDésinscription : {{lien_desinscription}}";

  it("porte l'identité, la source de l'adresse et le lien de désinscription", () => {
    const corps = corpsPourProspect(gabarit, {
      prenom: "jean",
      source: "annuaire public des professionnels RGE",
      unsubscribe_token: "tok-123",
    });

    expect(corps).toContain("Bonjour Jean,");
    expect(corps).toContain("/demo?p=tok-123");
    expect(corps).toContain("/desinscription/tok-123");
    // RGPD art. 14 : le destinataire doit savoir d'où vient son adresse.
    expect(corps).toContain("annuaire public des professionnels RGE");
    // LCEN art. 6 : l'expéditeur doit être identifiable.
    expect(corps).toContain("Max Landry (EI)");
    expect(corps).toContain("non affilié à l'Anah");
  });
});

describe("corpsHtmlPourProspect — version HTML à la marque", () => {
  const prospect = {
    prenom: "jean",
    source: "annuaire public des professionnels RGE",
    unsubscribe_token: "tok-123",
  };

  it("rend un HTML complet avec le bouton et le lien de désinscription", () => {
    const html = corpsHtmlPourProspect(prospect);

    expect(html).toContain("Bonjour Jean,");
    // Le lien démo doit être dans un href cliquable, pas en URL nue.
    expect(html).toContain('href="');
    expect(html).toContain("/demo?p=tok-123");
    expect(html).toContain("/desinscription/tok-123");
    expect(html).toContain("Tester en 2 minutes");
    expect(html).toContain(prospect.source);
    // Aucune variable de gabarit ne doit subsister.
    expect(html).not.toMatch(/\{\{\s*\w+\s*\}\}/);
  });

  it("échappe le HTML des valeurs variables (pas d'injection via la source)", () => {
    const html = corpsHtmlPourProspect({
      ...prospect,
      source: 'annuaire <script>alert(1)</script>',
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
