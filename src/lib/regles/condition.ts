import { z } from "zod";

/**
 * Logique pure (validation + merge) de la condition d'une règle métier.
 * Séparée des Server Actions pour être testable et réutilisable ; aucun accès
 * base ni auth ici.
 */

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

const pieceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string(),
  obligatoire: z.boolean(),
});

export const conditionSchema = z
  .object({
    r_min: z.number().optional(),
    etas_min: z.number().optional(),
    cop_min: z.number().optional(),
    rendement_min: z.number().optional(),
    tva_taux: z.number().optional(),
    anciennete_min_ans: z.number().optional(),
  })
  .passthrough();

/** Seuils édités par le formulaire : valeur, `null` pour retirer, `undefined` = inchangé. */
export type SeuilsInput = {
  r_min?: number | null;
  etas_min?: number | null;
  cop_min?: number | null;
  rendement_min?: number | null;
  tva_taux?: number | null;
  anciennete_min_ans?: number | null;
};

const SEUIL_KEYS = [
  "r_min",
  "etas_min",
  "cop_min",
  "rendement_min",
  "tva_taux",
  "anciennete_min_ans",
] as const;

const profilMontants = z
  .object({ classique: z.number(), precaire: z.number(), grande_precarite: z.number() })
  .partial();
const primeSchema = z.object({
  // Isolation : montant au m² (× surface). Chauffage : forfait fixe par profil.
  par_m2: profilMontants.optional(),
  forfait: profilMontants.optional(),
  plafond: z.number().nullable().optional(),
});

/** Valide et parse un JSON de pièces envoyé par le formulaire (texte). */
export function parsePieces(raw: string): ParseResult<unknown[]> {
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

/** Parse le barème de prime (objet JSON) ; vide → pas de barème (undefined). */
export function parsePrime(raw: string): ParseResult<unknown | undefined> {
  const trimmed = (raw ?? "").trim();
  if (!trimmed || trimmed === "{}" || trimmed === "null") return { ok: true, value: undefined };
  let json: unknown;
  try {
    json = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "Barème prime : JSON invalide." };
  }
  const parsed = primeSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        "Barème prime : format attendu { par_m2: { classique, precaire, grande_precarite }, plafond } ou { forfait: { classique, precaire, grande_precarite } }.",
    };
  }
  return { ok: true, value: parsed.data };
}

/** Valide et parse un JSON de mentions (tableau de chaînes). */
export function parseMentions(raw: string): ParseResult<string[]> {
  let json: unknown;
  try {
    json = JSON.parse(raw || "[]");
  } catch {
    return { ok: false, error: "Mentions : JSON invalide." };
  }
  const parsed = z.array(z.string()).safeParse(json);
  if (!parsed.success) {
    return { ok: false, error: "Mentions : tableau de textes attendu (ex. [\"Fiche CEE : {fiche}\"])." };
  }
  return { ok: true, value: parsed.data };
}

/**
 * Fusionne les seuils et le barème saisis dans la condition existante.
 * `null` retire la clé, `undefined` la laisse inchangée : les paramètres d'un
 * autre geste (ou d'un futur geste) ne sont jamais écrasés par une édition, et
 * un barème forfait n'est pas perdu à l'enregistrement.
 */
export function fusionnerCondition(
  base: Record<string, unknown>,
  seuils: SeuilsInput,
  prime: unknown | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const k of SEUIL_KEYS) {
    const v = seuils[k];
    if (v === undefined) continue;
    if (v === null) delete out[k];
    else out[k] = v;
  }
  if (prime === undefined) delete out.prime;
  else out.prime = prime;
  return conditionSchema.parse(out);
}
