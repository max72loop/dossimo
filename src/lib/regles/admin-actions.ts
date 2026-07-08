"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminEmail } from "@/lib/auth/is-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Dispositif } from "@/lib/database.types";

export type RegleActionResult = { ok: true } | { ok: false; error: string };

const pieceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string(),
  obligatoire: z.boolean(),
});

const conditionSchema = z
  .object({
    r_min: z.number().optional(),
    tva_taux: z.number().optional(),
    anciennete_min_ans: z.number().optional(),
  })
  .passthrough();

/** Valide et parse un JSON de pièces envoyé par le formulaire (texte). */
function parsePieces(raw: string): { ok: true; value: unknown[] } | { ok: false; error: string } {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Pièces : JSON invalide." };
  }
  const parsed = z.array(pieceSchema).safeParse(json);
  if (!parsed.success) {
    return { ok: false, error: "Pièces : chaque entrée doit avoir id, label, description, obligatoire." };
  }
  return { ok: true, value: parsed.data };
}

export interface RegleUpdateInput {
  id: string;
  r_min?: number | null;
  tva_taux?: number | null;
  anciennete_min_ans?: number | null;
  version_formulaire: string;
  actif: boolean;
  pieces_json: string;
}

/** Met à jour une règle métier (admin uniquement). */
export async function updateRegle(input: RegleUpdateInput): Promise<RegleActionResult> {
  if (!(await getAdminEmail())) return { ok: false, error: "Accès refusé." };

  const pieces = parsePieces(input.pieces_json);
  if (!pieces.ok) return pieces;

  const condition = conditionSchema.parse({
    ...(input.r_min != null ? { r_min: input.r_min } : {}),
    ...(input.tva_taux != null ? { tva_taux: input.tva_taux } : {}),
    ...(input.anciennete_min_ans != null ? { anciennete_min_ans: input.anciennete_min_ans } : {}),
  });

  const admin = createAdminClient();
  const { error } = await admin
    .from("regles_metier")
    .update({
      condition_json: condition as never,
      pieces_requises_json: pieces.value as never,
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

export interface RegleCreateInput {
  dispositif: Dispositif;
  type_travaux: string;
  version: number;
  r_min?: number | null;
  tva_taux?: number | null;
  anciennete_min_ans?: number | null;
  version_formulaire: string;
  pieces_json: string;
}

/** Crée une nouvelle règle (nouveau couple ou nouvelle version). Admin uniquement. */
export async function createRegle(input: RegleCreateInput): Promise<RegleActionResult> {
  if (!(await getAdminEmail())) return { ok: false, error: "Accès refusé." };
  if (!input.type_travaux.trim()) return { ok: false, error: "Type de travaux requis." };

  const pieces = parsePieces(input.pieces_json);
  if (!pieces.ok) return pieces;

  const condition = conditionSchema.parse({
    ...(input.r_min != null ? { r_min: input.r_min } : {}),
    ...(input.tva_taux != null ? { tva_taux: input.tva_taux } : {}),
    ...(input.anciennete_min_ans != null ? { anciennete_min_ans: input.anciennete_min_ans } : {}),
  });

  const admin = createAdminClient();
  const { error } = await admin.from("regles_metier").insert({
    dispositif: input.dispositif,
    type_travaux: input.type_travaux.trim(),
    version: input.version,
    condition_json: condition as never,
    pieces_requises_json: pieces.value as never,
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
