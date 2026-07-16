import { describe, it, expect } from "vitest";

import {
  saluer,
  normaliserTelephoneFr,
  lienWhatsApp,
  messageWhatsApp,
  messageEmail,
  messageRelanceWhatsApp,
  messageRelanceEmail,
} from "./message";
import { ACCROCHES } from "./accroches";

describe("saluer", () => {
  it("reconnaît une personne et pose le prénom", () => {
    expect(saluer("ALAIN RIFFAUT")).toBe("Bonjour Alain,");
    expect(saluer("Jean")).toBe("Bonjour Jean,");
    expect(saluer("marie-claire dupont")).toBe("Bonjour Marie-claire,");
  });

  it("retombe sur « Bonjour, » pour une raison sociale ou une valeur douteuse", () => {
    expect(saluer("APPLICATIONS MODERNES D'ELECTRICITE")).toBe("Bonjour,");
    expect(saluer("SARL DUPONT")).toBe("Bonjour,");
    expect(saluer("ISO 2000")).toBe("Bonjour,");
    expect(saluer("VGMS")).toBe("Bonjour,");
    expect(saluer("SNC")).toBe("Bonjour,");
    expect(saluer("")).toBe("Bonjour,");
    expect(saluer(null)).toBe("Bonjour,");
  });
});

describe("normaliserTelephoneFr", () => {
  it("normalise les formats courants vers 33XXXXXXXXX", () => {
    expect(normaliserTelephoneFr("06 80 26 45 56")).toBe("33680264556");
    expect(normaliserTelephoneFr("+33 6 80 26 45 56")).toBe("33680264556");
    expect(normaliserTelephoneFr("0033680264556")).toBe("33680264556");
    expect(normaliserTelephoneFr("01.47.39.76.16")).toBe("33147397616");
  });

  it("rejette ce qui n'est pas un numéro français exploitable", () => {
    expect(normaliserTelephoneFr("")).toBeNull();
    expect(normaliserTelephoneFr("12345")).toBeNull();
    expect(normaliserTelephoneFr(null)).toBeNull();
  });
});

describe("rendu des messages", () => {
  it("le lien wa.me porte le numéro international", () => {
    expect(lienWhatsApp("06 80 26 45 56", "coucou")).toContain("wa.me/33680264556");
    expect(lienWhatsApp("pas un numéro", "coucou")).toBeNull();
  });

  it("le message WhatsApp contient l'accroche, l'utm et le lieu", () => {
    const m = messageWhatsApp({ salutation: "Bonjour Alain,", ville: "CLICHY", metier: "isolation", accroche: ACCROCHES.isolation });
    expect(m).toContain("ACERMI");
    expect(m).toContain("utm_source=whatsapp");
    expect(m).toContain("(CLICHY, isolation)");
  });

  it("l'e-mail a un objet adapté et un corps avec STOP et utm", () => {
    const { objet, corps } = messageEmail({ salutation: "Bonjour,", accroche: ACCROCHES.pac });
    expect(objet).toMatch(/PAC/);
    expect(corps).toContain("utm_source=email");
    expect(corps).toContain("STOP");
    expect(corps).toContain("ETAS");
  });
});

describe("relance J+5", () => {
  it("annonce une relance unique et laisse une porte de sortie", () => {
    // Les deux tiennent le message : sans « une seule », la promesse du plan
    // n'est pas tenue ; sans la porte de sortie, la relance devient du forcing.
    const m = messageRelanceWhatsApp({ salutation: "Bonjour Alain," });
    expect(m).toContain("une seule relance");
    expect(m).toContain("je ne vous réécris pas");
    expect(m).toContain("utm_source=whatsapp");
  });

  it("la relance e-mail porte la source et le STOP, que le premier contact portait déjà", () => {
    // Chaque e-mail non sollicité doit porter sa sortie, pas seulement le premier.
    const { objet, corps } = messageRelanceEmail({ salutation: "Bonjour,", accroche: ACCROCHES.isolation });
    expect(corps).toContain("une seule relance");
    expect(corps).toContain("utm_source=email");
    expect(corps).toContain("STOP");
    expect(corps).toContain("annuaire public");
    // Objet identique au premier contact : le fil se regroupe naturellement,
    // sans « Re: » postiche qui simulerait une réponse jamais écrite.
    expect(objet).toBe(ACCROCHES.isolation.objet);
    expect(objet).not.toMatch(/^Re\s*:/i);
  });

  it("la relance ne rejoue pas l'argumentaire du premier contact", () => {
    const m = messageRelanceWhatsApp({ salutation: "Bonjour," });
    expect(m).not.toMatch(/mandataire|ACERMI|49\s?€/i);
  });
});
