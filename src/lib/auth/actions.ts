"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { consumeAuthRateLimit, messageRateLimit } from "@/lib/auth/rate-limit";
import { mapAuthError, passwordSchema } from "@/lib/auth/password";
import { destinationApresAuth } from "@/lib/auth/redirect";

export type AuthResult =
  | { ok: true; confirmationRequired?: boolean; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/* ------------------------------------------------------------------ Schémas */

const signInSchema = z.object({
  email: z.email("Email invalide."),
  password: z.string().min(1, "Mot de passe requis.").max(128),
});

const signUpSchema = z.object({
  email: z.email("Email invalide."),
  password: passwordSchema,
  entreprise: z.string().trim().min(1, "Raison sociale requise.").max(160),
  nom: z.string().trim().min(1, "Nom requis.").max(100),
  prenom: z.string().trim().min(1, "Prénom requis.").max(100),
  telephone: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().max(40).optional().or(z.literal("")),
  ),
  // Destination post-confirmation (reprise du brouillon d'essai, etc.).
  // Assainie ensuite par `destinationApresAuth` — jamais utilisée telle quelle.
  next: z.string().max(512).optional(),
});

/* ------------------------------------------------------------------ Actions */

export async function signIn(input: unknown): Promise<AuthResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Champs invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const quota = await consumeAuthRateLimit("signin", parsed.data.email, 8);
  if (quota !== "ok") {
    return { ok: false, error: messageRateLimit(quota, "Trop de tentatives. Réessayez dans 15 minutes.") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: mapAuthError(error.message) };

  return { ok: true };
}

export async function signUp(input: unknown): Promise<AuthResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Champs invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { email, password, entreprise, nom, prenom, telephone, next } = parsed.data;
  const quota = await consumeAuthRateLimit("signup", email, 4, 60 * 60);
  if (quota !== "ok") {
    return {
      ok: false,
      error: messageRateLimit(quota, "Trop de créations depuis cette connexion. Réessayez plus tard."),
    };
  }

  const supabase = await createClient();
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  // `next` encodé : il peut porter sa propre query (`/dossiers/nouveau?reprise=essai`)
  // et casserait le parsing du lien de confirmation s'il n'était pas échappé.
  const destination = encodeURIComponent(destinationApresAuth(next));
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${baseUrl}/auth/confirm?next=${destination}`,
      data: { entreprise, nom, prenom, telephone: telephone || null },
    },
  });
  if (error) {
    console.error("[auth] signUp:", error.status, error.message);
    // Réponse volontairement générique : ne révèle pas si l'adresse existe.
    return { ok: true, confirmationRequired: true, message: "Si cette adresse peut être utilisée, un email de confirmation vient d’être envoyé." };
  }
  return {
    ok: true,
    confirmationRequired: !data.session,
    message: data.session
      ? undefined
      : "Consultez votre messagerie et confirmez votre adresse pour ouvrir votre espace.",
  };
}

export async function requestPasswordReset(input: unknown): Promise<AuthResult> {
  const parsed = z.object({ email: z.email("Email invalide.") }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Email invalide." };
  const quota = await consumeAuthRateLimit("password-reset", parsed.data.email, 3, 60 * 60);
  if (quota !== "ok") {
    return { ok: false, error: messageRateLimit(quota, "Trop de demandes. Réessayez plus tard.") };
  }
  const supabase = await createClient();
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${baseUrl}/auth/confirm?next=/nouveau-mot-de-passe`,
  });
  if (error) console.error("[auth] password reset:", error.status, error.message);
  return { ok: true, message: "Si un compte correspond à cette adresse, un email vient d’être envoyé." };
}

export async function updatePassword(input: unknown): Promise<AuthResult> {
  const parsed = z.object({ password: passwordSchema }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Mot de passe insuffisamment robuste.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Ce lien n’est plus valide. Demandez-en un nouveau." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: mapAuthError(error.message) };
  await supabase.auth.signOut({ scope: "others" });
  return { ok: true, message: "Votre mot de passe a été modifié." };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const { redirect } = await import("next/navigation");
  redirect("/");
}
