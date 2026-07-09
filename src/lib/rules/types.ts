/**
 * Moteur de contrôle anti-refus — règles DURES (code déterministe).
 *
 * §5/§9 : les règles dures vivent dans le code ; les règles souples et la
 * rédaction des points de vigilance viendront d'un LLM (étape ultérieure). À
 * terme, les seuils/paramètres pourront être lus depuis `regles_metier`.
 */

export type Severite = "bloquant" | "avertissement" | "ok";

export type CategorieControle =
  | "chronologie"
  | "entreprise"
  | "rge"
  | "eligibilite"
  | "technique"
  | "montants"
  | "pieces";

export interface Finding {
  code: string;
  categorie: CategorieControle;
  severite: Severite;
  titre: string;
  detail: string;
}

export interface RapportControle {
  findings: Finding[];
  nbBloquants: number;
  nbAvertissements: number;
  /** Points de contrôle passés (severite « ok »). */
  nbConformes: number;
  /** Aucun point bloquant → le dossier peut être déposé. */
  conforme: boolean;
}

export const SEVERITE_LABEL: Record<Severite, string> = {
  bloquant: "Bloquant",
  avertissement: "À vérifier",
  ok: "Conforme",
};
