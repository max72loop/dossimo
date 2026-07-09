import type { StatutSiret } from "./types";

const BASE = "https://recherche-entreprises.api.gouv.fr/search";
const TIMEOUT_MS = 8000;

export interface ResultatAnnuaire {
  statut: Exclude<StatutSiret, "non_verifie">;
  denomination: string | null;
}

interface Etablissement {
  siret?: string;
  etat_administratif?: string;
}

/**
 * Interroge l'Annuaire des Entreprises (API publique data.gouv, sans clé) pour
 * l'état administratif d'un établissement (SIRET).
 *
 * `indisponible` = panne réseau ou réponse illisible : l'appelant dégradera
 * plutôt que de bloquer un dossier sur une indisponibilité d'annuaire.
 */
export async function rechercheEntreprise(
  siret: string,
): Promise<ResultatAnnuaire> {
  const url = `${BASE}?q=${encodeURIComponent(siret)}&per_page=1`;
  let json: unknown;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { statut: "indisponible", denomination: null };
    json = await res.json();
  } catch {
    return { statut: "indisponible", denomination: null };
  }

  const result = (json as { results?: Record<string, unknown>[] })?.results?.[0];
  if (!result) return { statut: "introuvable", denomination: null };

  const denomination =
    (result.nom_complet as string | undefined) ??
    (result.nom_raison_sociale as string | undefined) ??
    null;

  // État de l'établissement PRÉCIS (le SIRET demandé), pas seulement du siège :
  // une recherche par SIRET peut renvoyer l'entreprise sans que ce SIRET soit
  // son siège. On exige une correspondance exacte, sinon « introuvable ».
  const siege = result.siege as Etablissement | undefined;
  const matching =
    (result.matching_etablissements as Etablissement[] | undefined) ?? [];
  const etab =
    matching.find((e) => e?.siret === siret) ??
    (siege?.siret === siret ? siege : undefined);

  if (!etab) return { statut: "introuvable", denomination };
  return {
    statut: etab.etat_administratif === "A" ? "actif" : "ferme",
    denomination,
  };
}
