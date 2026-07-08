import "server-only";

/**
 * Accès LLM via OpenRouter (passerelle compatible OpenAI). Appel HTTP direct,
 * sans dépendance SDK. Modèles pilotables par variables d'environnement
 * (`OPENROUTER_MODEL` texte, `OPENROUTER_VLM_MODEL` vision). Clé server-only.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "qwen/qwen3-235b-a22b-2507";
const DEFAULT_VLM = "google/gemini-2.5-flash-lite";

/** true si une clé OpenRouter réelle est configurée (placeholders exclus). */
export function isLlmConfigured(): boolean {
  const k = process.env.OPENROUTER_API_KEY;
  return !!k && !k.includes("your") && !k.includes("...") && k.length > 12;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: unknown;
}

async function postChat(body: Record<string, unknown>, signal?: AbortSignal): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY manquant.");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://dossimo.app",
      "X-Title": "Dossimo",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Réponse OpenRouter vide.");
  }
  return content;
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
}): Promise<string> {
  return postChat(
    {
      model: params.model || process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      messages: params.messages,
      temperature: params.temperature ?? 0.3,
      max_tokens: params.maxTokens ?? 1200,
      ...(params.jsonMode ? { response_format: { type: "json_object" } } : {}),
    },
    params.signal,
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
    params.signal,
  );
}
