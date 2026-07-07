import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

/**
 * Service-role Supabase client — bypasses Row Level Security.
 *
 * SERVER ONLY. Never import this from a Client Component. Use it in trusted
 * server code (Route Handlers, Server Actions, webhooks) where the request has
 * already been authorized: lead capture from the landing form, Stripe webhooks,
 * document generation, etc.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
