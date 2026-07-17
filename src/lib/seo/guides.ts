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
    updated: "2026-07-14",
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
    updated: "2026-07-14",
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
 * Guides regroupés par famille, dans l'ordre de `GUIDE_CATEGORIES`. Les catégories
 * vides ne sont pas rendues : le hub grandit tout seul quand on ajoute un guide.
 */
export function guidesByCategory(): Array<{ category: GuideCategory; guides: SeoGuide[] }> {
  return GUIDE_CATEGORIES.map((category) => ({
    category,
    guides: guideList.filter((guide) => guide.category === category),
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
