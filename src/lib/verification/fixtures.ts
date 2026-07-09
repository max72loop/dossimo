import type { QualificationRge } from "./types";

/**
 * Entreprises de démonstration. Elles permettent de présenter Dossimo (ou de
 * tester) avec un SIRET fictif, sans dépendre d'une vraie entreprise inscrite
 * aux annuaires.
 *
 * Elles sont reconnues MÊME en mode « reel » : on peut donc faire une démo sur
 * l'environnement de production avec ces SIRET dédiés. En mode « demo », en
 * plus, N'IMPORTE QUEL SIRET est accepté via une entreprise générique (voir
 * `entrepriseDemoGenerique`), pour improviser une démo avec un SIRET inventé.
 */
export interface EntrepriseDemo {
  siret: string;
  denomination: string;
  actif: boolean;
  qualifications: QualificationRge[];
}

const VALIDITE = { date_debut: "2020-01-01", date_fin: "2030-12-31" } as const;

const QUALIF_ISOLATION: QualificationRge = {
  numero: "8611",
  qualification: "Qualibat 7131 — Isolation thermique par l'intérieur",
  domaine: "Isolation des combles perdus",
  meta_domaine: "Travaux d'efficacité énergétique",
  organisme: "Qualibat",
  ...VALIDITE,
};

const QUALIF_PAC: QualificationRge = {
  numero: "5911",
  qualification: "QualiPAC Chauffage",
  domaine: "Pompe à chaleur : chauffage",
  meta_domaine: "Installations d'énergies renouvelables",
  organisme: "Qualit'EnR",
  ...VALIDITE,
};

const QUALIF_CET: QualificationRge = {
  numero: "5921",
  qualification: "QualiPAC CET",
  domaine: "Chauffe-Eau Thermodynamique",
  meta_domaine: "Installations d'énergies renouvelables",
  organisme: "Qualit'EnR",
  ...VALIDITE,
};

const QUALIF_BOIS: QualificationRge = {
  numero: "5711",
  qualification: "Qualibois module Air",
  domaine: "Poêle ou insert bois",
  meta_domaine: "Installations d'énergies renouvelables",
  organisme: "Qualit'EnR",
  ...VALIDITE,
};

const TOUTES_QUALIFS = [
  QUALIF_ISOLATION,
  QUALIF_PAC,
  QUALIF_CET,
  QUALIF_BOIS,
];

export const ENTREPRISES_DEMO: EntrepriseDemo[] = [
  {
    // SIRET de démonstration dédié : à utiliser pour présenter Dossimo, y
    // compris en production. Reconnu quel que soit le mode de vérification.
    siret: "11111111111111",
    denomination: "Dossimo Démo — Artisan RGE",
    actif: true,
    qualifications: TOUTES_QUALIFS,
  },
];

/** Fixture nommée correspondant à ce SIRET, le cas échéant. */
export function entrepriseDemo(siret: string): EntrepriseDemo | undefined {
  return ENTREPRISES_DEMO.find((e) => e.siret === siret);
}

/**
 * Entreprise de démo générique pour un SIRET quelconque (mode « demo »). Elle
 * porte toutes les qualifications, si bien que n'importe quel geste est validé —
 * l'objectif est de dérouler une démo complète, pas de simuler un refus.
 */
export function entrepriseDemoGenerique(siret: string): EntrepriseDemo {
  return {
    siret,
    denomination: "Entreprise de démonstration",
    actif: true,
    qualifications: TOUTES_QUALIFS,
  };
}
