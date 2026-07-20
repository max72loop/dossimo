import "server-only";

/**
 * Accès LLM via OpenRouter (passerelle compatible OpenAI). Appel HTTP direct,
 * sans dépendance SDK. Modèles pilotables par variables d'environnement
 * (`OPENROUTER_MODEL` texte, `OPENROUTER_VLM_MODEL` vision). Clé server-only.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "qwen/qwen3-235b-a22b-2507";
const DEFAULT_VLM = "google/gemini-2.5-flash-lite";

/**
 * Budget TOTAL d'un appel, reprises comprises — pas un délai par tentative. Un
 * budget par tentative se multiplierait par le nombre de reprises et dépasserait la
 * durée maximale de la fonction, qui trancherait sans message.
 */
const BUDGET_CHAT_MS = 30_000;
const BUDGET_VISION_MS = 45_000;
const TENTATIVES_MAX = 3;
/** Pause avant la reprise n. Court : le budget total reste le juge de paix. */
const BACKOFF_MS = [400, 1_200];

/**
 * Panne transitoire du service : quota, débit, 5xx, réseau, délai dépassé.
 *
 * Le type existe pour que l'appelant sache faire la différence. Sans lui, tout
 * échec devenait « Réessayez avec un fichier plus lisible » : on demandait à
 * l'artisan de rescanner un document parfaitement net parce que le quota OpenRouter
 * était dépassé.
 */
export class LlmIndisponibleError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "LlmIndisponibleError";
  }
}

function attendre(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const minuteur = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(minuteur);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

/** true si une clé OpenRouter réelle est configurée (placeholders exclus). */
export function isLlmConfigured(): boolean {
  const k = process.env.OPENROUTER_API_KEY;
  return !!k && !k.includes("your") && !k.includes("...") && k.length > 12;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: unknown;
}

/** Une tentative, bornée dans le temps. Les pannes transitoires sortent en `LlmIndisponibleError`. */
async function tenterChat(
  body: Record<string, unknown>,
  apiKey: string,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<string> {
  const ctrl = new AbortController();
  const minuteur = setTimeout(() => ctrl.abort(), timeoutMs);
  const relais = () => ctrl.abort();
  signal?.addEventListener("abort", relais, { once: true });

  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://dossimo.app",
        "X-Title": "Dossimo",
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (err) {
    // Abandon demandé par l'appelant : sa décision, on la lui rend telle quelle.
    if (signal?.aborted) throw err;
    if (ctrl.signal.aborted) {
      throw new LlmIndisponibleError(`OpenRouter : délai de ${timeoutMs} ms dépassé.`, {
        cause: err,
      });
    }
    throw new LlmIndisponibleError("OpenRouter injoignable.", { cause: err });
  } finally {
    clearTimeout(minuteur);
    signal?.removeEventListener("abort", relais);
  }

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    const msg = `OpenRouter ${res.status}: ${t.slice(0, 300)}`;
    // 429 (quota, débit) et 5xx passent ; les autres 4xx (clé invalide, requête
    // malformée) sont notre faute et se reproduiront à l'identique : reprendre
    // coûterait un appel pour le même échec.
    if (res.status === 429 || res.status >= 500) throw new LlmIndisponibleError(msg);
    throw new Error(msg);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new LlmIndisponibleError("Réponse OpenRouter vide.");
  }
  return content;
}

/**
 * Politique de données imposée à OpenRouter, appliquée à TOUS les appels.
 *
 * `data_collection: "deny"` écarte de l'acheminement tout fournisseur qui
 * conserve les requêtes ou s'en sert pour entraîner ses modèles. Ce n'est pas
 * un réglage de confort : ce qui transite ici, ce sont les devis, les factures
 * et les avis d'imposition des bénéficiaires, c'est-à-dire les données les plus
 * sensibles du produit (`AGENTS.md`). Sans ce garde-fou, la promesse faite sur
 * la vitrine (« vos documents ne servent à entraîner aucun modèle ») serait
 * fausse, et une promesse de confidentialité fausse est pire que pas de
 * promesse du tout.
 *
 * Conséquence assumée : si aucun fournisseur conforme n'est disponible pour le
 * modèle demandé, l'appel échoue au lieu de partir chez un fournisseur qui
 * conserve. C'est le comportement voulu.
 */
const POLITIQUE_DONNEES = { data_collection: "deny" } as const;

async function postChat(
  body: Record<string, unknown>,
  opts: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY manquant.");

  // Appliquée ici, et pas chez les appelants : un seul point de passage pour
  // TOUS les appels (chat et vision), donc aucun moyen d'en oublier un. Les
  // options `provider` d'un appelant sont conservées, la politique de données
  // est imposée par-dessus.
  const corps = {
    ...body,
    provider: { ...(body.provider as object | undefined), ...POLITIQUE_DONNEES },
  };

  const budget = opts.timeoutMs ?? BUDGET_CHAT_MS;
  const echeance = Date.now() + budget;
  let derniere: unknown = new LlmIndisponibleError("OpenRouter : budget épuisé.");

  for (let essai = 0; essai < TENTATIVES_MAX; essai++) {
    if (opts.signal?.aborted) throw opts.signal.reason;
    const restant = echeance - Date.now();
    if (restant <= 0) break;

    try {
      return await tenterChat(corps, apiKey, restant, opts.signal);
    } catch (err) {
      // Seul le transitoire se reprend. Le reste remonte immédiatement.
      if (!(err instanceof LlmIndisponibleError)) throw err;
      derniere = err;
      const pause = BACKOFF_MS[essai];
      // Ne pas attendre pour une tentative que le budget ne laissera pas aboutir.
      if (pause == null || echeance - Date.now() <= pause) break;
      await attendre(pause, opts.signal);
    }
  }

  throw derniere;
}

/** Chat texte (points de vigilance, etc.). */
export async function openRouterChat(params: {
  messages: ChatMessage[];
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
  /** Surcharge ponctuelle du modèle (ex. modèle rapide pour la vigilance). */
  model?: string;
  signal?: AbortSignal;
  /** Budget total, reprises comprises. Défaut : `BUDGET_CHAT_MS`. */
  timeoutMs?: number;
}): Promise<string> {
  return postChat(
    {
      model: params.model || process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      messages: params.messages,
      temperature: params.temperature ?? 0.3,
      max_tokens: params.maxTokens ?? 1200,
      ...(params.jsonMode ? { response_format: { type: "json_object" } } : {}),
    },
    { signal: params.signal, timeoutMs: params.timeoutMs ?? BUDGET_CHAT_MS },
  );
}

/**
 * Vision : envoie un document (image ou PDF) à un VLM pour extraction. Le PDF
 * est lu nativement par le modèle (pas de plugin OCR séparé).
 */
export async function openRouterVision(params: {
  system: string;
  userText: string;
  file: { mime: string; dataUrl: string; filename?: string };
  jsonMode?: boolean;
  maxTokens?: number;
  signal?: AbortSignal;
  /** Budget total, reprises comprises. Défaut : `BUDGET_VISION_MS`. */
  timeoutMs?: number;
}): Promise<string> {
  const { mime, dataUrl, filename } = params.file;
  const doc = mime.startsWith("image/")
    ? { type: "image_url", image_url: { url: dataUrl } }
    : { type: "file", file: { filename: filename ?? "document.pdf", file_data: dataUrl } };

  return postChat(
    {
      model: process.env.OPENROUTER_VLM_MODEL || DEFAULT_VLM,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: [{ type: "text", text: params.userText }, doc] },
      ],
      temperature: 0,
      max_tokens: params.maxTokens ?? 1500,
      ...(params.jsonMode ? { response_format: { type: "json_object" } } : {}),
    },
    { signal: params.signal, timeoutMs: params.timeoutMs ?? BUDGET_VISION_MS },
  );
}
