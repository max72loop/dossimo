import type { SeoGuide } from "../types";
import { anahModeEmploi, franceRenovDossier, questionsCee } from "../sources";

export const coutDossierRefuse: SeoGuide = {
  slug: "cout-dossier-refuse",
  metaTitle: "Ce que coûte un dossier de prime refusé à l’artisan",
  title: "Ce que coûte réellement un dossier refusé, à l’artisan plus qu’au client",
  description:
    "Un refus ne coûte pas que la prime. Temps repris, client à rassurer, chantier parfois entamé sur une aide qui ne viendra jamais : ce que le refus déplace vers l’artisan, et comment le prévenir avant le devis.",
  eyebrow: "Solution artisan RGE · Prévention",
  category: "Déléguer votre dossier",
  updated: "2026-08-21",
  intro:
    "Une offre CEE engagée après l’acceptation du devis fait tomber la prime sans recours possible, quelle que soit la qualité du chantier. Ce genre de refus ne coûte pas que le montant de l’aide : il coûte le temps déjà passé sur le dossier, la conversation à avoir avec un client qui comptait sur cette prime pour financer une partie de ses travaux, et parfois la crédibilité de l’artisan qui la lui avait annoncée.",
  sections: [
    {
      heading: "Le refus se voit sur la prime, il se paie ailleurs",
      paragraphs: [
        "Le montant refusé est la partie visible du coût, celle qu’on chiffre facilement. La partie invisible est plus lourde : le temps déjà investi à constituer le dossier ne se récupère pas, que le refus soit corrigible ou non. Quand il ne l’est pas, comme une chronologie CEE mal respectée, ce temps est purement perdu, sans même la possibilité de reprendre le dossier autrement.",
        "S’ajoute le temps de la conversation avec le client, qui n’est pas neutre non plus. Expliquer qu’une aide annoncée ne viendra pas, ou viendra amputée, demande du tact et prend du temps sur un chantier qui, lui, avance sans attendre la décision.",
      ],
    },
    {
      heading: "Le coût qui ne se voit sur aucune facture",
      paragraphs: [
        "Un client à qui l’artisan a annoncé un montant d’aide qui ne se concrétise pas retient rarement que le refus vient d’un texte réglementaire complexe. Il retient que l’artisan s’est trompé sur un point qui touchait directement à son budget. C’est un coût de réputation qui ne figure sur aucune ligne comptable, mais qui pèse sur les recommandations et le bouche-à-oreille, le premier canal d’acquisition de la plupart des artisans RGE.",
        "Il y a enfin un coût de trésorerie spécifique aux chantiers déjà réalisés sur la promesse d’une aide : si le refus tombe après les travaux, l’artisan se retrouve parfois à devoir renégocier le solde avec un client qui n’a plus la prime en face pour le régler.",
      ],
    },
    {
      heading: "Les motifs qui coûtent le plus cher sont ceux qui ne se corrigent pas",
      paragraphs: [
        "Tous les refus ne se valent pas. Une pièce manquante ou une mention incomplète se corrige et permet de redéposer, ce qui limite le coût au temps de la correction. Un fait déjà accompli, comme un chantier démarré avant l’accusé de réception de la demande côté MaPrimeRénov’, ou une offre CEE contractualisée après le devis, ne se rattrape jamais sur ce dossier précis : le coût est intégralement perdu, y compris le temps de préparation initial.",
        "C’est cette catégorie de motifs, la chronologie, qui mérite le plus d’attention avant le devis, précisément parce qu’elle est la seule dont le coût ne se limite pas à un délai supplémentaire.",
      ],
    },
    {
      heading: "Prévenir coûte moins cher que corriger",
      paragraphs: [
        "Le calcul qui justifie un contrôle en amont est simple à poser une fois qu’on l’a fait une seule fois : comparer le coût d’une vérification systématique avant le dépôt au coût cumulé d’un seul refus évité, temps perdu, conversation difficile avec le client et confiance entamée compris. Dans la plupart des cas, la vérification coûte nettement moins cher que le refus qu’elle prévient.",
        "Dossimo vérifie la cohérence du dossier avant le dépôt et remonte les points de vigilance pendant qu’il est encore temps d’agir, pas après la décision. C’est un service indépendant d’aide à la préparation de dossier, non affilié à l’Anah ni à France Rénov’, qui ne dépose jamais le dossier et ne touche jamais la prime.",
      ],
    },
  ],
  checklist: [
    { title: "Distinguer les refus corrigibles des refus sur fait accompli", text: "Une pièce manquante se corrige. Une chronologie mal respectée, comme une offre CEE engagée après le devis, ne se rattrape jamais sur ce dossier." },
    { title: "Ne jamais annoncer un montant d’aide avant contrôle", text: "Un montant annoncé trop tôt et non confirmé abîme la confiance du client bien plus qu’un délai supplémentaire assumé dès le départ." },
    { title: "Chiffrer le coût réel d’un refus déjà vécu", text: "Temps de préparation perdu, temps de la conversation avec le client, éventuelle renégociation du solde : additionnez-les avant de sous-estimer le risque." },
    { title: "Sécuriser la chronologie avant le devis", text: "Offre CEE engagée avant l’acceptation du devis, demande MaPrimeRénov’ déposée avant le début des travaux : ces deux points se jouent avant la signature, jamais après." },
    { title: "Vérifier avant d’envoyer, pas après un premier refus", text: "Le contrôle a le même coût qu’il intervienne avant ou après un refus, mais un seul des deux moments évite réellement la perte." },
  ],
  errors: [
    "Un montant de prime est annoncé au client avant que la chronologie CEE ou MaPrimeRénov’ n’ait été vérifiée.",
    "Un chantier démarre avant l’accusé de réception de la demande MaPrimeRénov’ par l’Anah.",
    "L’offre CEE est engagée après l’acceptation du devis, ce qui fait tomber la prime sans recours.",
    "Le coût d’un refus n’est jamais mesuré au-delà du montant de la prime perdue.",
    "Le contrôle de cohérence n’intervient qu’après un premier refus, jamais en amont du devis.",
  ],
  example: {
    before: "Le devis annonce un montant d’aide avant vérification, l’offre CEE est engagée après signature, le refus tombe et le client doit être recontacté.",
    after: "La chronologie est vérifiée avant le devis, le montant annoncé au client correspond à ce que le dossier peut réellement obtenir, aucun refus sur fait accompli.",
  },
  faq: [
    {
      question: "Un dossier refusé, ça coûte quoi exactement à l’artisan ?",
      answer:
        "Au-delà du montant de la prime perdue, ça coûte le temps déjà passé à constituer le dossier, le temps de la conversation avec un client qui comptait sur cette aide, et parfois la confiance qu’il accordait à l’artisan pour le reste du chantier.",
    },
    {
      question: "Tous les refus sont-ils rattrapables ?",
      answer:
        "Non. Un refus sur pièce manquante ou mention incomplète se corrige et permet de redéposer. Un refus sur un fait déjà accompli, comme un chantier démarré trop tôt ou une offre CEE contractualisée après le devis, ne se rattrape jamais sur ce dossier précis.",
    },
    {
      question: "Comment éviter d’annoncer un montant d’aide qui ne se confirme pas ?",
      answer:
        "En vérifiant la chronologie et la cohérence du dossier avant le devis, pas après. C’est précisément le moment où la plupart des motifs de refus, notamment ceux liés aux dates, sont encore évitables plutôt qu’à corriger.",
    },
  ],
  sources: [
    { label: "Questions-réponses officielles sur le dispositif CEE", href: questionsCee },
    { label: "Bien monter son dossier MaPrimeRénov’ — France Rénov’", href: franceRenovDossier },
    { label: "Mode d’emploi MaPrimeRénov’ 2026 — Anah", href: anahModeEmploi },
  ],
  voirAussi: [
    {
      label: "MaPrimeRénov’ refusée : lire la décision avant de refaire le dossier",
      href: "/refus/maprimerenov-refuse",
      description: "Ce qui se corrige, ce qui ne se corrige pas, et la voie de recours devant le directeur général de l’Anah.",
    },
    {
      label: "Dossier CEE rejeté : ce que l’obligé a réellement contrôlé",
      href: "/refus/cee-rejete",
      description: "Les points que l’obligé vérifie réellement, fiche par fiche, et ceux qui sont irrattrapables.",
    },
  ],
  pourAllerPlusLoin: {
    heading: "Voir ce que produit une préparation vérifiée",
    liens: [
      {
        label: "Le pack complet en exemple",
        href: "/exemple",
        description: "Le récapitulatif, la checklist et le rapport de contrôle générés depuis une saisie unique, sur un chantier fictif.",
      },
      {
        label: "Grille tarifaire",
        href: "/tarifs",
        description: "Un prix fixe par dossier, très en dessous du coût d’un seul refus évité.",
      },
    ],
  },
};
