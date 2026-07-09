import type { Dispositif } from "@/lib/database.types";

/**
 * Guide de dépôt : « à qui, quand, quoi » pour l'artisan, selon le dispositif.
 *
 * Rappel de positionnement (CLAUDE.md §2) : Dossimo ne dépose JAMAIS et ne
 * touche jamais la prime. Ce bloc dit à l'artisan vers qui pousser son pack une
 * fois vérifié. Copie de référence statique (comme les repli de
 * `pieces-cee-isolation.ts`) ; à terme pilotable par la règle métier si besoin.
 */
export interface EtapeDepot {
  /** Titre court de l'étape temporelle. */
  titre: string;
  /** Ce qui se passe / ce qu'on fait à ce moment. */
  detail: string;
}

export interface DepotGuide {
  /** Nom lisible du dispositif. */
  dispositifLabel: string;
  /** À qui / où le dossier est déposé. */
  destinataire: string;
  /** Précision sur le destinataire (rôle, canal). */
  destinataireDetail: string;
  /** Qui, concrètement, effectue le dépôt (jamais Dossimo). */
  quiDepose: string;
  /** Fenêtre / séquence temporelle du dépôt. */
  quand: EtapeDepot[];
  /** Synthèse de ce que l'artisan transmet (le détail exact = checklist plus bas). */
  aEnvoyer: string;
}

const GUIDES: Record<Dispositif, DepotGuide> = {
  cee: {
    dispositifLabel: "CEE",
    destinataire: "L'obligé ou son délégataire",
    destinataireDetail:
      "Le financeur du CEE (fournisseur d'énergie ou son mandataire) avec qui l'offre « coup de pouce » a été signée. C'est lui, le demandeur officiel, qui dépose au registre national (EMMY).",
    quiDepose: "Vous transmettez le pack à l'obligé, qui dépose. Dossimo ne dépose jamais.",
    quand: [
      {
        titre: "Avant le devis",
        detail:
          "L'offre CEE doit être proposée AVANT la signature du devis (preuve du rôle actif et incitatif). Sans cette antériorité, refus assuré.",
      },
      {
        titre: "Après la facture",
        detail:
          "Vous transmettez le dossier complet à l'obligé dans les 3 mois suivant la date de facture.",
      },
    ],
    aEnvoyer:
      "Devis et facture aux mentions identiques, certificat RGE valide, fiche technique de l'isolant (ACERMI), attestation sur l'honneur co-signée, photos avant/après, preuve du cadre de contribution. Détail complet dans la checklist ci-dessous.",
  },
  maprimerenov: {
    dispositifLabel: "MaPrimeRénov'",
    destinataire: "maprimerenov.gouv.fr",
    destinataireDetail:
      "Dépôt en ligne sur le site de l'Anah par le bénéficiaire lui-même (ou un mandataire habilité par l'Anah). Vous, artisan, fournissez vos pièces au client.",
    quiDepose:
      "C'est votre client qui dépose son dossier en ligne. Dossimo ne dépose jamais.",
    quand: [
      {
        titre: "Avant les travaux",
        detail:
          "Le client fait sa demande et attend l'accord de l'Anah AVANT de démarrer les travaux.",
      },
      {
        titre: "Après les travaux",
        detail:
          "Une fois le chantier terminé, le client dépose sa demande de solde avec la facture pour déclencher le versement.",
      },
    ],
    aEnvoyer:
      "Vos pièces techniques (devis et facture cohérents, certificat RGE, fiche technique, photos) + les pièces du bénéficiaire (identité, avis d'imposition, titre de propriété, RIB). Détail complet dans la checklist ci-dessous.",
  },
};

export function depotGuide(dispositif: Dispositif): DepotGuide {
  return GUIDES[dispositif];
}
