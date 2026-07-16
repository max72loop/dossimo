import { describe, it, expect } from "vitest";

import { saluer, normaliserTelephoneFr, lienWhatsApp, messageWhatsApp, messageEmail } from "./message";
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
