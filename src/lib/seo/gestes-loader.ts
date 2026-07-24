import "server-only";

import type { SeoGuide } from "@/lib/seo/guides";
import { GESTES, regleToGeste, type RegleSeo } from "@/lib/seo/gestes";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Charge les pages « par geste » depuis `regles_metier`.
 *
 * Pourquoi le client service-role et pas le client public : la policy RLS de
 * `regles_metier` est `for select to authenticated` (migration 0001). Un
 * visiteur non connecté — Googlebot compris — ne lit donc rien avec la clé
 * anon. Ces pages sont publiques et rendues côté serveur : on lit en
 * service-role, et seules des valeurs réglementaires non nominatives sortent
 * dans le HTML (conditions, pièces, mentions, barèmes). Aucune donnée
 * personnelle ne transite ici.
 *
 * Dégradation gracieuse : si la base est injoignable ou la requête en erreur,
 * on renvoie une liste vide plutôt que de faire échouer le build. Les guides
 * éditoriaux restent servis, et aucune page geste n'est publiée avec un
 * contenu incomplet — ce qui vaut mieux qu'une page publiée à moitié.
 */
export async function getGesteGuides(): Promise<SeoGuide[]> {
  // Publication coupée (`GESTES` vide) : on sort avant d'ouvrir une connexion.
  // Sans ce court-circuit, chaque rendu du hub et de `[slug]` paierait une
  // requête `in (...)` sur une liste vide pour un résultat connu d'avance.
  if (GESTES.length === 0) return [];

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("regles_metier")
      .select(
        "dispositif,type_travaux,condition_json,pieces_requises_json,points_vigilance_json,version_formulaire,created_at",
      )
      .eq("actif", true)
      .in(
        "type_travaux",
        GESTES.map((geste) => geste.typeTravaux),
      );

    if (error || !data) return [];

    const regles = data as RegleSeo[];
    return GESTES.map((config) =>
      regleToGeste(
        config,
        regles.filter((regle) => regle.type_travaux === config.typeTravaux),
      ),
    ).filter((geste): geste is SeoGuide => geste !== null);
  } catch {
    return [];
  }
}
