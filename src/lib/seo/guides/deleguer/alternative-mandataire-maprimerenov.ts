import type { SeoGuide } from "../types";
import { anahModeEmploi, franceRenovDevis } from "../sources";

export const alternativeMandataire: SeoGuide = {
  slug: "alternative-mandataire-maprimerenov",
  metaTitle: "Alternative au mandataire MaPrimeRénov’ pour artisans",
  title: "L’alternative au mandataire MaPrimeRénov’ pour un artisan qui veut garder son client",
  description:
    "Un mandataire dépose le dossier et prend sa commission sur la prime. Il existe une autre voie : préparer un pack vérifié et déposer vous-même, sans céder la relation client ni le montant de l’aide.",
  eyebrow: "Solution artisan RGE · MaPrimeRénov’",
  category: "Déléguer votre dossier",
  updated: "2026-08-21",
  intro:
    "Un mandataire habilité par l’Anah dépose la demande à votre place et perçoit la prime, qu’il reverse ensuite en déduisant sa commission, en général assise sur le montant de l’aide. C’est un rôle que la réglementation autorise et encadre, mais que Dossimo refuse d’endosser par choix : dès qu’un mandataire dépose, c’est lui qui devient l’interlocuteur du dossier auprès du client, pas vous. Il existe une autre façon de se décharger de la partie administrative sans céder ce rôle.",
  sections: [
    {
      heading: "Ce que fait, et ne fait pas, un mandataire habilité",
      paragraphs: [
        "Le mandataire administratif ou financier, habilité par l’Anah, dépose la demande MaPrimeRénov’ pour le compte du bénéficiaire, éventuellement perçoit la prime en tiers de confiance, puis la reverse. Ce service a un coût, presque toujours une commission calculée sur le montant de l’aide obtenue, ce qui crée un lien financier direct entre ce que le mandataire facture et ce que le ménage reçoit réellement sur son compte.",
        "Ce que le mandataire ne fait pas, structurellement, c’est rester à votre place dans la relation avec le client. Une fois le dossier déposé en son nom, c’est lui qui répond aux questions sur l’avancement, lui qui gère une éventuelle demande de pièce complémentaire, lui qui explique un refus le cas échéant. L’artisan redevient un simple exécutant du chantier, dissocié du dossier d’aide qui a pourtant motivé la décision du client.",
      ],
    },
    {
      heading: "Pourquoi ce choix pèse plus qu’il n’y paraît au moment de la signature",
      paragraphs: [
        "Au moment du devis, la commission d’un mandataire paraît un détail : le client se concentre sur le reste à charge final, pas sur qui gère la paperasse. Le coût réel apparaît plus tard, quand le client rappelle pour savoir où en est son dossier et que l’artisan doit le renvoyer vers un tiers qu’il ne maîtrise pas. C’est un moment de friction qui abîme la relation que l’artisan a mis des mois à construire, souvent pour un service que l’artisan aurait pu piloter lui-même avec les bons outils.",
        "Il y a aussi un enjeu de contrôle sur le montant final. Un mandataire dont le revenu dépend du volume traité a rarement le temps d’optimiser chaque dossier individuellement. Un artisan qui connaît son client, son logement et son projet dans le détail a objectivement plus d’informations pour cela, à condition de ne pas perdre un temps disproportionné à apprendre les règles d’un dispositif qui change par arrêté.",
      ],
    },
    {
      heading: "La troisième voie : préparer sans déposer à la place du client",
      paragraphs: [
        "Entre monter seul chaque dossier et le céder à un mandataire, il existe une position intermédiaire : faire produire et vérifier le pack documentaire par un service indépendant, puis déposer vous-même avec votre client. C’est le choix que fait Dossimo. Depuis le 17 août 2026, le dépôt passe par le compte personnel unique du bénéficiaire sur france-renov.gouv.fr, sécurisé par FranceConnect+ : c’est le client qui se connecte avec son identité numérique, pas un tiers en son nom, ce qui est cohérent avec cette approche.",
        "Le pack généré reprend le récapitulatif du dossier, la checklist des pièces attendues et un rapport de contrôle qui remonte les points de vigilance avant l’envoi. Ce que vous perdez en rapidité de dépôt clé en main, vous le regagnez en ne partageant la commission avec personne et en restant l’interlocuteur unique de votre client, de la signature du devis jusqu’au versement de l’aide.",
      ],
    },
    {
      heading: "Ce que ça change concrètement pour le reste à charge du client",
      paragraphs: [
        "Sur un chantier identique, la différence entre les deux voies se joue essentiellement sur la commission. Un mandataire prélève un pourcentage de la prime obtenue, quel que soit le temps réellement passé sur le dossier. Un service de préparation documentaire facture un prix fixe par dossier, indépendant du montant de l’aide, ce qui ne crée aucune incitation à orienter le montage vers ce qui rapporte le plus au prestataire plutôt que vers ce qui optimise la prime du client.",
        "Dossimo est un service indépendant d’aide à la préparation de dossier, non affilié à l’Anah ni à France Rénov’. Il ne dépose jamais le dossier et ne touche jamais la prime : c’est un choix stratégique, pas une limite technique, qui laisse à l’artisan et à son client la main sur le dépôt et sur l’intégralité de l’aide.",
      ],
    },
  ],
  checklist: [
    { title: "Demander le taux de commission par écrit", text: "Avant de recommander un mandataire à un client, faites-vous préciser le pourcentage prélevé sur la prime, pas seulement le principe du service." },
    { title: "Identifier qui reste l’interlocuteur du dossier", text: "Un mandataire qui dépose devient le contact du client sur l’aide. Vérifiez si c’est ce que vous voulez avant de l’orienter vers cette option." },
    { title: "Vérifier l’identité numérique du client avant le 17 août", text: "Le dépôt passe désormais par FranceConnect+ et une identité numérique certifiée. Anticipez cette étape avec votre client, quelle que soit la voie choisie." },
    { title: "Comparer un prix fixe à une commission proportionnelle", text: "Sur une prime importante, une commission en pourcentage coûte souvent plus cher qu’un tarif fixe de préparation documentaire." },
    { title: "Garder la main sur les pièces techniques", text: "Devis, facture, caractéristiques du geste : produites et vérifiées en amont, elles restent cohérentes quelle que soit la voie de dépôt retenue ensuite." },
  ],
  errors: [
    "Le client découvre la commission du mandataire seulement au moment du versement de la prime.",
    "L’artisan renvoie systématiquement les questions du client vers le mandataire, sans plus suivre le dossier.",
    "Aucune identité numérique certifiée n’a été anticipée avant la date de dépôt.",
    "Un service de préparation documentaire est confondu avec un mandataire, alors que l’un dépose à votre place et l’autre non.",
    "Le choix entre les deux voies est fait sans avoir comparé le coût réel sur le montant précis de la prime attendue.",
  ],
  example: {
    before: "Le mandataire dépose le dossier, prélève sa commission sur la prime, et devient le point de contact du client pour toute la suite.",
    after: "Le pack est préparé et vérifié en amont, le client se connecte lui-même à son compte France Rénov’ pour déposer, l’artisan reste son seul interlocuteur.",
  },
  faq: [
    {
      question: "Un mandataire MaPrimeRénov’ est-il obligatoire pour déposer un dossier ?",
      answer:
        "Non. Le recours à un mandataire est une option, pas une obligation. Le bénéficiaire peut déposer lui-même sa demande depuis son compte personnel sur france-renov.gouv.fr, avec l’artisan à ses côtés pour préparer les pièces techniques du dossier.",
    },
    {
      question: "Quelle est la différence entre un mandataire et un service de préparation de dossier ?",
      answer:
        "Le mandataire dépose la demande au nom du bénéficiaire et perçoit généralement la prime pour la reverser, en général contre une commission. Un service de préparation documentaire génère et vérifie les pièces du dossier, mais c’est le bénéficiaire et l’artisan qui déposent eux-mêmes et qui reçoivent l’intégralité de l’aide.",
    },
    {
      question: "Pourquoi Dossimo ne devient-il pas mandataire, puisque ça simplifierait le dépôt ?",
      answer:
        "Par choix stratégique, pas par contrainte. Devenir mandataire déplacerait la relation client vers Dossimo, exactement ce que ce guide déconseille à un artisan qui veut la garder. Le pack complet et vérifié reste déposé par l’artisan et son client, qui conservent ainsi la main sur leur relation et sur la prime.",
    },
  ],
  sources: [
    { label: "Bonnes pratiques professionnels et mandataires — France Rénov’", href: franceRenovDevis },
    { label: "Compte personnel unique France Rénov’ au 17 août 2026 — communiqué de l’Anah", href: "https://www.anah.gouv.fr/presse/compter-du-17-aout-2026-france-renov-renforce-son-offre-de-services-avec-un-compte-personnel" },
    { label: "Mode d’emploi MaPrimeRénov’ 2026 — Anah", href: anahModeEmploi },
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
        description: "Un prix fixe par dossier, indépendant du montant de la prime.",
      },
    ],
  },
};
