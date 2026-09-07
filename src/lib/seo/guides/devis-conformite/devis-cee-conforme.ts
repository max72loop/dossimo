import type { SeoGuide } from "../types";
import { catalogueCee, mentionsFacture, questionsCee } from "../sources";

export const cee: SeoGuide = {
  slug: "devis-cee-conforme",
  metaTitle: "Devis CEE conforme : fiche, dates et preuve des travaux",
  title: "Devis CEE conforme : relier chaque ligne à la bonne fiche",
  description:
    "Préparez un devis CEE contrôlable : référence de fiche, caractéristiques techniques, qualification RGE, dates et preuves attendues.",
  eyebrow: "Guide artisan RGE · Certificats d’économies d’énergie",
  category: "Devis & conformité",
  updated: "2026-07-19",
  intro:
    "Une opération CEE est appréciée à partir de sa fiche d’opération standardisée et de ses modes de preuve. Le devis doit donc décrire précisément ce qui sera posé, sans mélanger les critères de plusieurs gestes. Ce guide détaille ce qui distingue un devis CEE d’un devis commercial ordinaire, ce qu’il doit faire figurer et comment le préparer pour qu’il tienne face au contrôle.",
  sections: [
    {
      heading: "Un devis CEE ne se lit pas comme un devis ordinaire",
      paragraphs: [
        "Un devis CEE n’est pas seulement une proposition de prix : c’est la première pièce d’un dossier qui sera contrôlé, et souvent celle qui fixe l’éligibilité de toute l’opération. Une prime CEE repose sur une fiche d’opération standardisée, un document officiel qui décrit le geste, les conditions à respecter et les preuves à fournir. Le devis doit permettre de rattacher chaque ligne à la bonne fiche et de vérifier, pièce en main, que les critères sont réunis.",
        "Concrètement, cela change la façon de le rédiger. Là où un devis commercial peut se contenter d’un forfait, un devis CEE doit rendre le geste vérifiable : nature exacte des travaux, surface ou quantité, matériau, référence, performance thermique. Ce qui n’apparaît pas noir sur blanc sur le devis devra être rattrapé plus tard, au moment du dépôt, quand il est souvent trop tard pour corriger sans refaire une pièce.",
      ],
    },
    {
      heading: "Relier chaque ligne à la bonne fiche d’opération",
      paragraphs: [
        "Le catalogue des fiches d’opérations standardisées liste, geste par geste, ce qui ouvre droit à une prime CEE (isolation, chauffage, ventilation, etc.). Chaque fiche a son périmètre et ses critères propres. La première décision, avant même de chiffrer, est d’identifier la fiche en vigueur qui correspond au bâtiment, au geste et à la date d’engagement de l’opération.",
        "Sur le devis, consacrez une ligne par geste et faites-y figurer les critères qui justifieront l’éligibilité : performances, dimensions, usages, marque et référence du produit. Ne mélangez jamais sur une même ligne les critères de deux fiches différentes : un contrôleur doit pouvoir mettre en regard votre ligne et la fiche, et retrouver chaque exigence. Une référence de fiche absente, ou une fiche qui ne correspond pas au geste réellement réalisé, est un motif de blocage classique.",
      ],
    },
    {
      heading: "Devis et facture : la cohérence se prépare dès le devis",
      paragraphs: [
        "Le motif de refus le plus fréquent n’est pas une erreur sur une pièce isolée : c’est un écart entre le devis et la facture. Une surface, une référence produit ou une performance qui diffère d’un document à l’autre suffit à bloquer le dossier, même si chaque pièce est correcte prise séparément.",
        "La parade se joue au moment du devis. Écrivez-le en pensant au rapprochement ligne à ligne qui aura lieu ensuite : mêmes désignations, mêmes références, mêmes performances, mêmes unités. Si un élément change entre le devis et la facture (un produit indisponible remplacé par un équivalent, par exemple), la nouvelle référence doit rester couverte par la même fiche et sa performance doit être tout aussi justifiable. Avec Dossimo, cette cohérence est structurelle : le devis et la facture sont générés depuis une saisie unique, donc l’écart devient très difficile à produire par accident.",
      ],
    },
    {
      heading: "La chronologie : l’offre CEE avant l’acceptation du devis",
      paragraphs: [
        "Une prime CEE n’est valable que si elle a réellement contribué à décider les travaux. C’est le rôle actif et incitatif : l’offre CEE doit être engagée avant que le client n’accepte le devis. Un engagement daté après l’acceptation fait tomber le dossier pour effet d’aubaine, sans recours. La date d’acceptation du devis, lisible sur la pièce signée, est donc un élément de conformité à part entière, pas un simple détail administratif.",
        "En pratique, ne démarrez ni travaux ni acompte engageant tant que cette chronologie n’est pas établie, et conservez la trace écrite qui rattache l’offre CEE à ce chantier précis. Ce point est développé dans notre guide dédié à l’offre CEE avant le devis.",
      ],
    },
    {
      heading: "Anticiper les preuves attendues",
      paragraphs: [
        "Chaque fiche précise ses modes de preuve. Au-delà du devis et de la facture, un dossier CEE mobilise en général des références produit, des fiches techniques, des certificats (l’ACERMI pour les isolants, par exemple), une attestation sur l’honneur co-signée et des photos avant et après travaux. Préparer ces éléments dès le devis évite de courir après les pièces au moment du dépôt.",
        "Dossimo est un service indépendant d’aide à la préparation de dossier, non affilié à l’Anah ni à France Rénov’. Il ne dépose pas le dossier et ne touche pas la prime : il vous aide à ce que chaque pièce soit cohérente avant que vous et votre client ne déposiez.",
      ],
    },
  ],
  checklist: [
    { title: "Choisir la fiche applicable", text: "Identifiez la fiche en vigueur correspondant au bâtiment, au geste et à la date d’engagement de l’opération." },
    { title: "Reprendre les critères utiles", text: "Faites apparaître sur le devis les performances, dimensions, usages et références qui permettront de justifier l’éligibilité." },
    { title: "Figer une chronologie claire", text: "Conservez une date d’engagement, une date de réalisation et une preuve d’achèvement cohérentes entre les pièces." },
    { title: "Vérifier le RGE à la date utile", text: "Lorsque la fiche exige une qualification, vérifiez son domaine et sa validité à la date d’engagement, souvent l’acceptation du devis." },
    { title: "Préparer la preuve", text: "Anticipez les références produit, certificats, attestations et éléments de facture demandés par la fiche." },
  ],
  errors: [
    "Référence CEE absente ou fiche qui ne correspond pas au geste réalisé.",
    "Critère technique de la fiche non repris sur le devis ou la facture.",
    "Date d’acceptation du devis incohérente avec le rôle actif et incitatif.",
    "Qualification RGE contrôlée à la mauvaise date.",
    "Référence produit différente entre devis, facture et justificatif.",
  ],
  example: {
    before: "Pose d’un isolant conforme CEE — 4 800 €",
    after: "Fiche CEE, zone concernée, surface, matériau, référence, épaisseur et performance thermique identifiés sur une ligne dédiée.",
  },
  faq: [
    {
      question: "Qu’est-ce qu’un devis CEE ?",
      answer:
        "C’est le devis d’un chantier de rénovation énergétique dont l’artisan RGE prévoit qu’il ouvrira droit à une prime au titre des Certificats d’économies d’énergie. Au-delà du prix, il doit décrire le geste de façon assez précise pour le rattacher à une fiche d’opération standardisée et prouver l’éligibilité : surface ou quantité, matériau, référence, performance.",
    },
    {
      question: "Quelles mentions doivent figurer sur un devis CEE ?",
      answer:
        "Les mentions habituelles d’un devis (identité de l’entreprise, SIRET, client, adresse du chantier, prix détaillés HT, TVA, TTC) et, en plus, les éléments qui rendent le geste vérifiable : référence de la fiche applicable, caractéristiques techniques exigées par cette fiche, marque et référence du produit, et la qualification RGE couvrant le domaine concerné.",
    },
    {
      question: "Faut-il indiquer la fiche CEE sur le devis ?",
      answer:
        "Oui. Chaque ligne éligible doit pouvoir être reliée à la fiche d’opération standardisée en vigueur qui la couvre, et reprendre les critères de cette fiche. C’est ce qui permet au contrôleur de mettre en regard votre devis et la fiche officielle, et de retrouver chaque exigence.",
    },
    {
      question: "Peut-on commencer les travaux avant l’acceptation du devis CEE ?",
      answer:
        "Non. L’offre CEE doit être engagée avant que le client n’accepte le devis, et aucun travail ni acompte engageant ne doit démarrer avant que cette chronologie soit établie. Un engagement daté après l’acceptation fait tomber le dossier pour effet d’aubaine, sans recours possible.",
    },
    {
      question: "Devis CEE et devis MaPrimeRénov’, est-ce le même document ?",
      answer:
        "C’est le même devis de chantier, mais il doit satisfaire les exigences des deux dispositifs à la fois lorsque vous visez le cumul. Les critères ne se recouvrent pas exactement : mieux vaut relire le devis une fois pour le CEE et une fois pour MaPrimeRénov’ avant de le faire signer. Reportez-vous aux sources officielles pour les conditions de cumul en vigueur.",
    },
    {
      question: "Combien de temps un devis CEE reste-t-il valable ?",
      answer:
        "La durée de validité est fixée par l’artisan et indiquée sur le devis lui-même. Ce qui compte pour la conformité CEE, ce n’est pas cette durée commerciale mais la cohérence des dates : l’offre CEE engagée avant l’acceptation du devis, puis un enchaînement acceptation, réalisation et achèvement cohérent d’une pièce à l’autre.",
    },
  ],
  sources: [
    { label: "Catalogue officiel des fiches d’opérations standardisées CEE", href: catalogueCee },
    { label: "Questions-réponses officielles sur le dispositif CEE", href: questionsCee },
    { label: "Mentions obligatoires d’une facture — Service Public", href: mentionsFacture },
  ],
  pourAllerPlusLoin: {
    heading: "Pas le temps de monter ce pack vous-même ?",
    liens: [
      {
        label: "Combien de temps prend vraiment un dossier CEE",
        href: "/temps-montage-dossier-cee",
        description: "Où part réellement le temps sur un dossier, et comment le reprendre.",
      },
    ],
  },
};
