import type { SeoGuide } from "../types";
import { catalogueCee, mentionsFacture, questionsCee } from "../sources";

export const dossierCee: SeoGuide = {
  slug: "constituer-dossier-cee-conforme",
  metaTitle: "Constituer un dossier CEE conforme : le pack complet",
  title: "Constituer un dossier CEE conforme : qui fournit quoi, et dans quel ordre",
  description:
    "La cartographie d’un dossier CEE complet : les pièces de l’artisan, celles du bénéficiaire, la chronologie du rôle incitatif et le délai d’envoi, pour un pack cohérent avant dépôt.",
  eyebrow: "Guide artisan RGE · Pack CEE",
  category: "Monter le dossier",
  updated: "2026-07-28",
  intro:
    "Un dossier CEE conforme ne se résume pas au devis. C’est un ensemble de pièces produites par l’artisan et par le bénéficiaire, qui doivent rester cohérentes entre elles et respecter une chronologie précise. Une seule mention qui diffère d’une pièce à l’autre, ou une date placée au mauvais moment, suffit à bloquer la prime. Ce guide cartographie ce que le dossier doit contenir et qui fournit quoi.",
  sections: [
    {
      heading: "Un dossier CEE se juge sur son ensemble, pas pièce par pièce",
      paragraphs: [
        "La première difficulté d’un dossier CEE n’est pas de produire les bonnes pièces : c’est de les faire tenir ensemble. Chaque document peut être irréprochable pris isolément et le dossier tomber quand même, parce qu’une surface diffère de deux mètres carrés entre le devis et la facture, ou parce qu’une référence produit a changé sans que l’attestation sur l’honneur suive.",
        "C’est la conséquence directe de ce que contrôle le dispositif. L’instructeur ne visite pas le chantier : il reconstitue l’opération à partir du papier. Sa méthode consiste précisément à rapprocher les pièces entre elles, parce que la concordance est le seul indice de sincérité dont il dispose. Un dossier CEE doit donc être relu comme un tout, une fois toutes les pièces réunies, et pas seulement validé document par document au fil de l’eau.",
      ],
    },
    {
      heading: "Les pièces produites par l’artisan",
      paragraphs: [
        "L’artisan porte la partie technique du dossier. Le devis conforme d’abord, qui rattache le geste à sa fiche d’opération standardisée et porte les caractéristiques exigées : surface, résistance thermique, marque et référence de l’isolant, certification ACERMI le cas échéant, numéro et domaine de qualification RGE. La facture ensuite, qui doit reprendre ces mentions à l’identique et non les reformuler.",
        "S’ajoutent les pièces qui prouvent la réalité et la qualité de l’opération : certificat RGE en cours de validité, fiche technique du produit posé, attestation sur l’honneur co-signée par l’artisan et le bénéficiaire, photos avant et après travaux. Ces pièces sont souvent réunies en dernier, alors qu’elles se préparent au moment du devis : une photo d’avant travaux ne se rattrape pas une fois les combles isolés.",
      ],
    },
    {
      heading: "Les pièces fournies par le bénéficiaire",
      paragraphs: [
        "Le bénéficiaire apporte la partie qui le concerne : selon la situation, pièce d’identité, RIB, justificatif de propriété et justificatif d’occupation du logement. C’est la partie du dossier sur laquelle l’artisan a le moins de prise, et c’est aussi celle qui retarde le plus souvent l’envoi.",
        "Certaines configurations demandent des pièces supplémentaires qu’il vaut mieux identifier dès le premier rendez-vous. Un bailleur devra produire le bail et un engagement de location. Une copropriété demandera le procès-verbal d’assemblée générale autorisant les travaux et la quote-part du demandeur. Découvrir ces exigences après le chantier revient à attendre une assemblée générale qui n’aura peut-être pas lieu avant plusieurs mois, alors que le délai d’envoi, lui, continue de courir.",
      ],
    },
    {
      heading: "Deux dates structurent tout le dossier",
      paragraphs: [
        "La première est l’engagement de l’offre CEE, qui doit précéder l’acceptation du devis par le client. C’est le rôle actif et incitatif : la prime doit avoir contribué à décider les travaux. Un engagement daté après la signature fait tomber le dossier pour effet d’aubaine, sans recours possible. C’est le seul motif de refus qui ne se corrige jamais, et il se joue avant même le début du chantier.",
        "La seconde est la date de la facture, qui ouvre le délai d’envoi du dossier, fixé à trois mois. Ce délai paraît confortable et se consomme vite, entre la collecte des pièces du bénéficiaire, les relances et les corrections. Le réflexe qui protège consiste à réunir les pièces au fur et à mesure du chantier plutôt qu’après la facture.",
      ],
    },
    {
      heading: "Partir de la version en vigueur, jamais d’un ancien modèle",
      paragraphs: [
        "Les fiches d’opérations standardisées et les modèles de pièces sont revus régulièrement, et la sixième période CEE ouverte en 2026 a renforcé les exigences de collecte au dépôt. Réutiliser une attestation sur l’honneur enregistrée deux ans plus tôt, ou raisonner sur une fiche d’une période antérieure, revient à fabriquer soi-même le motif de refus que l’on cherche à éviter.",
        "Le contrôle est simple à intégrer dans la routine : avant de chiffrer, vérifiez la fiche en vigueur à la date d’engagement de l’opération, et repartez des modèles à jour plutôt que d’un dossier précédent. Dossimo génère les pièces à partir d’une saisie unique et d’une table de règles versionnée, ce qui rend l’écart entre devis et facture structurellement difficile à produire. C’est un service indépendant d’aide à la préparation de dossier, non affilié à l’Anah ni à France Rénov’ : il ne dépose pas le dossier et ne touche pas la prime.",
      ],
    },
  ],
  checklist: [
    { title: "Pièces produites par l’artisan RGE", text: "Devis conforme (fiche CEE, surface, résistance thermique, marque et référence de l’isolant, ACERMI, numéro et domaine RGE), facture reprenant ces mentions à l’identique, certificat RGE, fiche technique du produit, attestation sur l’honneur co-signée, photos avant et après." },
    { title: "Pièces fournies par le bénéficiaire", text: "Selon la situation : pièce d’identité, RIB, justificatif de propriété et d’occupation. Cas particuliers du bailleur (bail, engagement de location) et de la copropriété (procès-verbal d’assemblée, quote-part)." },
    { title: "Chronologie du rôle actif et incitatif", text: "L’offre CEE doit être engagée avant l’acceptation du devis. La constitution du dossier démarre donc avant les travaux, pas après." },
    { title: "Délai d’envoi", text: "Le dossier part au plus tard trois mois après la date de la facture. Anticipez la collecte des pièces pour ne pas dépasser ce délai." },
    { title: "Cohérence croisée des pièces", text: "Rapprochez devis, facture, attestation sur l’honneur et photos : surfaces, références et performances doivent être identiques d’une pièce à l’autre." },
    { title: "Version des modèles en vigueur", text: "Depuis 2026, la sixième période CEE renforce la collecte au dépôt et re-version fiches et modèles. Partez de la version en vigueur, jamais d’un modèle d’une période antérieure." },
  ],
  errors: [
    "Une mention (surface, référence, performance) diffère entre le devis et la facture.",
    "Une pièce du bénéficiaire manque et n’est réclamée qu’au moment du dépôt.",
    "Le dossier est envoyé plus de trois mois après la facture.",
    "L’attestation sur l’honneur n’est pas co-signée ou reprend des valeurs différentes.",
    "Un modèle ou une fiche d’une période antérieure est utilisé après le passage à la sixième période.",
  ],
  example: {
    before: "Les pièces sont réunies au fil de l’eau, sans relecture d’ensemble, et la facture porte une surface légèrement différente du devis.",
    after: "Chaque pièce est rapprochée des autres avant l’envoi, les écarts sont corrigés, et le dossier part dans le délai avec des mentions identiques partout.",
  },
  faq: [
    {
      question: "Quelles pièces composent un dossier CEE complet ?",
      answer:
        "Du côté de l’artisan : devis conforme, facture reprenant les mêmes mentions, certificat RGE, fiche technique du produit, attestation sur l’honneur co-signée, photos avant et après travaux. Du côté du bénéficiaire, selon la situation : pièce d’identité, RIB, justificatif de propriété et d’occupation, auxquels s’ajoutent le bail pour un bailleur et le procès-verbal d’assemblée en copropriété.",
    },
    {
      question: "Quel est le délai pour envoyer un dossier CEE ?",
      answer:
        "Le dossier part au plus tard trois mois après la date de la facture. Ce délai se consomme vite si la collecte des pièces du bénéficiaire ne commence qu’après le chantier : réunissez-les au fil de l’eau plutôt qu’à la fin.",
    },
    {
      question: "Qui fournit les pièces du bénéficiaire, et comment les obtenir à temps ?",
      answer:
        "Le bénéficiaire lui-même. C’est la partie du dossier sur laquelle l’artisan a le moins de prise et celle qui retarde le plus souvent l’envoi. Listez-les dès le premier rendez-vous, en identifiant tout de suite les cas particuliers du bailleur et de la copropriété, dont les pièces demandent parfois plusieurs semaines.",
    },
    {
      question: "Faut-il des photos avant et après travaux ?",
      answer:
        "Oui, elles font partie des modes de preuve attendus. Leur particularité est de ne pas se rattraper : une photo d’avant travaux prise après l’isolation des combles n’existe pas. Prévoyez-les au moment du devis, pas au moment du dépôt.",
    },
    {
      question: "Le dossier peut-il être refusé alors que chaque pièce est correcte ?",
      answer:
        "Oui, et c’est le cas le plus fréquent. L’instructeur ne visite pas le chantier : il rapproche les pièces entre elles. Une surface, une référence ou une performance qui diffère d’un document à l’autre suffit à bloquer la prime, même si chaque document est irréprochable pris isolément.",
    },
    {
      question: "Peut-on réutiliser les modèles d’un dossier précédent ?",
      answer:
        "C’est risqué. Les fiches d’opérations standardisées et les modèles de pièces sont revus régulièrement, et la sixième période ouverte en 2026 a renforcé les exigences de collecte au dépôt. Repartez de la version en vigueur à la date d’engagement de l’opération plutôt que d’un dossier antérieur.",
    },
  ],
  sources: [
    { label: "Questions-réponses officielles sur le dispositif CEE (ecologie.gouv.fr)", href: questionsCee },
    { label: "Catalogue officiel des fiches d’opérations standardisées CEE", href: catalogueCee },
    { label: "Mentions obligatoires d’une facture — Service Public", href: mentionsFacture },
  ],
  pourAllerPlusLoin: {
    heading: "Pas le temps de monter ce pack vous-même ?",
    liens: [
      {
        label: "Déléguer le montage de vos dossiers CEE",
        href: "/deleguer-montage-dossier-cee",
        description: "Ce que recouvre chaque option de délégation, ce qu’elle coûte, et comment garder la main sur votre client.",
      },
      {
        label: "Sous-traiter un dossier MaPrimeRénov’",
        href: "/sous-traiter-dossier-maprimerenov",
        description: "Ce qui peut être délégué sans risque, et ce qui reste toujours de votre responsabilité.",
      },
      {
        label: "Combien de temps prend vraiment un dossier CEE",
        href: "/temps-montage-dossier-cee",
        description: "Où part réellement le temps sur un dossier, et comment le reprendre.",
      },
      {
        label: "La checklist à relire avant de déposer",
        href: "/checklist-avant-depot",
        description: "Douze points de contrôle, communs aux deux dispositifs ou propres à chacun.",
      },
    ],
  },
};
