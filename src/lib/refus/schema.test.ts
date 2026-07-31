import { describe, expect, it } from "vitest";

import { CONSENTEMENTS_VERSION, instantaneConsentements } from "@/lib/refus/consentements";
import { demandeRefusSchema } from "@/lib/refus/schema";

/** Demande minimale valide. Chaque test part de là et casse UN champ. */
function demandeValide(sur: Record<string, unknown> = {}) {
  return {
    profil: "artisan_rge",
    aide: "cee",
    geste: "Isolation de combles perdus",
    email: "artisan@example.com",
    telephone: "06 12 34 56 78",
    date_notification: "2026-07-10",
    motif_libre:
      "Le dossier a été refusé parce que l'offre CEE a été datée après la signature du devis.",
    consentement_contact: true,
    website: "",
    ...sur,
  };
}

const hier = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
const demain = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

describe("demandeRefusSchema — cas conformes", () => {
  it("accepte une demande complète", () => {
    const r = demandeRefusSchema.safeParse(demandeValide());
    expect(r.success).toBe(true);
  });

  it("accepte une demande sans téléphone, sans geste et sans date de notification", () => {
    const r = demandeRefusSchema.safeParse(
      demandeValide({ telephone: "", geste: "", date_notification: "" }),
    );
    expect(r.success).toBe(true);
    if (r.success) {
      // Les champs vides deviennent null, jamais la chaîne vide : c'est ce qui
      // distingue « non renseigné » de « renseigné à vide » côté base.
      expect(r.data.telephone).toBeNull();
      expect(r.data.geste).toBeNull();
      expect(r.data.date_notification).toBeNull();
    }
  });

  it("rogne les espaces autour des champs texte", () => {
    const r = demandeRefusSchema.safeParse(demandeValide({ telephone: "  06 12 34 56 78  " }));
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.telephone).toBe("06 12 34 56 78");
  });

  it("accepte une date de notification de la veille", () => {
    const r = demandeRefusSchema.safeParse(demandeValide({ date_notification: hier }));
    expect(r.success).toBe(true);
  });

  it("accepte les trois valeurs d'aide et les deux profils", () => {
    for (const aide of ["maprimerenov", "cee", "les_deux"]) {
      expect(demandeRefusSchema.safeParse(demandeValide({ aide })).success).toBe(true);
    }
    for (const profil of ["artisan_rge", "autre"]) {
      expect(demandeRefusSchema.safeParse(demandeValide({ profil })).success).toBe(true);
    }
  });
});

describe("demandeRefusSchema — cas de refus", () => {
  it("refuse un consentement non coché", () => {
    const r = demandeRefusSchema.safeParse(demandeValide({ consentement_contact: false }));
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.flatten().fieldErrors.consentement_contact).toBeDefined();
    }
  });

  it("refuse un consentement absent", () => {
    const sansConsentement: Record<string, unknown> = demandeValide();
    delete sansConsentement.consentement_contact;
    expect(demandeRefusSchema.safeParse(sansConsentement).success).toBe(false);
  });

  it("refuse une adresse e-mail invalide", () => {
    const r = demandeRefusSchema.safeParse(demandeValide({ email: "pas-une-adresse" }));
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.flatten().fieldErrors.email).toBeDefined();
  });

  it("refuse le profil « particulier », qui n'a aucune collecte", () => {
    // L'aiguillage mène un particulier vers une page statique : la valeur ne doit
    // pas exister côté serveur, même si quelqu'un la poste à la main.
    const r = demandeRefusSchema.safeParse(demandeValide({ profil: "particulier" }));
    expect(r.success).toBe(false);
  });

  it("refuse une demande sans motif décrit", () => {
    const r = demandeRefusSchema.safeParse(demandeValide({ motif_libre: "" }));
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.flatten().fieldErrors.motif_libre).toBeDefined();
  });

  it("refuse un motif trop court pour être diagnostiquable", () => {
    const r = demandeRefusSchema.safeParse(demandeValide({ motif_libre: "refusé" }));
    expect(r.success).toBe(false);
  });

  it("refuse un honeypot rempli", () => {
    const r = demandeRefusSchema.safeParse(demandeValide({ website: "http://spam.example" }));
    expect(r.success).toBe(false);
  });

  it("refuse une date de notification dans le futur", () => {
    const r = demandeRefusSchema.safeParse(demandeValide({ date_notification: demain }));
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.flatten().fieldErrors.date_notification).toBeDefined();
  });

  it("refuse une date de notification mal formée", () => {
    expect(demandeRefusSchema.safeParse(demandeValide({ date_notification: "10/07/2026" })).success)
      .toBe(false);
  });

  it("refuse une aide inconnue", () => {
    expect(demandeRefusSchema.safeParse(demandeValide({ aide: "cite" })).success).toBe(false);
  });

  it("refuse un motif libre au-delà de la limite de stockage", () => {
    expect(
      demandeRefusSchema.safeParse(demandeValide({ motif_libre: "a".repeat(4001) })).success,
    ).toBe(false);
  });
});

describe("consentements", () => {
  it("fige le texte exact ET sa version", () => {
    const snap = instantaneConsentements();
    expect(snap.version).toBe(CONSENTEMENTS_VERSION);
    expect(snap.textes.contact).toContain("recontacté");
    // La durée de conservation annoncée doit rester celle de la doc RGPD :
    // trois ans après le dernier contact (docs/cluster-refus.md § 3.7).
    expect(snap.textes.contact).toContain("trois ans");
  });
});
