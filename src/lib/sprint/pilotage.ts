import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { jourParis, PLAFOND_QUOTIDIEN, type CanalSprint } from "./lot";

/**
 * Tableau de bord du sprint (plan v3, §11 « cinq chiffres » et §12, outil 4).
 *
 * Deux sources, volontairement distinctes et affichées côte à côte :
 *
 * 1. `prospects_dossimo` : ce que l'humain a saisi (envoyé, répondu, STOP…).
 *    Déclaratif, donc faillible : un oubli de marquage fausse le chiffre.
 * 2. Les tables applicatives (`artisans`, `dossiers`, `paiements`) croisées par
 *    `source`, alimenté par le tracking utm first-party. Factuel : personne ne
 *    le saisit à la main.
 *
 * Les fusionner en un seul chiffre ferait passer une saisie oubliée pour un
 * canal qui ne convertit pas. Le plan (§12, outil 5) demande explicitement le
 * croisement, pas l'amalgame.
 */

/** Cibles et seuils d'alerte du sprint, repris tels quels de la section 11 du plan. */
export const CIBLES = {
  whatsapp: { tauxReponse: 0.1 },
  email: { tauxReponse: 0.05 },
  /** En dessous, on revoit le message, pas le canal (§11). */
  alerteTauxReponse: 0.03,
  /** 280 envois en 5 jours ouvrés, 140 par canal. */
  envoisParCanal: 140,
  demos: 15,
} as const;

/**
 * Sous ce nombre d'envois, un taux de réponse ne veut rien dire : 1 réponse sur
 * 5 envois afficherait 20 % et déclencherait une conclusion sur du bruit. On
 * refuse de trancher plutôt que de mentir avec un pourcentage.
 */
export const ENVOIS_MINIMUM_POUR_JUGER = 20;

export type VerdictCanal = "insuffisant" | "alerte" | "sous-cible" | "atteint";

/** Taux de réponse, ou null si aucun envoi (jamais une division par zéro affichée comme 0 %). */
export function tauxReponse(reponses: number, envois: number): number | null {
  if (envois <= 0) return null;
  return reponses / envois;
}

/**
 * Verdict d'un canal au regard des seuils du plan. `insuffisant` tant que
 * l'échantillon est trop petit pour conclure quoi que ce soit.
 */
export function verdictCanal(canal: CanalSprint, reponses: number, envois: number): VerdictCanal {
  if (envois < ENVOIS_MINIMUM_POUR_JUGER) return "insuffisant";
  const taux = tauxReponse(reponses, envois);
  if (taux === null) return "insuffisant";
  if (taux < CIBLES.alerteTauxReponse) return "alerte";
  if (taux < CIBLES[canal].tauxReponse) return "sous-cible";
  return "atteint";
}

export type ChiffresCanal = {
  canal: CanalSprint;
  assignes: number;
  envois: number;
  relances: number;
  reponses: number;
  demos: number;
  dossiers: number;
  stop: number;
  partisAujourdhui: number;
  restantsPlafond: number;
  taux: number | null;
  verdict: VerdictCanal;
};

/** Ce que les tables applicatives savent, par `source` utm (factuel, non déclaratif). */
export type ChiffresSource = {
  source: string;
  comptes: number;
  dossiers: number;
  dossiersPayes: number;
};

export type Pilotage = {
  jour: string;
  plafond: number;
  canaux: ChiffresCanal[];
  sources: ChiffresSource[];
};

/** Les cinq chiffres par canal + le croisement utm avec les tables applicatives. */
export async function chargerPilotage(): Promise<Pilotage> {
  const admin = createAdminClient();
  const jour = jourParis();

  const canaux = await Promise.all(
    (["whatsapp", "email"] as const).map(async (canal): Promise<ChiffresCanal> => {
      const base = () =>
        admin.from("prospects_dossimo").select("place_id", { count: "exact", head: true }).eq("canal", canal);
      const [assignes, envois, relances, reponses, demos, dossiers, stop, partis] = await Promise.all([
        base(),
        base().not("date_envoi", "is", null),
        base().not("date_relance", "is", null),
        base().eq("reponse", true),
        base().eq("essai_demo", true),
        base().eq("dossier_paye", true),
        base().eq("opt_out", true),
        base().or(`date_envoi.eq.${jour},date_relance.eq.${jour},date_nurturing.eq.${jour}`),
      ]);
      const erreur = [assignes, envois, relances, reponses, demos, dossiers, stop, partis].find((r) => r.error);
      if (erreur?.error) throw new Error(`Pilotage sprint : ${erreur.error.message}`);

      const nbEnvois = envois.count ?? 0;
      const nbReponses = reponses.count ?? 0;
      return {
        canal,
        assignes: assignes.count ?? 0,
        envois: nbEnvois,
        relances: relances.count ?? 0,
        reponses: nbReponses,
        demos: demos.count ?? 0,
        dossiers: dossiers.count ?? 0,
        stop: stop.count ?? 0,
        partisAujourdhui: partis.count ?? 0,
        restantsPlafond: Math.max(0, PLAFOND_QUOTIDIEN - (partis.count ?? 0)),
        taux: tauxReponse(nbReponses, nbEnvois),
        verdict: verdictCanal(canal, nbReponses, nbEnvois),
      };
    }),
  );

  // --- Croisement utm : ce que le site a réellement vu arriver ---
  const [{ data: artisans }, { data: lignes }, { data: paiements }] = await Promise.all([
    admin.from("artisans").select("source"),
    admin.from("dossiers").select("id, source"),
    admin.from("paiements").select("dossier_id").eq("statut", "paye"),
  ]);

  const payes = new Set((paiements ?? []).map((p) => p.dossier_id).filter(Boolean));
  const parSource = new Map<string, ChiffresSource>();
  const obtenir = (s: string | null) => {
    // `source` nul = arrivé hors campagne (bouche-à-oreille, direct). On le garde
    // sous un libellé explicite plutôt que de le jeter : c'est une information.
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

  return {
    jour,
    plafond: PLAFOND_QUOTIDIEN,
    canaux,
    sources: [...parSource.values()].sort((x, y) => y.comptes - x.comptes || x.source.localeCompare(y.source)),
  };
}
