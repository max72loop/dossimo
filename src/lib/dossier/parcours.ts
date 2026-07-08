import type { StatutDossier } from "@/lib/database.types";

/**
 * Parcours du dossier : cycle de vie ordonné, du plus tôt au plus tard. Colle au
 * parcours réel (surtout MaPrimeRénov' : demande, accord, travaux, solde), piloté
 * à la main par l'artisan. Source unique pour la liste, la page dossier et l'action.
 */
export interface EtapeParcours {
  statut: StatutDossier;
  label: string;
  /** Classes du badge (fond + texte) pour l'affichage. */
  cls: string;
  dot: string;
}

export const PARCOURS: EtapeParcours[] = [
  { statut: "nouveau", label: "Nouveau", cls: "bg-papier-fonce text-ardoise", dot: "bg-encre-claire" },
  { statut: "en_traitement", label: "En préparation", cls: "bg-info-bg text-tampon", dot: "bg-tampon" },
  { statut: "pret_depot", label: "Prêt à déposer", cls: "bg-avertissement-bg text-avertissement", dot: "bg-avertissement" },
  { statut: "depose", label: "Déposé", cls: "bg-info-bg text-tampon", dot: "bg-tampon" },
  { statut: "livre", label: "Soldé", cls: "bg-succes-bg text-succes", dot: "bg-succes" },
];

export const ETAPE_PAR_STATUT: Record<StatutDossier, EtapeParcours> =
  Object.fromEntries(PARCOURS.map((e) => [e.statut, e])) as Record<
    StatutDossier,
    EtapeParcours
  >;

export const STATUTS_VALIDES = new Set<StatutDossier>(
  PARCOURS.map((e) => e.statut),
);

export function indexEtape(statut: StatutDossier): number {
  return PARCOURS.findIndex((e) => e.statut === statut);
}
