"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const adresseSchema = z.object({
  adresse: z.string().trim().min(1, "Adresse requise."),
  code_postal: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Code postal : 5 chiffres."),
  ville: z.string().trim().min(1, "Ville requise."),
});

export type AdresseFacturationInput = z.infer<typeof adresseSchema>;

export type AdresseResult = { ok: true } | { ok: false; error: string };

/**
 * Enregistre l'adresse de facturation sur la fiche de l'artisan connecté.
 * Saisie une fois, réutilisée par toutes les factures suivantes.
 *
 * Écriture via le client auth-scopé : la RLS (`artisan modifie sa fiche`)
 * garantit qu'un artisan ne peut toucher que la sienne. Aucun `artisan_id`
 * n'est accepté depuis le client.
 */
export async function updateAdresseFacturation(
  input: unknown,
): Promise<AdresseResult> {
  const parsed = adresseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Saisie invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const { error } = await supabase
    .from("artisans")
    .update(parsed.data)
    .eq("user_id", user.id);

  if (error) {
    console.error("[artisan] adresse facturation:", error.message);
    return { ok: false, error: "Enregistrement impossible." };
  }
  return { ok: true };
}
