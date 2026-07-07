import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Artisan } from "@/lib/database.types";

/**
 * Utilisateur Supabase Auth courant (ou null). `getUser()` revalide le jeton
 * côté serveur d'authentification — c'est la source de vérité, pas la session.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Fiche artisan liée à l'utilisateur connecté (via `user_id`). Lue avec le
 * client auth-scopé : la RLS ne renvoie que sa propre fiche. null si non
 * connecté ou fiche absente.
 */
export async function getCurrentArtisan(): Promise<Artisan | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("artisans")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data ?? null;
}
