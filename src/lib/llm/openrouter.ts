import "server-only";

/**
 * Accès LLM via OpenRouter (passerelle compatible OpenAI). Appel HTTP direct,
 * sans dépendance SDK. Le modèle est pilotable par variable d'environnement
 * (`OPENROUTER_MODEL`) pour rester souple. Jamais exposé au navigateur : la clé
 * ne vit que côté serveur.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// Défaut : meilleur rapport coût/qualité pour la tâche (MoE 235B/22B actifs,
// bon en français + JSON, ~0,09/0,10 $/M). Surchargé par OPENROUTER_MODEL.
const DEFAULT_MODEL = "qwen/qwen3-235b-a22b-2507";

/** true si une clé OpenRouter réelle est configurée (placeholders exclus). */
export function isLlmConfigured(): boolean {
  const k = process.env.OPENROUTER_API_KEY;
  return !!k && !k.includes("your") && !k.includes("...") && k.length > 12;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function openRouterChat(params: {
  messages: ChatMessage[];
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY manquant.");
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // En-têtes d'attribution recommandés par OpenRouter (facultatifs).
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://dossimo.fr",
      "X-Title": "Dossimo",
    },
    body: JSON.stringify({
      model,
      messages: params.messages,
      temperature: params.temperature ?? 0.3,
      max_tokens: params.maxTokens ?? 1200,
      // Mode JSON : honoré par les modèles compatibles, ignoré sinon (on
      // valide de toute façon la sortie côté serveur).
      ...(params.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: params.signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Réponse OpenRouter vide.");
  }
  return content;
}
