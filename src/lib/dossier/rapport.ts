import "server-only";

import type { DossierComplet } from "@/lib/dossier/get-dossier";
import { getDossierPieces, versControle, type PieceAvecEcarts } from "@/lib/piece/get";
import { controlerDossier } from "@/lib/rules/controle-dossier";
import { controlerPieces, fusionnerRapport } from "@/lib/rules/controle-pieces";
import type { RapportControle } from "@/lib/rules/types";

/**
 * LE rapport de contrôle d'un dossier : la saisie ET les pièces réelles.
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
  const rapport = fusionnerRapport(
    controlerDossier(data),
    controlerPieces(versControle(pieces)),
  );
  return { rapport, pieces };
}
