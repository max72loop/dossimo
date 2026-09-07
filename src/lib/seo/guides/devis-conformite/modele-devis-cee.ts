import type { SeoGuide } from "../types";
import { catalogueCee, mentionsFacture, questionsCee } from "../sources";

export const modeleCee: SeoGuide = {
  slug: "modele-devis-cee",
  metaTitle: "Modèle de devis CEE : structure et exemple ligne par ligne",
  title: "Modèle de devis CEE : la structure à reprendre, avec un exemple",
  description:
    "Il n’existe pas de modèle officiel imposé de devis CEE, mais une structure et des mentions à respecter. Les blocs à reprendre et un exemple de ligne conforme, geste par geste.",
  eyebrow: "Guide artisan RGE · Modèle de devis CEE",
  category: "Devis & conformité",
  updated: "2026-07-19",
  intro:
    "« Où trouver un modèle de devis CEE ? » revient souvent, et la réponse tient en deux temps : il n’existe pas de modèle officiel imposé, mais un devis CEE doit respecter des mentions et une structure précises pour ouvrir droit à la prime. Ce guide donne la trame à reprendre, bloc par bloc, et un exemple de ligne conforme pour un geste d’isolation.",
  sections: [
    {
      heading: "Pas de modèle officiel, mais des mentions non négociables",
      paragraphs: [
        "Aucun formulaire type n’est imposé pour un devis CEE : vous pouvez partir de votre propre modèle d’entreprise. Ce qui est encadré, ce n’est pas la forme du document mais son contenu. Un devis reste soumis aux mentions obligatoires habituelles (identité de l’entreprise, SIRET, client, prix détaillés), et un devis CEE y ajoute ce qui rend le geste vérifiable au regard de sa fiche d’opération standardisée.",
        "Autrement dit, un « modèle de devis CEE » réussi n’est pas un joli gabarit Word : c’est un document dont chaque ligne éligible peut être rapprochée d’une fiche officielle et, plus tard, d’une facture identique. C’est cette relecture qui décide de la prime, pas la mise en page.",
      ],
    },
    {
      heading: "Les blocs à reprendre",
      paragraphs: [
        "Un devis CEE contrôlable s’organise en blocs stables, quel que soit votre gabarit : un en-tête entreprise (raison sociale, SIRET, coordonnées, qualification RGE et son domaine) ; un bloc d’identification du client et de l’adresse exacte du chantier ; une ou plusieurs lignes de geste, une par opération, portant les critères de la fiche CEE applicable ; un bloc financier détaillé (prix unitaires, HT, taux et montant de TVA, TTC) ; enfin les mentions de validité et de dates. La checklist ci-dessous reprend ces blocs un à un.",
      ],
    },
    {
      heading: "La ligne de geste, cœur d’un devis CEE",
      paragraphs: [
        "C’est la ligne de geste qui distingue un devis CEE d’un devis ordinaire. Une ligne au forfait du type « pose d’un isolant conforme » ne prouve rien. La même opération devient contrôlable dès lors qu’elle précise la fiche CEE visée, la zone concernée, la surface, le matériau, sa marque et sa référence, l’épaisseur et la performance thermique (résistance thermique R pour un isolant, avec sa certification quand la fiche l’exige).",
        "Consacrez une ligne par geste et ne mélangez jamais les critères de deux fiches sur la même ligne. Si un chantier combine plusieurs opérations, chacune a sa ligne, sa fiche et ses critères propres.",
      ],
    },
    {
      heading: "Comment produire le vôtre",
      paragraphs: [
        "Vous pouvez composer ce devis dans votre outil habituel, à condition de vérifier chaque ligne contre la fiche en vigueur et de garder en tête le rapprochement futur avec la facture. L’espace Dossimo propose une bibliothèque de devis qui génère ce bloc de lignes (désignation, caractéristiques, référence de fiche CEE et mentions RGE) prêt à intégrer, à partir d’une saisie unique : le devis et la facture partant de la même source, l’écart entre les deux, premier motif de refus, devient très difficile à produire par accident.",
        "Dossimo est un service indépendant d’aide à la préparation de dossier, non affilié à l’Anah ni à France Rénov’. Il ne dépose pas le dossier et ne touche pas la prime.",
      ],
    },
  ],
  checklist: [
    { title: "En-tête entreprise", text: "Raison sociale, forme juridique le cas échéant, adresse, SIRET, coordonnées, et la qualification RGE avec son domaine, lisible sans ambiguïté." },
    { title: "Client et chantier", text: "Nom du client et adresse exacte du logement concerné, identiques à celles qui figureront sur la facture et le reste du dossier." },
    { title: "Ligne de geste CEE", text: "Une ligne par opération : fiche applicable, zone, surface ou quantité, matériau, marque, référence, épaisseur et performance exigée par la fiche." },
    { title: "Bloc financier", text: "Prix unitaires ou forfaits explicites, total HT, taux et montant de TVA, TTC, afin que la future facture se rapproche ligne à ligne." },
    { title: "Dates et validité", text: "Durée de validité du devis et emplacement pour la date d’acceptation signée, qui devra rester postérieure à l’engagement de l’offre CEE." },
  ],
  errors: [
    "Une ligne au forfait regroupe le geste sans fiche, surface ni performance.",
    "La référence de la fiche CEE applicable n’apparaît nulle part.",
    "Le même modèle sert pour deux gestes sans distinguer leurs critères.",
    "La performance (résistance thermique, référence produit) est renvoyée à une brochure au lieu d’être sur le devis.",
    "Le devis n’a pas de place pour une date d’acceptation lisible.",
  ],
  example: {
    before: "Pose d’un isolant conforme CEE — forfait 4 800 € TTC",
    after: "Isolation de 95 m² de combles perdus — fiche CEE applicable, isolant (marque, référence), épaisseur et résistance thermique R indiquées — prix HT, TVA et TTC séparés.",
  },
  faq: [
    {
      question: "Existe-t-il un modèle officiel de devis CEE ?",
      answer:
        "Non. Aucun formulaire type n’est imposé. Vous utilisez votre propre modèle de devis, à condition qu’il respecte les mentions obligatoires d’un devis et qu’il fasse figurer, pour chaque ligne éligible, les critères de la fiche d’opération standardisée concernée.",
    },
    {
      question: "Où trouver un exemple de devis CEE ?",
      answer:
        "La trame et l’exemple de ligne de ce guide en donnent la structure. Dans l’espace Dossimo, la bibliothèque de devis génère un bloc de lignes conforme (désignation, caractéristiques, référence de fiche CEE, mentions RGE) à partir d’une saisie unique, prêt à intégrer à votre devis.",
    },
    {
      question: "Un modèle Word ou Excel suffit-il pour un devis CEE ?",
      answer:
        "Techniquement oui, la forme est libre. Le risque n’est pas l’outil mais l’écart : un devis et une facture composés séparément finissent souvent par diverger sur une surface ou une référence, ce qui bloque le dossier. L’intérêt d’une saisie unique est justement d’empêcher cet écart.",
    },
    {
      question: "Le devis CEE doit-il mentionner le montant de la prime ?",
      answer:
        "Le devis chiffre les travaux, pas la prime, dont le montant relève de l’offre CEE et de ses conditions. Ce qui compte sur le devis, c’est de décrire le geste de façon vérifiable et de garder une chronologie cohérente : offre CEE engagée avant l’acceptation du devis.",
    },
  ],
  sources: [
    { label: "Catalogue officiel des fiches d’opérations standardisées CEE", href: catalogueCee },
    { label: "Mentions obligatoires d’une facture — Service Public", href: mentionsFacture },
    { label: "Questions-réponses officielles sur le dispositif CEE", href: questionsCee },
  ],
};
