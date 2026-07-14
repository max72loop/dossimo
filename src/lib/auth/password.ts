import { z } from "zod";

/**
 * Règle unique de robustesse du mot de passe. Partagée par l'inscription, la
 * réinitialisation par email et le changement depuis l'espace : trois portes
 * d'entrée vers le même compte, donc une seule exigence.
 */
export const passwordSchema = z
  .string()
  .min(12, "12 caractères minimum.")
  .max(128, "128 caractères maximum.")
  .regex(/[a-z]/, "Ajoutez une lettre minuscule.")
  .regex(/[A-Z]/, "Ajoutez une lettre majuscule.")
  .regex(/[0-9]/, "Ajoutez un chiffre.");

/** Traduit les erreurs Supabase Auth en messages affichables. */
export function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Un compte existe déjà avec cet email.";
  if (m.includes("email not confirmed")) return "Votre email n'est pas encore confirmé.";
  if (m.includes("should be different")) return "Ce mot de passe est identique à l'ancien.";
  if (m.includes("password"))
    return "Mot de passe invalide (12 caractères minimum, avec majuscule, minuscule et chiffre).";
  return "Une erreur est survenue. Réessayez.";
}
