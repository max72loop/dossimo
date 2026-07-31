import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Contrat de la Server Action `soumettreDemandeRefus`.
 *
 * Le schéma Zod est déjà couvert par `schema.test.ts` : ce fichier ne re-teste
 * pas la validation, il teste les trois décisions que la Server Action prend
 * elle-même et qui ne se voient nulle part ailleurs.
 *
 *   1. le MODE FERMÉ, qui est la différence assumée avec le formulaire lead :
 *      quota comme panne du limiteur refusent, et proposent l'e-mail de repli ;
 *   2. l'instantané de consentement écrit avec la ligne (texte exact + version),
 *      sans quoi une case cochée ne prouve rien ;
 *   3. l'échec d'insertion remonté, jamais avalé (AGENTS.md).
 */

const insert = vi.fn();
const consumeAuthRateLimit = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: () => ({ insert }) }),
}));

vi.mock("@/lib/auth/rate-limit", () => ({
  consumeAuthRateLimit: (...args: unknown[]) => consumeAuthRateLimit(...args),
}));

const { soumettreDemandeRefus } = await import("@/lib/refus/actions");
const { CONSENTEMENT_CONTACT, CONSENTEMENTS_VERSION } = await import(
  "@/lib/refus/consentements"
);

function demande(sur: Record<string, unknown> = {}) {
  return {
    profil: "artisan_rge",
    aide: "cee",
    geste: "Isolation de combles perdus",
    email: "artisan@example.com",
    telephone: null,
    date_notification: null,
    motif_libre:
      "Refus notifié parce que la date de visite technique ne figure sur aucune pièce du dossier.",
    consentement_contact: true,
    website: "",
    ...sur,
  };
}

beforeEach(() => {
  insert.mockReset();
  insert.mockResolvedValue({ error: null });
  consumeAuthRateLimit.mockReset();
  consumeAuthRateLimit.mockResolvedValue("ok");
});

describe("soumettreDemandeRefus", () => {
  it("refuse et propose l'e-mail de repli quand le quota est atteint", async () => {
    consumeAuthRateLimit.mockResolvedValue("quota");

    const result = await soumettreDemandeRefus(demande());

    expect(result).toMatchObject({ ok: false, repliEmail: true });
    expect(insert).not.toHaveBeenCalled();
  });

  it("refuse AUSSI quand le limiteur est en panne (mode fermé)", async () => {
    // C'est le cas où `submitLead` laisse passer. Ici on ferme : une file de
    // traitement manuel noyée, ce sont des artisans qui attendent une réponse
    // qui n'arrivera pas.
    consumeAuthRateLimit.mockResolvedValue("erreur");

    const result = await soumettreDemandeRefus(demande());

    expect(result).toMatchObject({ ok: false, repliEmail: true });
    expect(insert).not.toHaveBeenCalled();
  });

  it("borne le limiteur par IP, jamais par e-mail", async () => {
    // Faire entrer l'adresse saisie dans la clé la ferait repartir de zéro à
    // chaque envoi : l'identité passée est vide, `consumeAuthRateLimit` retombe
    // alors sur l'IP de l'appelant.
    await soumettreDemandeRefus(demande());

    expect(consumeAuthRateLimit).toHaveBeenCalledWith("refus", "", 5);
  });

  it("écrit le texte exact du consentement et sa version", async () => {
    await soumettreDemandeRefus(demande());

    expect(insert).toHaveBeenCalledTimes(1);
    const ligne = insert.mock.calls[0][0] as Record<string, unknown>;
    expect(ligne.consentements_version).toBe(CONSENTEMENTS_VERSION);
    expect(ligne.consentements_texte).toEqual({ contact: CONSENTEMENT_CONTACT.texte });
    expect(typeof ligne.consentement_contact_at).toBe("string");
  });

  it("n'écrit pas de ligne quand le consentement n'est pas coché", async () => {
    const result = await soumettreDemandeRefus(demande({ consentement_contact: false }));

    expect(result.ok).toBe(false);
    expect(insert).not.toHaveBeenCalled();
  });

  it("remonte l'échec d'insertion au lieu de l'avaler", async () => {
    insert.mockResolvedValue({ error: { message: "insert refusé" } });

    const result = await soumettreDemandeRefus(demande());

    expect(result).toMatchObject({ ok: false, repliEmail: true });
  });
});
