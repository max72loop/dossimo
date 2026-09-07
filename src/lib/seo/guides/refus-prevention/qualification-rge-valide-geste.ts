import type { SeoGuide } from "../types";
import { anahModeEmploi, annuaireRge, franceRenovDossier } from "../sources";

export const rge: SeoGuide = {
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
  voirAussi: [
    {
      label: "La qualification RGE n’était pas valide à la date utile",
      href: "/refus/motifs/qualification-rge-invalide-a-la-date",
      description:
        "Le motif correspondant : à quelle date la qualification s’apprécie, et ce qu’il reste à faire quand le refus est déjà tombé.",
    },
    {
      label: "La qualification ne couvre pas le geste, ou le poseur n’est pas celui qui est qualifié",
      href: "/refus/motifs/rge-hors-domaine-ou-sous-traitance",
      description:
        "Le cas de la sous-traitance, qui ne se voit pas sur le devis et coûte le plus cher.",
    },
  ],
  sources: [
    { label: "Annuaire officiel des professionnels RGE (France Rénov’)", href: annuaireRge },
    { label: "Bien monter son dossier MaPrimeRénov’ — France Rénov’", href: franceRenovDossier },
    { label: "Mode d’emploi MaPrimeRénov’ 2026 — Anah", href: anahModeEmploi },
  ],
  pourAllerPlusLoin: {
    heading: "Pas le temps de sécuriser ce point vous-même ?",
    liens: [
      {
        label: "Ce que coûte réellement un dossier refusé",
        href: "/cout-dossier-refuse",
        description: "Temps repris, client à rassurer, prime perdue : ce que le refus déplace vers l’artisan.",
      },
      {
        label: "La checklist à relire avant de déposer",
        href: "/checklist-avant-depot",
        description: "Douze points de contrôle, communs aux deux dispositifs ou propres à chacun.",
      },
    ],
  },
};
