import type { SeoGuide } from "../types";
import { catalogueCee, mentionsFacture, questionsCee } from "../sources";

export const prixCee: SeoGuide = {
  slug: "prix-devis-cee",
  metaTitle: "Devis CEE gratuit ? Ce qui fait le prix et le reste à charge",
  title: "Devis CEE : gratuit ou payant, et ce qui fait varier le reste à charge",
  description:
    "Un devis CEE est-il gratuit, et qu’est-ce qui fait varier son prix et le reste à charge ? Les repères pour lire un devis, distinguer les travaux de la prime et comparer deux offres sans se tromper.",
  eyebrow: "Guide artisan RGE · Prix & devis CEE",
  category: "Devis & conformité",
  updated: "2026-07-19",
  intro:
    "« Devis CEE gratuit », « prix d’un devis CEE » : derrière ces recherches, deux questions se mélangent, l’établissement du devis lui-même et le coût réel des travaux une fois la prime déduite. Ce guide les sépare, sans annoncer de montant de prime : celui-ci dépend de la fiche, du geste et de l’offre du signataire, jamais d’un barème universel. L’objectif est de savoir lire un devis CEE et d’en comparer deux sans se faire piéger.",
  sections: [
    {
      heading: "Un devis CEE est-il gratuit ?",
      paragraphs: [
        "Dans la très grande majorité des cas, l’établissement d’un devis est gratuit et n’engage à rien tant qu’il n’est pas signé. La loi autorise toutefois un professionnel à facturer un devis, notamment lorsqu’il demande une étude poussée ou un déplacement, à la condition d’en informer le client à l’avance. Un devis « gratuit » qui se transforme en diagnostic payant non annoncé est un signal à ne pas ignorer.",
        "Signer le devis, en revanche, n’est jamais anodin pour un dossier CEE : la date d’acceptation doit rester postérieure à l’engagement de l’offre CEE, et aucun acompte engageant ne doit être versé avant que cette chronologie soit établie.",
      ],
    },
    {
      heading: "Prime CEE et reste à charge : ce que le devis doit montrer",
      paragraphs: [
        "Un devis chiffre les travaux : prix des fournitures et de la pose, en HT, TVA et TTC. La prime CEE, elle, vient en déduction ou en versement selon l’offre choisie, et son montant dépend de la fiche d’opération, des caractéristiques du geste et de l’offre du signataire de CEE. Il n’existe donc pas de prix unique d’un chantier CEE : deux logements identiques peuvent afficher des restes à charge différents selon les offres mobilisées.",
        "Ce que le devis doit rendre lisible, c’est la frontière : le coût des travaux d’un côté, la prime de l’autre. Un devis qui fond les deux dans un seul chiffre « tout compris » empêche de savoir ce qui reste réellement à payer, et rend le rapprochement avec la facture plus fragile.",
      ],
    },
    {
      heading: "Méfiance sur le « reste à charge nul »",
      paragraphs: [
        "Les offres qui promettent un reste à charge quasi nul ou une somme symbolique sont à examiner de près : les conditions d’accès ont été resserrées au fil des périodes CEE, et un tel argument sert parfois de porte d’entrée à du démarchage agressif. Une prime n’est valable que si l’offre a réellement précédé la décision de travaux ; un « c’est gratuit, signez ici » qui court-circuite cette chronologie fabrique le motif de rejet qu’il prétend éviter.",
        "Le bon réflexe est de revenir au devis détaillé : quel est le coût des travaux, quelle offre CEE, engagée à quelle date. Un montant final crédible se reconstruit à partir de ces éléments, pas d’un slogan.",
      ],
    },
    {
      heading: "Comparer deux devis CEE sans se tromper",
      paragraphs: [
        "Comparer deux devis n’a de sens qu’à périmètre égal : mêmes surfaces, mêmes performances visées, mêmes fiches d’opération. Un prix plus bas qui repose sur une résistance thermique moindre, une surface réduite ou une ligne qui ne correspond pas à la fiche n’est pas une bonne affaire : il expose à un refus, et un dossier refusé coûte bien plus que l’écart de prix initial.",
        "Mettez donc les deux devis en regard ligne à ligne avant de regarder le total. Le devis le plus intéressant est celui qui reste conforme et vérifiable, pas seulement le moins cher.",
      ],
    },
  ],
  checklist: [
    { title: "Gratuité et conditions", text: "Le devis est en principe gratuit ; toute facturation d’étude ou de déplacement doit être annoncée avant, jamais découverte après." },
    { title: "Travaux et prime séparés", text: "Le coût des travaux (HT, TVA, TTC) apparaît distinctement du montant de la prime CEE, pour savoir ce qui reste réellement à payer." },
    { title: "Taux de TVA cohérent", text: "Vérifiez que le taux de TVA réduit applicable à la rénovation énergétique est correctement appliqué au bon poste de travaux." },
    { title: "Périmètre comparable", text: "Pour comparer deux devis, alignez surfaces, performances et fiches visées ; sinon les prix ne sont pas comparables." },
    { title: "Pas d’acompte prématuré", text: "Aucun acompte engageant avant que l’offre CEE soit engagée et la chronologie du rôle incitatif établie." },
  ],
  errors: [
    "Le devis fond le coût des travaux et le montant de la prime en un seul chiffre « tout compris ».",
    "Un « reste à charge nul » est mis en avant sans que l’offre CEE ait précédé l’acceptation du devis.",
    "Deux devis sont comparés à surfaces ou performances différentes.",
    "Un devis annoncé gratuit se double d’un diagnostic payant non prévu.",
    "Un acompte est réclamé avant que la chronologie du rôle incitatif soit établie.",
  ],
  example: {
    before: "Isolation des combles — reste à charge 1 €, tout compris",
    after: "Coût des travaux détaillé (HT, TVA, TTC) et prime CEE indiquée à part, offre engagée avant l’acceptation du devis.",
  },
  faq: [
    {
      question: "Un devis CEE est-il gratuit ?",
      answer:
        "En principe oui : établir un devis est gratuit et sans engagement tant qu’il n’est pas signé. Un professionnel peut toutefois facturer un devis nécessitant une étude ou un déplacement, à condition de l’annoncer au préalable. Un devis gratuit qui se transforme en diagnostic payant non prévu doit alerter.",
    },
    {
      question: "Combien coûte un chantier CEE au final ?",
      answer:
        "Il n’y a pas de prix unique. Le devis chiffre les travaux ; la prime CEE, qui dépend de la fiche, du geste et de l’offre du signataire, vient ensuite réduire le reste à charge. Deux logements identiques peuvent aboutir à des restes à charge différents selon l’offre mobilisée.",
    },
    {
      question: "Le devis affiche-t-il le montant de la prime CEE ?",
      answer:
        "Le devis chiffre d’abord les travaux. Le montant de la prime relève de l’offre CEE et de ses conditions ; l’essentiel est que le devis distingue clairement le coût des travaux de la prime, pour que le reste à charge soit lisible.",
    },
    {
      question: "Un reste à charge à 1 € ou nul est-il fiable ?",
      answer:
        "À examiner avec prudence. Les conditions se sont resserrées au fil des périodes CEE et ce type d’argument accompagne parfois du démarchage agressif. Vérifiez toujours le devis détaillé et que l’offre CEE a bien précédé la décision de travaux, sans quoi le dossier peut être rejeté.",
    },
    {
      question: "Pourquoi deux devis CEE affichent-ils des prix très différents ?",
      answer:
        "Souvent parce qu’ils ne portent pas sur le même périmètre : surfaces, performances visées ou fiches d’opération différentes. Comparez ligne à ligne, à périmètre égal, avant de regarder le total. Un prix bas obtenu au prix d’une moindre performance expose à un refus.",
    },
  ],
  sources: [
    { label: "Questions-réponses officielles sur le dispositif CEE", href: questionsCee },
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
    ],
  },
};
