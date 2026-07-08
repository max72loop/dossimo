import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Contrôle d'accès admin, par liste d'e-mails (env `ADMIN_EMAILS`, séparés par
 * virgule). Sert à protéger l'édition de `regles_metier` : lecture de l'identité
 * via le client auth-scopé, écriture ensuite en service-role côté action.
 *
 * @returns l'e-mail admin connecté, ou null si l'utilisateur n'est pas admin.
 */
export async function getAdminEmail(): Promise<string | null> {
  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allow.length === 0) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  return email && allow.includes(email) ? email : null;
}
