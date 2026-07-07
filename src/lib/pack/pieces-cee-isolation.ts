import type { DossierComplet } from "@/lib/dossier/get-dossier";

/**
 * Bordereau des pièces d'un dossier CEE isolation.
 *
 * Référence statique pour l'étape 1 (§9). À terme, cette liste sera pilotée par
 * `regles_metier.pieces_requises_json` (table éditable, versionnée) — le code ne
 * fera que lire la règle active. Voir CLAUDE.md §7/§9.
 */
export interface PieceRequise {
  id: string;
  label: string;
  description: string;
  obligatoire: boolean;
}

export interface MentionObligatoire {
  document: "Devis" | "Facture";
  mention: string;
}

/** Mentions qui DOIVENT figurer sur le devis et la facture (fiches BAR-EN). */
export function mentionsObligatoires(
  data: DossierComplet,
): MentionObligatoire[] {
  const { travaux } = data.caracteristiques;
  const communes: MentionObligatoire[] = [
    { document: "Devis", mention: `Fiche CEE : ${travaux.fiche}` },
    { document: "Devis", mention: "Marque et référence de l'isolant posé" },
    {
      document: "Devis",
      mention: `Surface isolée : ${travaux.surface_isolee_m2} m²`,
    },
    {
      document: "Devis",
      mention: `Résistance thermique R = ${travaux.resistance_thermique_r} m²·K/W`,
    },
    {
      document: "Devis",
      mention: "Certification de l'isolant (ACERMI ou équivalent)",
    },
    { document: "Devis", mention: "Mention de la qualification RGE (n° et domaine)" },
  ];
  // Les mêmes mentions sont exigées à l'identique sur la facture.
  const surFacture = communes.map((m) => ({ ...m, document: "Facture" as const }));
  return [...communes, ...surFacture];
}

/** Liste des pièces à réunir, adaptée au dossier (occupation, revenus). */
export function piecesCeeIsolation(data: DossierComplet): PieceRequise[] {
  const { beneficiaire } = data.caracteristiques;

  const pieces: PieceRequise[] = [
    {
      id: "cadre_contribution",
      label: "Cadre contribution / preuve du rôle actif et incitatif",
      description:
        "Document prouvant que l'offre CEE (le « coup de pouce ») a été proposée AVANT la signature du devis. Sans antériorité, le dossier est refusé.",
      obligatoire: true,
    },
    {
      id: "devis_signe",
      label: "Devis signé et daté",
      description:
        "Signé par le bénéficiaire, portant toutes les mentions obligatoires CEE et daté avant le début des travaux.",
      obligatoire: true,
    },
    {
      id: "facture",
      label: "Facture",
      description:
        "Reprenant à l'identique les mentions techniques (marque, référence, surface, R) et cohérente avec le devis.",
      obligatoire: true,
    },
    {
      id: "attestation_honneur",
      label: "Attestation sur l'honneur (AH)",
      description:
        "Signée par le bénéficiaire ET le professionnel, datée après la fin des travaux.",
      obligatoire: true,
    },
    {
      id: "qualification_rge",
      label: "Justificatif de qualification RGE",
      description:
        "Certificat RGE valide à la date de signature du devis, couvrant le domaine des travaux réalisés.",
      obligatoire: true,
    },
    {
      id: "fiche_technique",
      label: "Fiche technique de l'isolant",
      description:
        "Fiche produit mentionnant la marque, la référence, la résistance thermique et la certification ACERMI.",
      obligatoire: true,
    },
    {
      id: "photos",
      label: "Photographies avant / après travaux",
      description:
        "Preuves visuelles de l'état initial et des travaux réalisés (souvent exigées au contrôle).",
      obligatoire: true,
    },
  ];

  // Justificatif de revenus si bonification précarité.
  if (beneficiaire.precarite !== "classique") {
    pieces.push({
      id: "avis_imposition",
      label: "Avis d'imposition du ménage",
      description:
        "Justifie la catégorie de revenus (précaire / grande précarité) ouvrant droit à la bonification.",
      obligatoire: true,
    });
  }

  // Cas bailleur : attestation d'engagement de location.
  if (beneficiaire.occupation === "proprietaire_bailleur") {
    pieces.push({
      id: "attestation_bailleur",
      label: "Attestation d'engagement du bailleur",
      description:
        "Engagement de location du logement à titre de résidence principale.",
      obligatoire: true,
    });
  }

  return pieces;
}
