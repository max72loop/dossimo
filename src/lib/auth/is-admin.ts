import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Contrôle d'accès admin, par liste d'UUID Auth immuables (`ADMIN_USER_IDS`).
 * Sert à protéger l'édition de `regles_metier` : lecture de l'identité
 * via le client auth-scopé, écriture ensuite en service-role côté action.
 *
 * @returns l'e-mail admin connecté, ou null si l'utilisateur n'est pas admin.
 */
export async function getAdminEmail(): Promise<string | null> {
  const allow = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allow.length === 0) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !allow.includes(user.id)) return null;
  return user.email?.toLowerCase() ?? user.id;
}
