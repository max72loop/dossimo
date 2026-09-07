import type { SeoGuide } from "../types";
import { franceRenovDevis, mentionsFacture } from "../sources";

export const mentions: SeoGuide = {
  slug: "mentions-obligatoires-devis-rge",
  metaTitle: "Mentions obligatoires d’un devis RGE : checklist 2026",
  title: "Mentions obligatoires d’un devis RGE : une relecture en 3 blocs",
  description:
    "Checklist des mentions d’entreprise, de chantier et de travaux à contrôler sur un devis RGE avant un dossier MaPrimeRénov’ ou CEE.",
  eyebrow: "Guide pratique · Devis artisan RGE",
  category: "Devis & conformité",
  updated: "2026-07-28",
  intro:
    "La conformité se vérifie plus vite lorsque le devis est relu en trois blocs : l’entreprise, le client et le chantier, puis la description technique et financière des travaux.",
  sections: [
    {
      heading: "Deux couches de mentions, pas une",
      paragraphs: [
        "Un devis d’artisan RGE porte en réalité deux séries d’obligations qui se superposent. La première relève du droit commun : ce sont les mentions qu’un devis doit comporter quel que soit le chantier, parce qu’il engage une entreprise vis-à-vis d’un consommateur. La seconde relève des dispositifs d’aide, MaPrimeRénov’ ou CEE, qui exigent en plus de quoi vérifier l’éligibilité du geste.",
        "Cette superposition explique un malentendu fréquent. Un devis peut être parfaitement valable commercialement, avoir été accepté sans réserve par le client, et faire tomber la prime parce qu’il lui manque une caractéristique technique dont le droit commun se moque. À l’inverse, un devis très détaillé techniquement mais dont le bloc entreprise est incomplet posera problème au moment du rapprochement avec la facture. Les deux couches doivent tenir ensemble.",
      ],
    },
    {
      heading: "Bloc entreprise : désigner sans ambiguïté qui facture",
      paragraphs: [
        "Le premier bloc identifie l’entreprise : raison sociale, forme juridique le cas échéant, adresse, identifiants d’immatriculation, SIRET, coordonnées. L’exigence de fond n’est pas décorative : le dossier d’aide doit pouvoir rattacher le devis, la facture, le certificat RGE et l’attestation sur l’honneur à une seule et même entité, sans reconstitution.",
        "Les écarts se glissent là où on ne les attend pas. Un nom commercial sur le devis et une raison sociale sur la facture, une adresse de siège d’un côté et d’établissement de l’autre, un SIRET d’un établissement secondaire : chacun de ces cas crée un doute légitime sur l’identité du prestataire. Choisissez une désignation unique et tenez-la sur toutes les pièces du dossier.",
      ],
    },
    {
      heading: "Bloc client et chantier : l’adresse d’exécution est décisive",
      paragraphs: [
        "Le deuxième bloc identifie le bénéficiaire et le lieu des travaux. C’est ici que se joue une confusion coûteuse : l’adresse de facturation n’est pas l’adresse du chantier. Un logement mis en location, une résidence secondaire, un client qui a déménagé en cours de projet suffisent à les dissocier. Or c’est l’adresse d’exécution qui conditionne l’aide, puisqu’elle détermine le logement financé.",
        "Écrivez cette adresse en entier, telle qu’elle figurera dans la demande d’aide : numéro, voie, complément d’adresse, code postal, commune. Les abréviations et les identifications partielles, comme la seule mention de la ville, laissent planer un doute que le dossier ne pourra pas lever. Le nom du client doit lui aussi correspondre exactement à celui du bénéficiaire déclaré.",
      ],
    },
    {
      heading: "Bloc technique : ce qui n’est pas écrit n’existe pas",
      paragraphs: [
        "Le troisième bloc décrit les travaux, et c’est celui qui fait la différence entre un devis ordinaire et un devis qui ouvre droit à une aide. Chaque poste doit porter la nature du geste, la quantité, l’unité, le produit posé avec sa marque et sa référence, et les performances exigées par le dispositif visé, comme la résistance thermique pour un isolant.",
        "La règle de relecture tient en une phrase : ce qui n’est pas écrit sur le devis n’existe pas pour l’instructeur. Une performance annoncée dans une documentation fabricant, une précision donnée oralement au client, une caractéristique évidente pour un professionnel du métier ne comptent pas. Le corollaire est qu’une ligne unique regroupant plusieurs gestes est presque toujours un problème : elle mélange des critères techniques distincts, et souvent des taux de TVA différents.",
      ],
    },
    {
      heading: "Bloc financier : préparer le rapprochement avec la facture",
      paragraphs: [
        "Le quatrième bloc rend les montants comparables : prix unitaires ou forfaits explicites, total hors taxes, taux et montant de TVA, total toutes taxes comprises, conditions de règlement et durée de validité. L’enjeu n’est pas la facture en tant que telle, c’est le rapprochement ligne à ligne qui sera fait plus tard entre le devis et la facture.",
        "Un devis construit poste par poste rend ce rapprochement mécanique. Un devis au forfait le rend impossible : personne ne peut vérifier que la facture correspond au devis si aucun des deux ne détaille. Vérifiez enfin que les totaux se recoupent réellement, l’incohérence arithmétique étant l’un des signaux qui déclenchent un examen plus poussé de tout le dossier.",
      ],
    },
    {
      heading: "Sous-traitance et qualification RGE",
      paragraphs: [
        "Dernier point, souvent oublié : lorsque le geste est sous-traité, c’est la qualification RGE de l’entreprise qui exécute réellement les travaux qui doit couvrir ce geste. Le numéro RGE porté sur le devis doit être vérifiable et associé au bon domaine de travaux, pas simplement mentionné.",
        "Dossimo relit ces quatre blocs automatiquement et remonte les écarts avant le dépôt. C’est un service indépendant d’aide à la préparation de dossier, non affilié à l’Anah ni à France Rénov’ : il ne dépose pas le dossier et ne touche pas la prime.",
      ],
    },
  ],
  checklist: [
    { title: "Bloc entreprise", text: "Raison sociale, forme juridique le cas échéant, adresse, identifiants d’immatriculation, SIRET et coordonnées doivent désigner sans ambiguïté l’entreprise qui facture." },
    { title: "Bloc client et chantier", text: "Le nom du client et l’adresse d’exécution doivent correspondre aux autres pièces du dossier, sans abréviation qui crée un doute." },
    { title: "Bloc technique", text: "Chaque poste décrit la nature, la quantité, l’unité, le produit et les performances nécessaires au dispositif visé." },
    { title: "Bloc financier", text: "Prix unitaires ou forfaits explicites, totaux HT, taux et montant de TVA, TTC, conditions de règlement et durée de validité." },
    { title: "Sous-traitance et RGE", text: "Lorsque ces informations sont requises, identifiez la sous-traitance et les qualifications correspondant aux travaux réellement exécutés." },
  ],
  errors: [
    "Une seule ligne vague regroupe plusieurs gestes et plusieurs taux de TVA.",
    "Le chantier est identifié uniquement par la ville ou par l’adresse de facturation.",
    "La performance est présente dans une brochure, mais pas sur le devis.",
    "Le numéro RGE est indiqué sans domaine de travaux vérifiable.",
    "Les totaux HT, TVA et TTC ne se recoupent pas.",
  ],
  example: {
    before: "Fourniture et pose matériel selon normes — 12 000 €",
    after: "Une ligne par geste avec lieu de pose, quantité, unité, marque, référence, performance, prix HT, TVA et TTC.",
  },
  faq: [
    {
      question: "Quelles mentions sont obligatoires sur un devis d’artisan RGE ?",
      answer:
        "Deux séries se superposent. Celles du droit commun d’abord : identité complète de l’entreprise, SIRET, coordonnées, identité du client, description et prix des prestations, totaux HT et TTC, TVA, durée de validité. Celles des dispositifs d’aide ensuite : adresse exacte du logement, caractéristiques techniques du geste, marque et référence du produit, performances, numéro et domaine RGE.",
    },
    {
      question: "L’adresse du chantier doit-elle vraiment figurer sur le devis ?",
      answer:
        "Oui, et en entier. C’est l’adresse d’exécution des travaux qui conditionne l’aide, pas l’adresse de facturation. Les deux diffèrent dès qu’il s’agit d’un logement mis en location, d’une résidence secondaire ou d’un client qui a déménagé. Une identification par la seule ville ne suffit pas.",
    },
    {
      question: "Peut-on regrouper plusieurs gestes sur une même ligne ?",
      answer:
        "C’est déconseillé et souvent bloquant. Chaque geste a ses propres critères techniques d’éligibilité, et parfois son propre taux de TVA. Une ligne unique empêche de rattacher les critères au bon geste et rend impossible le rapprochement ligne à ligne entre le devis et la facture.",
    },
    {
      question: "Une performance annoncée dans la documentation du fabricant compte-t-elle ?",
      answer:
        "Non. Ce qui n’est pas écrit sur le devis n’existe pas pour l’instructeur. La résistance thermique, la marque, la référence et les caractéristiques exigées par le dispositif doivent figurer sur le devis lui-même, même si elles paraissent évidentes pour un professionnel du métier.",
    },
    {
      question: "Le numéro RGE suffit-il, ou faut-il préciser le domaine ?",
      answer:
        "Le numéro seul ne suffit pas à démontrer l’éligibilité. La qualification doit couvrir le domaine du geste facturé et être valable à la date utile. Un domaine voisin ne vaut pas couverture, et en cas de sous-traitance, c’est l’entreprise qui exécute réellement le geste qui doit détenir la qualification.",
    },
    {
      question: "Que se passe-t-il si le devis et la facture diffèrent ?",
      answer:
        "C’est le motif de refus le plus courant. Un écart de surface, de référence produit ou de performance suffit à bloquer le dossier, même si chaque pièce est correcte prise isolément. La parade se prépare au devis : mêmes désignations, mêmes unités, mêmes valeurs, dans le même découpage de postes.",
    },
  ],
  sources: [
    { label: "Bonnes pratiques des professionnels MaPrimeRénov’", href: franceRenovDevis },
    { label: "Mentions obligatoires d’une facture — Service Public", href: mentionsFacture },
  ],
  pourAllerPlusLoin: {
    heading: "Pas le temps de monter ce pack vous-même ?",
    liens: [
      {
        label: "Sous-traiter un dossier MaPrimeRénov’",
        href: "/sous-traiter-dossier-maprimerenov",
        description: "Ce qui peut être délégué sans risque, et ce qui reste toujours de votre responsabilité.",
      },
      {
        label: "La checklist à relire avant de déposer",
        href: "/checklist-avant-depot",
        description: "Douze points de contrôle, communs aux deux dispositifs ou propres à chacun.",
      },
    ],
  },
};
