import "server-only";

import { z } from "zod";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Dispositif } from "@/lib/database.types";

/**
 * Résolution du moteur de règles éditable (`regles_metier`, CLAUDE.md §7/§9.4).
 *
 * La table porte, par couple (dispositif, type_travaux), les PARAMÈTRES métier :
 * seuils techniques, taux, pièces requises, version de fiche. Le code reste le
 * moteur ; il lit ces paramètres et retombe sur ses valeurs en dur si aucune
 * règle active n'existe (résolution best-effort, jamais bloquante).
 */

/**
 * Barème de prime (indicatif, éditable). Deux modes :
 *  - `par_m2` : montant €/m² par catégorie de revenus (isolation).
 *  - `forfait` : montant fixe € par catégorie (chauffage, ex. PAC).
 */
const montantsParProfil = z
  .object({ classique: z.number(), precaire: z.number(), grande_precarite: z.number() })
  .partial();

const primeSchema = z
  .object({
    par_m2: montantsParProfil.optional(),
    forfait: montantsParProfil.optional(),
    plafond: z.number().nullable().optional(),
  })
  .optional();

const conditionSchema = z
  .object({
    r_min: z.number().optional(),
    etas_min: z.number().optional(),
    cop_min: z.number().optional(),
    rendement_min: z.number().optional(),
    tva_taux: z.number().optional(),
    anciennete_min_ans: z.number().optional(),
    prime: primeSchema,
  })
  .passthrough();

const pieceSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  obligatoire: z.boolean(),
});

const mentionsSchema = z.array(z.string());

export type RegleCondition = z.infer<typeof conditionSchema>;
export type ReglePiece = z.infer<typeof pieceSchema>;

export interface RegleMetierResolue {
  version: number;
  versionFormulaire: string | null;
  condition: RegleCondition;
  pieces: ReglePiece[];
  /** Mentions obligatoires (templates) à porter sur devis + facture. */
  mentions: string[];
}

export type DbClient = SupabaseClient<Database>;

/**
 * Règle active pour un couple (dispositif, type_travaux) : version `actif` la
 * plus élevée. Renvoie null si aucune règle ou si le contenu est illisible —
 * l'appelant reprend alors ses valeurs par défaut codées.
 */
export async function fetchRegleActive(
  supabase: DbClient,
  dispositif: Dispositif,
  typeTravaux: string,
): Promise<RegleMetierResolue | null> {
  const { data, error } = await supabase
    .from("regles_metier")
    .select(
      "condition_json, pieces_requises_json, points_vigilance_json, version_formulaire, version",
    )
    .eq("dispositif", dispositif)
    .eq("type_travaux", typeTravaux)
    .eq("actif", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const condition = conditionSchema.safeParse(data.condition_json);
  const pieces = z.array(pieceSchema).safeParse(data.pieces_requises_json);
  const mentions = mentionsSchema.safeParse(data.points_vigilance_json);

  return {
    version: data.version,
    versionFormulaire: data.version_formulaire,
    condition: condition.success ? condition.data : {},
    pieces: pieces.success ? pieces.data : [],
    mentions: mentions.success ? mentions.data : [],
  };
}

/**
 * Seuils R minimaux des postes d'isolation CEE, lus depuis `regles_metier`.
 *
 * Pourquoi cette fonction existe : ces seuils étaient AUSSI écrits en dur dans
 * `TYPES_ISOLATION` (src/lib/dossier/cee-isolation.ts) pour alimenter l'aide à la
 * saisie, alors que la table les porte déjà et que `/admin/regles` permet de les
 * éditer. Deux sources de vérité pour un seuil réglementaire : le jour où un
 * arrêté change le R minimal et où l'admin corrige la base, le formulaire
 * continuait d'afficher l'ancien seuil pendant que le moteur refusait sur le
 * nouveau. Dossimo fabriquait le motif de refus qu'il prétend éviter (CLAUDE.md
 * §8), et l'artisan ne comprenait pas pourquoi.
 *
 * Une seule requête pour les quatre postes : l'écran de saisie n'a pas à faire
 * quatre allers-retours. Un poste absent ou illisible n'apparaît pas dans le
 * résultat, et l'appelant TAIT alors l'indication au lieu d'en inventer une.
 */
export async function fetchSeuilsIsolation(
  supabase: DbClient,
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("regles_metier")
    .select("type_travaux, condition_json, version")
    .eq("dispositif", "cee")
    .eq("actif", true)
    .order("version", { ascending: false });

  if (error || !data) return {};

  const seuils: Record<string, number> = {};
  for (const ligne of data) {
    // `order` décroissant + premier gagnant : on garde la version active la plus
    // élevée par poste, comme `fetchRegleActive`.
    if (ligne.type_travaux in seuils) continue;
    const condition = conditionSchema.safeParse(ligne.condition_json);
    if (condition.success && typeof condition.data.r_min === "number") {
      seuils[ligne.type_travaux] = condition.data.r_min;
    }
  }
  return seuils;
}
