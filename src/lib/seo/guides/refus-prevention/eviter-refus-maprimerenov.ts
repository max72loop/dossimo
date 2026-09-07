import type { SeoGuide } from "../types";
import { anahModeEmploi, franceRenovDossier } from "../sources";

export const refus: SeoGuide = {
  slug: "eviter-refus-maprimerenov",
  metaTitle: "Éviter un refus MaPrimeRénov' : 7 contrôles avant dépôt",
  title: "Éviter un refus MaPrimeRénov’ : contrôler les pièces entre elles",
  description:
    "Sept contrôles de cohérence entre demande, devis, RGE et facture pour réduire les dossiers MaPrimeRénov’ incomplets ou bloqués.",
  eyebrow: "Prévention des blocages · MaPrimeRénov’",
  category: "Refus & prévention",
  updated: "2026-07-21",
  intro:
    "Un dossier MaPrimeRénov’ n’est presque jamais refusé pour une pièce fausse prise isolément. Il l’est parce que deux pièces se contredisent : un nom, une adresse, une date, une surface ou un montant qui diffère entre la demande, le devis et la facture. La bonne nouvelle, c’est que ces écarts se voient et se corrigent avant le dépôt, à condition de relire les pièces les unes contre les autres. Ce guide donne les sept contrôles qui attrapent l’essentiel des blocages.",
  hero: {
    src: "/brand/guide-coherence-pieces.svg",
    alt: "Un devis et une facture posés côte à côte : les lignes concordantes sont validées, la surface qui diffère (95 m² contre 80 m²) est signalée en rouge.",
  },
  sections: [
    {
      heading: "Un refus coûte bien plus qu’un délai",
      paragraphs: [
        "Sur le papier, un dossier refusé n’est qu’un dossier à recommencer. En pratique, c’est votre trésorerie qui attend, un client qui doute de la prime que vous lui aviez laissé espérer, et parfois une aide qui se referme parce que les conditions ont changé entre-temps. Le coût réel d’un refus n’est pas le formulaire à refaire : c’est le temps perdu, la relance des pièces manquantes et la relation client fragilisée au pire moment.",
        "C’est pourquoi la relecture avant dépôt n’est pas une formalité administrative de plus, mais l’étape qui protège votre chantier. Attraper un écart la veille du dépôt coûte quelques minutes ; le découvrir dans un courrier de refus coûte des semaines.",
      ],
    },
    {
      heading: "Le vrai motif de refus : l’incohérence entre les pièces",
      paragraphs: [
        "Une demande d’aide se contrôle en rapprochant les documents entre eux. Le devis peut être irréprochable lu seul, la facture parfaitement conforme de son côté, et le dossier tomber quand même parce que la surface, la référence produit ou l’adresse ne concordent pas d’une pièce à l’autre. L’instructeur ne juge pas une pièce, il juge leur cohérence d’ensemble.",
        "C’est ce qui rend ces erreurs traîtres : elles ne se voient sur aucun document isolé. Il faut mettre la demande, le devis et la facture côte à côte et vérifier, ligne à ligne, que le nom, l’adresse, les dates, les caractéristiques techniques et les montants racontent tous la même histoire. Les sept contrôles ci-dessous ne font rien d’autre que dérouler méthodiquement ce rapprochement.",
      ],
    },
    {
      heading: "Contrôler avant le dépôt, quand tout est encore corrigeable",
      paragraphs: [
        "La fenêtre pour corriger sans douleur se situe avant l’envoi. Une surface qui diffère, une référence produit remplacée sans justificatif de performance, une aide déjà prévue mais oubliée dans le plan de financement : tant que le dossier n’est pas déposé, chacun de ces points se rattrape en éditant la bonne pièce. Une fois le dossier instruit et refusé, le même correctif suppose de reprendre le dossier et de le représenter.",
        "Le bon réflexe est donc de figer une relecture systématique juste avant le dépôt, sur la version finale des pièces, jamais sur un brouillon annoté. C’est ce passage unique qui distingue un dossier qui passe d’un dossier qui revient.",
      ],
    },
    {
      heading: "Une saisie unique qui rend l’écart difficile à produire",
      paragraphs: [
        "La parade la plus solide contre l’incohérence n’est pas de relire plus, c’est de rendre l’écart structurellement difficile à créer. Quand le devis et la facture sont composés séparément, à deux moments différents, ils finissent tôt ou tard par diverger sur une surface ou une référence. Quand ils sont générés depuis une seule saisie des données du chantier, la même valeur alimente toutes les pièces : l’écart devient un accident qu’il faut provoquer, pas une fatalité.",
        "C’est le principe de Dossimo : une saisie unique, un pack cohérent, et un contrôle qui remonte les points de blocage avant que vous et votre client ne déposiez. Dossimo est un service indépendant d’aide à la préparation de dossier, non affilié à l’Anah ni à France Rénov’. Il ne dépose jamais le dossier et ne touche jamais la prime : vous gardez la main sur votre client comme sur votre relation avec l’administration.",
      ],
    },
  ],
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
  faq: [
    {
      question: "Pourquoi un dossier MaPrimeRénov’ est-il refusé le plus souvent ?",
      answer:
        "Rarement pour une pièce fausse prise à part, le plus souvent pour une incohérence entre les pièces : un nom, une adresse, une date, une surface ou une référence produit qui diffère entre la demande, le devis et la facture. L’instruction rapproche les documents entre eux, et c’est cet écart qui bloque, même quand chaque pièce est correcte lue isolément.",
    },
    {
      question: "Que faire en cas de refus MaPrimeRénov’ ?",
      answer:
        "Commencez par lire précisément le motif indiqué dans la notification : il pointe la pièce ou l’incohérence en cause. Corrigez le point exact (aligner une surface, fournir un justificatif de performance, compléter une aide oubliée), réunissez les versions finales cohérentes entre elles, puis suivez la voie de recours ou de nouvelle demande prévue par votre parcours d’aide. Reportez-vous aux sources officielles ci-dessous pour la procédure en vigueur.",
    },
    {
      question: "Peut-on corriger une erreur du devis après la signature ?",
      answer:
        "Une modification reste possible tant que le dossier n’est pas déposé, en éditant la pièce concernée et en gardant la cohérence avec les autres documents. Après dépôt et instruction, le même correctif suppose généralement de reprendre le dossier et de le représenter. D’où l’intérêt d’une relecture croisée avant l’envoi, sur la version finale des pièces.",
    },
    {
      question: "Une aide CEE ou locale change-t-elle le dossier MaPrimeRénov’ ?",
      answer:
        "Oui. Les aides déjà prévues sur le chantier doivent apparaître dans le plan de financement du dossier. Omettre une prime CEE ou une aide locale crée une incohérence entre le montant des travaux, les aides déclarées et le reste à charge, ce qui peut bloquer l’instruction. Déclarez toutes les aides mobilisées, dès le montage du dossier.",
    },
    {
      question: "Combien de temps prend l’instruction d’un dossier ?",
      answer:
        "Le délai dépend du dispositif, de la complétude du dossier et de la période. Nous n’affichons pas de durée chiffrée ici pour ne pas relayer un délai périmé : consultez les sources officielles pour le délai en vigueur. Ce qui est certain, c’est qu’un dossier incohérent rallonge le traitement, puisqu’il déclenche une demande de pièces ou un refus à représenter.",
    },
    {
      question: "Dossimo dépose-t-il le dossier à ma place ?",
      answer:
        "Non. Dossimo est un service indépendant d’aide à la préparation de dossier, non affilié à l’Anah ni à France Rénov’. Il produit le pack documentaire cohérent et remonte les points de blocage avant le dépôt, mais c’est vous et votre client qui déposez le dossier et percevez la prime. Vous gardez la main sur votre client comme sur votre relation avec l’administration.",
    },
  ],
  voirAussi: [
    {
      label: "MaPrimeRénov’ refusée : lire la décision avant de refaire le dossier",
      href: "/refus/maprimerenov-refuse",
      description:
        "Le refus est déjà tombé : ce qui se corrige, ce qui ne se corrige pas, et le recours préalable devant le directeur général de l’Anah.",
    },
    {
      label: "Les motifs de refus, un par un",
      href: "/refus",
      description:
        "Chaque motif expliqué à partir du texte qui le fonde, avec ce qui le déclenche et ce qui l’évite.",
    },
  ],
  sources: [
    { label: "Les règles d’or d’un dossier MaPrimeRénov’ — France Rénov’", href: franceRenovDossier },
    { label: "Guide MaPrimeRénov’ rénovation par geste — France Rénov’", href: "https://france-renov.gouv.fr/preparer-projet/dossier-demande-aide/guide-geste" },
    { label: "Mode d’emploi MaPrimeRénov’ 2026 — Anah", href: anahModeEmploi },
  ],
  pourAllerPlusLoin: {
    heading: "Pas envie de gérer ce risque vous-même ?",
    liens: [
      {
        label: "L’alternative au mandataire MaPrimeRénov’",
        href: "/alternative-mandataire-maprimerenov",
        description: "Préparer un pack vérifié et déposer vous-même, sans céder la relation client ni la prime à un mandataire.",
      },
      {
        label: "Ce que coûte réellement un dossier refusé",
        href: "/cout-dossier-refuse",
        description: "Temps repris, client à rassurer, prime perdue : ce que le refus déplace vers l’artisan.",
      },
    ],
  },
};
