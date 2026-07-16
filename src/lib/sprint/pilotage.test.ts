import { describe, it, expect } from "vitest";

import { tauxReponse, verdictCanal, CIBLES, ENVOIS_MINIMUM_POUR_JUGER } from "./pilotage";

describe("tauxReponse", () => {
  it("calcule le taux", () => {
    expect(tauxReponse(14, 140)).toBeCloseTo(0.1);
    expect(tauxReponse(0, 140)).toBe(0);
  });

  it("rend null sans envoi plutôt que 0 %", () => {
    // 0 réponse sur 0 envoi n'est pas « 0 % de réponse » : c'est « pas de
    // donnée ». Afficher 0 % déclencherait une alerte sur un canal jamais lancé.
    expect(tauxReponse(0, 0)).toBeNull();
  });
});

describe("verdictCanal", () => {
  it("refuse de juger tant que l'échantillon est trop petit", () => {
    // 1 réponse sur 5 envois = 20 %, très au-dessus de la cible WhatsApp. Conclure
    // « cible atteinte » sur 5 envois serait du bruit présenté comme un résultat.
    expect(verdictCanal("whatsapp", 1, 5)).toBe("insuffisant");
    expect(verdictCanal("email", 0, 0)).toBe("insuffisant");
    expect(verdictCanal("whatsapp", 0, ENVOIS_MINIMUM_POUR_JUGER - 1)).toBe("insuffisant");
  });

  it("atteint la cible : ≥ 10 % WhatsApp, ≥ 5 % e-mail (§11)", () => {
    expect(verdictCanal("whatsapp", 14, 140)).toBe("atteint");
    expect(verdictCanal("email", 7, 140)).toBe("atteint");
    // Le seuil est inclusif : pile la cible compte comme atteinte.
    expect(verdictCanal("whatsapp", 2, 20)).toBe("atteint");
  });

  it("sous la cible mais au-dessus du seuil d'alerte", () => {
    // 5 % en WhatsApp : sous la cible de 10 %, mais loin des 3 % d'alerte.
    expect(verdictCanal("whatsapp", 7, 140)).toBe("sous-cible");
    // 4 % en e-mail : sous les 5 % visés, au-dessus des 3 %.
    expect(verdictCanal("email", 6, 140)).toBe("sous-cible");
  });

  it("alerte sous 3 % : on revoit le message, pas le canal (§11)", () => {
    expect(verdictCanal("whatsapp", 2, 140)).toBe("alerte");
    expect(verdictCanal("email", 2, 140)).toBe("alerte");
    expect(verdictCanal("whatsapp", 0, 140)).toBe("alerte");
  });

  it("les seuils restent ceux du plan", () => {
    // Les relever ou les baisser se décide, ne se subit pas au détour d'un refactor.
    expect(CIBLES.whatsapp.tauxReponse).toBe(0.1);
    expect(CIBLES.email.tauxReponse).toBe(0.05);
    expect(CIBLES.alerteTauxReponse).toBe(0.03);
    expect(CIBLES.envoisParCanal).toBe(140);
    expect(CIBLES.demos).toBe(15);
  });
});
