import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";

export async function consumeAuthRateLimit(
  action: "signin" | "signup" | "password-reset",
  identity: string,
  limit: number,
  windowSeconds = 15 * 60,
): Promise<boolean> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const secret = process.env.AUTH_RATE_LIMIT_SECRET || process.env.DEPOT_LINK_SECRET;
  if (!secret) {
    console.error("[auth] AUTH_RATE_LIMIT_SECRET manquant");
    return false;
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
    return false;
  }
  return data === true;
}
