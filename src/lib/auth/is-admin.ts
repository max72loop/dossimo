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
    error,
  } = await supabase.auth.getUser();
  // Une panne d'authentification refuse l'accès, comme un utilisateur inconnu :
  // c'est déjà ce que produisait `user === null`, mais en silence. Cette console
  // écrit dans `regles_metier` en service-role — le seul défaut acceptable ici
  // est de fermer la porte, jamais de l'ouvrir, et jamais sans le dire.
  if (error) {
    console.error("[admin] identité illisible, accès refusé:", error.message);
    return null;
  }
  if (!user || !allow.includes(user.id)) return null;
  return user.email?.toLowerCase() ?? user.id;
}
