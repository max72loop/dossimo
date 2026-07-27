/**
 * Registre des modèles de formulaires officiels — cœur du versionnement (CLAUDE.md §8).
 *
 * Chaque modèle porte sa référence (arrêté / n° Cerfa), sa version et ses dates
 * d'effet. Un dossier est TOUJOURS produit sur le modèle en vigueur à la date
 * pertinente : sinon Dossimo fabriquerait lui-même le motif de refus qu'il
 * prétend éviter.
 *
 * Trois stratégies de production :
 *  - `acroform`    : modèle à champs (AcroForm) rempli par nom de champ.
 *  - `overlay`     : modèle officiel STATIQUE (imprimé/signé, sans champ) sur
 *    lequel on surimprime les valeurs à des coordonnées mesurées. Cas du Cerfa Anah.
 *  - `preparation` : Dossimo ne produit PAS le document réglementaire, il produit
 *    une fiche de préparation des valeurs à y reporter. Cas de l'AH CEE.
 *
 * POURQUOI PAS DE REPRODUCTION DE L'AH CEE (revue du 2026-07-25, cf.
 * CHANGELOG-cerfa.md). L'annexe 7 de l'arrêté du 4 septembre 2014 modifié dit :
 * « En dehors de ces éléments qui doivent être personnalisés par le demandeur,
 * aucune modification du contenu et de l'organisation de l'attestation sur
 * l'honneur n'est autorisée. » L'AH vierge naît chez le demandeur (l'obligé),
 * qui y dactylographie sa raison sociale, son SIREN et sa mention CNIL avant
 * signature. Un tiers n'a donc pas le droit d'en produire une, si fidèle soit
 * elle, et il n'existe aucune AH officielle vierge à remplir. Le seul chemin
 * conforme est l'AH de l'obligé, pré-remplie : `oblige-actions.ts`.
 *
 * Source de vérité actuelle : ce registre. Seam prévu vers `regles_metier`
 * (colonne `version_formulaire`) — voir `expectedVersionFromRule()`.
 */

import type { Dispositif } from "@/lib/database.types";

export type CerfaStrategy = "acroform" | "overlay" | "preparation";

/**
 * Nature du document produit :
 *  - `officiel`    : PDF officiel réel (rempli par overlay ou acroform).
 *  - `preparation` : document Dossimo qui n'est PAS le document réglementaire et
 *    ne prétend pas l'être. Il rassemble les valeurs à reporter sur le document
 *    que le tiers habilité (l'obligé) émet lui-même.
 */
export type CerfaKind = "officiel" | "preparation";

export interface CerfaField {
  name: string;
  label: string;
  type: "text" | "check";
}

/** Position d'une valeur surimprimée (origine bas-gauche, points PDF). */
export interface OverlaySpec {
  key: string;
  page: number;
  x: number;
  y: number;
  size?: number;
}

/**
 * Revue « four-eyes » du modèle : comparaison cadre par cadre de ce que Dossimo
 * produit avec la source réglementaire ET le modèle d'un obligé réel, consignée
 * dans `CHANGELOG-cerfa.md`.
 *
 * Absence de `revue` = revue NON faite. C'est le sens sûr : aucune promesse de
 * conformité n'est affichée à l'artisan tant que quelqu'un ne l'a pas signée.
 * L'UI et le PDF DÉRIVENT leur formulation de ce champ, ils ne la décident pas.
 */
export interface RevueModele {
  /** Date de signature de la revue (ISO). */
  valideeLe: string;
  /** Personne qui a signé la revue. */
  valideePar: string;
  /** Obligé dont le modèle a servi de référence à la comparaison. */
  obligeReference: string;
}

export interface CerfaTemplate {
  id: string;
  dispositif: Dispositif;
  /** Fiches couvertes (CEE). Vide = modèle non indexé par fiche (ex. MPR). */
  fiches: string[];
  titre: string;
  /** Référence de l'arrêté / n° Cerfa fixant le modèle. */
  arrete: string;
  version: string;
  effectiveFrom: string; // ISO (YYYY-MM-DD)
  effectiveTo: string | null;
  /** true = document officiel réel ; false = document Dossimo de préparation. */
  official: boolean;
  kind: CerfaKind;
  strategy: CerfaStrategy;
  /** Revue four-eyes signée. Absent = non validé (cf. `RevueModele`). */
  revue?: RevueModele;
  /** Variante du modèle d'AH à rendre (5e période vs 6e période). */
  ahVariant?: "p5" | "p6";
  /** Champs canoniques (stratégie acroform). */
  fields?: readonly CerfaField[];
  /** Fichier officiel dans public/cerfa/ (stratégie overlay, ou acroform officiel). */
  file?: string;
  /** Positions de surimpression (stratégie overlay). */
  overlay?: readonly OverlaySpec[];
}

/* ------------------------------------------------- Champs AH CEE (acroform) */
/**
 * Champs canoniques de l'attestation sur l'honneur CEE (BAR-EN). Partagés par
 * le générateur de placeholder ET le mapping : les noms restent cohérents.
 */
export const AH_CEE_FIELDS: readonly CerfaField[] = [
  { name: "beneficiaire_nom_prenom", label: "Bénéficiaire (nom et prénom)", type: "text" },
  { name: "beneficiaire_adresse", label: "Adresse des travaux", type: "text" },
  { name: "beneficiaire_cp_commune", label: "Code postal et commune", type: "text" },
  { name: "logement_type", label: "Type de logement", type: "text" },
  { name: "logement_annee", label: "Année de construction", type: "text" },
  { name: "logement_plus_2_ans", label: "Logement achevé depuis plus de 2 ans", type: "check" },
  { name: "pro_raison_sociale", label: "Professionnel — raison sociale", type: "text" },
  { name: "pro_siret", label: "SIRET", type: "text" },
  { name: "pro_rge_numero", label: "N° de qualification RGE", type: "text" },
  { name: "pro_rge_domaine", label: "Domaine RGE", type: "text" },
  { name: "travaux_fiche", label: "Fiche d'opération standardisée", type: "text" },
  { name: "travaux_nature", label: "Nature des travaux", type: "text" },
  { name: "travaux_surface", label: "Surface isolée (m²)", type: "text" },
  { name: "travaux_resistance", label: "Résistance thermique R (m²·K/W)", type: "text" },
  { name: "travaux_isolant", label: "Isolant (marque / référence)", type: "text" },
  { name: "travaux_epaisseur", label: "Épaisseur (mm)", type: "text" },
  { name: "date_devis", label: "Date d'acceptation du devis", type: "text" },
  { name: "date_debut", label: "Date de début des travaux", type: "text" },
  { name: "date_fin", label: "Date d'achèvement des travaux", type: "text" },
  { name: "date_facture", label: "Date de la facture", type: "text" },
  { name: "montant_ht", label: "Montant HT des travaux (€)", type: "text" },
  { name: "atteste_exactitude", label: "J'atteste sur l'honneur l'exactitude des informations ci-dessus", type: "check" },
  { name: "signature_lieu", label: "Fait à", type: "text" },
  { name: "signature_date", label: "Le", type: "text" },
];

/* -------------------------- Surimpression mandat MPR (Cerfa 16089*02, page 1) */
/**
 * Coordonnées mesurées sur le PDF officiel (page 1, 595 x 842). On ne pré-remplit
 * QUE le bloc « mandant » (le client) : conforme au positionnement Dossimo, le
 * choix et l'identité du mandataire restent à la main du client.
 */
const MANDAT_MPR_OVERLAY: readonly OverlaySpec[] = [
  { key: "mandant_nom_prenom", page: 0, x: 128, y: 333 },
  { key: "mandant_adresse", page: 0, x: 92, y: 285 },
  { key: "mandant_cp", page: 0, x: 122, y: 265 },
  { key: "mandant_commune", page: 0, x: 228, y: 265 },
  { key: "mandant_tel", page: 0, x: 80, y: 244 },
  { key: "mandant_mel", page: 0, x: 216, y: 244 },
];

/* -------------------------------------------------------------- Modèles */
const TEMPLATES: CerfaTemplate[] = [
  // Modèle d'AH en vigueur AVANT la 6e période (opérations engagées jusqu'au
  // 31/03/2026). Le résolveur le choisit sur la date de devis (§8).
  {
    id: "ah-cee-bar-en-p5",
    dispositif: "cee",
    fiches: ["BAR-EN-101", "BAR-EN-102", "BAR-EN-103"],
    titre:
      "Fiche de préparation — Attestation sur l'honneur CEE Isolation (fiches BAR-EN)",
    arrete:
      "Modèle d'attestation sur l'honneur — arrêté du 4 septembre 2014 modifié (annexe 7-1)",
    version: "2025-01",
    effectiveFrom: "2024-01-01",
    effectiveTo: "2026-03-31",
    official: false,
    kind: "preparation",
    strategy: "preparation",
    ahVariant: "p5",
    fields: AH_CEE_FIELDS,
  },
  // Modèle d'AH 6e période — annexe 7-1 modifiée, en vigueur pour les opérations
  // engagées à compter du 01/04/2026 : coût de l'opération, aides publiques
  // perçues (hors CEE), engagement de mise en service.
  {
    id: "ah-cee-bar-en-p6",
    dispositif: "cee",
    fiches: ["BAR-EN-101", "BAR-EN-102", "BAR-EN-103"],
    titre:
      "Fiche de préparation — Attestation sur l'honneur CEE Isolation (fiches BAR-EN)",
    arrete:
      "Modèle d'attestation sur l'honneur 6e période — arrêté du 4 septembre 2014 modifié (annexe 7-1) et arrêté du 21 décembre 2025",
    version: "2026-04 (P6)",
    effectiveFrom: "2026-04-01",
    effectiveTo: null,
    official: false,
    kind: "preparation",
    strategy: "preparation",
    ahVariant: "p6",
    fields: AH_CEE_FIELDS,
  },
  // AH CEE pompe à chaleur air/eau (BAR-TH-171) — même modèle réglementaire
  // (annexe 7-1), cadre technique adapté au geste chauffage. Deux périodes.
  {
    id: "ah-cee-bar-th-171-p5",
    dispositif: "cee",
    fiches: ["BAR-TH-171"],
    titre:
      "Fiche de préparation — Attestation sur l'honneur CEE Pompe à chaleur air/eau (BAR-TH-171)",
    arrete:
      "Modèle d'attestation sur l'honneur — arrêté du 4 septembre 2014 modifié (annexe 7-1)",
    version: "2025-01",
    effectiveFrom: "2024-01-01",
    effectiveTo: "2026-03-31",
    official: false,
    kind: "preparation",
    strategy: "preparation",
    ahVariant: "p5",
  },
  {
    id: "ah-cee-bar-th-171-p6",
    dispositif: "cee",
    fiches: ["BAR-TH-171"],
    titre:
      "Fiche de préparation — Attestation sur l'honneur CEE Pompe à chaleur air/eau (BAR-TH-171)",
    arrete:
      "Modèle d'attestation sur l'honneur 6e période — arrêté du 4 septembre 2014 modifié (annexe 7-1) et arrêté du 21 décembre 2025",
    version: "2026-04 (P6)",
    effectiveFrom: "2026-04-01",
    effectiveTo: null,
    official: false,
    kind: "preparation",
    strategy: "preparation",
    ahVariant: "p6",
  },
  // AH CEE chauffe-eau thermodynamique (BAR-TH-148) — même modèle réglementaire
  // (annexe 7-1), cadre technique adapté au geste. Deux périodes.
  {
    id: "ah-cee-bar-th-148-p5",
    dispositif: "cee",
    fiches: ["BAR-TH-148"],
    titre:
      "Fiche de préparation — Attestation sur l'honneur CEE Chauffe-eau thermodynamique (BAR-TH-148)",
    arrete:
      "Modèle d'attestation sur l'honneur — arrêté du 4 septembre 2014 modifié (annexe 7-1)",
    version: "2025-01",
    effectiveFrom: "2024-01-01",
    effectiveTo: "2026-03-31",
    official: false,
    kind: "preparation",
    strategy: "preparation",
    ahVariant: "p5",
  },
  {
    id: "ah-cee-bar-th-148-p6",
    dispositif: "cee",
    fiches: ["BAR-TH-148"],
    titre:
      "Fiche de préparation — Attestation sur l'honneur CEE Chauffe-eau thermodynamique (BAR-TH-148)",
    arrete:
      "Modèle d'attestation sur l'honneur 6e période — arrêté du 4 septembre 2014 modifié (annexe 7-1) et arrêté du 21 décembre 2025",
    version: "2026-04 (P6)",
    effectiveFrom: "2026-04-01",
    effectiveTo: null,
    official: false,
    kind: "preparation",
    strategy: "preparation",
    ahVariant: "p6",
  },
  // AH CEE appareil de chauffage au bois (BAR-TH-112) — même modèle
  // réglementaire (annexe 7-1), cadre technique adapté au geste. Deux périodes.
  {
    id: "ah-cee-bar-th-112-p5",
    dispositif: "cee",
    fiches: ["BAR-TH-112"],
    titre:
      "Fiche de préparation — Attestation sur l'honneur CEE Appareil de chauffage au bois (BAR-TH-112)",
    arrete:
      "Modèle d'attestation sur l'honneur — arrêté du 4 septembre 2014 modifié (annexe 7-1)",
    version: "2025-01",
    effectiveFrom: "2024-01-01",
    effectiveTo: "2026-03-31",
    official: false,
    kind: "preparation",
    strategy: "preparation",
    ahVariant: "p5",
  },
  {
    id: "ah-cee-bar-th-112-p6",
    dispositif: "cee",
    fiches: ["BAR-TH-112"],
    titre:
      "Fiche de préparation — Attestation sur l'honneur CEE Appareil de chauffage au bois (BAR-TH-112)",
    arrete:
      "Modèle d'attestation sur l'honneur 6e période — arrêté du 4 septembre 2014 modifié (annexe 7-1) et arrêté du 21 décembre 2025",
    version: "2026-04 (P6)",
    effectiveFrom: "2026-04-01",
    effectiveTo: null,
    official: false,
    kind: "preparation",
    strategy: "preparation",
    ahVariant: "p6",
  },
  // AH CEE chauffe-eau solaire individuel (BAR-TH-101) — même modèle
  // réglementaire (annexe 7-1), cadre technique adapté au geste. Deux périodes.
  // La partie A du BAR-TH-101 porte, depuis le 01/07/2026, le coût HT/TTC et le
  // montant prévisionnel des aides publiques hors CEE : c'est exactement ce que
  // couvre la variante p6, d'où le même découpage que les autres fiches.
  {
    id: "ah-cee-bar-th-101-p5",
    dispositif: "cee",
    fiches: ["BAR-TH-101"],
    titre:
      "Fiche de préparation — Attestation sur l'honneur CEE Chauffe-eau solaire individuel (BAR-TH-101)",
    arrete:
      "Modèle d'attestation sur l'honneur — arrêté du 4 septembre 2014 modifié (annexe 7-1)",
    version: "2025-01",
    effectiveFrom: "2024-01-01",
    effectiveTo: "2026-03-31",
    official: false,
    kind: "preparation",
    strategy: "preparation",
    ahVariant: "p5",
  },
  {
    id: "ah-cee-bar-th-101-p6",
    dispositif: "cee",
    fiches: ["BAR-TH-101"],
    titre:
      "Fiche de préparation — Attestation sur l'honneur CEE Chauffe-eau solaire individuel (BAR-TH-101)",
    arrete:
      "Modèle d'attestation sur l'honneur 6e période — arrêté du 4 septembre 2014 modifié (annexe 7-1) et arrêté du 21 décembre 2025",
    version: "2026-04 (P6)",
    effectiveFrom: "2026-04-01",
    effectiveTo: null,
    official: false,
    kind: "preparation",
    strategy: "preparation",
    ahVariant: "p6",
  },
  {
    id: "cerfa-16089-02-mandat-mpr",
    dispositif: "maprimerenov",
    fiches: [],
    titre: "Mandat général MaPrimeRénov' (Cerfa n°16089*02)",
    arrete: "Cerfa n°16089*02 — Arrêté du 14 janvier 2020 modifié (mandat MaPrimeRénov')",
    version: "2024-10-15",
    effectiveFrom: "2024-10-15",
    effectiveTo: null,
    official: true,
    kind: "officiel",
    strategy: "overlay",
    file: "cerfa-16089-02-mandat-mpr.pdf",
    overlay: MANDAT_MPR_OVERLAY,
  },
];

/* ------------------------------------------------------------- Résolution */
export type ResolveResult =
  | { ok: true; template: CerfaTemplate }
  | { ok: false; reason: string };

/**
 * Modèle en vigueur pour un dispositif (et une fiche, pour le CEE) à une date
 * donnée. Erreur explicite si aucun modèle n'est enregistré : on refuse de
 * produire sur un modèle inconnu plutôt que d'en deviner un.
 */
export function resolveCerfaTemplate(
  dispositif: Dispositif,
  fiche: string | null | undefined,
  atISO: string,
): ResolveResult {
  const date = atISO.slice(0, 10);
  const matches = TEMPLATES.filter(
    (t) =>
      t.dispositif === dispositif &&
      (t.fiches.length === 0 || (fiche != null && t.fiches.includes(fiche))) &&
      t.effectiveFrom <= date &&
      (t.effectiveTo === null || date <= t.effectiveTo),
  );
  if (matches.length === 0) {
    const cible = fiche ? `la fiche ${fiche}` : `le dispositif ${dispositif}`;
    return {
      ok: false,
      reason: `Aucun modèle officiel enregistré pour ${cible} à la date du ${date}.`,
    };
  }
  const template = [...matches].sort((a, b) =>
    a.effectiveFrom < b.effectiveFrom ? 1 : -1,
  )[0];
  return { ok: true, template };
}

/**
 * Un modèle ne peut se dire vérifié que si la revue four-eyes est signée. Sans
 * exception de complaisance pour le `kind: "officiel"` : sur un overlay, le PDF
 * vient bien de l'administration mais les COORDONNÉES de surimpression sont
 * mesurées à la main par Dossimo, et une valeur posée dans la mauvaise case est
 * le même défaut que reproduire un modèle de travers.
 */
export function revueValidee(t: CerfaTemplate): boolean {
  return t.revue != null;
}

/**
 * Seam vers `regles_metier.version_formulaire` (§8) — DÉLIBÉRÉMENT non branché.
 *
 * Attention avant de le câbler : les deux valeurs ne sont PAS sur le même axe.
 * `regles_metier.version_formulaire` porte la version de la FICHE d'opération
 * (« BAR-TH-171 vA78.4 »), `CerfaTemplate.version` porte la version du MODÈLE
 * d'attestation (« 2026-04 (P6) »). Les comparer produirait une divergence à
 * chaque dossier, donc une alerte que plus personne ne lirait.
 *
 * Ce qu'il faudrait d'abord : un champ distinct côté règle pour la version du
 * modèle d'AH, ou un `ficheVersion` côté registre. Tant que l'un des deux
 * n'existe pas, renvoyer null est la seule réponse honnête.
 */
export function expectedVersionFromRule(): string | null {
  return null;
}
