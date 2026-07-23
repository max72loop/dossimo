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
    updated: "2026-07-17",
    intro:
      "Un dossier CEE conforme ne se résume pas au devis. C’est un ensemble de pièces produites par l’artisan et par le bénéficiaire, qui doivent rester cohérentes entre elles et respecter une chronologie précise. Une seule mention qui diffère d’une pièce à l’autre, ou une date placée au mauvais moment, suffit à bloquer la prime. Ce guide cartographie ce que le dossier doit contenir et qui fournit quoi.",
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
    updated: "2026-07-14",
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
    updated: "2026-07-14",
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
    updated: "2026-07-17",
    intro:
      "Une prime CEE n’est valable que si elle a réellement contribué à décider les travaux. C’est le rôle actif et incitatif : l’offre CEE doit être engagée avant que le client n’accepte le devis. Si l’engagement est daté après, le dossier tombe pour effet d’aubaine, sans recours possible. La chronologie se sécurise document par document, avant le chantier.",
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
    updated: "2026-07-17",
    intro:
      "Le statut RGE ne suffit pas à lui seul : il doit couvrir précisément le geste réalisé et être valable à la date qui compte pour le dispositif. Une qualification dans un domaine voisin, expirée ou portée par la mauvaise entreprise bloque l’accès aux aides. Ces contrôles se font avant d’engager les travaux, quand tout est encore corrigeable.",
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
