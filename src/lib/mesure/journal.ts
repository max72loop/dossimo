import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, MotifEchecLecture, TypeEvenementParcours } from "@/lib/database.types";

/**
 * Le journal du tunnel : les deux seules écritures de mesure du produit
 * (`evenements_parcours`, `appels_llm`, migration 0051).
 *
 * ---------------------------------------------------------------------------
 * Pourquoi ces deux fonctions n'échouent JAMAIS bruyamment
 * ---------------------------------------------------------------------------
 * `AGENTS.md` pose la règle inverse : « Errors are never ignored silently.
 * Check `error` on every Supabase call that carries a promise to a human ». Un
 * STOP avalé en silence, c'est recontacter quelqu'un qui a refusé.
 *
 * Une ligne de mesure ne porte aucune promesse à un humain. Si l'insertion
 * échoue, faire échouer l'appel voudrait dire : « la lecture de votre devis est
 * refusée parce que je n'ai pas réussi à compter combien elle m'a coûté ». Le
 * compteur ferait tomber la chose qu'il compte.
 *
 * L'erreur n'est donc pas ignorée pour autant : elle part en `console.error`
 * avec un préfixe cherchable. Un chiffre manquant se voit sur le tableau de
 * bord (le total stagne), pas un dossier perdu.
 * ---------------------------------------------------------------------------
 *
 * Aucune donnée nominative n'entre ici : ni nom, ni e-mail, ni adresse IP, ni
 * identifiant de visiteur. Un essai anonyme est un compteur, pas une personne.
 */

/**
 * Le service-role est-il configuré ? Même garde que `isLlmConfigured()` : sans
 * elle, les tests unitaires (qui ne chargent aucun `.env`) tenteraient d'ouvrir
 * un client Supabase sur une URL vide, et un test de reprise LLM se mettrait à
 * échouer pour une raison qui n'a rien à voir avec ce qu'il vérifie.
 */
function mesurable(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export type EvenementParcoursEntree = {
  type: TypeEvenementParcours;
  dossierId?: string | null;
  artisanId?: string | null;
  source?: string | null;
  /** Renseigné pour `devis_echec` uniquement. */
  motif?: MotifEchecLecture | null;
  /** Renseigné pour `assistance` uniquement : minutes de temps humain. */
  minutes?: number | null;
  detail?: Record<string, unknown>;
};

/**
 * Résultat d'une écriture de mesure. Rendu à l'appelant plutôt que jeté : la
 * télémétrie l'ignore (elle ne doit rien faire tomber), mais une saisie humaine
 * — le temps d'assistance, tapé à la main par l'admin — doit pouvoir dire « ça
 * n'a pas été enregistré » au lieu d'afficher un « c'est noté » mensonger.
 */
export type EcritureMesure = { ok: boolean; error?: string };

/** Pose une étape du tunnel. Ne lève jamais ; rend l'échec à qui veut le lire. */
export async function enregistrerEvenement(e: EvenementParcoursEntree): Promise<EcritureMesure> {
  if (!mesurable()) return { ok: false, error: "Mesure non configurée." };
  try {
    const { error } = await createAdminClient().from("evenements_parcours").insert({
      type: e.type,
      dossier_id: e.dossierId ?? null,
      artisan_id: e.artisanId ?? null,
      source: e.source ?? null,
      motif: e.motif ?? null,
      minutes: e.minutes ?? null,
      detail_json: (e.detail ?? {}) as unknown as Json,
    });
    if (error) {
      console.error("[mesure] evenement non enregistré:", e.type, error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("[mesure] evenement non enregistré:", e.type, err);
    return { ok: false, error: err instanceof Error ? err.message : "Écriture impossible." };
  }
}

export type AppelLlmEntree = {
  contexte: string;
  modele: string;
  tokensEntree: number;
  tokensSortie: number;
  /** Coût en micro-USD. `null` quand le fournisseur ne le communique pas. */
  coutMicroUsd: number | null;
  dossierId?: string | null;
  artisanId?: string | null;
};

/** Enregistre la consommation d'un appel LLM. Ne lève jamais. */
export async function enregistrerAppelLlm(a: AppelLlmEntree): Promise<void> {
  if (!mesurable()) return;
  try {
    const { error } = await createAdminClient().from("appels_llm").insert({
      dossier_id: a.dossierId ?? null,
      artisan_id: a.artisanId ?? null,
      contexte: a.contexte,
      modele: a.modele,
      tokens_entree: a.tokensEntree,
      tokens_sortie: a.tokensSortie,
      cout_micro_usd: a.coutMicroUsd,
    });
    if (error) console.error("[mesure] appel LLM non enregistré:", a.contexte, error.message);
  } catch (err) {
    console.error("[mesure] appel LLM non enregistré:", a.contexte, err);
  }
}

/**
 * Coût OpenRouter (USD, flottant) → micro-USD entier.
 *
 * Un appel coûte de l'ordre de 0,0004 $ : arrondi au cent, il vaudrait zéro, et
 * mille appels vaudraient encore zéro. Le micro-USD est la plus petite unité qui
 * garde un entier significatif. Une valeur absente reste absente : on ne
 * fabrique jamais un coût à partir d'une grille tarifaire recopiée dans le code.
 */
export function microUsd(cout: unknown): number | null {
  if (typeof cout !== "number" || !Number.isFinite(cout) || cout < 0) return null;
  return Math.round(cout * 1_000_000);
}
