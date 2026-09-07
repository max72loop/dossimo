import type { SeoGuide } from "../types";
import { anahModeEmploi, catalogueCee, questionsCee } from "../sources";

export const cumulMprCee: SeoGuide = {
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
