import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

type Client = SupabaseClient<Database>;

/**
 * Rétention des pièces justificatives — le point RGPD le plus lourd du produit.
 *
 * Avis d'imposition, RIB et pièces d'identité (déposés par l'artisan ET par le
 * bénéficiaire) vivent dans le bucket privé `pieces` et, pour l'avis, en clair
 * dans `pieces_justificatives.extraction_json`. Sans purge, ils s'accumulent
 * sans limite (art. 5.1.e RGPD : conservation limitée à la finalité).
 *
 * FINALITÉ : la pièce sert au contrôle croisé anti-refus avant dépôt, puis à
 * couvrir un éventuel refus/redépôt auprès de l'Anah ou de l'obligé. Passé ce
 * délai, elle n'a plus de raison d'être conservée.
 *
 * ⚠️ VALEURS À FAIRE VALIDER JURIDIQUEMENT. Les deux fenêtres ci-dessous sont
 * des défauts défendables, pas une décision arbitrée. Elles vivent ici, en
 * constantes nommées et documentées, volontairement hors `regles_metier` (dont
 * le schéma vise l'éligibilité d'un geste, pas la rétention). Si la valeur
 * change, c'est le seul endroit à toucher.
 */

/**
 * Délai de conservation après livraison du pack (`dossiers.delivered_at`).
 * Couvre le cycle d'un refus puis d'un redépôt avant purge.
 */
export const RETENTION_APRES_LIVRAISON_JOURS = 90;

/**
 * Plafond absolu depuis le dépôt de la pièce (`created_at`), quel que soit
 * l'état du dossier. Rattrape les dossiers jamais livrés (abandonnés) dont les
 * pièces resteraient sinon éternellement.
 */
export const RETENTION_MAX_JOURS = 180;

const JOUR_MS = 24 * 60 * 60 * 1000;

/** Ligne minimale nécessaire à la décision de purge. */
export type PieceRetention = {
  created_at: string;
  /** `delivered_at` du dossier parent ; null si le pack n'a pas été livré. */
  delivered_at: string | null;
};

/**
 * Une pièce est purgeable si :
 *  - son dossier a été livré il y a plus de RETENTION_APRES_LIVRAISON_JOURS, OU
 *  - elle a été déposée il y a plus de RETENTION_MAX_JOURS (dossier abandonné).
 * Fonction pure, testée unitairement.
 */
export function estPurgeable(piece: PieceRetention, now: Date): boolean {
  const maintenant = now.getTime();

  if (piece.delivered_at) {
    const age = maintenant - new Date(piece.delivered_at).getTime();
    if (age > RETENTION_APRES_LIVRAISON_JOURS * JOUR_MS) return true;
  }

  const ageDepot = maintenant - new Date(piece.created_at).getTime();
  return ageDepot > RETENTION_MAX_JOURS * JOUR_MS;
}

type Candidat = {
  id: string;
  storage_path: string;
  created_at: string;
  delivered_at: string | null;
};

function chunk<T>(xs: T[], taille: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += taille) out.push(xs.slice(i, i + taille));
  return out;
}

/** Compromis lisibilité/charge : quelques centaines de pièces par appel suffisent au volume de lancement. */
const LOT = 100;

export type RapportPurge = {
  candidats: number;
  fichiersSupprimes: number;
  lignesSupprimees: number;
};

/**
 * Purge les pièces échues : fichier du bucket PUIS ligne (l'inverse laisserait
 * un orphelin invisible et jamais purgé). Toute erreur remonte (fail loud) : un
 * échec silencieux ici, ce sont des données personnelles qu'on croit effacées
 * alors qu'elles persistent. Le lot en échec n'est pas supprimé et sera
 * retenté au prochain passage du cron.
 *
 * Le SQL de Supabase ne peut pas toucher au Storage : la purge doit donc passer
 * par le client service-role (comme `expire-credits`), pas par une migration.
 */
export async function purgerPiecesExpirees(
  admin: Client,
  now: Date = new Date(),
): Promise<RapportPurge> {
  // Le `!inner` force la jointure : une pièce dont le dossier a disparu est déjà
  // supprimée en cascade (0002, `on delete cascade`), donc absente ici.
  const { data, error } = await admin
    .from("pieces_justificatives")
    .select("id, storage_path, created_at, dossiers!inner(delivered_at)")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`purge_pieces/lecture: ${error.message}`);

  const candidats: Candidat[] = (data ?? [])
    .map((p) => {
      const d = p.dossiers as unknown as { delivered_at: string | null } | null;
      return {
        id: p.id as string,
        storage_path: p.storage_path as string,
        created_at: p.created_at as string,
        delivered_at: d?.delivered_at ?? null,
      };
    })
    .filter((p) => estPurgeable(p, now));

  let fichiersSupprimes = 0;
  let lignesSupprimees = 0;

  for (const lot of chunk(candidats, LOT)) {
    const chemins = lot.map((p) => p.storage_path).filter(Boolean);
    if (chemins.length > 0) {
      const { error: storageErr } = await admin.storage
        .from("pieces")
        .remove(chemins);
      if (storageErr) {
        throw new Error(`purge_pieces/storage: ${storageErr.message}`);
      }
      fichiersSupprimes += chemins.length;
    }

    const { error: delErr } = await admin
      .from("pieces_justificatives")
      .delete()
      .in(
        "id",
        lot.map((p) => p.id),
      );
    if (delErr) throw new Error(`purge_pieces/delete: ${delErr.message}`);
    lignesSupprimees += lot.length;
  }

  return {
    candidats: candidats.length,
    fichiersSupprimes,
    lignesSupprimees,
  };
}
