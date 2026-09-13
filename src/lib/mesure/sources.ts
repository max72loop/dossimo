import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Ce que les tables applicatives savent, par `source` utm : factuel, jamais
 * déclaratif. Personne ne saisit ces chiffres, le tracking first-party les
 * écrit à l'inscription (`artisans.source`) et le dossier en hérite.
 */
export type ChiffresSource = {
  source: string;
  comptes: number;
  dossiers: number;
  dossiersPayes: number;
};

/**
 * Croisement utm : comptes créés, dossiers et dossiers payés, par source.
 *
 * Vivait dans le pilotage du sprint bicanal (`src/lib/sprint/pilotage.ts`),
 * retiré le 2026-09-13 avec ses consoles. C'était le seul bloc de cette page
 * qui ne dépendait pas de l'A/B abandonné : il rejoint le Tunnel, où il
 * répond à « d'où viennent ceux qui paient ».
 *
 * `source` nul = arrivé hors campagne (bouche-à-oreille, direct). Gardé sous
 * un libellé explicite plutôt que jeté : c'est une information.
 */
export async function chargerSources(): Promise<ChiffresSource[]> {
  const admin = createAdminClient();
  const [
    { data: artisans, error: erreurArtisans },
    { data: lignes, error: erreurDossiers },
    { data: paiements, error: erreurPaiements },
  ] = await Promise.all([
    admin.from("artisans").select("source"),
    admin.from("dossiers").select("id, source"),
    admin.from("paiements").select("dossier_id").eq("statut", "paye"),
  ]);
  // L'original se dégradait en `?? []` : une panne affichait « Aucun compte
  // enregistré », et l'admin en concluait que la prospection ne ramenait rien.
  const panne = erreurArtisans ?? erreurDossiers ?? erreurPaiements;
  if (panne) throw new Error(`Croisement par source : ${panne.message}`);

  const payes = new Set((paiements ?? []).map((p) => p.dossier_id).filter(Boolean));
  const parSource = new Map<string, ChiffresSource>();
  const obtenir = (s: string | null) => {
    const cle = s?.trim() || "(direct)";
    if (!parSource.has(cle)) parSource.set(cle, { source: cle, comptes: 0, dossiers: 0, dossiersPayes: 0 });
    return parSource.get(cle)!;
  };
  for (const a of artisans ?? []) obtenir(a.source).comptes += 1;
  for (const d of lignes ?? []) {
    const e = obtenir(d.source);
    e.dossiers += 1;
    if (payes.has(d.id)) e.dossiersPayes += 1;
  }

  return [...parSource.values()].sort(
    (x, y) => y.comptes - x.comptes || x.source.localeCompare(y.source),
  );
}
