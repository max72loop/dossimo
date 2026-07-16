import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Verdict d'une consommation de quota.
 *
 * `unavailable` couvre les pannes du limiteur (secret absent, RPC en erreur).
 * On refuse quand même l'opération, mais le motif reste distinct de `quota` :
 * annoncer « trop de tentatives » sur une panne ment à l'artisan et masque
 * l'incident côté exploitation.
 */
export type RateLimitVerdict = "ok" | "quota" | "unavailable";

const MESSAGE_INDISPONIBLE =
  "Service momentanément indisponible. Réessayez dans quelques instants.";

/** Message à afficher pour un verdict non passant, `quotaMessage` portant le cas nominal. */
export function messageRateLimit(verdict: Exclude<RateLimitVerdict, "ok">, quotaMessage: string): string {
  return verdict === "quota" ? quotaMessage : MESSAGE_INDISPONIBLE;
}

export async function consumeAuthRateLimit(
  action: "signin" | "signup" | "password-reset" | "password-change" | "email-change",
  identity: string,
  limit: number,
  windowSeconds = 15 * 60,
): Promise<RateLimitVerdict> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const secret = process.env.AUTH_RATE_LIMIT_SECRET || process.env.DEPOT_LINK_SECRET;
  if (!secret) {
    console.error("[auth] AUTH_RATE_LIMIT_SECRET manquant");
    return "unavailable";
  }
  const keyHash = createHash("sha256")
    .update(`${secret}:${ip}:${identity.trim().toLowerCase()}`)
    .digest("hex");
  const { data, error } = await createAdminClient().rpc("consume_auth_rate_limit", {
    p_action: action,
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[auth] rate limit:", error.message);
    return "unavailable";
  }
  return data === true ? "ok" : "quota";
}
