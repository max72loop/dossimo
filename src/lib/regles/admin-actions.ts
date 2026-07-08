"use server";

import { revalidatePath } from "next/cache";

import { getAdminEmail } from "@/lib/auth/is-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Dispositif } from "@/lib/database.types";
import {
  fusionnerCondition,
  parseMentions,
  parsePieces,
  parsePrime,
  type SeuilsInput,
} from "@/lib/regles/condition";

export type RegleActionResult = { ok: true } | { ok: false; error: string };

export interface RegleUpdateInput extends SeuilsInput {
  id: string;
  version_formulaire: string;
  actif: boolean;
  pieces_json: string;
  mentions_json: string;
  prime_json: string;
}

/** Met à jour une règle métier (admin uniquement). */
export async function updateRegle(input: RegleUpdateInput): Promise<RegleActionResult> {
  if (!(await getAdminEmail())) return { ok: false, error: "Accès refusé." };

  const pieces = parsePieces(input.pieces_json);
  if (!pieces.ok) return pieces;
  const mentions = parseMentions(input.mentions_json);
  if (!mentions.ok) return mentions;
  const prime = parsePrime(input.prime_json);
  if (!prime.ok) return prime;

  const admin = createAdminClient();

  // Merge sur la condition existante : on ne repart pas d'un objet vide, pour
  // préserver toute clé non exposée par le formulaire de ce geste.
  const { data: existing, error: readErr } = await admin
    .from("regles_metier")
    .select("condition_json")
    .eq("id", input.id)
    .maybeSingle();
  if (readErr || !existing) {
    return { ok: false, error: "Règle introuvable." };
  }
  const base = (existing.condition_json ?? {}) as Record<string, unknown>;
  const condition = fusionnerCondition(base, input, prime.value);

  const { error } = await admin
    .from("regles_metier")
    .update({
      condition_json: condition as never,
      pieces_requises_json: pieces.value as never,
      points_vigilance_json: mentions.value as never,
      version_formulaire: input.version_formulaire || null,
      actif: input.actif,
    })
    .eq("id", input.id);

  if (error) {
    console.error("[regles] update:", error.message);
    return { ok: false, error: "Échec de l'enregistrement." };
  }
  revalidatePath("/admin/regles");
  return { ok: true };
}

export interface RegleCreateInput extends SeuilsInput {
  dispositif: Dispositif;
  type_travaux: string;
  version: number;
  version_formulaire: string;
  pieces_json: string;
  mentions_json: string;
  prime_json: string;
}

/** Crée une nouvelle règle (nouveau couple ou nouvelle version). Admin uniquement. */
export async function createRegle(input: RegleCreateInput): Promise<RegleActionResult> {
  if (!(await getAdminEmail())) return { ok: false, error: "Accès refusé." };
  if (!input.type_travaux.trim()) return { ok: false, error: "Type de travaux requis." };

  const pieces = parsePieces(input.pieces_json);
  if (!pieces.ok) return pieces;
  const mentions = parseMentions(input.mentions_json);
  if (!mentions.ok) return mentions;
  const prime = parsePrime(input.prime_json);
  if (!prime.ok) return prime;

  // Création : condition vide + seuils saisis (les null sont ignorés).
  const condition = fusionnerCondition({}, input, prime.value);

  const admin = createAdminClient();
  const { error } = await admin.from("regles_metier").insert({
    dispositif: input.dispositif,
    type_travaux: input.type_travaux.trim(),
    version: input.version,
    condition_json: condition as never,
    pieces_requises_json: pieces.value as never,
    points_vigilance_json: mentions.value as never,
    version_formulaire: input.version_formulaire || null,
    actif: true,
  });

  if (error) {
    console.error("[regles] create:", error.message);
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "Une règle existe déjà pour ce couple et cette version."
          : "Échec de la création.",
    };
  }
  revalidatePath("/admin/regles");
  return { ok: true };
}
