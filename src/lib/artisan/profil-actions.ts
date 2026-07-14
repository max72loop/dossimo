"use server";

import { revalidatePath } from "next/cache";
import { createClient as createStatelessClient } from "@supabase/supabase-js";
import { z } from "zod";

import { consumeAuthRateLimit } from "@/lib/auth/rate-limit";
import { mapAuthError, passwordSchema } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/server";
import { normaliserSiret, siretValide } from "@/lib/artisan/siret";
import type { Database } from "@/lib/database.types";

export type ProfilResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/* ------------------------------------------------------------------ Schémas */

/** Champ texte facultatif : "" et espaces seuls valent « non renseigné ». */
function texteOptionnel(max: number) {
  return z.preprocess(
    (v) => (typeof v === "string" ? v.trim() || null : (v ?? null)),
    z.string().max(max).nullable(),
  );
}

const siretChamp = z.preprocess(
  (v) => (typeof v === "string" ? normaliserSiret(v) || null : (v ?? null)),
  z
    .string()
    .nullable()
    .refine((v) => v === null || siretValide(v), "SIRET invalide : 14 chiffres, clé de contrôle incorrecte."),
);

const entrepriseSchema = z.object({
  entreprise: z.string().trim().min(1, "Raison sociale requise.").max(160),
  siret: siretChamp,
  qualification_rge: texteOptionnel(120),
});

const contactSchema = z.object({
  prenom: z.string().trim().min(1, "Prénom requis.").max(100),
  nom: z.string().trim().min(1, "Nom requis.").max(100),
  telephone: texteOptionnel(40),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis."),
  password: passwordSchema,
});

const emailChangeSchema = z.object({
  email: z.email("Email invalide."),
  currentPassword: z.string().min(1, "Mot de passe requis."),
});

/* -------------------------------------------------------------- Utilitaires */

function invalide(error: z.ZodError): ProfilResult {
  return {
    ok: false,
    error: "Champs invalides.",
    fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
  };
}

/**
 * Écrit un correctif sur la fiche de l'artisan connecté.
 *
 * Client auth-scopé : la policy RLS restreint la ligne à la sienne, et le grant
 * de colonnes (migration 0031) restreint les colonnes modifiables. Aucun
 * `artisan_id` ni `user_id` n'est accepté depuis le client.
 */
async function enregistrerFiche(
  patch: Database["public"]["Tables"]["artisans"]["Update"],
): Promise<ProfilResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const { error } = await supabase.from("artisans").update(patch).eq("user_id", user.id);
  if (error) {
    console.error("[artisan] profil:", error.message);
    return { ok: false, error: "Enregistrement impossible." };
  }

  revalidatePath("/dossiers/profil");
  return { ok: true, message: "Modifications enregistrées." };
}

/**
 * Revérifie le mot de passe courant sur un client sans état.
 *
 * Supabase autorise `updateUser({ password })` sur la seule foi de la session :
 * un poste laissé ouvert suffirait à prendre le compte. On réauthentifie donc
 * explicitement. Le client est volontairement isolé (`persistSession: false`)
 * pour que cette vérification n'écrive jamais sur les cookies de la session en
 * cours.
 */
async function motDePasseCourantValide(email: string, password: string): Promise<boolean> {
  const isole = createStatelessClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await isole.auth.signInWithPassword({ email, password });
  return !error;
}

/* -------------------------------------------------------------------- Fiche */

export async function updateEntreprise(input: unknown): Promise<ProfilResult> {
  const parsed = entrepriseSchema.safeParse(input);
  if (!parsed.success) return invalide(parsed.error);
  return enregistrerFiche(parsed.data);
}

export async function updateContact(input: unknown): Promise<ProfilResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return invalide(parsed.error);
  return enregistrerFiche(parsed.data);
}

/* ----------------------------------------------------------------- Sécurité */

export async function changePassword(input: unknown): Promise<ProfilResult> {
  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) return invalide(parsed.error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Vous devez être connecté." };

  if (!(await consumeAuthRateLimit("password-change", user.id, 5))) {
    return { ok: false, error: "Trop de tentatives. Réessayez dans 15 minutes." };
  }

  if (!(await motDePasseCourantValide(user.email, parsed.data.currentPassword))) {
    return {
      ok: false,
      error: "Mot de passe actuel incorrect.",
      fieldErrors: { currentPassword: ["Mot de passe actuel incorrect."] },
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: mapAuthError(error.message) };

  // Un changement de mot de passe invalide les autres sessions : si le compte
  // était compromis, l'intrus perd l'accès ici.
  await supabase.auth.signOut({ scope: "others" });

  return {
    ok: true,
    message: "Mot de passe modifié. Les autres appareils ont été déconnectés.",
  };
}

export async function changeEmail(input: unknown): Promise<ProfilResult> {
  const parsed = emailChangeSchema.safeParse(input);
  if (!parsed.success) return invalide(parsed.error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Vous devez être connecté." };

  const nouvelEmail = parsed.data.email.trim().toLowerCase();
  if (nouvelEmail === user.email.toLowerCase()) {
    return { ok: false, error: "C'est déjà votre adresse actuelle." };
  }

  if (!(await consumeAuthRateLimit("email-change", user.id, 3, 60 * 60))) {
    return { ok: false, error: "Trop de demandes. Réessayez plus tard." };
  }

  if (!(await motDePasseCourantValide(user.email, parsed.data.currentPassword))) {
    return {
      ok: false,
      error: "Mot de passe incorrect.",
      fieldErrors: { currentPassword: ["Mot de passe incorrect."] },
    };
  }

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const { error } = await supabase.auth.updateUser(
    { email: nouvelEmail },
    { emailRedirectTo: `${baseUrl}/auth/confirm?next=/dossiers/profil` },
  );
  if (error) {
    console.error("[artisan] changement email:", error.status, error.message);
    // Réponse volontairement neutre : ne révèle pas si l'adresse cible existe.
    return {
      ok: true,
      message: `Si cette adresse est utilisable, un lien de confirmation vient d'être envoyé à ${nouvelEmail}.`,
    };
  }

  // L'email de la fiche artisan ne bougera qu'à la confirmation du lien
  // (trigger sync_artisan_email, migration 0031).
  return {
    ok: true,
    message: `Un lien de confirmation a été envoyé à ${nouvelEmail}. L'adresse changera une fois ce lien ouvert.`,
  };
}

/** Déconnecte tous les autres appareils, en gardant la session courante. */
export async function signOutOtherDevices(): Promise<ProfilResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) return { ok: false, error: "Déconnexion impossible. Réessayez." };

  return { ok: true, message: "Les autres appareils ont été déconnectés." };
}
