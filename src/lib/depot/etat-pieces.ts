import type { PieceAttendue } from "@/lib/depot/pieces-attendues";

/**
 * Où en est CHAQUE pièce attendue, sachant qu'une pièce peut tenir en plusieurs
 * fichiers.
 *
 * Une carte d'identité est recto-verso, un avis d'imposition fait deux à quatre
 * pages : le modèle « une pièce attendue = un fichier » était faux dès le premier
 * dossier réel. La base n'a jamais imposé cette contrainte (aucun unique sur
 * `(dossier_id, type)`), et les écritures sont déjà à la granularité du fichier.
 * Tout le problème était dans les LECTURES, qui faisaient un `.find()` par type et
 * ne voyaient donc qu'un fichier sur N, choisi au hasard du tri.
 *
 * Ce module est le seul endroit où se décide « cette pièce est-elle satisfaite ? ».
 * Il était auparavant redécidé dans quatre fichiers, avec quatre résultats
 * différents selon l'ordre de tri (cf. AGENTS.md : une bonne idée appliquée à une
 * seule table est le défaut récurrent de ce dépôt).
 *
 * LA RÈGLE, énoncée une fois
 *  - aucun fichier                       → `manquante`
 *  - au moins un fichier validé          → `validee`
 *  - des fichiers, tous rejetés          → `a_revoir`
 *  - sinon (déposés, pas encore revus)   → `en_attente`
 *
 * « Au moins un validé » et non « tous validés » : le produit ne sait pas combien de
 * pages un document devrait avoir, et ne peut donc pas détecter un verso manquant.
 * C'est l'artisan qui en juge à la revue, et qui rejette si le compte n'y est pas.
 * Inventer un nombre de pages attendu par type reviendrait à fabriquer un blocage
 * sur une règle qu'aucun texte ne pose.
 */

export type StatutValidation = "submitted" | "approved" | "rejected" | null;

export interface FichierDepose {
  id: string;
  type: string;
  nomFichier: string | null;
  validationStatus: StatutValidation;
  rejectionReason: string | null;
  createdAt: string;
}

export type StatutPiece = "manquante" | "en_attente" | "validee" | "a_revoir";

export interface EtatPiece {
  attendue: PieceAttendue;
  /** Tous les fichiers de ce type, du plus ancien au plus récent. */
  fichiers: FichierDepose[];
  statut: StatutPiece;
}

function statutDe(fichiers: readonly FichierDepose[]): StatutPiece {
  if (fichiers.length === 0) return "manquante";
  if (fichiers.some((f) => f.validationStatus === "approved")) return "validee";
  if (fichiers.every((f) => f.validationStatus === "rejected")) return "a_revoir";
  return "en_attente";
}

/**
 * Croise les pièces attendues et les fichiers réellement déposés. Pur : aucune
 * requête, donc testable sans base.
 *
 * L'ordre de `fichiers` est celui de `deposes`, quel que soit le tri de l'appelant :
 * on ne trie pas ici pour ne pas masquer un tri décroissant côté requête.
 */
export function etatDesPieces(
  attendues: readonly PieceAttendue[],
  deposes: readonly FichierDepose[],
): EtatPiece[] {
  return attendues.map((attendue) => {
    const fichiers = deposes.filter((f) => f.type === attendue.type);
    return { attendue, fichiers, statut: statutDe(fichiers) };
  });
}

/** Les pièces qu'il reste à obtenir du bénéficiaire : ni validées, ni en attente de revue. */
export function piecesARelancer(etats: readonly EtatPiece[]): EtatPiece[] {
  return etats.filter((e) => e.statut !== "validee");
}

/**
 * Le motif à redonner au client pour une pièce à revoir : celui du rejet le plus
 * récent. Plusieurs fichiers rejetés pour des raisons différentes ne peuvent pas
 * tenir dans une ligne de relance, et le dernier motif est le seul encore d'actualité.
 */
export function motifDeRejet(etat: EtatPiece): string | null {
  if (etat.statut !== "a_revoir") return null;
  const rejetes = etat.fichiers.filter((f) => f.validationStatus === "rejected");
  return rejetes[rejetes.length - 1]?.rejectionReason ?? null;
}