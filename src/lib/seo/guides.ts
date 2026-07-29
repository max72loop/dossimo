/**
 * Ordre éditorial des familles de guides. Il pilote l'affichage du hub `/guides`
 * (page pilier) et le regroupement dans le menu. Ajouter une catégorie ici suffit
 * à la faire apparaître ; un guide qui pointe une catégorie absente de cette liste
 * ne serait jamais rendu, donc les deux doivent rester synchronisés.
 */
export const GUIDE_CATEGORIES = [
  "Monter le dossier",
  "Devis & conformité",
  "Refus & prévention",
  // Pages dérivées de `regles_metier` (cf. `gestes.ts`) : elles répondent à
  // l'intention « mon geste », pas « ma méthode ». Elles ne vivent pas dans
  // `guides` ci-dessous, qui reste l'éditorial écrit à la main.
  "Par geste",
] as const;

export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

export interface SeoGuide {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  category: GuideCategory;
  /**
   * Date de dernière vérification éditoriale, au format ISO `AAAA-MM-JJ`. Source
   * unique pour l'affichage (« Vérifié le… »), le JSON-LD `dateModified` et le
   * `lastModified` du sitemap : la faire vivre ici évite les dates codées en dur
   * qui « périment » le contenu aux yeux de Google.
   */
  updated: string;
  intro: string;
  /**
   * Illustration d'en-tête optionnelle. Purement additive : un guide sans `hero`
   * garde exactement son en-tête d'origine (texte pleine largeur). Quand elle est
   * présente, l'en-tête passe en deux colonnes (texte + visuel) sur grand écran.
   * `src` pointe un actif statique de `public/` (SVG de marque de préférence),
   * `alt` décrit la scène pour l'accessibilité et n'est jamais vide.
   */
  hero?: { src: string; alt: string };
  /**
   * Prose longue optionnelle, rendue juste après l'introduction. Sert à donner de la
   * profondeur éditoriale (le « pourquoi ») là où la checklist ne donne que le « quoi ».
   * Un guide sans `sections` garde exactement son rendu d'origine : le champ est
   * additif, jamais requis. Chaque section porte un `heading` (h2 serif) et ses
   * paragraphes.
   */
  sections?: Array<{ heading: string; paragraphs: string[] }>;
  checklist: Array<{ title: string; text: string }>;
  errors: string[];
  example: { before: string; after: string };
  /**
   * Questions fréquentes optionnelles. Rendues visiblement ET exposées en JSON-LD
   * `FAQPage` (rich snippets Google). N'ajouter le champ que si les réponses sont
   * réellement affichées : le balisage FAQ doit refléter le contenu visible.
   */
  faq?: Array<{ question: string; answer: string }>;
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
const annuaireRge = "https://france-renov.gouv.fr/annuaire-rge";
const anahModeEmploi =
  "https://www.anah.gouv.fr/anatheque/maprimerenov-mode-emploi";

export const guides = {
  dossierCee: {
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
  },
  cumulMprCee: {
    slug: "cumul-maprimerenov-cee",
    metaTitle: "Cumuler MaPrimeRénov' et CEE : ordre, écrêtement et pièges",
    title: "Cumuler MaPrimeRénov’ et CEE sur un même chantier",
    description:
      "Les deux aides se cumulent, mais dans un ordre précis et sous conditions. La chronologie à respecter, l’écrêtement, les non-cumuls entre gestes et les erreurs qui font tomber une des deux primes.",
    eyebrow: "Guide artisan RGE · Cumul des aides",
    category: "Monter le dossier",
    updated: "2026-07-20",
    intro:
      "MaPrimeRénov’ et les CEE sont deux dispositifs distincts, portés par des acteurs différents, et ils se cumulent sur un même chantier. Mais ce cumul n’est pas automatique : il suppose une chronologie respectée, deux dossiers montés en parallèle sur des pièces cohérentes, et la vérification qu’aucune règle de non-cumul ne s’applique au geste concerné. Ce guide décrit le mécanisme et les points où le cumul se perd.",
    sections: [
      {
        heading: "Deux dispositifs, deux logiques, un seul chantier",
        paragraphs: [
          "MaPrimeRénov’ est une aide publique versée par l’Anah, calculée selon le geste et le profil de revenus du ménage. Les Certificats d’économies d’énergie relèvent d’une obligation imposée aux fournisseurs d’énergie : la prime vient d’un acteur privé, en contrepartie de certificats qu’il valorise. Les deux ne suivent donc ni le même circuit, ni les mêmes délais, ni les mêmes contrôles.",
          "La conséquence pratique est simple : viser le cumul, c’est monter deux dossiers, pas un dossier envoyé deux fois. Les pièces sont largement communes (le devis, la facture, la qualification RGE, les caractéristiques techniques), mais chaque dispositif a ses exigences propres et son propre motif de refus. Un devis irréprochable pour l’un peut être insuffisant pour l’autre.",
        ],
      },
      {
        heading: "La chronologie commande tout : le CEE d’abord",
        paragraphs: [
          "C’est le point qui fait perdre le plus de cumuls, et il est irrattrapable. Le CEE impose un rôle actif et incitatif : l’offre doit être engagée avant que le client n’accepte le devis. Un engagement daté après la signature fait tomber la prime CEE pour effet d’aubaine, sans recours. MaPrimeRénov’ a sa propre exigence d’antériorité de la demande sur le démarrage des travaux.",
          "L’ordre à retenir est donc : engager l’offre CEE, faire accepter le devis, puis démarrer. Un artisan qui pense au CEE après la signature du devis, parce que le client a demandé « s’il n’y a pas moyen d’avoir plus », a déjà perdu cette prime, quelle que soit la qualité du reste du dossier. Ce point est développé dans notre guide sur l’offre CEE avant le devis.",
        ],
      },
      {
        heading: "L’écrêtement : le cumul est plafonné, pas illimité",
        paragraphs: [
          "Cumuler ne veut pas dire additionner sans limite. Le total des aides perçues sur une opération est encadré : au-delà d’un certain niveau, le montant est écrêté pour qu’un reste à charge subsiste. Le plafond dépend du dispositif, du geste et du profil de revenus du ménage, et il évolue par arrêté.",
          "Ce guide n’affiche volontairement aucun chiffre : un plafond périmé recopié dans une page web est exactement le genre d’erreur qui fabrique une promesse intenable envers le client. Reportez-vous aux sources officielles ci-dessous pour les niveaux en vigueur à la date de votre chantier. Ce qu’il faut retenir côté conduite de chantier, c’est de ne jamais annoncer un reste à charge au client avant d’avoir vérifié l’écrêtement applicable.",
        ],
      },
      {
        heading: "Vérifier qu’aucun non-cumul ne s’applique au geste",
        paragraphs: [
          "Le cumul MaPrimeRénov’ + CEE est le principe général, mais il existe des exclusions entre gestes à l’intérieur même du dispositif CEE, et elles bougent. Depuis 2026, par exemple, les fiches de chauffage solaire et de chauffe-eau solaire ne sont plus cumulables avec celles des pompes à chaleur air/eau et eau/eau : deux gestes qui se valorisaient ensemble jusque-là ne le peuvent plus.",
          "Cette famille de règles est traître parce qu’elle ne se voit pas sur une pièce isolée : le devis est correct, la facture est correcte, et le blocage vient de la combinaison. Avant de chiffrer un bouquet de travaux, vérifiez dans le catalogue des fiches en vigueur que les gestes retenus sont bien cumulables entre eux, et à la date d’engagement de l’opération.",
        ],
      },
      {
        heading: "Une saisie unique pour deux dossiers cohérents",
        paragraphs: [
          "Le cumul multiplie mécaniquement le risque d’incohérence : mêmes travaux, deux dossiers, deux jeux de pièces, et un contrôleur de chaque côté qui rapproche le devis, la facture et les caractéristiques techniques. Une surface saisie différemment d’un dossier à l’autre, une référence produit mise à jour d’un seul côté, et l’une des deux primes tombe.",
          "C’est précisément ce que Dossimo verrouille : toutes les pièces sont générées depuis une saisie unique, donc l’écart entre deux documents devient structurellement difficile à produire. Dossimo est un service indépendant d’aide à la préparation de dossier, non affilié à l’Anah ni à France Rénov’. Il ne dépose pas le dossier et ne touche pas la prime : vous et votre client restez maîtres du dépôt.",
        ],
      },
    ],
    checklist: [
      { title: "Engager l’offre CEE avant la signature", text: "L’offre CEE doit être engagée avant l’acceptation du devis. C’est la seule étape du cumul qui ne se rattrape jamais après coup." },
      { title: "Vérifier le cumul entre gestes", text: "Avant de chiffrer un bouquet de travaux, contrôlez dans le catalogue en vigueur que les fiches retenues sont cumulables entre elles à la date d’engagement." },
      { title: "Contrôler la qualification RGE pour les deux", text: "Le domaine RGE doit couvrir chaque geste et être valide à la date utile de chaque dispositif, qui n’est pas forcément la même." },
      { title: "Aligner devis et facture des deux côtés", text: "Surfaces, références, marques et performances doivent être identiques dans le dossier MaPrimeRénov’ et dans le dossier CEE." },
      { title: "Vérifier l’écrêtement avant d’annoncer un reste à charge", text: "Le cumul est plafonné. Ne communiquez un reste à charge au client qu’après avoir vérifié le plafond en vigueur pour le geste et le profil de revenus." },
      { title: "Tenir les deux calendriers de dépôt", text: "Les deux dispositifs ont leurs propres délais après facture. Collectez les pièces du bénéficiaire en amont plutôt qu’au moment du dépôt." },
    ],
    errors: [
      "L’offre CEE est engagée après l’acceptation du devis : la prime CEE tombe, MaPrimeRénov’ seule subsiste.",
      "Deux gestes non cumulables entre eux sont valorisés sur le même chantier.",
      "Une caractéristique technique diffère entre le dossier MaPrimeRénov’ et le dossier CEE.",
      "Un reste à charge est annoncé au client sans tenir compte de l’écrêtement.",
      "Le dossier CEE est monté après coup, quand les travaux sont déjà engagés.",
    ],
    example: {
      before: "Devis signé, puis recherche d’une prime CEE pour compléter MaPrimeRénov’.",
      after: "Offre CEE engagée et datée, puis acceptation du devis, puis démarrage des travaux : les deux dispositifs restent ouverts.",
    },
    faq: [
      {
        question: "Peut-on cumuler MaPrimeRénov’ et une prime CEE ?",
        answer:
          "Oui, c’est le principe général : les deux dispositifs sont distincts et se cumulent sur un même chantier. Le cumul suppose toutefois que la chronologie propre à chaque aide soit respectée, que les gestes soient cumulables entre eux et que le total reste dans les limites de l’écrêtement en vigueur.",
      },
      {
        question: "Faut-il demander le CEE avant ou après MaPrimeRénov’ ?",
        answer:
          "L’offre CEE doit être engagée avant l’acceptation du devis, c’est la contrainte la plus stricte du montage. Faites-en donc la première étape. Un CEE demandé après la signature du devis est perdu définitivement, alors que le reste du dossier peut encore être corrigé.",
      },
      {
        question: "Qu’est-ce que l’écrêtement ?",
        answer:
          "C’est le plafonnement du total des aides perçues sur une opération, destiné à laisser un reste à charge au ménage. Le niveau dépend du dispositif, du geste et du profil de revenus, et il est fixé par arrêté. Vérifiez toujours le plafond en vigueur à la date du chantier avant d’annoncer un montant au client.",
      },
      {
        question: "Tous les gestes sont-ils cumulables entre eux ?",
        answer:
          "Non. Il existe des exclusions entre fiches à l’intérieur du dispositif CEE, et elles évoluent. Depuis 2026, les fiches de chauffage et de chauffe-eau solaires ne sont plus cumulables avec celles des pompes à chaleur air/eau et eau/eau. Contrôlez le catalogue des fiches en vigueur avant de chiffrer un bouquet de travaux.",
      },
      {
        question: "Faut-il deux devis pour cumuler les deux aides ?",
        answer:
          "Non, un seul devis de chantier suffit, mais il doit satisfaire les exigences des deux dispositifs à la fois. Les critères ne se recouvrent pas exactement : relisez-le une fois pour MaPrimeRénov’ et une fois pour le CEE avant de le faire signer.",
      },
      {
        question: "Le cumul change-t-il quelque chose au contrôle du dossier ?",
        answer:
          "Oui, il double le nombre de contrôles. Chaque dispositif rapproche de son côté le devis, la facture et les caractéristiques techniques. Une valeur mise à jour dans un seul des deux dossiers suffit à faire tomber la prime correspondante, même si l’autre passe sans encombre.",
      },
    ],
    sources: [
      { label: "MaPrimeRénov’, mode d’emploi — Anah", href: anahModeEmploi },
      { label: "Questions-réponses officielles sur le dispositif CEE", href: questionsCee },
      { label: "Catalogue officiel des fiches d’opérations standardisées CEE", href: catalogueCee },
    ],
  },
  maprimerenov: {
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
  },
  cee: {
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
  },
  modeleCee: {
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
  },
  prixCee: {
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
  },
  mentions: {
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
  },
  refus: {
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
    sources: [
      { label: "Les règles d’or d’un dossier MaPrimeRénov’ — France Rénov’", href: franceRenovDossier },
      { label: "Guide MaPrimeRénov’ rénovation par geste — France Rénov’", href: "https://france-renov.gouv.fr/preparer-projet/dossier-demande-aide/guide-geste" },
      { label: "Mode d’emploi MaPrimeRénov’ 2026 — Anah", href: anahModeEmploi },
    ],
  },
  rai: {
    slug: "offre-cee-avant-le-devis",
    metaTitle: "Offre CEE avant le devis : sécuriser le rôle actif incitatif",
    title: "Offre CEE avant le devis : sécuriser le rôle actif et incitatif",
    description:
      "Pour une prime CEE valable, l’offre doit être engagée avant l’acceptation du devis. Comprendre la chronologie du rôle actif et incitatif (RAI) pour éviter un rejet sans recours.",
    eyebrow: "Guide artisan RGE · Chronologie CEE",
    category: "Refus & prévention",
    updated: "2026-07-28",
    intro:
      "Une prime CEE n’est valable que si elle a réellement contribué à décider les travaux. C’est le rôle actif et incitatif : l’offre CEE doit être engagée avant que le client n’accepte le devis. Si l’engagement est daté après, le dossier tombe pour effet d’aubaine, sans recours possible. La chronologie se sécurise document par document, avant le chantier.",
    sections: [
      {
        heading: "Ce que le rôle actif et incitatif exige vraiment",
        paragraphs: [
          "Le dispositif des certificats d’économies d’énergie ne finance pas des travaux : il finance une décision. La prime n’est due que si elle a pesé sur le choix du ménage, et c’est exactement ce que vérifie le rôle actif et incitatif, souvent abrégé RAI. Un contrôleur ne cherche pas à savoir si les travaux ont été bien faits, il cherche à savoir si l’offre CEE existait avant que le client ne dise oui.",
          "Cette exigence se lit dans une seule comparaison : la date d’engagement de l’offre CEE face à la date d’acceptation du devis. Si la première précède la seconde, la chronologie tient. Si elle vient après, le dossier est rejeté pour effet d’aubaine, c’est-à-dire une prime versée pour des travaux qui auraient eu lieu de toute façon. La distinction paraît formelle, elle est en réalité la raison d’être du dispositif.",
        ],
      },
      {
        heading: "Pourquoi c’est le seul motif de refus sans rattrapage",
        paragraphs: [
          "La plupart des motifs de refus se corrigent. Une mention absente s’ajoute, une facture se rectifie, une pièce manquante se demande au bénéficiaire. Le rôle actif et incitatif fait exception : il porte sur un ordre entre deux dates, et cet ordre ne se réécrit pas. Antidater une pièce serait un faux, et un dossier reconstitué après coup se repère à la première demande de justificatif.",
          "C’est ce qui rend l’erreur si coûteuse. L’artisan découvre en général le problème au dépôt, alors que le chantier est fait, la facture émise et le client informé du montant qu’il attendait. Il ne reste alors qu’à annoncer que la prime est perdue. Le seul moment où le sujet se traite est celui où le devis n’est pas encore signé.",
        ],
      },
      {
        heading: "Qui engage l’offre, et avec quel document",
        paragraphs: [
          "L’offre CEE n’émane pas de l’artisan mais de l’obligé ou de son délégataire, c’est-à-dire l’acteur qui achètera les certificats. Elle prend des formes variables selon les partenaires : bon d’adhésion signé par le bénéficiaire, courrier d’offre nominatif, contrat cadre auquel le chantier est rattaché. Peu importe la forme, ce qui compte est qu’une pièce écrite et datée matérialise l’engagement avant la signature du devis.",
          "Un point échappe souvent à la vigilance : cette pièce doit relier l’offre à ce chantier précis. Un contrat cadre signé un an plus tôt, sans aucun rattachement daté à l’opération en cours, laisse un doute qu’un contrôleur tranchera rarement en votre faveur. Conservez systématiquement la trace qui fait le lien entre l’offre et le projet, et rappelez le dispositif CEE sur le devis lui-même.",
        ],
      },
      {
        heading: "Organiser la chronologie sur un chantier réel",
        paragraphs: [
          "L’ordre de travail qui sécurise le dossier inverse le réflexe commercial habituel. On chiffre, on présente l’offre CEE au client, on fait engager cette offre, et seulement ensuite on fait signer le devis. Tant que la chronologie n’est pas établie, aucun acompte engageant ni aucun début de travaux : un chantier démarré vaut décision prise, quelle que soit la date portée sur le devis.",
          "La date d’acceptation du devis mérite une attention particulière. Elle doit figurer lisiblement sur la pièce signée, de la main du client. Un devis retourné sans date, ou daté seulement par l’entreprise, prive le dossier de la preuve dont il a besoin, alors même que la chronologie réelle était correcte. Une tolérance encadrée peut exister pour certains particuliers, mais elle se vérifie dans les textes en vigueur et ne couvre jamais un chantier déjà démarré. En cas de doute, restez sur la règle simple : l’offre avant le devis.",
        ],
      },
      {
        heading: "Le rôle de Dossimo sur ce point",
        paragraphs: [
          "Dossimo contrôle la chronologie du rôle actif et incitatif parmi les points de vigilance remontés avant le dépôt, en rapprochant les dates portées par les pièces du dossier. L’objectif est que l’écart se voie tant qu’il est encore corrigeable, c’est-à-dire avant la signature, et non au moment où la prime est déjà perdue.",
          "Dossimo est un service indépendant d’aide à la préparation de dossier, non affilié à l’Anah ni à France Rénov’. Il ne dépose jamais le dossier et ne touche jamais la prime : vous gardez votre client et votre relation avec l’obligé.",
        ],
      },
    ],
    checklist: [
      { title: "Situer l’engagement CEE", text: "L’offre ou le contrat CEE (bon d’adhésion, courrier, contrat cadre) doit porter une date antérieure à l’acceptation du devis par le client." },
      { title: "Dater l’acceptation du devis", text: "La date d’acceptation du devis fait foi. Elle doit venir après l’engagement CEE, et rester lisible sur la pièce signée." },
      { title: "Ne rien démarrer avant", text: "Aucun début de travaux ni acompte engageant tant que la chronologie du rôle incitatif n’est pas établie." },
      { title: "Relier l’offre au chantier", text: "Le devis mentionne le dispositif CEE et conservez la trace écrite qui rattache l’offre à ce projet précis, et non à un autre." },
      { title: "Vérifier la tolérance applicable", text: "Une tolérance encadrée peut exister pour les particuliers, à confirmer dans les textes en vigueur, jamais après le démarrage des travaux. En cas de doute, restez sur l’engagement avant le devis." },
    ],
    errors: [
      "L’engagement CEE est daté après l’acceptation du devis.",
      "Des travaux ou un acompte ont démarré avant l’engagement CEE.",
      "Le devis ne fait aucune mention du dispositif CEE incitatif.",
      "Aucune preuve écrite ne relie l’offre CEE à ce chantier précis.",
      "La date d’acceptation du devis est absente ou illisible.",
    ],
    example: {
      before: "Devis accepté le 3 mars, contrat CEE signé le 20 mars : l’incitation arrive après la décision de travaux.",
      after: "Offre CEE engagée le 1er mars, devis accepté le 3 mars : la prime a bien précédé la décision, la chronologie est défendable.",
    },
    faq: [
      {
        question: "Que signifie « rôle actif et incitatif » en pratique ?",
        answer:
          "Que la prime CEE doit avoir contribué à décider les travaux, et non les récompenser après coup. Concrètement, l’offre CEE doit être engagée avant que le client n’accepte le devis. C’est cet ordre entre deux dates qui est contrôlé, pas la qualité des travaux.",
      },
      {
        question: "J’ai fait signer le devis avant l’offre CEE, puis-je rattraper ?",
        answer:
          "Non. C’est le seul motif de refus qui ne se corrige pas, parce qu’il porte sur un ordre entre deux dates déjà établies. Antidater une pièce serait un faux. Si le devis est signé et que rien n’a démarré, la seule voie est d’annuler ce devis et d’en établir un nouveau après l’engagement de l’offre CEE.",
      },
      {
        question: "Quelle date fait foi pour le devis ?",
        answer:
          "La date d’acceptation par le client, celle qu’il porte lui-même sur la pièce signée, et non la date d’édition du devis par l’entreprise. Un devis retourné sans date d’acceptation lisible prive le dossier de sa preuve, même lorsque la chronologie réelle était correcte.",
      },
      {
        question: "Un acompte compte-t-il comme un démarrage des travaux ?",
        answer:
          "Un acompte engageant est un signal fort que la décision était prise. Tant que la chronologie du rôle incitatif n’est pas établie, n’encaissez ni acompte ni commande ferme, et ne démarrez aucun travaux, y compris la commande de matériel spécifique au chantier.",
      },
      {
        question: "Un contrat cadre signé il y a un an suffit-il ?",
        answer:
          "Pas à lui seul. Il faut une trace écrite et datée qui rattache l’offre à ce chantier précis. Un contrat cadre ancien sans rattachement daté à l’opération en cours laisse un doute qu’un contrôleur tranchera rarement en votre faveur.",
      },
      {
        question: "Qui émet l’offre CEE : l’artisan ou un autre acteur ?",
        answer:
          "L’obligé ou son délégataire, c’est-à-dire l’acteur qui achètera les certificats. L’artisan ne l’émet pas, mais c’est lui qui subit le refus si la chronologie est mauvaise : c’est donc à lui de vérifier que l’engagement est bien intervenu avant de faire signer le devis.",
      },
    ],
    sources: [
      { label: "Questions-réponses officielles sur le dispositif CEE (ecologie.gouv.fr)", href: questionsCee },
      { label: "Catalogue officiel des fiches d’opérations standardisées CEE", href: catalogueCee },
    ],
  },
  rge: {
    slug: "qualification-rge-valide-geste",
    metaTitle: "Qualification RGE valide et adaptée au geste : le contrôle",
    title: "Qualification RGE : valide, dans le bon domaine, à la bonne date",
    description:
      "Une aide est bloquée si la qualification RGE ne couvre pas le geste réalisé ou n’est pas valable à la date utile. Les points à vérifier avant d’engager le chantier.",
    eyebrow: "Guide artisan RGE · Éligibilité",
    category: "Refus & prévention",
    updated: "2026-07-28",
    intro:
      "Le statut RGE ne suffit pas à lui seul : il doit couvrir précisément le geste réalisé et être valable à la date qui compte pour le dispositif. Une qualification dans un domaine voisin, expirée ou portée par la mauvaise entreprise bloque l’accès aux aides. Ces contrôles se font avant d’engager les travaux, quand tout est encore corrigeable.",
    sections: [
      {
        heading: "« Être RGE » ne veut rien dire tout seul",
        paragraphs: [
          "Reconnu Garant de l’Environnement n’est pas un label unique attribué à une entreprise, mais un ensemble de qualifications délivrées domaine par domaine. Une entreprise n’est jamais RGE dans l’absolu : elle est qualifiée pour l’isolation, pour les pompes à chaleur, pour la ventilation, ou pour plusieurs de ces domaines à la fois. C’est cette distinction qui décide de l’accès aux aides, et c’est précisément celle que le langage courant efface.",
          "La conséquence est directe. La bonne question n’est pas « suis-je RGE ? » mais « ce geste précis est-il couvert par une qualification que je détiens, valable à la date qui compte pour ce dispositif ? ». Un chantier techniquement irréprochable, réalisé par une entreprise réellement qualifiée, peut ne pas ouvrir droit à l’aide simplement parce que le geste relève d’un domaine voisin de celui détenu.",
        ],
      },
      {
        heading: "Le domaine doit correspondre au geste facturé",
        paragraphs: [
          "Le contrôle consiste à mettre en regard deux choses : le geste tel qu’il apparaît sur la facture, et le périmètre exact de la qualification invoquée. Les frontières entre domaines paraissent parfois arbitraires vues du chantier, mais elles sont opposables. Une qualification chauffage ne couvre pas une isolation de combles, une qualification isolation des murs ne couvre pas nécessairement l’isolation des planchers bas.",
          "Le cas le plus piégeux est celui du devis à plusieurs postes. Un chantier qui associe une pompe à chaleur et une isolation relève de deux domaines distincts, et chacun doit être couvert. Invoquer une seule qualification pour l’ensemble ne bloque pas forcément tout le dossier, mais fait tomber le geste non couvert, souvent celui qui portait la plus grosse part de la prime attendue.",
        ],
      },
      {
        heading: "La date utile n’est pas la date des travaux",
        paragraphs: [
          "Une qualification a une durée de validité, et le dispositif regarde si elle était active à une date précise. Cette date n’est pas celle de la fin du chantier, ni celle de la facture : c’est en général celle de l’acceptation du devis ou de l’engagement de l’opération, selon le dispositif. Autrement dit, la qualification doit être valable au moment où le client s’engage, bien avant que le premier isolant soit posé.",
          "Cela crée un risque discret sur les chantiers longs et sur les qualifications proches de leur échéance. Une qualification qui expire trois semaines après la signature laisse croire que tout va bien alors que le renouvellement n’est pas acquis. Vérifiez la date d’échéance avant d’engager, pas au moment de monter le dossier, et lancez le renouvellement avec de la marge : un audit ou une visite de contrôle ne se programment pas en quelques jours.",
        ],
      },
      {
        heading: "En sous-traitance, c’est celui qui pose qui doit être qualifié",
        paragraphs: [
          "La règle est constante et régulièrement méconnue : la qualification doit être détenue par l’entreprise qui exécute réellement le geste. Une entreprise générale qualifiée qui sous-traite l’isolation à un poseur non qualifié ne transmet pas sa qualification avec le contrat de sous-traitance.",
          "Cela impose de vérifier les qualifications de vos sous-traitants avec la même rigueur que la vôtre, et de les vérifier pour le geste qu’ils exécutent réellement, pas pour l’objet global du chantier. Ce point mérite une place explicite dans le dossier lorsque la sous-traitance existe, plutôt que d’être découvert lors d’une demande de justificatif.",
        ],
      },
      {
        heading: "Rendre la qualification vérifiable, pas seulement la mentionner",
        paragraphs: [
          "Un numéro RGE porté sur un devis sans domaine de travaux identifiable n’apporte rien à l’instruction. Ce qui compte est que l’instructeur puisse retrouver la qualification dans l’annuaire officiel des professionnels RGE, constater qu’elle couvre le geste et qu’elle était active à la date utile. Indiquez donc le domaine à côté du numéro, et conservez le certificat correspondant dans les pièces du dossier.",
          "Dossimo contrôle la correspondance entre le geste et le domaine RGE parmi les points de vigilance remontés avant le dépôt. C’est un service indépendant d’aide à la préparation de dossier, non affilié à l’Anah ni à France Rénov’ : il ne dépose jamais le dossier et ne touche jamais la prime.",
        ],
      },
    ],
    checklist: [
      { title: "Identifier le domaine exact", text: "La qualification doit couvrir précisément le geste concerné, par exemple pompe à chaleur, isolation ou ventilation, et non un domaine seulement proche." },
      { title: "Vérifier la validité à la date utile", text: "Contrôlez que la qualification est active à la date qui compte pour le dispositif, souvent l’acceptation du devis ou l’engagement de l’opération." },
      { title: "Rapprocher RGE et travaux exécutés", text: "Le geste facturé doit relever du domaine RGE mentionné, y compris lorsque le devis comporte plusieurs postes." },
      { title: "Traiter la sous-traitance", text: "Si un poste est sous-traité, c’est la qualification de l’entreprise qui exécute réellement le geste qui doit le couvrir." },
      { title: "Anticiper le renouvellement", text: "Une qualification proche de son échéance peut expirer avant la date utile. Vérifiez sa validité avant d’engager le chantier." },
    ],
    errors: [
      "La qualification RGE couvre un domaine proche mais pas le geste facturé.",
      "La qualification a expiré ou n’était pas encore active à la date utile.",
      "Le geste est sous-traité à une entreprise sans le RGE correspondant.",
      "Le numéro RGE figure sur le devis sans domaine vérifiable.",
      "Une seule qualification est invoquée pour des postes relevant de domaines différents.",
    ],
    example: {
      before: "Une qualification « chauffage » est invoquée pour une isolation de combles : le domaine ne correspond pas au geste.",
      after: "Le geste d’isolation est porté par une qualification RGE isolation, valide à la date d’acceptation du devis et vérifiable dans l’annuaire officiel.",
    },
    faq: [
      {
        question: "Une entreprise RGE est-elle qualifiée pour tous les travaux de rénovation ?",
        answer:
          "Non. RGE n’est pas un label unique mais un ensemble de qualifications délivrées domaine par domaine : isolation, pompes à chaleur, ventilation, chauffage bois. Une entreprise est qualifiée pour un ou plusieurs domaines, jamais « RGE dans l’absolu », et seul le domaine correspondant au geste facturé ouvre droit à l’aide.",
      },
      {
        question: "À quelle date la qualification doit-elle être valable ?",
        answer:
          "À la date qui compte pour le dispositif, en général celle de l’acceptation du devis ou de l’engagement de l’opération, et non celle de la fin du chantier ou de la facture. Une qualification qui expire pendant le chantier mais qui était active à l’engagement ne pose pas le même problème qu’une qualification expirée à la signature.",
      },
      {
        question: "Mon devis comporte deux gestes de domaines différents, que faire ?",
        answer:
          "Chaque geste doit être couvert par une qualification adaptée. Invoquer une seule qualification pour l’ensemble fait tomber le geste non couvert, souvent celui qui portait la plus grosse part de la prime. Si vous ne détenez qu’un des deux domaines, faites porter l’autre geste par une entreprise qualifiée et tracez-le dans le dossier.",
      },
      {
        question: "Puis-je sous-traiter un geste à une entreprise non RGE ?",
        answer:
          "Pas si le geste doit ouvrir droit à une aide. La qualification doit être détenue par l’entreprise qui exécute réellement les travaux : elle ne se transmet pas par le contrat de sous-traitance. Vérifiez les qualifications de vos sous-traitants pour le geste qu’ils réalisent, pas pour l’objet global du chantier.",
      },
      {
        question: "Comment vérifier qu’une qualification RGE est valide ?",
        answer:
          "Par l’annuaire officiel des professionnels RGE de France Rénov’, qui permet de retrouver l’entreprise, ses domaines de qualification et leur validité. C’est aussi ce que fera l’instructeur : indiquez donc le domaine à côté du numéro sur le devis et conservez le certificat dans les pièces du dossier.",
      },
      {
        question: "Ma qualification expire bientôt, dois-je attendre pour signer ?",
        answer:
          "Ne signez pas en comptant sur un renouvellement non acquis. Un audit ou une visite de contrôle ne se programment pas en quelques jours. Lancez la démarche de renouvellement avec de la marge et vérifiez la date d’échéance avant d’engager le chantier, plutôt qu’au moment de monter le dossier.",
      },
    ],
    sources: [
      { label: "Annuaire officiel des professionnels RGE (France Rénov’)", href: annuaireRge },
      { label: "Bien monter son dossier MaPrimeRénov’ — France Rénov’", href: franceRenovDossier },
      { label: "Mode d’emploi MaPrimeRénov’ 2026 — Anah", href: anahModeEmploi },
    ],
  },
} satisfies Record<string, SeoGuide>;

export const guideList = Object.values(guides);

/**
 * Index slug → guide, construit une seule fois. Sert à la route dynamique
 * `app/[slug]` : elle reçoit un slug d'URL et doit retrouver le guide en O(1),
 * sans réénumérer `guideList` à chaque requête.
 */
const guidesBySlug = new Map(guideList.map((guide) => [guide.slug, guide] as const));

/** Retrouve un guide par son slug d'URL, ou `undefined` s'il n'existe pas. */
export function guideBySlug(slug: string): SeoGuide | undefined {
  return guidesBySlug.get(slug);
}

/**
 * Guides regroupés par famille, dans l'ordre de `GUIDE_CATEGORIES`. Les catégories
 * vides ne sont pas rendues : le hub grandit tout seul quand on ajoute un guide.
 *
 * `extra` accueille les pages qui ne vivent pas dans `guides` parce qu'elles sont
 * dérivées de la base (cf. `gestes.ts`). Si la base est injoignable, l'appelant
 * passe une liste vide et le hub se contente de l'éditorial : une catégorie sans
 * page disparaît au lieu de s'afficher vide.
 */
export function guidesByCategory(
  extra: SeoGuide[] = [],
): Array<{ category: GuideCategory; guides: SeoGuide[] }> {
  const pages = [...guideList, ...extra];
  return GUIDE_CATEGORIES.map((category) => ({
    category,
    guides: pages.filter((guide) => guide.category === category),
  })).filter((group) => group.guides.length > 0);
}

/** Date ISO d'un guide → « 14 juillet 2026 » pour l'affichage. */
export function formatGuideDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00Z`));
}
