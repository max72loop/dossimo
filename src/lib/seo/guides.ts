export interface SeoGuide {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  intro: string;
  checklist: Array<{ title: string; text: string }>;
  errors: string[];
  example: { before: string; after: string };
  sources: Array<{ label: string; href: string }>;
}

const franceRenovDevis =
  "https://france-renov.gouv.fr/mandataire/bonnes-pratiques-professionnels";
const franceRenovDossier =
  "https://france-renov.gouv.fr/actualites/4-regles-dossier-maprimerenov";
const catalogueCee =
  "https://www.ecologie.gouv.fr/politiques-publiques/operations-standardisees-deconomies-denergie";
const questionsCee =
  "https://www.ecologie.gouv.fr/politiques-publiques/questions-reponses-dispositif-cee";
const mentionsFacture =
  "https://www.service-public.fr/entreprendre/vosdroits/F31808";

export const guides = {
  maprimerenov: {
    slug: "devis-maprimerenov-conforme",
    metaTitle: "Devis MaPrimeRénov' conforme : checklist artisan RGE",
    title: "Devis MaPrimeRénov’ conforme : la checklist avant signature",
    description:
      "Vérifiez les mentions, le RGE, l’adresse, les montants et les caractéristiques techniques d’un devis MaPrimeRénov’ avant le dépôt.",
    eyebrow: "Guide artisan RGE · MaPrimeRénov’",
    intro:
      "Un devis lisible ne suffit pas : les informations de l’entreprise, du logement, des travaux et de la qualification doivent rester cohérentes avec la demande d’aide puis avec la facture. Cette checklist organise la relecture avant que le client ne dépose son dossier.",
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
    sources: [
      { label: "Bonnes pratiques devis et factures MaPrimeRénov’ — France Rénov’", href: franceRenovDevis },
      { label: "Bien monter son dossier MaPrimeRénov’ — France Rénov’", href: franceRenovDossier },
      { label: "Mentions obligatoires d’une facture — Service Public", href: mentionsFacture },
    ],
  },
  cee: {
    slug: "devis-cee-conforme",
    metaTitle: "Devis CEE conforme : fiche, dates et preuve des travaux",
    title: "Devis CEE conforme : relier chaque ligne à la bonne fiche",
    description:
      "Préparez un devis CEE contrôlable : référence de fiche, caractéristiques techniques, qualification RGE, dates et preuves attendues.",
    eyebrow: "Guide artisan RGE · Certificats d’économies d’énergie",
    intro:
      "Une opération CEE est appréciée à partir de sa fiche d’opération standardisée et de ses modes de preuve. Le devis doit donc décrire précisément ce qui sera posé, sans mélanger les critères de plusieurs gestes.",
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
    sources: [
      { label: "Catalogue officiel des fiches d’opérations standardisées CEE", href: catalogueCee },
      { label: "Questions-réponses officielles sur le dispositif CEE", href: questionsCee },
    ],
  },
  mentions: {
    slug: "mentions-obligatoires-devis-rge",
    metaTitle: "Mentions obligatoires d’un devis RGE : checklist 2026",
    title: "Mentions obligatoires d’un devis RGE : une relecture en 3 blocs",
    description:
      "Checklist des mentions d’entreprise, de chantier et de travaux à contrôler sur un devis RGE avant un dossier MaPrimeRénov’ ou CEE.",
    eyebrow: "Guide pratique · Devis artisan RGE",
    intro:
      "La conformité se vérifie plus vite lorsque le devis est relu en trois blocs : l’entreprise, le client et le chantier, puis la description technique et financière des travaux.",
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
    sources: [
      { label: "Bonnes pratiques des professionnels MaPrimeRénov’", href: franceRenovDevis },
      { label: "Mentions obligatoires d’une facture — Service Public", href: mentionsFacture },
    ],
  },
  refus: {
    slug: "eviter-refus-maprimerenov",
    metaTitle: "Éviter un refus MaPrimeRénov' : 7 contrôles avant dépôt",
    title: "Éviter un refus MaPrimeRénov’ : contrôler les pièces entre elles",
    description:
      "Sept contrôles de cohérence entre demande, devis, RGE et facture pour réduire les dossiers MaPrimeRénov’ incomplets ou bloqués.",
    eyebrow: "Prévention des blocages · MaPrimeRénov’",
    intro:
      "Les erreurs les plus coûteuses ne sont pas toujours visibles sur une pièce isolée. Elles apparaissent lorsque le nom, l’adresse, les dates, les travaux ou les montants divergent entre la demande, le devis et la facture.",
    checklist: [
      { title: "Identité", text: "Comparez orthographe, prénom, nom et qualité du demandeur sur chaque document." },
      { title: "Adresse", text: "Utilisez la même adresse complète du logement sur la demande, le devis et la facture." },
      { title: "Chronologie", text: "Vérifiez l’ordre des démarches, de l’engagement et des travaux selon le parcours d’aide concerné." },
      { title: "Entreprise", text: "Rapprochez raison sociale, SIRET, coordonnées et éventuelle sous-traitance." },
      { title: "RGE", text: "Contrôlez le bon domaine de qualification et sa validité à la date requise." },
      { title: "Technique", text: "Comparez surfaces, quantités, marques, références et performances entre devis et facture." },
      { title: "Montants", text: "Expliquez toute variation et vérifiez les totaux HT, TVA, TTC et aides déclarées." },
    ],
    errors: [
      "Le nom ou l’adresse varie d’un document à l’autre.",
      "La facture remplace une référence produit sans conserver la preuve de performance.",
      "La surface facturée diffère de la surface demandée sans explication.",
      "Le dossier omet une aide CEE ou locale déjà prévue.",
      "Une pièce annotée ou incomplète est déposée à la place de sa version finale.",
    ],
    example: {
      before: "Le devis est conforme lorsqu’il est lu seul, mais la facture présente une autre surface et une autre référence.",
      after: "Les écarts sont repérés avant dépôt, justifiés ou corrigés, puis les versions finales sont réunies dans un dossier cohérent.",
    },
    sources: [
      { label: "Les règles d’or d’un dossier MaPrimeRénov’ — France Rénov’", href: franceRenovDossier },
      { label: "Guide MaPrimeRénov’ rénovation par geste — France Rénov’", href: "https://france-renov.gouv.fr/preparer-projet/dossier-demande-aide/guide-geste" },
      { label: "Mode d’emploi MaPrimeRénov’ 2026 — Anah", href: "https://www.anah.gouv.fr/anatheque/maprimerenov-mode-emploi" },
    ],
  },
} satisfies Record<string, SeoGuide>;

export const guideList = Object.values(guides);
