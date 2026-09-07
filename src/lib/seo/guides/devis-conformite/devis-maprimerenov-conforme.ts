import type { SeoGuide } from "../types";
import { franceRenovDevis, franceRenovDossier, mentionsFacture } from "../sources";

export const maprimerenov: SeoGuide = {
  slug: "devis-maprimerenov-conforme",
  metaTitle: "Devis MaPrimeRénov' conforme : checklist artisan RGE",
  title: "Devis MaPrimeRénov’ conforme : la checklist avant signature",
  description:
    "Vérifiez les mentions, le RGE, l’adresse, les montants et les caractéristiques techniques d’un devis MaPrimeRénov’ avant le dépôt.",
  eyebrow: "Guide artisan RGE · MaPrimeRénov’",
  category: "Devis & conformité",
  updated: "2026-07-28",
  intro:
    "Un devis lisible ne suffit pas : les informations de l’entreprise, du logement, des travaux et de la qualification doivent rester cohérentes avec la demande d’aide puis avec la facture. Cette checklist organise la relecture avant que le client ne dépose son dossier.",
  sections: [
    {
      heading: "Le devis est la pièce sur laquelle l’aide est instruite",
      paragraphs: [
        "Dans un dossier MaPrimeRénov’, le devis n’arrive pas en fin de parcours commercial : il ouvre le dossier. C’est à partir de lui que la demande d’aide est déposée, que le montant est calculé et que l’éligibilité du geste est appréciée. Tout ce qui manquera au devis manquera à l’instruction, et devra être rattrapé par une pièce complémentaire, quand c’est encore possible.",
        "Cette place particulière change la façon de le rédiger. Un devis pensé pour convaincre un client met en avant le résultat et le prix. Un devis pensé pour un dossier MaPrimeRénov’ doit en plus rendre le geste vérifiable par quelqu’un qui n’a jamais vu le chantier et qui ne dispose que du papier. Les deux objectifs ne s’opposent pas, mais le second demande un niveau de détail que le premier n’impose pas.",
      ],
    },
    {
      heading: "Identifier le logement, pas seulement le client",
      paragraphs: [
        "MaPrimeRénov’ finance un logement, avec ses propres conditions d’ancienneté et d’occupation. L’adresse d’exécution des travaux est donc une donnée de fond, pas une formalité. Elle doit être écrite en entier sur le devis et correspondre exactement à celle renseignée dans la demande d’aide, y compris le complément d’adresse dans un immeuble.",
        "L’erreur classique consiste à reprendre l’adresse de facturation du client. Elle diffère de l’adresse du chantier dès qu’il s’agit d’un bien loué, d’une résidence secondaire ou d’un client qui a déménagé pendant le projet. Le nom du bénéficiaire doit lui aussi correspondre à celui de la demande : en indivision ou en couple, c’est la personne déclarée comme demandeur qui doit apparaître.",
      ],
    },
    {
      heading: "Décrire chaque geste séparément",
      paragraphs: [
        "MaPrimeRénov’ raisonne geste par geste, chacun avec ses critères techniques et son barème. Un devis qui présente un forfait global empêche d’instruire quoi que ce soit : il faut une ligne par geste, avec la quantité, l’unité, le produit posé et les performances attendues pour ce geste précis. Pour une isolation, la surface et la résistance thermique. Pour un équipement, la marque, la référence et les caractéristiques de performance.",
        "Ce découpage sert deux fois. Il permet d’abord d’instruire la demande. Il permet ensuite de rapprocher la facture du devis poste par poste, contrôle que l’Anah opère au moment du versement. Un devis détaillé et une facture au forfait replacent l’artisan dans la même impasse : rien ne se recoupe.",
      ],
    },
    {
      heading: "La qualification RGE doit couvrir le geste, à la bonne date",
      paragraphs: [
        "Être RGE ne suffit pas. La qualification doit couvrir le domaine de travaux concerné et être valable à la date qui compte pour le dispositif. Une entreprise qualifiée en chauffage qui pose une isolation de combles n’ouvre pas droit à l’aide pour ce geste, même si le chantier est irréprochable.",
        "Deux situations méritent une vérification systématique. Un devis à plusieurs postes relevant de domaines différents demande que chaque geste soit couvert, pas seulement le principal. Et lorsqu’un poste est sous-traité, c’est la qualification de l’entreprise qui exécute réellement le geste qui compte. Vérifiez enfin la date d’échéance : une qualification qui expire entre la signature et la fin du chantier crée un risque évitable.",
      ],
    },
    {
      heading: "Relire avant signature, jamais après",
      paragraphs: [
        "La logique commune à tous ces contrôles est temporelle. Une fois le devis signé et le dossier déposé, chaque correction devient un devis rectificatif, un nouvel envoi et un délai supplémentaire, quand elle ne fait pas tomber la demande. Avant signature, les mêmes corrections coûtent quelques minutes de relecture.",
        "Cette relecture porte sur trois cohérences : entre le devis et la demande d’aide, entre le devis et la future facture, et entre les travaux décrits et la qualification invoquée. Dossimo les vérifie automatiquement et remonte les points de vigilance avant le dépôt. C’est un service indépendant d’aide à la préparation de dossier, non affilié à l’Anah ni à France Rénov’ : il ne dépose jamais le dossier et ne touche jamais la prime, que le client et vous gardez entre vos mains.",
      ],
    },
  ],
  checklist: [
    { title: "Identifier les deux parties", text: "Vérifiez la raison sociale, le SIRET, l’adresse de l’entreprise, le nom du client et l’adresse exacte du logement concerné." },
    { title: "Décrire chaque geste", text: "Séparez les postes et indiquez les quantités, surfaces, performances, marques ou références nécessaires à l’instruction du geste." },
    { title: "Contrôler la qualification", text: "La qualification RGE doit couvrir le domaine de travaux concerné et être valable à la date utile du dossier." },
    { title: "Rendre les montants comparables", text: "Détaillez prix unitaires, HT, taux de TVA, TVA et TTC afin que la future facture puisse être rapprochée ligne à ligne." },
    { title: "Relire avant engagement", text: "Contrôlez dates, conditions de paiement, durée de validité et cohérence globale avant signature ou dépôt." },
  ],
  errors: [
    "Adresse du chantier différente de celle renseignée dans la demande.",
    "SIRET, raison sociale ou coordonnées incomplets ou divergents.",
    "Performance technique attendue mais absente de la ligne de travaux.",
    "Qualification RGE non adaptée au geste ou non vérifiable à la bonne date.",
    "Devis et facture impossibles à rapprocher poste par poste.",
  ],
  example: {
    before: "Isolation des combles — forfait : 6 500 € TTC",
    after: "Isolation de 95 m² de combles perdus — isolant, référence, épaisseur et résistance thermique détaillés — prix HT, TVA et TTC séparés.",
  },
  faq: [
    {
      question: "Que doit contenir un devis pour être accepté par MaPrimeRénov’ ?",
      answer:
        "L’identité complète de l’entreprise avec son SIRET, le nom du bénéficiaire tel que déclaré, l’adresse exacte du logement où les travaux sont exécutés, une ligne par geste avec quantité, unité, produit et performances, le numéro et le domaine de qualification RGE, et le détail des montants HT, TVA et TTC poste par poste.",
    },
    {
      question: "Faut-il déposer la demande avant ou après la signature du devis ?",
      answer:
        "La demande d’aide se dépose avant le début des travaux, à partir du devis. C’est ce devis qui sert de base à l’instruction et au calcul du montant. Commencer le chantier avant l’accord expose le dossier à un refus, et les règles de démarrage se vérifient dans le mode d’emploi en vigueur à la date du projet.",
    },
    {
      question: "Un devis au forfait peut-il passer ?",
      answer:
        "Difficilement. MaPrimeRénov’ instruit geste par geste, avec des critères techniques propres à chacun. Un forfait global ne permet ni de vérifier l’éligibilité, ni de rapprocher ensuite la facture du devis poste par poste, contrôle opéré au moment du versement.",
    },
    {
      question: "L’adresse de facturation peut-elle remplacer l’adresse du chantier ?",
      answer:
        "Non. MaPrimeRénov’ finance un logement précis, avec ses conditions d’ancienneté et d’occupation. L’adresse d’exécution des travaux doit figurer en entier sur le devis et correspondre exactement à celle de la demande, complément d’adresse compris dans un immeuble.",
    },
    {
      question: "Mon RGE couvre-t-il automatiquement tous les postes du devis ?",
      answer:
        "Non. Chaque geste doit relever d’un domaine de qualification effectivement détenu. Un devis à plusieurs postes relevant de domaines différents exige que chacun soit couvert, et pas seulement le poste principal. En sous-traitance, c’est l’entreprise qui exécute réellement le geste qui doit détenir la qualification.",
    },
    {
      question: "Que faire si un produit change entre le devis et la facture ?",
      answer:
        "Le produit de remplacement doit rester éligible et sa performance au moins équivalente à celle annoncée. Le changement doit être tracé, par un devis rectificatif ou une pièce complémentaire selon le cas, plutôt que découvert par l’instructeur au moment du rapprochement entre le devis et la facture.",
    },
  ],
  sources: [
    { label: "Bonnes pratiques devis et factures MaPrimeRénov’ — France Rénov’", href: franceRenovDevis },
    { label: "Bien monter son dossier MaPrimeRénov’ — France Rénov’", href: franceRenovDossier },
    { label: "Mentions obligatoires d’une facture — Service Public", href: mentionsFacture },
  ],
  pourAllerPlusLoin: {
    heading: "Pas envie de gérer ce compte à la place du client ?",
    liens: [
      {
        label: "L’alternative au mandataire MaPrimeRénov’",
        href: "/alternative-mandataire-maprimerenov",
        description: "Préparer un pack vérifié et déposer vous-même, sans céder la relation client ni la prime à un mandataire.",
      },
      {
        label: "Sous-traiter un dossier MaPrimeRénov’",
        href: "/sous-traiter-dossier-maprimerenov",
        description: "Ce qui peut être délégué sans risque, et ce qui reste toujours de votre responsabilité.",
      },
    ],
  },
};
