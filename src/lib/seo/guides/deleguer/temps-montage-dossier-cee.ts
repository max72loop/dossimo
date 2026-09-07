import type { SeoGuide } from "../types";
import { catalogueCee, mentionsFacture, questionsCee } from "../sources";

export const tempsMontageCee: SeoGuide = {
  slug: "temps-montage-dossier-cee",
  metaTitle: "Combien de temps prend un dossier CEE, vraiment",
  title: "Combien de temps prend vraiment un dossier CEE",
  description:
    "Trois mois pour l’envoyer après la facture, mais un temps de préparation qui dépend surtout des allers-retours. Où part réellement le temps sur un dossier CEE, et comment le reprendre.",
  eyebrow: "Solution artisan RGE · Délégation CEE",
  category: "Déléguer votre dossier",
  updated: "2026-08-21",
  intro:
    "Le dispositif CEE laisse trois mois pour envoyer un dossier après la date de la facture. Ce délai paraît large, et c’est justement pour ça qu’il se consomme sans qu’on s’en rende compte : ce n’est pas la constitution des pièces qui prend du temps, ce sont les allers-retours provoqués par une pièce oubliée, une mention incohérente ou un justificatif du bénéficiaire qui n’arrive jamais du premier coup.",
  sections: [
    {
      heading: "Le temps ne se perd pas où on croit qu’il se perd",
      paragraphs: [
        "Réunir les pièces produites par l’artisan lui-même, devis conforme, facture, certificat RGE, attestation sur l’honneur, photos avant et après, prend en réalité peu de temps quand elles sont préparées au fil du chantier. Le temps se perd ailleurs : dans les relances pour obtenir une pièce d’identité ou un RIB du bénéficiaire, dans la correction d’une surface qui diffère de deux mètres carrés entre le devis et la facture, ou dans la recherche a posteriori d’une photo d’avant travaux qui n’a pas été prise au bon moment.",
        "Chacun de ces incidents, pris isolément, coûte peu. Répétés sur une tournée de dossiers, ils expliquent pourquoi un délai de trois mois se retrouve parfois dépassé, alors que le contenu du dossier, lui, était prêt depuis longtemps.",
      ],
    },
    {
      heading: "Ce que change une saisie unique, en temps réel",
      paragraphs: [
        "Le point qui consomme le plus de temps est la relecture croisée : rapprocher le devis, la facture, l’attestation sur l’honneur et les photos pour vérifier qu’ils racontent la même histoire. Fait à la main, ce rapprochement demande de rouvrir plusieurs documents, poste par poste, et de comparer des valeurs qu’on a soi-même saisies plusieurs fois, avec le risque d’erreur que cela comporte.",
        "Générer les pièces depuis une seule saisie du chantier supprime une bonne partie de ce temps, parce que l’incohérence entre deux documents devient structurellement difficile à produire par accident : la surface, la référence produit ou la performance ne sont saisies qu’une fois et reportées partout où elles doivent apparaître.",
      ],
    },
    {
      heading: "Le vrai coût du temps, ce n’est pas les heures",
      paragraphs: [
        "Le temps passé sur un dossier CEE n’est presque jamais le vrai problème : c’est ce qu’il empêche de faire pendant ce temps-là, chiffrer un nouveau chantier, relancer un client, avancer sur un devis en attente. Un dossier qui traîne trois semaines de plus qu’il ne devrait n’a coûté que quelques heures cumulées, mais il a occupé un créneau mental disproportionné par rapport à ces heures.",
        "C’est cette charge mentale, plus que le temps brut, qui pousse le plus d’artisans à chercher une solution de délégation. Elle se traite en réduisant le nombre d’allers-retours, pas en accélérant chaque étape prise isolément.",
      ],
    },
    {
      heading: "Reprendre la main sur le calendrier",
      paragraphs: [
        "Le réflexe qui protège le mieux le délai de trois mois consiste à réunir les pièces au fur et à mesure du chantier, pas après la facture : prendre la photo avant travaux au moment du devis, demander les justificatifs du bénéficiaire dès le premier rendez-vous, dater l’engagement de l’offre CEE avant la signature. Un service qui contrôle la cohérence à chaque étape, plutôt qu’une seule fois à la fin, resserre encore ce calendrier.",
        "Dossimo génère le pack de pièces depuis une saisie unique et le contrôle avant l’envoi, ce qui réduit le nombre d’allers-retours plutôt que le temps de saisie lui-même. C’est un service indépendant d’aide à la préparation de dossier, non affilié à l’Anah ni à France Rénov’ : il ne dépose jamais le dossier et ne touche jamais la prime.",
      ],
    },
  ],
  checklist: [
    { title: "Chronométrer un dossier réel une fois", text: "Notez le temps passé sur votre prochain dossier CEE, poste par poste. C’est souvent la seule façon de voir où il part vraiment." },
    { title: "Prendre les photos au bon moment", text: "Avant et après travaux, au moment du chantier, pas au moment du dépôt : une photo manquante après coup ne se remplace pas." },
    { title: "Demander les pièces du bénéficiaire dès le premier rendez-vous", text: "C’est la partie du dossier sur laquelle l’artisan a le moins de prise et celle qui provoque le plus de relances tardives." },
    { title: "Rapprocher devis et facture avant l’envoi", text: "Une seule mention divergente déclenche un aller-retour qui peut coûter plus de temps que la préparation initiale du dossier." },
    { title: "Compter le coût du temps, pas seulement celui de la délégation", text: "Comparez le temps réellement passé à ce que coûterait un service qui vérifie les pièces avant l’envoi." },
  ],
  errors: [
    "Le dossier est constitué après la facture plutôt qu’au fil du chantier, ce qui concentre tous les aller-retours sur la fin du délai.",
    "Les photos avant travaux ne sont pas prises au bon moment et ne peuvent plus être produites après coup.",
    "Les pièces du bénéficiaire sont demandées tardivement, ce qui allonge le délai sans que l’artisan puisse agir dessus.",
    "Une incohérence entre devis et facture n’est détectée qu’au moment du dépôt, provoquant un nouvel aller-retour.",
    "Le temps passé sur les dossiers n’a jamais été mesuré, ce qui empêche de savoir si une délégation serait rentable.",
  ],
  example: {
    before: "Les pièces sont réunies dans la dernière semaine du délai de trois mois, une incohérence est découverte, le dossier part en retard.",
    after: "Les pièces sont produites depuis une saisie unique dès le chantier, la cohérence est vérifiée en continu, le dossier part sans relance.",
  },
  faq: [
    {
      question: "Combien de temps faut-il vraiment pour monter un dossier CEE ?",
      answer:
        "La production des pièces elle-même prend peu de temps quand elle est faite au fil du chantier. Ce qui allonge réellement le délai, ce sont les allers-retours provoqués par une pièce manquante ou une incohérence entre documents, découverts trop tard.",
    },
    {
      question: "Le délai de trois mois après la facture est-il suffisant ?",
      answer:
        "Oui dans l’absolu, mais il se consomme vite si la collecte des pièces du bénéficiaire ne commence qu’après le chantier. Réunir les justificatifs dès le premier rendez-vous et vérifier la cohérence en continu, plutôt qu’en une seule fois à la fin, garde une vraie marge sur ce délai.",
    },
    {
      question: "Une saisie unique fait-elle vraiment gagner du temps sur un dossier CEE ?",
      answer:
        "Elle réduit surtout le nombre d’allers-retours, qui est ce qui coûte le plus cher en temps réel. Une surface ou une référence produit saisie une seule fois et reportée automatiquement sur toutes les pièces ne peut plus diverger entre le devis et la facture, ce qui supprime la relecture croisée manuelle.",
    },
  ],
  sources: [
    { label: "Questions-réponses officielles sur le dispositif CEE", href: questionsCee },
    { label: "Catalogue officiel des fiches d’opérations standardisées CEE", href: catalogueCee },
    { label: "Mentions obligatoires d’une facture — Service Public", href: mentionsFacture },
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
        description: "Un prix fixe par dossier, sans abonnement ni commission sur la prime.",
      },
    ],
  },
};
