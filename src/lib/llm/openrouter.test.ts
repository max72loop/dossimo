import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { LlmIndisponibleError, openRouterChat } from "@/lib/llm/openrouter";

/**
 * La reprise elle-même : ce qui se réessaie, ce qui ne se réessaie pas, et ce qui
 * s'arrête. Un quota dépassé qui remonte comme « document illisible » envoie
 * l'artisan rescanner un fichier parfaitement net.
 */

const ok = (contenu: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content: contenu } }] }), {
    status: 200,
  });
const ko = (status: number) => new Response("boum", { status });

const appel = () => openRouterChat({ messages: [{ role: "user", content: "salut" }] });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.OPENROUTER_API_KEY = "sk-or-v1-clefdetestsuffisammentlongue";
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("openRouter : reprise sur panne transitoire", () => {
  it("reprend après un 429 et rend la réponse suivante", async () => {
    fetchMock.mockResolvedValueOnce(ko(429)).mockResolvedValueOnce(ok("bonjour"));
    await expect(appel()).resolves.toBe("bonjour");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reprend après un 500", async () => {
    fetchMock.mockResolvedValueOnce(ko(503)).mockResolvedValueOnce(ok("bonjour"));
    await expect(appel()).resolves.toBe("bonjour");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reprend après une panne réseau", async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(ok("bonjour"));
    await expect(appel()).resolves.toBe("bonjour");
  });

  it("reprend sur une réponse vide", async () => {
    fetchMock.mockResolvedValueOnce(ok("   ")).mockResolvedValueOnce(ok("bonjour"));
    await expect(appel()).resolves.toBe("bonjour");
  });

  it("s'arrête après trois tentatives et remonte l'indisponibilité", async () => {
    fetchMock.mockResolvedValue(ko(429));
    await expect(appel()).rejects.toBeInstanceOf(LlmIndisponibleError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("ne reprend PAS sur une clé invalide : l'échec se reproduirait à l'identique", async () => {
    fetchMock.mockResolvedValue(ko(401));
    const err = await appel().catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(LlmIndisponibleError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("ne reprend PAS sur une requête malformée", async () => {
    fetchMock.mockResolvedValue(ko(400));
    await expect(appel()).rejects.not.toBeInstanceOf(LlmIndisponibleError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("respecte le budget total plutôt que de le multiplier par les tentatives", async () => {
    // Un budget épuisé coupe la reprise : sans ce garde-fou, trois tentatives à
    // 45 s dépasseraient la durée maximale de la fonction, qui trancherait sans
    // message.
    fetchMock.mockResolvedValue(ko(500));
    const err = await openRouterChat({
      messages: [{ role: "user", content: "salut" }],
      timeoutMs: 1,
    }).catch((e) => e);
    expect(err).toBeInstanceOf(LlmIndisponibleError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("borne l'appel dans le temps quand le service ne répond jamais", async () => {
    // fetch qui ne se résout que sur abandon : c'est le minuteur qui doit trancher.
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const err = await openRouterChat({
      messages: [{ role: "user", content: "salut" }],
      timeoutMs: 30,
    }).catch((e) => e);
    expect(err).toBeInstanceOf(LlmIndisponibleError);
    expect((err as Error).message).toContain("délai");
  });

  it("rend la main immédiatement si l'appelant abandonne", async () => {
    const ctrl = new AbortController();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const promesse = openRouterChat({
      messages: [{ role: "user", content: "salut" }],
      signal: ctrl.signal,
    });
    ctrl.abort();
    await expect(promesse).rejects.toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
