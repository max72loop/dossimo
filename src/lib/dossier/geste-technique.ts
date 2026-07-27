import {
  BOIS_COMBUSTIBLES,
  PAC_TEMPERATURES,
  SOLAIRE_APPOINTS,
  SOLAIRE_CERTIFICATIONS,
  SOLAIRE_FLUIDES,
  SOLAIRE_SOUTIRAGE_PROFILS,
  SOUTIRAGE_PROFILS,
  USAGES_PAC,
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
 * Case Oui / Non d'un cadre A. `null` et `undefined` rendent « — » : un dossier
 * antérieur à la question n'a pas répondu « non », il n'a pas répondu.
 */
const ouiNon = (v: boolean | null | undefined) =>
  v == null ? "—" : v ? "Oui" : "Non";

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
    const p = c.pac;
    return [
      { label: "Efficacité énergétique saisonnière (ETAS)", value: `${p.etas} %`, mono: true },
      { label: "Régime de température", value: PAC_TEMPERATURES[p.temperature] },
      { label: "Puissance thermique", value: `${p.puissance_kw} kW`, mono: true },
      {
        label: "Surface chauffée par la PAC",
        value: p.surface_chauffee_m2 != null ? `${p.surface_chauffee_m2} m²` : "—",
        mono: true,
      },
      {
        label: "Usage couvert",
        value: p.usage ? USAGES_PAC[p.usage] : "—",
      },
      { label: "Marque / référence", value: ou(p.marque, p.reference) },
      {
        label: "Référence du modèle (EPREL)",
        value: p.reference_modele || "—",
        mono: true,
      },
      // Ne concerne que les PAC bonifiées : ligne masquée sinon.
      ...(p.numero_agrement
        ? [{ label: "N° d'agrément du modèle", value: p.numero_agrement, mono: true }]
        : []),
      { label: "Équipée d'un régulateur", value: ouiNon(p.regulateur) },
      { label: "Classe du régulateur", value: p.regulateur_classe || "—" },
      {
        label: "Note de dimensionnement remise au bénéficiaire",
        value: ouiNon(p.note_dimensionnement),
      },
      {
        label: "Système déporté pour l'eau chaude",
        value: ouiNon(p.systeme_deporte),
      },
      // Le détail du système déporté n'a de sens que s'il y en a un : l'afficher
      // à vide ferait croire à une information manquante sur toutes les autres PAC.
      ...(p.systeme_deporte
        ? [
            {
              label: "Système déporté — marque / référence",
              value: ou(p.deporte_marque ?? null, p.deporte_reference ?? null),
            },
            {
              label: "Système déporté — consomme de l'énergie pour l'ECS",
              value: ouiNon(p.deporte_consomme_energie),
            },
          ]
        : []),
    ];
  }

  if (geste === "cet" && c.cet) {
    return [
      {
        label: "Efficacité énergétique ECS",
        value:
          c.cet.efficacite_ecs != null ? `${c.cet.efficacite_ecs} %` : "—",
        mono: true,
      },
      // Le COP n'est plus un critère : affiché seulement s'il a été saisi, pour
      // ne pas suggérer qu'il manque une valeur obligatoire.
      ...(c.cet.cop != null
        ? [{ label: "COP (indicatif)", value: String(c.cet.cop), mono: true }]
        : []),
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

  if (geste === "solaire_thermique" && c.solaire) {
    // Ordre calé sur les mentions qu'exige le BAR-TH-101 sur la facture.
    return [
      { label: "Énergie de l'appoint", value: SOLAIRE_APPOINTS[c.solaire.appoint] },
      { label: "Fluide caloporteur", value: SOLAIRE_FLUIDES[c.solaire.fluide] },
      { label: "Surface hors-tout des capteurs", value: `${c.solaire.surface_capteurs_m2} m²`, mono: true },
      { label: "Profil de soutirage", value: SOLAIRE_SOUTIRAGE_PROFILS[c.solaire.profil_soutirage] },
      { label: "Efficacité énergétique ECS", value: `${c.solaire.efficacite_ecs} %`, mono: true },
      { label: "Nombre de ballons", value: String(c.solaire.nb_ballons), mono: true },
      { label: "Capacité de chaque ballon", value: `${c.solaire.volume_ballon_l} L`, mono: true },
      { label: "Classe d'efficacité du ballon", value: c.solaire.classe_ballon || "—" },
      { label: "Certification des capteurs", value: SOLAIRE_CERTIFICATIONS[c.solaire.certification] },
      { label: "Couvre la totalité du besoin ECS", value: ouiNon(c.solaire.couvre_totalite_ecs) },
      { label: "Capteurs non hybrides", value: ouiNon(c.solaire.capteurs_non_hybrides) },
      { label: "Marque / référence", value: ou(c.solaire.marque, c.solaire.reference) },
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
    // Cadre A des BAR-EN-101 / 103 seulement. Le BAR-EN-102 (murs) ne pose pas
    // la question : ne pas afficher la ligne sur un dossier de murs.
    ...(t.type_isolation !== "murs"
      ? [{ label: "Pare-vapeur ou équivalent", value: ouiNon(t.pare_vapeur) }]
      : []),
  ];
}

/** Intitulé de la section technique selon le geste. */
export function titreSectionTechnique(c: CeeIsolationCaracteristiques): string {
  const geste = c.geste ?? "isolation";
  if (geste === "pac_air_eau") return "Pompe à chaleur air/eau";
  if (geste === "cet") return "Chauffe-eau thermodynamique";
  if (geste === "bois") return "Appareil de chauffage au bois";
  if (geste === "solaire_thermique") return "Chauffe-eau solaire individuel";
  return "Travaux d'isolation";
}

/** Ré-export pratique pour les appelants qui affichent aussi le poste. */
export { posteLabel };
