import {
  BOIS_COMBUSTIBLES,
  PAC_TEMPERATURES,
  SOUTIRAGE_PROFILS,
  posteLabel,
} from "@/lib/dossier/cee-isolation";
import type { CeeIsolationCaracteristiques } from "@/lib/dossier/get-dossier";

/**
 * Ligne technique à afficher (récap, attestation, vue dossier). `mono` demande
 * un rendu chiffré (police à chasse fixe) là où le support le permet.
 */
export interface LigneTechnique {
  label: string;
  value: string;
  mono?: boolean;
}

const ou = (...v: (string | null | undefined)[]) =>
  v.filter(Boolean).join(" ") || "—";

/**
 * Bloc technique d'un dossier, lu selon la famille de geste. Point unique de
 * vérité pour tous les rendus : ajouter un geste = ajouter un cas ici, sans
 * toucher aux documents ni à la vue. Un dossier ne porte que le bloc de sa
 * famille (`travaux`, `pac` ou `cet`) ; on ne lit jamais un bloc absent.
 */
export function lignesTechniques(
  c: CeeIsolationCaracteristiques,
): LigneTechnique[] {
  const geste = c.geste ?? "isolation";

  if (geste === "pac_air_eau" && c.pac) {
    return [
      { label: "Efficacité énergétique saisonnière (ETAS)", value: `${c.pac.etas} %`, mono: true },
      { label: "Régime de température", value: PAC_TEMPERATURES[c.pac.temperature] },
      { label: "Puissance thermique", value: `${c.pac.puissance_kw} kW`, mono: true },
      { label: "Marque / référence", value: ou(c.pac.marque, c.pac.reference) },
      { label: "Classe du régulateur", value: c.pac.regulateur_classe || "—" },
    ];
  }

  if (geste === "cet" && c.cet) {
    return [
      { label: "COP (EN 16147)", value: String(c.cet.cop), mono: true },
      { label: "Profil de soutirage", value: SOUTIRAGE_PROFILS[c.cet.profil_soutirage] },
      { label: "Volume du ballon", value: `${c.cet.volume_l} L`, mono: true },
      { label: "Marque / référence", value: ou(c.cet.marque, c.cet.reference) },
    ];
  }

  if (geste === "bois" && c.bois) {
    return [
      { label: "Combustible", value: BOIS_COMBUSTIBLES[c.bois.combustible] },
      { label: "Rendement énergétique", value: `${c.bois.rendement} %`, mono: true },
      { label: "Émissions CO", value: c.bois.emissions_co != null ? `${c.bois.emissions_co} mg/Nm³` : "—", mono: true },
      { label: "Marque / référence", value: ou(c.bois.marque, c.bois.reference) },
    ];
  }

  // Isolation (défaut, y compris dossiers antérieurs au multi-geste). Le bloc
  // peut manquer si le geste déclaré n'a pas son bloc technique (donnée
  // incohérente) : on rend une liste vide plutôt que de lever.
  const t = c.travaux;
  if (!t) return [];
  return [
    { label: "Surface isolée", value: `${t.surface_isolee_m2} m²`, mono: true },
    { label: "Isolant", value: t.isolant_type },
    { label: "Résistance thermique R", value: `${t.resistance_thermique_r} m²·K/W`, mono: true },
    { label: "Marque / référence", value: ou(t.isolant_marque, t.isolant_reference) },
    { label: "Épaisseur", value: t.epaisseur_mm ? `${t.epaisseur_mm} mm` : "—", mono: true },
  ];
}

/** Intitulé de la section technique selon le geste. */
export function titreSectionTechnique(c: CeeIsolationCaracteristiques): string {
  const geste = c.geste ?? "isolation";
  if (geste === "pac_air_eau") return "Pompe à chaleur air/eau";
  if (geste === "cet") return "Chauffe-eau thermodynamique";
  if (geste === "bois") return "Appareil de chauffage au bois";
  return "Travaux d'isolation";
}

/** Ré-export pratique pour les appelants qui affichent aussi le poste. */
export { posteLabel };
