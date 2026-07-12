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
import type { PlafondRessources } from "@/lib/database.types";

/**
 * LE rapport de contrôle d'un dossier : la saisie, les pièces de l'artisan, et les
 * pièces du bénéficiaire.
 *
 * Point d'entrée unique de la vue dossier et des routes PDF. `controlerDossier`
 * seul ne juge que la saisie ; l'appeler directement produirait un rapport qui
 * ignore les documents que l'artisan s'apprête à déposer — c'est-à-dire qui tait
 * les écarts et les mentions manquantes, précisément ce qu'on lui vend.
 *
 * Renvoie aussi les pièces, dont la vue a besoin par ailleurs : un seul aller-retour.
 */
export async function rapportComplet(data: DossierComplet): Promise<{
  rapport: RapportControle;
  pieces: PieceAvecEcarts[];
}> {
  const pieces = await getDossierPieces(data);
  const famille = familleDeGeste(data.caracteristiques.geste ?? "isolation");

  const findingsPieces: Finding[] = [
    ...controlerPieces(versControle(pieces), famille),
    ...(await controlerAvis(data, pieces)),
  ];

  return {
    rapport: fusionnerRapport(controlerDossier(data), findingsPieces),
    pieces,
  };
}

/**
 * Confronte l'avis d'imposition déposé par le bénéficiaire à la catégorie de revenus
 * déclarée au dossier. Silencieux tant qu'aucun avis lisible n'est déposé : on ne
 * reproche pas à l'artisan une pièce qu'il n'a pas encore reçue de son client — c'est
 * la checklist qui la réclame, pas le contrôle.
 */
async function controlerAvis(
  data: DossierComplet,
  pieces: readonly PieceAvecEcarts[],
): Promise<Finding[]> {
  const avis = pieces.find(
    (p) =>
      p.piece.type === "avis_imposition" &&
      p.piece.extraction_statut === "ok" &&
      p.piece.extraction_json,
  );
  if (!avis) return [];

  return controlerAvisImposition({
    caracteristiques: data.caracteristiques,
    avis: avis.piece.extraction_json as unknown as AvisImposition,
    plafonds: await chargerPlafonds(),
    anneeCourante: new Date().getFullYear(),
  });
}

/**
 * Barème des plafonds de ressources en vigueur. Best-effort : si la table n'est pas
 * là (migration non appliquée), on rend une liste vide et le contrôle se contente
 * d'un avertissement — il ne bloque jamais un dossier sur son propre barème manquant.
 */
async function chargerPlafonds(): Promise<PlafondRessources[]> {
  const supabase = await createClient();
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
