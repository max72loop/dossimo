"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/* ------------------------------------------------------------------ Schémas */

const signInSchema = z.object({
  email: z.email("Email invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});

const signUpSchema = z.object({
  email: z.email("Email invalide."),
  password: z.string().min(8, "8 caractères minimum."),
  entreprise: z.string().trim().min(1, "Raison sociale requise."),
  nom: z.string().trim().min(1, "Nom requis."),
  prenom: z.string().trim().min(1, "Prénom requis."),
  telephone: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().max(40).optional().or(z.literal("")),
  ),
});

/* ------------------------------------------------------------- Traductions */

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Un compte existe déjà avec cet email.";
  if (m.includes("email not confirmed")) return "Votre email n'est pas encore confirmé.";
  if (m.includes("password")) return "Mot de passe invalide (8 caractères minimum).";
  return "Une erreur est survenue. Réessayez.";
}

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

  const { email, password, entreprise, nom, prenom, telephone } = parsed.data;

  // Création du compte côté serveur de confiance (service-role), déjà confirmé.
  // Aucun e-mail n'est envoyé → pas de dépendance à la délivrabilité ni au
  // rate-limit e-mail de Supabase. À faire évoluer vers une confirmation par
  // e-mail (Resend/SMTP) quand l'emailing sera branché.
  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { entreprise, nom, prenom },
  });
  if (error) {
    console.error("[auth] createUser:", error.status, error.message);
    return { ok: false, error: mapAuthError(error.message) };
  }

  const userId = created.user?.id;
  if (!userId) return { ok: false, error: "Création du compte impossible. Réessayez." };

  // Fiche artisan liée au compte.
  const { error: profileErr } = await admin.from("artisans").insert({
    user_id: userId,
    entreprise,
    nom,
    prenom,
    email,
    telephone: telephone || null,
  });
  if (profileErr) {
    console.error("[auth] création fiche artisan:", profileErr.message);
    // Compte orphelin sans profil : on le retire pour permettre une nouvelle tentative.
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: "Création du profil impossible. Réessayez." };
  }

  // Ouvre la session dans le navigateur (pose les cookies auth).
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInErr) {
    return { ok: false, error: "Compte créé. Connectez-vous pour continuer." };
  }

  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
