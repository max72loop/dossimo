import "server-only";

import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { isLlmConfigured, openRouterChat } from "@/lib/llm/openrouter";
import type { StatutDossier } from "@/lib/database.types";

/**
 * Interrogation de la base en langage naturel, pour l'admin (`/admin/donnees`).
 *
 * Principe de sûreté : le LLM ne génère JAMAIS de SQL. Il traduit la question en
 * un *plan de requête* structuré (table + colonnes + filtres + agrégat), limité
 * à une liste blanche. Ce plan est validé par zod puis exécuté de façon
 * déterministe via supabase-js — donc en lecture seule (seul `.select` est
 * utilisé) et avec des valeurs paramétrées (aucune injection possible). Une
 * table ou une colonne hors liste blanche est rejetée avant tout accès.
 *
 * Second principe, tout aussi important : AUCUNE donnée personnelle ne sort vers
 * le LLM. Le modèle voit la question et un aperçu du résultat MASQUÉ (cf.
 * `masquerPii`) ; l'admin, lui, voit les données réelles à l'écran, rendues
 * directement depuis Supabase. Le LLM n'a besoin que de la FORME du résultat
 * pour rédiger sa phrase, jamais du contenu nominatif.
 */

// ---------------------------------------------------------------------------
// Catalogue exposé (liste blanche). Rien d'autre n'est atteignable.
//
// `pii` : colonnes identifiant une personne. Elles restent interrogeables et
// affichables, mais leurs VALEURS sont masquées avant tout envoi au LLM.
// Ajouter une colonne nominative ici est obligatoire, pas optionnel.
// ---------------------------------------------------------------------------
const CATALOGUE = {
  dossiers: {
    description: "Un dossier de rénovation (CEE ou MaPrimeRénov') monté par un artisan.",
    colonnes: [
      "id",
      "artisan_id",
      "statut", // nouveau | en_traitement | pret_depot | depose | livre
      "dispositif", // maprimerenov | cee
      "type_travaux",
      "commune",
      "code_postal",
      "statut_rge",
      "client_identifie",
      "montant_estime",
      "formule",
      "created_at",
      "delivered_at",
    ],
    pii: [],
  },
  artisans: {
    description: "Un artisan RGE inscrit.",
    colonnes: [
      "id",
      "entreprise",
      "nom",
      "prenom",
      "email",
      "telephone",
      "ville",
      "siret",
      "qualification_rge",
      "statut_abonnement", // aucun | actif | expire
      "created_at",
    ],
    pii: ["nom", "prenom", "email", "telephone", "siret", "entreprise"],
  },
  pieces_justificatives: {
    description: "Un fichier (devis, facture...) rattaché à un dossier.",
    colonnes: ["id", "dossier_id", "type", "extraction_statut", "taille", "created_at"],
    pii: [],
  },
  paiements: {
    description: "Un paiement Stripe lié à un dossier ou un artisan.",
    colonnes: [
      "id",
      "dossier_id",
      "artisan_id",
      "montant",
      "statut", // en_attente | paye | echoue | rembourse
      "type", // abonnement | ponctuel
      "created_at",
    ],
    pii: [],
  },
  leads: {
    description: "Un contact capté par le formulaire de la landing.",
    colonnes: ["id", "email", "nom", "entreprise", "telephone", "source", "created_at"],
    pii: ["email", "nom", "telephone", "entreprise"],
  },
} as const;

type TableName = keyof typeof CATALOGUE;
const TABLES = Object.keys(CATALOGUE) as TableName[];

/**
 * Les valeurs de l'enum `statut_dossier`, dans l'ordre du parcours métier.
 *
 * Le prompt annonçait `nouveau|en_traitement|livre`, soit l'état du schéma AVANT
 * la migration 0007, qui a ajouté `pret_depot` et `depose`. Le LLM ignorait donc
 * 2 des 5 états : « combien de dossiers déposés ? » produisait un filtre sur un
 * statut inexistant, et l'admin recevait un chiffre faux, formulé avec assurance.
 *
 * Le `Record<StatutDossier, true>` est la garde, et c'est pour ça qu'il est écrit
 * ainsi plutôt qu'en simple tableau : TypeScript EXIGE une entrée par valeur de
 * l'enum. Ajouter un statut dans `database.types.ts` sans le reporter ici ne
 * compile pas. C'est ce qui empêche le catalogue de dériver une troisième fois.
 */
const ORDRE_STATUTS: Record<StatutDossier, true> = {
  nouveau: true,
  en_traitement: true,
  pret_depot: true,
  depose: true,
  livre: true,
};
const STATUTS_DOSSIER = Object.keys(ORDRE_STATUTS) as StatutDossier[];

const OPERATEURS = ["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "in", "is"] as const;
const METRIQUES = ["count", "sum", "avg", "min", "max"] as const;
const LIMITE_LIGNES = 200; // plafond de lignes brutes renvoyées à l'affichage
const LIMITE_AGREGAT = 10000; // plafond de lignes LUES pour un agrégat (comptage juste)

// ---------------------------------------------------------------------------
// Schéma du plan (validé après génération LLM). La cohérence table↔colonnes est
// contrôlée dans `validerPlan`, pas par zod (zod ne connaît pas la table ici).
// ---------------------------------------------------------------------------
const filtreSchema = z.object({
  column: z.string(),
  op: z.enum(OPERATEURS),
  value: z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.union([z.string(), z.number()]))]),
});

const planSchema = z.object({
  table: z.string(),
  select: z.array(z.string()).default([]),
  filters: z.array(filtreSchema).default([]),
  order: z.object({ column: z.string(), ascending: z.boolean().default(true) }).nullish(),
  limit: z.number().int().positive().max(LIMITE_LIGNES).nullish(),
  aggregate: z
    .object({
      groupBy: z.array(z.string()).default([]),
      metric: z.enum(METRIQUES),
      column: z.string().nullish(),
    })
    .nullish(),
});

export type QueryPlan = z.infer<typeof planSchema>;

function colonnesValides(table: TableName): readonly string[] {
  return CATALOGUE[table].colonnes;
}

function colonnesPii(table: TableName): readonly string[] {
  return CATALOGUE[table].pii;
}

/** Rejette tout plan qui sortirait de la liste blanche. Exporté pour test. */
export function validerPlan(
  plan: QueryPlan,
): { ok: true; table: TableName } | { ok: false; error: string } {
  if (!TABLES.includes(plan.table as TableName)) {
    return { ok: false, error: `Table non autorisée : ${plan.table}.` };
  }
  const table = plan.table as TableName;
  const cols = colonnesValides(table);
  const verifier = (c: string, ctx: string) =>
    cols.includes(c) ? null : `Colonne inconnue (${ctx}) : ${c}.`;

  for (const c of plan.select) {
    const e = verifier(c, "select");
    if (e) return { ok: false, error: e };
  }
  for (const f of plan.filters) {
    const e = verifier(f.column, "filtre");
    if (e) return { ok: false, error: e };
  }
  if (plan.order) {
    const e = verifier(plan.order.column, "tri");
    if (e) return { ok: false, error: e };
  }
  if (plan.aggregate) {
    for (const c of plan.aggregate.groupBy) {
      const e = verifier(c, "regroupement");
      if (e) return { ok: false, error: e };
    }
    if (plan.aggregate.column) {
      const e = verifier(plan.aggregate.column, "métrique");
      if (e) return { ok: false, error: e };
    }
    // `count` compte des lignes et se passe de colonne. Les quatre autres
    // métriques portent SUR une colonne : sans elle, le calcul mappait chaque
    // ligne sur Number(0) et renvoyait « 0 » au lieu d'échouer. Un LLM qui oublie
    // `column` faisait donc dire « 0 € » à une somme jamais calculée.
    if (plan.aggregate.metric !== "count" && !plan.aggregate.column) {
      return {
        ok: false,
        error: `La métrique « ${plan.aggregate.metric} » exige une colonne à agréger.`,
      };
    }
  }
  return { ok: true, table };
}

// ---------------------------------------------------------------------------
// Exécution déterministe (lecture seule).
// ---------------------------------------------------------------------------
export interface ResultatRequete {
  colonnes: string[];
  lignes: Record<string, unknown>[];
  tronque: boolean;
}

type Ligne = Record<string, unknown>;

function agreger(
  lignes: Ligne[],
  agg: NonNullable<QueryPlan["aggregate"]>,
  tronque: boolean,
): ResultatRequete {
  // La clé de regroupement est un JSON des valeurs, pas une concaténation.
  // Auparavant les clés étaient jointes par " · " puis REDÉCOUPÉES sur ce même
  // séparateur pour reconstruire les colonnes : toute valeur contenant " · "
  // (une commune, une raison sociale) partait dans le mauvais groupe, et les
  // types étaient perdus au passage (tout devenait chaîne). On conserve donc les
  // valeurs d'origine à côté de la clé.
  const groupes = new Map<string, { valeurs: unknown[]; rows: Ligne[] }>();
  for (const l of lignes) {
    const valeurs = agg.groupBy.map((c) => l[c] ?? null);
    const cle = JSON.stringify(valeurs);
    if (!groupes.has(cle)) groupes.set(cle, { valeurs, rows: [] });
    groupes.get(cle)!.rows.push(l);
  }
  const col = agg.column;
  const nums = (rows: Ligne[]) =>
    rows.map((r) => Number(col ? r[col] : 0)).filter((n) => Number.isFinite(n));
  const calc = (rows: Ligne[]): number => {
    if (agg.metric === "count") return rows.length;
    const v = nums(rows);
    if (v.length === 0) return 0;
    if (agg.metric === "sum") return v.reduce((a, b) => a + b, 0);
    if (agg.metric === "avg") return v.reduce((a, b) => a + b, 0) / v.length;
    if (agg.metric === "min") return Math.min(...v);
    return Math.max(...v);
  };
  const etiquette = agg.metric === "count" ? "count" : `${agg.metric}(${col ?? "?"})`;
  const lignesAgg = [...groupes.values()].map(({ valeurs, rows }) => {
    const base: Ligne = {};
    agg.groupBy.forEach((c, i) => (base[c] = valeurs[i]));
    base[etiquette] = Math.round(calc(rows) * 100) / 100;
    return base;
  });
  lignesAgg.sort((a, b) => Number(b[etiquette]) - Number(a[etiquette]));
  return {
    colonnes: [...agg.groupBy, etiquette],
    lignes: lignesAgg.slice(0, LIMITE_LIGNES),
    tronque,
  };
}

async function executerPlan(plan: QueryPlan, table: TableName): Promise<ResultatRequete> {
  const admin = createAdminClient();

  // Colonnes à charger : pour un agrégat, on a besoin des colonnes de groupBy +
  // métrique ; sinon la sélection demandée (à défaut, toutes les colonnes).
  let selection: string[];
  if (plan.aggregate) {
    selection = [...new Set([...plan.aggregate.groupBy, plan.aggregate.column].filter(Boolean) as string[])];
    if (selection.length === 0) selection = ["id"]; // count(*) simple
  } else {
    selection = plan.select.length ? plan.select : [...colonnesValides(table)];
  }

  let q = admin.from(table).select(selection.join(","));
  for (const f of plan.filters) {
    switch (f.op) {
      case "eq": q = q.eq(f.column, f.value as never); break;
      case "neq": q = q.neq(f.column, f.value as never); break;
      case "gt": q = q.gt(f.column, f.value as never); break;
      case "gte": q = q.gte(f.column, f.value as never); break;
      case "lt": q = q.lt(f.column, f.value as never); break;
      case "lte": q = q.lte(f.column, f.value as never); break;
      case "like": q = q.like(f.column, String(f.value)); break;
      case "ilike": q = q.ilike(f.column, String(f.value)); break;
      case "in": q = q.in(f.column, (Array.isArray(f.value) ? f.value : [f.value]) as never); break;
      case "is": q = q.is(f.column, f.value as never); break;
    }
  }
  if (plan.order) q = q.order(plan.order.column, { ascending: plan.order.ascending });

  // Pour un agrégat, on lit large (jusqu'à LIMITE_AGREGAT) pour que le comptage
  // ou la somme soit juste ; l'affichage brut reste plafonné à LIMITE_LIGNES.
  const limite = plan.aggregate ? LIMITE_AGREGAT : plan.limit ?? 50;
  q = q.limit(limite);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const lignes = (data ?? []) as unknown as Ligne[];
  const tronque = lignes.length >= limite;

  if (plan.aggregate) return agreger(lignes, plan.aggregate, tronque);
  return { colonnes: selection, lignes, tronque };
}

// ---------------------------------------------------------------------------
// Génération du plan par le LLM, puis rédaction de la réponse.
// ---------------------------------------------------------------------------
function catalogueTexte(): string {
  return TABLES.map((t) => `- ${t} : ${CATALOGUE[t].description}\n  colonnes: ${colonnesValides(t).join(", ")}`).join("\n");
}

const SYSTEME_PLAN = `Tu convertis une question d'administrateur (en français) en un PLAN DE REQUÊTE JSON sur une base de données. Tu ne génères JAMAIS de SQL.

Tables et colonnes disponibles (rien d'autre n'existe) :
${catalogueTexte()}

Réponds STRICTEMENT en JSON, sans texte autour, conforme à :
{
  "table": "<une des tables ci-dessus>",
  "select": ["colonne", ...],            // colonnes à renvoyer (vide = toutes)
  "filters": [{"column":"...","op":"eq|neq|gt|gte|lt|lte|like|ilike|in|is","value": ...}],
  "order": {"column":"...","ascending": true|false} | null,
  "limit": <entier 1..200> | null,
  "aggregate": {"groupBy":["colonne", ...],"metric":"count|sum|avg|min|max","column":"colonne|null"} | null
}

Règles :
- Utilise UNIQUEMENT des colonnes de la table choisie.
- Pour un comptage ("combien de..."), utilise aggregate avec metric "count".
- Pour une somme/moyenne (ex. montant total), metric "sum"/"avg" et "column" numérique.
- Pour "par X" (répartition), mets X dans groupBy.
- Les dates sont au format ISO ; pour "en juillet 2026" filtre created_at gte "2026-07-01" et lt "2026-08-01".
- Pour une recherche texte partielle, utilise ilike avec des % (ex. "%test%").
- Enum utiles : dossiers.statut = ${STATUTS_DOSSIER.join("|")} ; dossiers.dispositif = maprimerenov|cee ; paiements.statut = en_attente|paye|echoue|rembourse ; paiements.type = abonnement|ponctuel.
- Si la question est hors de portée de ces tables, renvoie {"table":"dossiers","select":[],"filters":[],"order":null,"limit":1,"aggregate":null} (on gérera le message).`;

/** Extrait un objet JSON d'une réponse LLM (retire d'éventuelles clôtures markdown). */
function extractJson(raw: string): unknown {
  let s = raw.trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) s = fenced[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}

/**
 * Remplace les valeurs des colonnes nominatives par un jeton neutre, AVANT tout
 * envoi au LLM.
 *
 * Pourquoi : `redigerReponse` expédiait jusqu'à 50 lignes brutes à OpenRouter, et
 * le catalogue expose `artisans.email/telephone/siret` et `leads.email/nom/
 * telephone`. Une question du type « liste les 50 derniers leads » transférait
 * donc 50 identités complètes à un tiers hors UE, sans base légale, alors même
 * que le reste du projet est méticuleux sur le RGPD. Rien dans l'UI ne le
 * laissait deviner : elle ne promet qu'une « lecture seule ».
 *
 * Ce que ça ne coûte pas : l'admin voit toujours les vraies valeurs à l'écran,
 * `resultat` étant rendu directement depuis Supabase. Seule la phrase de synthèse
 * est écrite par le LLM, et pour ça la forme du résultat suffit.
 *
 * Le masque conserve le fait qu'une valeur EXISTE (« [masqué] » vs null) : le
 * modèle peut donc encore dire « 12 leads, tous avec un e-mail » sans les lire.
 */
export function masquerPii(resultat: ResultatRequete, table: TableName): ResultatRequete {
  const pii = new Set(colonnesPii(table));
  if (pii.size === 0) return resultat;
  return {
    ...resultat,
    lignes: resultat.lignes.map((ligne) => {
      const copie: Ligne = {};
      for (const [k, v] of Object.entries(ligne)) {
        copie[k] = pii.has(k) && v !== null && v !== undefined ? "[masqué]" : v;
      }
      return copie;
    }),
  };
}

async function redigerReponse(
  question: string,
  resultat: ResultatRequete,
  table: TableName,
): Promise<string> {
  const sansPii = masquerPii(resultat, table);
  const apercu = {
    colonnes: sansPii.colonnes,
    lignes: sansPii.lignes.slice(0, 50),
    nb_lignes: sansPii.lignes.length,
    tronque: sansPii.tronque,
  };
  const raw = await openRouterChat({
    messages: [
      {
        role: "system",
        content:
          "Tu réponds en français, en une ou deux phrases, à une question d'administrateur, à partir UNIQUEMENT du résultat JSON fourni. Donne le chiffre ou le fait, sans inventer. Si le résultat est vide, dis-le simplement. Pas de markdown. " +
          "Certaines valeurs valent « [masqué] » : ce sont des données personnelles volontairement retirées. Ne les commente pas, ne cherche pas à les deviner ; l'administrateur les voit dans le tableau affiché à côté de ta réponse.",
      },
      { role: "user", content: `Question : ${question}\n\nRésultat :\n${JSON.stringify(apercu)}` },
    ],
    temperature: 0.2,
    maxTokens: 300,
  });
  return raw.trim();
}

export type InterrogationResult =
  | { ok: true; reponse: string; plan: QueryPlan; resultat: ResultatRequete }
  | { ok: false; error: string };

/** Orchestration : question → plan validé → exécution lecture seule → réponse. */
export async function interrogerDonnees(question: string): Promise<InterrogationResult> {
  const q = question.trim();
  if (!q) return { ok: false, error: "Question vide." };
  if (!isLlmConfigured()) return { ok: false, error: "L'IA n'est pas configurée (OPENROUTER_API_KEY)." };

  let plan: QueryPlan;
  try {
    const raw = await openRouterChat({
      messages: [
        { role: "system", content: SYSTEME_PLAN },
        { role: "user", content: q },
      ],
      jsonMode: true,
      temperature: 0,
      maxTokens: 600,
    });
    const parsed = planSchema.safeParse(extractJson(raw));
    if (!parsed.success) return { ok: false, error: "Je n'ai pas su traduire la question en requête." };
    plan = parsed.data;
  } catch (err) {
    console.error("[nl-query] plan:", err);
    return { ok: false, error: "Le service d'IA est momentanément indisponible." };
  }

  const valide = validerPlan(plan);
  if (!valide.ok) return { ok: false, error: valide.error };

  let resultat: ResultatRequete;
  try {
    resultat = await executerPlan(plan, valide.table);
  } catch (err) {
    console.error("[nl-query] exécution:", err);
    return { ok: false, error: "La requête a échoué à l'exécution." };
  }

  let reponse: string;
  try {
    reponse = await redigerReponse(q, resultat, valide.table);
  } catch {
    // La rédaction est un confort : en cas d'échec on renvoie quand même les données.
    reponse = `${resultat.lignes.length} ligne(s) trouvée(s).`;
  }

  return { ok: true, reponse, plan, resultat };
}
