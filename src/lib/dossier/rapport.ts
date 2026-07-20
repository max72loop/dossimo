import "server-only";

import { familleDeGeste } from "@/lib/dossier/cee-isolation";
import type { DossierComplet } from "@/lib/dossier/get-dossier";
import { getDossierPieces, versControle, type PieceAvecEcarts } from "@/lib/piece/get";
import type { AvisImposition } from "@/lib/piece/avis-imposition";
import { controlerAvisImposition } from "@/lib/rules/controle-avis";
import { controlerDossier } from "@/lib/rules/controle-dossier";
import { controlerPieces, fusionnerRapport } from "@/lib/rules/controle-pieces";
import type { Finding, RapportControle } from "@/lib/rules/types";
import { createClient } from "@/lib/supabase/server";
import type { DbClient } from "@/lib/rules/regles-metier";
import type { PlafondRessources } from "@/lib/database.types";

/**
 * LE rapport de contrôle d'un dossier : la saisie, les pièces de l'artisan, et les
 * pièces du bénéficiaire.
 *
 * Point d'entrée unique de la vue dossier, de la liste et des routes PDF.
 * `controlerDossier` seul ne juge que la saisie ; l'appeler directement produirait un
 * rapport qui ignore les documents que l'artisan s'apprête à déposer — c'est-à-dire
 * qui tait les écarts et les mentions manquantes, précisément ce qu'on lui vend.
 */
export async function rapportComplet(data: DossierComplet): Promise<{
  rapport: RapportControle;
  pieces: PieceAvecEcarts[];
}> {
  const supabase = await createClient();
  const [pieces, plafonds] = await Promise.all([
    getDossierPieces(data),
    chargerPlafonds(supabase),
  ]);

  return {
    rapport: fusionnerRapport(
      controlerDossier(data),
      findingsDesPieces(data, pieces, plafonds),
    ),
    pieces,
  };
}

/**
 * Tous les findings issus des pièces réelles : ceux du chantier (écarts, mentions,
 * concordance devis/facture) et ceux du bénéficiaire (avis d'imposition).
 *
 * PUR et exporté : c'est ce qui garantit que la liste des dossiers et la page dossier
 * rendent le MÊME verdict. Deux moteurs différents finiraient par se contredire — un
 * dossier « conforme » dans la liste, bloquant une fois ouvert.
 */
export function findingsDesPieces(
  data: DossierComplet,
  pieces: readonly PieceAvecEcarts[],
  plafonds: readonly PlafondRessources[],
): Finding[] {
  const famille = familleDeGeste(data.caracteristiques.geste ?? "isolation");
  return [
    ...controlerPieces(versControle(pieces), famille),
    ...findingsAvis(data, pieces, plafonds),
  ];
}

/**
 * Confronte l'avis d'imposition déposé par le bénéficiaire à la catégorie de revenus
 * déclarée au dossier. Silencieux tant qu'aucun avis lisible n'est déposé : on ne
 * reproche pas à l'artisan une pièce qu'il n'a pas encore reçue de son client — c'est
 * la checklist qui la réclame, pas le contrôle.
 */
function findingsAvis(
  data: DossierComplet,
  pieces: readonly PieceAvecEcarts[],
  plafonds: readonly PlafondRessources[],
): Finding[] {
  // Le DERNIER avis lisible et non rejeté, pas le premier. `getDossierPieces` trie
  // par `created_at` croissant : un `.find()` retenait donc le plus ANCIEN, et le
  // contrôle continuait de juger l'avis périmé même après que le client en a déposé
  // un corrigé. Un avis rejeté par l'artisan ne fait plus foi non plus.
  const lisibles = pieces.filter(
    (p) =>
      p.piece.type === "avis_imposition" &&
      p.piece.extraction_statut === "ok" &&
      p.piece.extraction_json &&
      p.piece.validation_status !== "rejected",
  );
  const avis = lisibles[lisibles.length - 1];
  if (!avis) return [];

  return controlerAvisImposition({
    caracteristiques: data.caracteristiques,
    avis: avis.piece.extraction_json as unknown as AvisImposition,
    plafonds,
    anneeCourante: new Date().getFullYear(),
  });
}

/**
 * Barème des plafonds de ressources en vigueur. Best-effort : si la table n'est pas
 * là (migration non appliquée), on rend une liste vide et le contrôle se contente
 * d'un avertissement — il ne bloque jamais un dossier sur son propre barème manquant.
 */
export async function chargerPlafonds(
  supabase: DbClient,
): Promise<PlafondRessources[]> {
  const { data, error } = await supabase
    .from("plafonds_ressources")
    .select("*")
    .eq("actif", true)
    .order("annee", { ascending: false });

  if (error || !data) return [];

  // Le barème le plus récent l'emporte : les plafonds sont révisés chaque année, et
  // une ligne périmée jugerait le dossier sur des seuils qui n'existent plus.
  const anneeMax = data.reduce((max, l) => Math.max(max, l.annee), 0);
  return data.filter((l) => l.annee === anneeMax);
}
