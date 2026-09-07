import type { SeoGuide } from "../types";
import { franceRenovDossier, mentionsFacture, questionsCee } from "../sources";

export const checklistAvantDepot: SeoGuide = {
  slug: "checklist-avant-depot",
  metaTitle: "Checklist de contrôle avant dépôt, MaPrimeRénov’ et CEE",
  title: "La checklist à relire avant de déposer, MaPrimeRénov’ et CEE",
  description:
    "Douze points de contrôle, communs aux deux dispositifs ou propres à chacun, à relire avant l’envoi d’un dossier. De quoi repérer en quelques minutes ce qu’un instructeur mettrait des semaines à révéler par un refus.",
  eyebrow: "Solution artisan RGE · Contrôle avant dépôt",
  category: "Déléguer votre dossier",
  updated: "2026-08-21",
  intro:
    "Un dossier MaPrimeRénov’ ou CEE ne se juge jamais pièce par pièce mais dans son ensemble : c’est le rapprochement entre le devis, la facture et les justificatifs qui détermine si le dossier passe, pas la qualité de chaque document pris isolément. Cette checklist rassemble les points qu’un instructeur vérifie réellement, dans l’ordre où ils valent d’être relus avant l’envoi.",
  sections: [
    {
      heading: "D’abord la chronologie, parce qu’elle ne se corrige jamais après coup",
      paragraphs: [
        "Avant toute autre vérification, contrôlez les dates. Côté CEE, l’offre doit avoir été engagée au plus tard à la date d’acceptation du devis, avec une tolérance de quatorze jours pour un bénéficiaire particulier à condition que le chantier n’ait pas commencé. Côté MaPrimeRénov’, la demande doit avoir été déposée, et son accusé de réception obtenu, avant le début des travaux. Ces deux points sont les seuls du dossier qu’aucune pièce complémentaire ne peut réparer une fois le chantier engagé.",
        "En isolation, ajoutez le délai de sept jours francs minimum entre l’acceptation du devis et la pose de l’isolant, exigé par les fiches CEE concernées. Un chantier posé trop vite après la signature fait tomber le dossier, même si toutes les autres pièces sont parfaites.",
      ],
    },
    {
      heading: "Ensuite la cohérence entre les pièces",
      paragraphs: [
        "Une fois la chronologie validée, rapprochez le devis et la facture ligne à ligne : surface, quantité, marque, référence du produit posé, résistance thermique ou performance annoncée doivent être identiques d’un document à l’autre. La moindre divergence, même de quelques centimètres carrés, est ce que l’instructeur, qui ne visite jamais le chantier, cherche en priorité à recouper.",
        "Vérifiez ensuite que l’adresse du chantier, écrite en entier avec son complément le cas échéant, correspond exactement à celle de la demande d’aide, et que le nom du bénéficiaire figurant sur les pièces est bien celui déclaré comme demandeur.",
      ],
    },
    {
      heading: "Puis la qualification et les justificatifs techniques",
      paragraphs: [
        "Contrôlez que la qualification RGE couvre précisément le domaine du geste facturé, à la date qui compte pour le dispositif concerné, et que c’est bien l’entreprise qui a exécuté les travaux qui la détient, y compris en cas de sous-traitance. Vérifiez la présence et la date de la visite technique préalable quand la fiche CEE l’exige, ainsi que les photos avant et après travaux, qui ne se produisent pas rétroactivement une fois le chantier terminé.",
        "Relisez enfin l’attestation sur l’honneur : elle doit être co-signée par l’artisan et le bénéficiaire, et reprendre des valeurs identiques à celles du devis et de la facture, jamais une reformulation approximative.",
      ],
    },
    {
      heading: "Enfin les pièces du bénéficiaire, et le cas des situations particulières",
      paragraphs: [
        "Terminez par les pièces qui dépendent du bénéficiaire : identité, RIB, justificatif de propriété et d’occupation, complétés du bail et de l’engagement de location pour un bailleur, ou du procès-verbal d’assemblée générale et de la quote-part pour une copropriété. C’est la partie sur laquelle l’artisan a le moins de prise, donc celle qu’il vaut mieux avoir réclamée dès le premier rendez-vous plutôt qu’au moment du dépôt.",
        "Une relecture menée dans cet ordre, chronologie d’abord, cohérence ensuite, qualification puis pièces du bénéficiaire, prend quelques minutes une fois automatisée et évite la plupart des refus documentaires. C’est cette relecture que Dossimo effectue systématiquement sur chaque dossier généré, avant que l’artisan ne l’envoie. Dossimo est un service indépendant d’aide à la préparation de dossier, non affilié à l’Anah ni à France Rénov’ : il ne dépose jamais le dossier et ne touche jamais la prime.",
      ],
    },
  ],
  checklist: [
    { title: "Chronologie CEE", text: "Offre engagée avant l’acceptation du devis, ou dans les quatorze jours pour un particulier si le chantier n’a pas démarré. Sept jours francs avant la pose en isolation." },
    { title: "Chronologie MaPrimeRénov’", text: "Demande déposée et accusé de réception obtenu avant le début des travaux." },
    { title: "Cohérence devis / facture", text: "Surface, marque, référence et performance identiques d’un document à l’autre, à l’unité près." },
    { title: "Adresse et identité", text: "Adresse du chantier écrite en entier, identique à celle de la demande. Nom du demandeur cohérent sur toutes les pièces." },
    { title: "Qualification RGE", text: "Domaine couvrant le geste facturé, valide à la date utile, détenue par l’entreprise qui a réellement exécuté les travaux." },
    { title: "Preuves techniques", text: "Visite préalable datée quand elle est exigée, photos avant et après, attestation sur l’honneur co-signée et cohérente." },
    { title: "Pièces du bénéficiaire", text: "Identité, RIB, justificatifs de propriété et d’occupation, complétés selon le cas par le bail ou le procès-verbal de copropriété." },
  ],
  errors: [
    "La relecture se fait pièce par pièce plutôt que par rapprochement entre les documents.",
    "Une date d’engagement ou de dépôt est vérifiée après le début du chantier, quand elle ne se corrige plus.",
    "Une divergence de quelques centimètres carrés entre devis et facture n’est pas repérée avant l’envoi.",
    "La qualification RGE du sous-traitant réel n’est pas distinguée de celle du donneur d’ordre.",
    "Les pièces du bénéficiaire sont réclamées au moment du dépôt plutôt que dès le premier rendez-vous.",
  ],
  example: {
    before: "Chaque pièce est considérée correcte isolément, et le dossier part sans relecture d’ensemble entre les documents.",
    after: "Le dossier est relu dans l’ordre chronologie, cohérence, qualification, pièces du bénéficiaire, et chaque écart est corrigé avant l’envoi.",
  },
  faq: [
    {
      question: "Quel est le premier point à vérifier avant de déposer un dossier ?",
      answer:
        "La chronologie, avant toute autre chose. L’offre CEE engagée après le devis ou un chantier démarré avant l’accusé de réception MaPrimeRénov’ sont les deux seuls défauts qu’aucune pièce complémentaire ne peut réparer une fois le chantier commencé.",
    },
    {
      question: "Faut-il une checklist différente pour MaPrimeRénov’ et pour le CEE ?",
      answer:
        "Les deux partagent un socle commun, la cohérence entre devis et facture et la qualification RGE, mais divergent sur la chronologie et certaines pièces techniques. Sur un chantier qui cumule les deux aides, les deux jeux de contrôles doivent être passés en parallèle, pas fusionnés.",
    },
    {
      question: "Cette checklist remplace-t-elle un contrôle automatisé ?",
      answer:
        "Elle donne l’ordre et les points à ne pas manquer, mais un contrôle automatisé les applique systématiquement sur chaque dossier, sans dépendre de la vigilance du moment. Dossimo l’effectue à partir d’une saisie unique du chantier et remonte les écarts avant l’envoi.",
    },
  ],
  sources: [
    { label: "Bien monter son dossier MaPrimeRénov’ — France Rénov’", href: franceRenovDossier },
    { label: "Questions-réponses officielles sur le dispositif CEE", href: questionsCee },
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
