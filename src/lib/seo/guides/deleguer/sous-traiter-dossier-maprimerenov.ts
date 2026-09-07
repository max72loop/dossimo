import type { SeoGuide } from "../types";
import { anahModeEmploi, annuaireRge, franceRenovDossier } from "../sources";

export const sousTraiterMpr: SeoGuide = {
  slug: "sous-traiter-dossier-maprimerenov",
  metaTitle: "Sous-traiter le montage d’un dossier MaPrimeRénov’",
  title: "Qui peut monter un dossier MaPrimeRénov’ à votre place, et jusqu’où",
  description:
    "Devis, description technique, qualification RGE : une partie du dossier reste indéplaçable. Ce qui peut être sous-traité sans risque, ce qui ne le peut pas, et à qui confier chaque partie.",
  eyebrow: "Solution artisan RGE · MaPrimeRénov’",
  category: "Déléguer votre dossier",
  updated: "2026-08-21",
  intro:
    "Un dossier MaPrimeRénov’ complet mêle des pièces que seul l’artisan peut produire, comme le devis détaillé geste par geste, et des pièces purement administratives, comme le rassemblement des justificatifs du bénéficiaire. La confusion entre les deux est ce qui fait le plus perdre de temps : on tente de sous-traiter ce qui ne se délègue pas, ou on garde en interne ce qui pourrait être vérifié ailleurs en quelques minutes.",
  sections: [
    {
      heading: "Ce qui ne se sous-traite pas, quelle que soit la solution choisie",
      paragraphs: [
        "Le devis reste la pièce sur laquelle l’aide est instruite, et lui seul rattache le geste à sa qualification RGE. Personne d’autre que l’entreprise qui exécute les travaux ne peut engager cette qualification, la décrire avec les bonnes caractéristiques techniques, ni certifier que la visite préalable exigée par certaines fiches a bien eu lieu. Un tiers, mandataire ou service de préparation documentaire, peut relire et vérifier ce devis, mais ne peut jamais le produire à votre place sans exposer le dossier à une incohérence entre ce qui est écrit et ce qui a réellement été fait.",
        "La facture suit la même logique : elle doit reprendre à l’identique les mentions du devis, et c’est l’entreprise qui l’a exécuté qui l’établit. Ce socle technique reste donc, dans toutes les configurations, à la charge de l’artisan.",
      ],
    },
    {
      heading: "Ce qui peut être délégué sans risque",
      paragraphs: [
        "À l’inverse, une part importante du dossier est purement administrative et peut être confiée sans toucher au fond technique : rassembler les justificatifs d’identité, de propriété et d’occupation du bénéficiaire, vérifier que l’adresse du chantier correspond exactement à celle de la demande, contrôler que les montants du devis et de la future facture concordent ligne à ligne, ou encore relire l’ensemble des pièces pour repérer une incohérence avant l’envoi.",
        "C’est cette part-là que Dossimo prend en charge, à partir d’une saisie unique des données du chantier que vous renseignez vous-même : le pack de pièces est généré et contrôlé, sans qu’aucune information technique n’ait été produite par quelqu’un d’autre que vous.",
      ],
    },
    {
      heading: "Le cas particulier de la sous-traitance de chantier",
      paragraphs: [
        "Quand une partie des travaux est elle-même sous-traitée à une autre entreprise, la règle se durcit : c’est l’entreprise qui exécute réellement le geste qui doit détenir la qualification RGE correspondante, pas le donneur d’ordre qui a signé le devis principal. Un devis qui mentionne votre qualification alors qu’un sous-traitant non qualifié a posé le geste ne protège pas le dossier, même si le reste des pièces est irréprochable.",
        "Cette vérification, en revanche, se sous-traite très bien à un service de contrôle documentaire : c’est exactement le type d’incohérence qu’un rapprochement automatique entre les pièces fait remonter avant le dépôt plutôt qu’après un refus.",
      ],
    },
    {
      heading: "Choisir le bon niveau de délégation",
      paragraphs: [
        "La question à se poser n’est pas « puis-je sous-traiter ce dossier » mais « quelle partie de ce dossier engage ma qualification, et laquelle est purement administrative ». La première reste toujours de votre ressort. La seconde peut être confiée à un tiers, à condition de choisir un service qui vérifie plutôt qu’un mandataire qui se substitue à vous dans la relation avec le client.",
        "Dossimo est un service indépendant d’aide à la préparation de dossier, non affilié à l’Anah ni à France Rénov’. Il ne dépose jamais le dossier et ne touche jamais la prime : la partie qui vous engage reste entre vos mains, la partie administrative est prise en charge et vérifiée.",
      ],
    },
  ],
  checklist: [
    { title: "Séparer le technique de l’administratif", text: "Devis, description du geste et qualification restent de votre ressort. Justificatifs du bénéficiaire, cohérence des montants et relecture croisée peuvent être délégués." },
    { title: "Vérifier la qualification du sous-traitant réel", text: "Si un geste est sous-traité, c’est l’entreprise qui l’exécute qui doit détenir la qualification correspondante, pas le donneur d’ordre." },
    { title: "Ne jamais confier la rédaction du devis technique", text: "Un tiers peut relire et signaler une incohérence, jamais rédiger à votre place la description du geste qui engage votre qualification." },
    { title: "Choisir un contrôle, pas une substitution", text: "Un service qui vérifie vos pièces ne vous retire rien. Un mandataire qui dépose à votre place vous retire la relation avec le client." },
    { title: "Tracer qui a produit quoi", text: "En cas de contrôle, il doit être possible de retrouver qui a rédigé chaque pièce du dossier et sur quelle base." },
  ],
  errors: [
    "Le devis technique est rédigé par un tiers qui n’a pas réalisé la visite préalable exigée par la fiche.",
    "Un geste sous-traité est couvert par la qualification du donneur d’ordre plutôt que par celle de l’entreprise qui l’a réellement posé.",
    "Toute la partie administrative reste gérée en interne alors qu’elle pourrait être déléguée sans risque.",
    "Un service de contrôle est confondu avec un mandataire qui déposerait le dossier à la place de l’artisan.",
    "Aucune trace ne permet de savoir qui a produit quelle pièce du dossier.",
  ],
  example: {
    before: "L’ensemble du dossier, technique et administratif, est monté en interne au fil de l’eau, sans relecture d’ensemble avant l’envoi.",
    after: "Le devis et la qualification restent produits par l’artisan, la collecte des pièces du bénéficiaire et la vérification croisée sont déléguées à un service qui contrôle sans se substituer.",
  },
  faq: [
    {
      question: "Peut-on faire rédiger son devis MaPrimeRénov’ par un tiers ?",
      answer:
        "Non, pas sans risque. Le devis engage la qualification RGE de l’entreprise qui réalise les travaux, et lui seul peut attester que la visite technique préalable exigée par certaines fiches a eu lieu. Un tiers peut le relire et signaler une incohérence, jamais le produire à la place de l’artisan.",
    },
    {
      question: "Quelle partie du dossier peut vraiment être déléguée ?",
      answer:
        "La collecte des justificatifs du bénéficiaire, la vérification de la cohérence entre les pièces et la relecture d’ensemble avant l’envoi. C’est la part administrative du dossier, distincte de la description technique du geste qui reste de la responsabilité de l’artisan.",
    },
    {
      question: "Que se passe-t-il si un sous-traitant n’a pas la bonne qualification RGE ?",
      answer:
        "Le geste qu’il a réalisé n’ouvre pas droit à l’aide, même si le devis global porte la qualification du donneur d’ordre. C’est l’entreprise qui exécute réellement les travaux qui doit détenir le signe de qualité correspondant : vérifiez-le avant de signer, pas au moment du dépôt.",
    },
  ],
  sources: [
    { label: "Bien monter son dossier MaPrimeRénov’ — France Rénov’", href: franceRenovDossier },
    { label: "Annuaire officiel des professionnels RGE (France Rénov’)", href: annuaireRge },
    { label: "Mode d’emploi MaPrimeRénov’ 2026 — Anah", href: anahModeEmploi },
  ],
  pourAllerPlusLoin: {
    heading: "Voir ce que produit une préparation vérifiée",
    liens: [
      {
        label: "Le pack complet en exemple",
        href: "/exemple",
        description: "Le récapitulatif, la checklist et le rapport de contrôle générés depuis une saisie unique, sur un chantier fictif.",
      },
      {
        label: "Grille tarifaire",
        href: "/tarifs",
        description: "Un prix fixe par dossier, sans abonnement ni commission sur la prime.",
      },
    ],
  },
};
