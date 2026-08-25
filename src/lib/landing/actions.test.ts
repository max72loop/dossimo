import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Contrat de la Server Action `submitLead`.
 *
 * Le formulaire lead est volontairement plus permissif que `/refus`
 * (actions.test.ts du même dossier) : il laisse passer sur une panne du
 * limiteur ou du jeton d'ouverture, jamais sur un dépassement de quota ou un
 * jeton trop jeune. Voir le commentaire « on ne perd jamais un lead » dans
 * actions.ts.
 */

const consumeAuthRateLimit = vi.fn();
const verifierOuvertureFormulaire = vi.fn();
const emailEstRecevable = vi.fn();

vi.mock("@/lib/auth/rate-limit", () => ({
  consumeAuthRateLimit: (...args: unknown[]) => consumeAuthRateLimit(...args),
}));

vi.mock("@/lib/forms/timing", () => ({
  verifierOuvertureFormulaire: (...args: unknown[]) => verifierOuvertureFormulaire(...args),
}));

vi.mock("@/lib/forms/anti-spam", () => ({
  emailEstRecevable: (...args: unknown[]) => emailEstRecevable(...args),
}));

const { submitLead } = await import("@/lib/landing/actions");

function lead(sur: Record<string, unknown> = {}) {
  return {
    email: "artisan@example.com",
    entreprise: "",
    telephone: "",
    message: "",
    website: "",
    opened_at: "jeton-valide",
    ...sur,
  };
}

const fetchMock = vi.fn();

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

  consumeAuthRateLimit.mockReset();
  consumeAuthRateLimit.mockResolvedValue("ok");
  verifierOuvertureFormulaire.mockReset();
  verifierOuvertureFormulaire.mockReturnValue("ok");
  emailEstRecevable.mockReset();
  emailEstRecevable.mockResolvedValue(true);

  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("submitLead", () => {
  it("capture le lead quand tout est en ordre", async () => {
    const result = await submitLead(lead());

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [endpoint] = fetchMock.mock.calls[0] as [URL];
    expect(endpoint.pathname).toBe("/rest/v1/leads");
  });

  it("refuse quand le quota est atteint", async () => {
    consumeAuthRateLimit.mockResolvedValue("quota");

    const result = await submitLead(lead());

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("laisse passer quand le limiteur est en panne (mode ouvert)", async () => {
    consumeAuthRateLimit.mockResolvedValue("unavailable");

    const result = await submitLead(lead());

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refuse un formulaire soumis trop vite", async () => {
    verifierOuvertureFormulaire.mockReturnValue("trop-tot");

    const result = await submitLead(lead());

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("laisse passer quand le jeton d'ouverture est indisponible (mode ouvert)", async () => {
    verifierOuvertureFormulaire.mockReturnValue("indisponible");

    const result = await submitLead(lead());

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refuse une adresse dont le domaine ne peut pas recevoir de message", async () => {
    emailEstRecevable.mockResolvedValue(false);

    const result = await submitLead(lead());

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
