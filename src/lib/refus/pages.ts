/**
 * Contenu éditorial des pages fixes du cluster « refus », en données typées, sur
 * le modèle de `seo/guides.ts`. Les pages motif, elles, viennent de la base
 * (`motifs-loader.ts`) : ce fichier ne porte que ce qui n'est pas un motif.
 *
 * RÈGLE DE RÉDACTION, sans exception (docs/cluster-refus.md § 6) :
 * aucune affirmation réglementaire qui ne soit adossée à une assertion sourcée de
 * `docs/refus/motifs-assertions.md`. Les identifiants (A1, A3b…) sont cités en
 * commentaire au-dessus de chaque section concernée, pour que la relecture porte
 * sur la correspondance texte / source et pas sur la prose.
 *
 * En particulier : AUCUN délai chiffré côté MaPrimeRénov'. L'article 9 du décret
 * n° 2020-26 ne fixe pas de délai au recours préalable (A1b), et les deux mois
 * souvent cités sont ceux du recours contentieux (A2b). Les pages renvoient à ce
 * que porte la notification reçue, un délai non mentionné dans celle-ci n'étant
 * pas opposable (A2).
 */

export interface RefusSection {
  heading: string;
  paragraphs: string[];
}

export interface RefusPageContenu {
  /** Chemin absolu, sans slash final. Sert au canonical, au fil d'Ariane et au sitemap. */
  path: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  /** Date de dernière vérification éditoriale, `AAAA-MM-JJ`. */
  updated: string;
  sections: RefusSection[];
  /** Points saillants, rendus en fin de page. Jamais un verdict, jamais un délai. */
  aRetenir: string[];
}

const VERIFIE_LE = "2026-07-31";

/* -------------------------------------------------------------------------- */
/* /refus/maprimerenov-refuse                                                  */
/* -------------------------------------------------------------------------- */

export const PAGE_MPR: RefusPageContenu = {
  path: "/refus/maprimerenov-refuse",
  metaTitle: "MaPrimeRénov’ refusée : comprendre la décision et la reprendre",
  metaDescription:
    "Ce que dit une décision de refus MaPrimeRénov’, ce qui se corrige et ce qui ne se corrige pas, et la voie de recours préalable obligatoire devant le directeur général de l’Anah.",
  eyebrow: "Artisan RGE · MaPrimeRénov’",
  title: "MaPrimeRénov’ refusée : lire la décision avant de refaire le dossier",
  intro:
    "Un refus MaPrimeRénov’ arrive presque toujours par écrit, avec un motif, et c’est ce motif qui commande la suite. Certains se corrigent et autorisent un nouveau dépôt, d’autres portent sur un fait déjà accompli qu’aucune pièce ne rattrapera. Cette page distingue les deux, et décrit la voie de recours telle que le texte l’organise, sans avancer de délai que la décision reçue ne mentionnerait pas.",
  updated: VERIFIE_LE,
  sections: [
    // A1, A1b : RAPO obligatoire, art. 9 du décret n° 2020-26. Aucun délai chiffré.
    {
      heading: "Contester suppose d’abord d’écrire à l’Anah",
      paragraphs: [
        "Contrairement à ce qu’on lit souvent, on ne saisit pas directement le juge d’une décision relative à la prime. L’introduction d’un recours est subordonnée à l’exercice préalable d’un recours administratif auprès du directeur général de l’Anah : ce passage n’est pas une formalité de courtoisie, c’est une condition de recevabilité. Sans lui, une requête au tribunal est écartée sans examen du fond.",
        "Ce recours préalable est adressé au directeur général de l’Anah. Le silence gardé plus de quatre mois sur cette demande vaut décision de rejet, ce qui rouvre alors la voie contentieuse. C’est le seul délai que le texte énonce lui-même à ce stade.",
        "Le reste des délais dépend de ce que porte la décision reçue. Les délais de recours contre une décision administrative ne sont opposables qu’à la condition d’avoir été mentionnés, avec les voies de recours, dans la notification. La bonne pratique est donc de relire la notification, d’y chercher ces mentions, et de dater précisément sa réception : c’est ce document qui fixe le calendrier applicable, pas un délai général appris ailleurs.",
      ],
    },
    // A4, A4b : art. 2 du décret n° 2020-26, y compris la dérogation.
    {
      heading: "Les travaux commencés trop tôt, et l’exception que le texte prévoit",
      paragraphs: [
        "Le motif le plus fréquent, et le plus mal compris, tient à la chronologie. Seuls les travaux et prestations commencés après l’accusé de réception de la demande de prime par l’Anah y ouvrent droit. Cet accusé de réception ne vaut pas décision d’octroi : il ouvre la fenêtre pendant laquelle le chantier peut démarrer, rien de plus. Un devis signé et un chantier lancé avant ce point de départ font tomber la demande sur un fait acquis.",
        "Le décret prévoit toutefois une soupape, souvent ignorée. Le directeur général de l’Anah peut exceptionnellement accepter une demande déposée après le commencement des travaux, notamment lorsque ceux-ci étaient urgents et justifiés par un risque manifeste pour la santé ou la sécurité des personnes, ou consécutifs à une catastrophe naturelle ou technologique. Cette voie est étroite et suppose de documenter l’urgence, mais elle existe : un dossier dans cette situation n’est pas mécaniquement clos.",
      ],
    },
    {
      heading: "Corriger et redéposer, ou contester : deux réponses différentes",
      paragraphs: [
        "Un refus fondé sur une pièce absente, une mention manquante ou une incohérence entre documents appelle une correction, pas un recours. Le geste utile consiste à reprendre la pièce en cause, à vérifier que les autres documents disent la même chose, et à redéposer un dossier cohérent. Engager une contestation sur un dossier qu’on peut simplement corriger fait perdre du temps aux deux parties.",
        "Un refus fondé sur une appréciation, en revanche, se conteste. C’est le cas lorsque l’instruction retient une lecture d’une pièce que l’artisan estime inexacte, ou tient pour absente une information qui figure au dossier. Là, le recours préalable a un objet : il expose, pièce à l’appui, en quoi la décision repose sur une erreur de fait.",
        "Dans les deux cas, la question à trancher en premier est celle-ci : le motif porte-t-il sur un document, ou sur un fait déjà accompli ? Un document se refait. Une date de démarrage, non. C’est cette distinction que le pack Dossimo cherche à rendre inutile en amont, en vérifiant la cohérence avant le dépôt plutôt qu’après la décision.",
      ],
    },
  ],
  aRetenir: [
    "Le recours devant le directeur général de l’Anah est un préalable obligatoire : sans lui, la requête au juge est irrecevable.",
    "Le silence gardé plus de quatre mois sur ce recours préalable vaut décision de rejet.",
    "Les délais applicables sont ceux que porte votre notification : un délai qui n’y est pas mentionné ne vous est pas opposable.",
    "Un chantier démarré avant l’accusé de réception de la demande n’ouvre pas droit à la prime, sauf acceptation exceptionnelle prévue par le décret.",
  ],
};

/* -------------------------------------------------------------------------- */
/* /refus/cee-rejete                                                           */
/* -------------------------------------------------------------------------- */

export const PAGE_CEE: RefusPageContenu = {
  path: "/refus/cee-rejete",
  metaTitle: "Dossier CEE rejeté : les causes réelles, fiche par fiche",
  metaDescription:
    "Rôle actif et incitatif, délai de sept jours francs, mentions de la preuve de réalisation, résistance thermique, qualification RGE à la date d’engagement : ce qui fait tomber un dossier CEE.",
  eyebrow: "Artisan RGE · CEE",
  title: "Dossier CEE rejeté : ce que l’obligé a réellement contrôlé",
  intro:
    "Un rejet CEE ne vient pas d’une administration mais de l’obligé ou de son délégataire, qui vérifie que l’opération remplit les conditions de la fiche d’opération standardisée applicable. Le contrôle est documentaire : personne ne visite le chantier, tout se joue sur la concordance des pièces et sur des dates. Cette page décrit les points qui font tomber les dossiers, tels que les fiches et le code de l’énergie les posent.",
  updated: VERIFIE_LE,
  sections: [
    // A3, A3b, A3c, A23 : art. R. 221-22 du code de l'énergie.
    {
      heading: "Le rôle actif et incitatif, et la fenêtre de quatorze jours",
      paragraphs: [
        "Une prime CEE n’est pas une remise commerciale : elle est la contrepartie d’une obligation qui pèse sur les fournisseurs d’énergie, et elle n’est due que si elle a contribué à déclencher les travaux. Le code de l’énergie traduit cela par une règle de date : la contractualisation intervient au plus tard à la date d’engagement de l’opération, laquelle est le plus souvent, pour un particulier, la date d’acceptation du devis.",
        "La règle n’est pourtant pas absolue, et c’est le point qui sauve le plus de dossiers. Lorsque le bénéficiaire est une personne physique ou un syndicat de copropriétaires, la contractualisation peut intervenir jusqu’à quatorze jours après la date d’engagement, à la double condition qu’elle précède le début de réalisation des travaux. Une offre mise en place quelques jours après la signature, sur un chantier qui n’a pas encore commencé, reste donc dans les clous.",
        "Le rejet tombe dans deux situations distinctes : quand la contractualisation sort de cette fenêtre, et quand le chantier a démarré avant elle. Il tombe aussi, en pratique, quand aucune date d’engagement ne figure au dossier, faute de pouvoir vérifier l’antériorité.",
      ],
    },
    // A5, A6, A14, A22, A7 : BAR-EN-101 § 3 et BAR-EN-102 § 3.
    {
      heading: "En isolation, deux dates que le dossier doit porter",
      paragraphs: [
        "Les fiches d’isolation des combles, des toitures et des murs imposent un délai minimal de sept jours francs entre la date d’acceptation du devis et la date de début des travaux, c’est-à-dire la pose de l’isolant. Ce délai n’est pas une recommandation commerciale : c’est une condition de délivrance, et un chantier posé trop vite après la signature ne se rattrape pas.",
        "Les mêmes fiches exigent une visite technique du bâtiment, réalisée au plus tard avant l’établissement du devis. Elle est faite par l’entreprise qui exécute les travaux et qui détient le signe de qualité, et sa date doit figurer sur la preuve de réalisation. C’est au cours de cette visite que le professionnel valide l’adéquation du procédé et s’assure que l’isolation existante peut être conservée, faute de quoi elle est remise en état ou déposée.",
        "Une visite réellement effectuée mais non datée sur la facture produit exactement le même rejet qu’une visite absente. Le contrôle étant documentaire, ce qui n’est écrit nulle part n’a pas eu lieu.",
      ],
    },
    // A7, A8, A25, A26, A11, A12, A13.
    {
      heading: "Ce que la preuve de réalisation doit dire, et la tolérance qui existe",
      paragraphs: [
        "La preuve de réalisation mentionne la mise en place d’une isolation, la marque, la référence, l’épaisseur et la surface d’isolant, la résistance thermique évaluée selon la norme applicable, les aménagements nécessaires autour des conduits de fumées et des éclairages encastrés, la rehausse au-dessus de la trappe, le pare-vapeur ou équivalent, et la date de la visite du bâtiment. Une seule de ces mentions absente suffit à ouvrir un motif de rejet.",
        "À défaut de porter la résistance thermique, la preuve peut mentionner le matériau, sa surface et la date de visite, complétée par un document du fabricant ou d’un organisme accrédité selon la norme NF EN ISO/IEC 17065 par le COFRAC. Et lorsque ce document du fabricant porte une date de validité, il est considéré comme valable jusqu’à un an après sa date de fin de validité : un justificatif expiré depuis quelques mois ne condamne donc pas le dossier. Pour les références déclinées en plusieurs épaisseurs, la preuve doit à tout le moins préciser l’épaisseur posée.",
        "Sur la performance elle-même, la résistance thermique de l’isolation installée doit atteindre 7 m².K/W en comble perdu et 6 m².K/W en rampant de toiture, 3,7 m².K/W pour l’isolation des murs. Dans tous les cas, la résistance de l’isolation existante n’entre pas dans le calcul : c’est l’isolation posée qui est jugée, et cette confusion produit des dossiers sincèrement remplis et pourtant sous le seuil.",
      ],
    },
    // A9, A10, A23 : décret n° 2014-812 art. 1 et 2.
    {
      heading: "La qualification s’apprécie à une date, et couvre un domaine",
      paragraphs: [
        "Le professionnel qui réalise l’opération doit être titulaire d’un signe de qualité, et cette qualification s’apprécie à la date d’engagement de l’opération, c’est-à-dire le plus souvent à la date d’acceptation du devis. Une qualification obtenue en cours de chantier, ou expirée entre le devis et la facture, ne remplit pas la condition, même si l’entreprise est irréprochable par ailleurs.",
        "Le signe de qualité doit en outre couvrir le geste réalisé : les rubriques ne sont pas interchangeables entre l’isolation des combles, celle des murs, le chauffe-eau thermodynamique ou la pompe à chaleur. Une qualification valide mais hors domaine produit le même rejet qu’une qualification absente.",
        "Le point le plus coûteux concerne la sous-traitance : c’est l’entreprise qui exécute réellement les travaux qui doit détenir le signe de qualité. Un donneur d’ordre qualifié qui confie la pose à un tiers non qualifié ne satisfait pas la condition, et cela ne se voit pas sur le devis.",
      ],
    },
    // A18, A19 : § 2 des fiches BAR-TH-171 et BAR-TH-148, versions applicables en 2026.
    {
      heading: "Deux gestes qui ne se cumulent pas",
      paragraphs: [
        "Les fiches excluent certaines associations d’opérations. Dans les versions applicables en 2026, l’installation d’une pompe à chaleur air/eau n’est pas cumulable avec les fiches de chaudière individuelle, d’appareil de chauffage au bois, de régulation par programmation d’intermittence, ni avec le chauffe-eau thermodynamique. Réciproquement, le chauffe-eau thermodynamique n’est pas cumulable avec les fiches de pompe à chaleur air/eau et eau/eau.",
        "Ces exclusions sont posées par la version de la fiche applicable à la date d’engagement de l’opération : un chantier engagé sous une version antérieure ne se juge pas sur celle d’aujourd’hui. C’est aussi le motif le plus difficile à voir venir, parce qu’il ne se lit pas sur un dossier isolé : il apparaît quand deux dossiers du même logement se rencontrent chez l’obligé.",
      ],
    },
  ],
  aRetenir: [
    "La contractualisation intervient au plus tard à la date d’engagement, avec une fenêtre de quatorze jours pour un particulier ou un syndicat de copropriétaires, et toujours avant le début du chantier.",
    "Sept jours francs au minimum entre l’acceptation du devis et la pose de l’isolant.",
    "La date de la visite technique doit figurer sur la preuve de réalisation, même quand la visite a bien eu lieu.",
    "La résistance thermique jugée est celle de l’isolation posée : l’existant n’entre pas dans le calcul.",
    "La qualification RGE s’apprécie à la date d’engagement, doit couvrir le geste, et appartient à l’entreprise qui pose.",
  ],
};

export const PAGES_CIBLEES: readonly RefusPageContenu[] = [PAGE_MPR, PAGE_CEE];

/* -------------------------------------------------------------------------- */
/* /refus — le hub                                                             */
/* -------------------------------------------------------------------------- */

export const HUB = {
  path: "/refus",
  metaTitle: "Refus MaPrimeRénov’ et CEE : les motifs réels, expliqués",
  metaDescription:
    "Les motifs qui font refuser un dossier MaPrimeRénov’ ou rejeter un dossier CEE, expliqués un par un à partir des textes, et un diagnostic gratuit de votre refus par un humain.",
  eyebrow: "Cluster refus",
  title: "Votre dossier a été refusé. Reste à savoir sur quoi.",
  intro:
    "Un refus tient rarement au fond du chantier : il tient à une date, à une mention absente, à deux pièces qui ne disent pas la même chose. Chaque motif ci-dessous est expliqué à partir du texte qui le fonde, avec ce qui le déclenche, ce qui l’évite, et si la décision peut encore être reprise. Si vous ne savez pas dans quelle case tombe votre dossier, décrivez-le : nous le lisons et nous vous répondons.",
  updated: VERIFIE_LE,
} as const;
