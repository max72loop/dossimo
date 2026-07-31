-- Seed de la taxonomie `refus_motifs` : les onze motifs du lot 1.
--
-- POURQUOI UNE MIGRATION SÉPARÉE DE LA 0053
-- Convention du repo : le schéma et son contenu ne voyagent pas ensemble
-- (0001 puis 0004, 0005, 0009 à 0011, 0042). Cela garde la 0053 relisible et
-- permet de corriger un texte par une migration suivante sans jamais toucher
-- une DDL déjà appliquée (README § 1, règle 3).
--
-- CONTENU
-- CE FICHIER EST LA SOURCE DU TEXTE. Les sources réglementaires, elles, vivent
-- dans docs/refus/motifs-assertions.md : chaque affirmation y porte un
-- identifiant (A1, A3b, A25…), le slug du motif qu'elle soutient, sa source
-- primaire, sa référence exacte, la version de la fiche et sa date
-- d'applicabilité.
--
-- RÈGLE : toute migration qui modifie le texte d'un motif met à jour la liste
-- d'assertions dans le MÊME commit (CLAUDE.md §11), au même titre que
-- database.types.ts pour un changement de schéma. Deux copies dérivent toujours.
--
-- ÉTAT DE PUBLICATION
-- Les onze motifs partent à `publie = true`, après la passe de relecture du
-- 30/07/2026 qui a posé deux questions à chaque assertion : le texte source
-- contient-il une tolérance, une dérogation ou un délai de régularisation que la
-- prose traite comme absolu, et l'assertion porte-t-elle la version de la fiche
-- et sa date d'applicabilité ? Cette passe a corrigé les motifs 5 et 9 (voir
-- motifs-assertions.md § 9). Un cluster qui sort à trois pages sur onze est
-- faible en SEO comme en support de vente : ils partent groupés.
--
-- IDEMPOTENCE
-- `on conflict (slug) do nothing` : rejouer la migration ne duplique rien et
-- n'écrase aucune correction faite après coup.

insert into public.refus_motifs
  (slug, libelle, aide, description, contestable, publie, meta_title, meta_description, contenu_json)
values

-- 1 ----------------------------------------------------------------------
(
  'offre-cee-posterieure-au-devis',
  'L''offre CEE a été engagée après le devis',
  'cee',
  'La contractualisation du rôle actif et incitatif intervient au plus tard à la date d''engagement. Pour un bénéficiaire particulier, elle peut intervenir jusqu''à quatorze jours après, et avant tout début de chantier.',
  true,
  true,
  'Offre CEE après le devis : la fenêtre de 14 jours qu''on ignore',
  'L''offre CEE contractualisée après le devis ne fait pas toujours tomber le dossier. Pour un client particulier, le texte ouvre quatorze jours après l''engagement, à condition que le chantier n''ait pas commencé.',
  $json${
    "sections": [
      {
        "heading": "Ce qui déclenche le refus",
        "paragraphs": [
          "Une prime CEE n'est pas une remise commerciale : c'est la contrepartie d'une obligation qui pèse sur les fournisseurs d'énergie, et elle n'est due que si elle a réellement contribué à déclencher les travaux. C'est le rôle actif et incitatif, et le texte le traduit par une règle de date : la contractualisation de la contribution intervient au plus tard à la date d'engagement de l'opération, laquelle est, pour un particulier, le plus souvent la date d'acceptation du devis.",
          "Mais la règle n'est pas absolue, et c'est le point que presque personne ne connaît. Lorsque le bénéficiaire est une personne physique ou un syndicat de copropriétaires, la contractualisation peut intervenir jusqu'à quatorze jours après la date d'engagement, à la double condition qu'elle précède le début de réalisation. Autrement dit, une offre CEE mise en place quelques jours après la signature du devis, sur un chantier qui n'a pas encore commencé, n'est pas hors délai.",
          "Le refus tombe donc dans deux situations, pas une : quand la contractualisation dépasse cette fenêtre, et quand le chantier a démarré avant elle. Il tombe aussi, en pratique, quand aucune date d'engagement ne figure au dossier, l'antériorité n'étant alors pas vérifiable."
        ]
      },
      {
        "heading": "Ce qui le prévient",
        "paragraphs": [
          "Le réflexe qui protège reste le même : décider du CEE au moment du chiffrage, pas au moment de la signature, et conserver la trace écrite datée qui rattache l'offre à ce chantier.",
          "La fenêtre de quatorze jours est un filet de sécurité, pas un mode de fonctionnement. Elle se referme au premier coup de perceuse, et elle ne joue que pour les bénéficiaires particuliers et les syndicats de copropriétaires. La tenir pour acquise, c'est faire dépendre une prime d'un planning de chantier."
        ]
      },
      {
        "heading": "Si le refus est déjà tombé",
        "paragraphs": [
          "Ce motif mérite d'être regardé de près avant de renoncer, parce qu'un refus a pu être prononcé sur une lecture plus stricte que le texte. Trois questions valent d'être posées : la contractualisation est-elle intervenue dans les quatorze jours suivant l'engagement, le chantier avait-il commencé à ce moment-là, et le bénéficiaire est-il bien une personne physique ou un syndicat de copropriétaires ? Si les trois réponses sont favorables, l'opération remplit la condition posée par le code de l'énergie et le dossier mérite d'être repris pièces en main.",
          "Si la fenêtre est réellement dépassée, ou si le chantier avait démarré, la condition de fond n'est pas remplie et aucune pièce produite après coup ne la rétablit. Reste alors à vérifier si MaPrimeRénov' est ouverte sur ce chantier : son exigence de chronologie est distincte, et se joue sur la réception de la demande par l'Anah."
        ]
      }
    ],
    "faq": [
      {
        "question": "L'offre CEE peut-elle être régularisée après la signature du devis ?",
        "answer": "Oui, dans une limite précise. Pour un bénéficiaire personne physique ou un syndicat de copropriétaires, la contractualisation peut intervenir jusqu'à quatorze jours après la date d'engagement, et dans tous les cas avant le début de réalisation des travaux. Au-delà, ou si le chantier a commencé, la condition n'est plus remplie."
      },
      {
        "question": "Cette tolérance vaut-elle pour un client professionnel ou une entreprise ?",
        "answer": "Non. Le texte réserve ce délai aux bénéficiaires personnes physiques et aux syndicats de copropriétaires. Pour les autres, la contractualisation intervient au plus tard à la date d'engagement de l'opération."
      },
      {
        "question": "Le devis n'est pas signé, seulement remis. Est-ce que ça change quelque chose ?",
        "answer": "La date qui compte est celle de l'acceptation du devis par le client, pas celle de son édition. Tant que le devis n'est pas accepté, l'offre CEE peut encore être mise en place dans le bon ordre."
      },
      {
        "question": "MaPrimeRénov' est-elle perdue aussi ?",
        "answer": "Ce sont deux dispositifs distincts. Un refus CEE pour ce motif ne vaut pas refus MaPrimeRénov', dont la condition de chronologie est différente et se joue sur la réception de la demande par l'Anah."
      }
    ]
  }$json$::jsonb
),

-- 2 ----------------------------------------------------------------------
(
  'travaux-demarres-avant-engagement',
  'Les travaux ont commencé avant l''engagement',
  'les_deux',
  'Côté MaPrimeRénov'', seuls les travaux commencés après la réception de la demande par l''Anah ouvrent droit à la prime. Il faut attendre l''accusé de réception, pas la décision d''octroi.',
  false,
  true,
  'Travaux commencés trop tôt : le refus qui vient des dates',
  'Faut-il attendre l''accord avant de démarrer ? Non, et cette croyance immobilise des chantiers pour rien. Ce que le texte exige vraiment, et les dérogations qu''il prévoit.',
  $json${
    "sections": [
      {
        "heading": "Ce qui déclenche le refus",
        "paragraphs": [
          "Les deux dispositifs partagent la même logique, l'aide finançant une décision et non un chantier déjà lancé, mais ils ne posent pas le même point de départ, et c'est là que se perd le plus de temps de chantier.",
          "Côté MaPrimeRénov', le texte est précis : seuls les travaux et prestations commencés après l'accusé de réception par l'Anah de la demande de prime y ouvrent droit, et cet accusé de réception ne vaut pas décision d'octroi. La condition porte donc sur la réception de la demande, pas sur l'accord. Une grande partie de ce qui circule dans le secteur affirme l'inverse et conseille d'attendre la notification d'accord : c'est plus strict que le texte, et cela immobilise un chantier pendant des semaines sans nécessité.",
          "Côté CEE, le point de départ est la contractualisation du rôle actif et incitatif, avec sa fenêtre de quatorze jours pour les bénéficiaires particuliers, qui se referme dans tous les cas au début de réalisation.",
          "Le piège commun est que le début des travaux ne veut pas dire la fin du chantier. Une première intervention avancée pour arranger un client, une dépose commencée pendant que le dossier se monte, un acompte encaissé avant l'acceptation formelle : chacun de ces gestes peut être lu comme un démarrage. Le contrôleur ne juge pas l'intention, il lit des dates sur des pièces."
        ]
      },
      {
        "heading": "Ce qui le prévient",
        "paragraphs": [
          "Écrivez la chronologie avant de la vivre. Le devis porte une date d'acceptation lisible, l'offre CEE une date de contractualisation, le chantier une date de démarrage, et ces trois dates doivent pouvoir être alignées sans effort par quelqu'un qui n'a rien vu du chantier.",
          "Le point de vigilance commercial est réel : un client pressé demande souvent de commencer tout de suite. C'est le moment où il faut expliquer que quelques jours d'attente protègent sa prime, et que démarrer plus tôt la lui fait perdre."
        ]
      },
      {
        "heading": "Si le refus est déjà tombé",
        "paragraphs": [
          "Une date de démarrage antérieure à l'engagement ne se réécrit pas. Deux vérifications valent cependant la peine.",
          "La première porte sur ce que l'instruction a retenu comme date de début. Si elle s'appuie sur une pièce ambiguë, un bon de commande, un acompte, une intervention préparatoire qui n'était pas le geste financé, l'écart mérite d'être documenté avant d'accepter la décision.",
          "La seconde est propre à MaPrimeRénov' : le décret prévoit que le directeur général de l'Anah peut exceptionnellement accepter une demande déposée après le commencement des travaux, notamment pour des travaux urgents justifiés par un risque manifeste pour la santé ou la sécurité, ou pour des dommages consécutifs à une catastrophe naturelle ou technologique. Si le chantier relevait de l'un de ces cas, la situation n'est pas close.",
          "Côté MaPrimeRénov', un recours devant le juge suppose d'avoir d'abord saisi le directeur général de l'Anah. Les délais applicables sont ceux portés par la notification reçue, et un délai qui n'y figure pas ne vous est pas opposable."
        ]
      }
    ],
    "faq": [
      {
        "question": "Faut-il attendre l'accord de l'Anah pour démarrer le chantier ?",
        "answer": "Non. Le texte exige que les travaux commencent après l'accusé de réception de la demande, et précise que cet accusé de réception ne vaut pas décision d'octroi. Attendre la notification d'accord est une précaution répandue, plus stricte que la règle, et elle immobilise le chantier sans nécessité."
      },
      {
        "question": "Un acompte compte-t-il comme un début de travaux ?",
        "answer": "Il n'est pas le geste technique lui-même, mais il matérialise un engagement, et il est fréquemment lu comme tel dans un dossier où les dates sont serrées. N'encaissez pas d'acompte engageant avant que la chronologie du dossier soit établie."
      },
      {
        "question": "Et si le client a lui-même demandé de commencer plus tôt ?",
        "answer": "La bonne foi n'ouvre pas d'exception en elle-même. En revanche, côté MaPrimeRénov', l'urgence sanitaire ou de sécurité et les suites d'une catastrophe naturelle ou technologique sont des cas que le texte prévoit expressément."
      }
    ]
  }$json$::jsonb
),

-- 3 ----------------------------------------------------------------------
(
  'delai-sept-jours-francs-isolation',
  'Le délai de sept jours francs n''a pas été respecté',
  'cee',
  'Sur une opération d''isolation, un délai minimal de sept jours francs doit séparer l''acceptation du devis du début de la pose. Poser plus tôt place l''opération hors des conditions de la fiche.',
  false,
  true,
  'Isolation CEE : les sept jours francs entre devis et chantier',
  'Les fiches d''isolation imposent un délai minimal de sept jours francs entre l''acceptation du devis et la pose de l''isolant. Un délai peu connu, qui fait tomber des dossiers par ailleurs conformes.',
  $json${
    "sections": [
      {
        "heading": "Ce qui déclenche le refus",
        "paragraphs": [
          "Les fiches d'isolation imposent un délai minimal de sept jours francs entre la date d'acceptation du devis et la date de début des travaux, entendue comme la pose de l'isolant. Ce délai est une condition de délivrance des certificats, au même titre que la résistance thermique.",
          "C'est probablement la condition la moins connue de tout le dispositif, et elle est facile à enfreindre sans y penser : un chantier calé rapidement parce que l'équipe est disponible, un client qui part en vacances, une météo qui se dégrade. Le devis est accepté un lundi, l'isolant est posé le jeudi, et l'opération sort des conditions de la fiche alors que tout le reste est en règle.",
          "Le contrôle est mécanique : deux dates figurent au dossier, l'écart se calcule."
        ]
      },
      {
        "heading": "Ce qui le prévient",
        "paragraphs": [
          "Traitez ce délai comme une contrainte de planning au même titre que l'approvisionnement. Au moment où le devis est accepté, la première date de pose possible se calcule immédiatement, et c'est elle qu'on annonce au client, pas la première date où l'équipe est libre.",
          "Faites porter au devis une date d'acceptation lisible et non ambiguë. Un devis accepté sans date, ou dont la date est illisible, transforme un délai respecté en délai invérifiable, ce qui produit le même résultat à l'instruction."
        ]
      },
      {
        "heading": "Si le refus est déjà tombé",
        "paragraphs": [
          "Le délai écoulé ne se rallonge pas rétroactivement. Une vérification vaut cependant la peine avant de renoncer : le décompte des jours francs et la date d'acceptation réellement retenue. Si l'instruction s'est appuyée sur une date d'édition du devis plutôt que sur sa date d'acceptation, l'écart mérite d'être documenté. Les voies et délais applicables figurent sur la décision reçue."
        ]
      }
    ],
    "faq": [
      {
        "question": "Sept jours francs, cela veut dire quoi exactement ?",
        "answer": "Un délai en jours francs ne compte ni le jour de départ ni, selon les cas, le jour d'arrivée. C'est un mode de décompte plus long qu'un simple sept jours, donc à vérifier précisément plutôt qu'à estimer."
      },
      {
        "question": "Ce délai s'applique-t-il à tous les gestes ?",
        "answer": "Il figure dans les fiches d'isolation. Les fiches de chauffage consultées ne le posent pas. Vérifiez toujours la fiche applicable à votre geste, dans sa version en vigueur à la date d'engagement."
      }
    ]
  }$json$::jsonb
),

-- 4 ----------------------------------------------------------------------
(
  'devis-et-facture-divergents',
  'Le devis et la facture ne concordent pas',
  'les_deux',
  'L''instructeur ne visite pas le chantier : il rapproche les pièces entre elles. Une valeur qui diffère du devis à la facture est le motif de refus le plus courant.',
  true,
  true,
  'Devis et facture qui divergent : le motif de refus n°1',
  'Une surface, une référence ou un montant qui change entre le devis et la facture suffit à bloquer un dossier conforme par ailleurs. Pourquoi ce contrôle existe, et comment rendre l''écart impossible.',
  $json${
    "sections": [
      {
        "heading": "Ce qui déclenche le refus",
        "paragraphs": [
          "L'instruction d'un dossier ne consiste pas à juger un chantier, mais à reconstituer une opération à partir de papier. La concordance entre les pièces est le principal indice de sincérité disponible. Une surface qui passe de 95 à 97 mètres carrés, une référence d'isolant mise à jour d'un seul côté, un montant arrondi sur la facture : chacun de ces écarts contredit le dossier.",
          "L'écart n'a pas besoin d'être important pour bloquer. Il a besoin d'être visible. Et il l'est toujours, puisque le rapprochement est exactement ce que fait l'instructeur.",
          "Le cas le plus fréquent n'est pas la négligence : c'est le chantier qui a légitimement évolué. Un produit indisponible remplacé par un équivalent, une surface réelle un peu différente du métré. Le problème n'est pas le changement, c'est qu'il n'ait été répercuté que sur une des deux pièces."
        ]
      },
      {
        "heading": "Ce qui le prévient",
        "paragraphs": [
          "Écrivez le devis en pensant au rapprochement ligne à ligne qui aura lieu ensuite : mêmes désignations, mêmes références, mêmes unités, mêmes performances. Quand le chantier évolue, faites suivre les deux pièces, par un devis rectificatif ou une pièce complémentaire selon le cas, plutôt que de corriger la facture seule.",
          "La parade structurelle consiste à ne pas écrire deux fois la même information. Quand le devis et la facture sont produits à partir d'une seule saisie, l'écart devient très difficile à fabriquer par accident. C'est le principe de fonctionnement de Dossimo, service indépendant d'aide à la préparation de dossier, non affilié à l'Anah ni à France Rénov'."
        ]
      },
      {
        "heading": "Si le refus est déjà tombé",
        "paragraphs": [
          "C'est l'un des motifs qui se reprennent le mieux. L'opération reste la même : ce qui est en cause est une incohérence documentaire, pas une inéligibilité. Selon le dispositif et l'état du dossier, la voie passe par une pièce rectificative cohérente avec la réalité du chantier, ou par une reprise auprès de l'organisme qui a instruit.",
          "Attention à ne pas aggraver le dossier en corrigeant : la pièce rectifiée doit décrire ce qui a réellement été posé. Aligner la facture sur le devis quand c'est le devis qui était faux remplace un problème de cohérence par un problème de sincérité."
        ]
      }
    ],
    "faq": [
      {
        "question": "Un écart de deux mètres carrés suffit-il vraiment à bloquer ?",
        "answer": "Oui, quand la surface est une caractéristique qui conditionne l'éligibilité ou le calcul. Le contrôle est une comparaison, pas une appréciation."
      },
      {
        "question": "Le produit posé n'était plus disponible. Que fallait-il faire ?",
        "answer": "Tracer le remplacement sur les deux pièces, en vérifiant que le produit de substitution reste couvert par la même fiche et que sa performance reste au moins équivalente à celle annoncée."
      },
      {
        "question": "Peut-on refaire une facture ?",
        "answer": "Une facture se rectifie selon les règles comptables applicables, pas en réécrivant la précédente. Faites-le avec votre comptable plutôt que dans l'urgence du dépôt."
      }
    ]
  }$json$::jsonb
),

-- 5 ----------------------------------------------------------------------
(
  'mention-obligatoire-absente',
  'Une mention obligatoire manque sur la preuve de réalisation',
  'cee',
  'Chaque fiche liste les mentions que la preuve de réalisation doit porter. Une mention absente bloque le dossier, même quand les travaux sont conformes.',
  true,
  true,
  'Mention manquante sur la facture CEE : ce que la fiche exige',
  'Marque, référence, épaisseur, surface, résistance thermique, date de visite : la fiche liste les mentions que la preuve de réalisation doit porter. Ce qui se passe quand l''une manque.',
  $json${
    "sections": [
      {
        "heading": "Ce qui déclenche le refus",
        "paragraphs": [
          "La fiche d'opération standardisée ne décrit pas seulement un geste éligible : elle énumère ce que la preuve de réalisation doit mentionner. Pour l'isolation de combles ou de toiture, la liste comprend la mise en place d'une isolation, les marque et référence de l'isolant, son épaisseur et sa surface, la résistance thermique évaluée selon la norme applicable, les aménagements nécessaires, et la date de la visite du bâtiment.",
          "Une mention absente n'est pas un détail de forme. La preuve de réalisation ne prouve plus ce qu'elle doit prouver, et le dossier est incomplet même si les travaux sont irréprochables.",
          "La fiche prévoit une voie de rattrapage, et il faut la connaître : à défaut de porter toutes ces mentions, la preuve peut se limiter au matériau avec ses marque et référence, sa surface, et la date de visite, à condition d'être complétée par un document du fabricant ou d'un organisme accrédité précisant les caractéristiques thermiques du produit. Ce n'est pas une tolérance vague, c'est une seconde configuration exigeante et précise.",
          "Deux précisions de la fiche jouent en votre faveur et sont presque toujours ignorées. D'abord, lorsque ce document du fabricant porte une date de validité, il est considéré comme valable jusqu'à un an après sa date de fin de validité : un justificatif périmé depuis moins d'un an reste recevable. Ensuite, pour les références proposées en plusieurs épaisseurs, la preuve de réalisation qui ne mentionne pas la résistance thermique de l'isolation installée doit impérativement en préciser l'épaisseur. C'est une exigence, mais c'est aussi une voie explicitement ouverte par la fiche."
        ]
      },
      {
        "heading": "Ce qui le prévient",
        "paragraphs": [
          "Ne travaillez pas de mémoire, et ne recopiez pas la facture d'un dossier précédent. Partez de la fiche applicable, dans sa version en vigueur à la date d'engagement de l'opération, et cochez ses mentions une à une sur le devis puis sur la facture.",
          "Deux mentions sont oubliées plus souvent que les autres parce qu'elles ne relèvent pas du réflexe commercial : la date de la visite technique du bâtiment, et les aménagements réalisés autour des conduits de fumée, des éclairages encastrés ou de la trappe d'accès. Elles ne s'inventent pas après coup."
        ]
      },
      {
        "heading": "Si le refus est déjà tombé",
        "paragraphs": [
          "Une mention manquante décrit un défaut documentaire, pas une opération inéligible : c'est l'une des situations les plus souvent reprises. La question à trancher est de savoir si la mention absente peut être portée par une pièce conforme à la réalité du chantier, par exemple un document du fabricant dans la configuration prévue par la fiche, ou si elle décrit quelque chose qui n'a pas eu lieu. Dans le second cas, il n'y a rien à rattraper. Les voies et délais figurent sur la décision reçue."
        ]
      }
    ],
    "faq": [
      {
        "question": "La certification ACERMI est-elle obligatoire ?",
        "answer": "La fiche consultée ne nomme pas l'ACERMI. Elle exige, dans sa configuration de repli, un document du fabricant ou d'un organisme accrédité selon la norme NF EN ISO/IEC 17065 précisant les caractéristiques thermiques. L'ACERMI est l'un des justificatifs qui répondent couramment à cette exigence, pas une obligation posée en ces termes par la fiche."
      },
      {
        "question": "Mon justificatif fabricant a expiré. Le dossier est-il perdu ?",
        "answer": "Pas nécessairement. La fiche prévoit que, lorsque ce document porte une date de validité, il est considéré comme valable jusqu'à un an après sa date de fin de validité. Un justificatif périmé depuis moins d'un an reste donc recevable. Vérifiez la date avant de conclure que la pièce est à refaire."
      },
      {
        "question": "Faut-il ces mentions sur le devis ou sur la facture ?",
        "answer": "La fiche vise la preuve de réalisation. En pratique, les porter dès le devis évite d'avoir à les inventer au moment de la facture, et fait disparaître du même coup le risque d'écart entre les deux pièces."
      }
    ]
  }$json$::jsonb
),

-- 6 ----------------------------------------------------------------------
(
  'qualification-rge-invalide-a-la-date',
  'La qualification RGE n''était pas valide à la date utile',
  'les_deux',
  'La qualification doit être valide à la date qui compte pour le dispositif, généralement celle de l''engagement. Un renouvellement postérieur ne rattrape pas la période découverte.',
  true,
  true,
  'RGE expiré à la date du devis : pourquoi le dossier tombe',
  'Ce n''est pas la date du chantier qui compte, ni celle du dépôt. Une qualification échue à la date utile fait tomber le dossier, même renouvelée depuis.',
  $json${
    "sections": [
      {
        "heading": "Ce qui déclenche le refus",
        "paragraphs": [
          "Les dispositifs exigent que le professionnel réalisant l'opération soit titulaire d'un signe de qualité répondant aux exigences du décret de 2014 sur les signes de qualité. La question n'est donc pas de savoir si l'entreprise est RGE, mais si elle l'était à la date qui compte. Dans le dispositif CEE, cette date est celle de l'engagement de l'opération, le plus souvent l'acceptation du devis par le bénéficiaire.",
          "Le trou de couverture typique dure quelques semaines : un renouvellement en cours, un audit de suivi décalé, un dossier de requalification en attente. Pendant cette fenêtre, les chantiers continuent, et chaque devis accepté à ce moment-là porte un défaut invisible. La qualification est retrouvée un mois plus tard, mais elle ne couvre pas rétroactivement la période découverte.",
          "Le contrôle s'appuie sur les annuaires officiels, pas sur le certificat papier que l'entreprise détient. Une qualification effective mais non encore publiée produit le même effet qu'une qualification absente."
        ]
      },
      {
        "heading": "Ce qui le prévient",
        "paragraphs": [
          "Traitez la date d'échéance de votre qualification comme une date de péremption commerciale : à trois mois de l'échéance, plus aucun devis ne devrait être signé sans que le renouvellement soit engagé.",
          "Vérifiez aussi votre situation dans l'annuaire officiel, et pas seulement dans vos papiers. C'est cet annuaire qui sera consulté, et un décalage de publication est un motif de refus sur lequel vous ne pouvez agir qu'en amont."
        ]
      },
      {
        "heading": "Si le refus est déjà tombé",
        "paragraphs": [
          "Ce motif se reprend quand il repose sur une erreur de fait : qualification effectivement valide mais mal publiée, date utile mal retenue par l'instruction, domaine correct lu de travers. Rassemblez la décision de qualification et sa période de validité, et confrontez-les à la date que la décision de refus a retenue.",
          "Il ne se reprend pas quand la qualification manquait réellement à la date utile. Côté MaPrimeRénov', un recours devant le juge suppose d'avoir d'abord saisi le directeur général de l'Anah, et les délais applicables sont ceux portés par la notification reçue."
        ]
      }
    ],
    "faq": [
      {
        "question": "Ma qualification a été renouvelée depuis. Est-ce que ça change la décision ?",
        "answer": "Le renouvellement vaut pour l'avenir. Il ne couvre pas une date passée à laquelle la qualification n'était pas en vigueur."
      },
      {
        "question": "Quelle est la date qui compte ?",
        "answer": "Dans le dispositif CEE, l'appréciation se fait à la date d'engagement de l'opération, laquelle est le plus fréquemment, pour un particulier, la date d'acceptation du devis. Vérifiez-la sur la fiche applicable avant de chiffrer."
      }
    ]
  }$json$::jsonb
),

-- 7 ----------------------------------------------------------------------
(
  'rge-hors-domaine-ou-sous-traitance',
  'La qualification ne couvre pas le geste, ou le poseur n''est pas celui qui est qualifié',
  'les_deux',
  'La qualification doit correspondre au geste réalisé, et c''est celle de l''entreprise qui exécute réellement l''opération qui est exigée, pas celle du signataire du devis.',
  true,
  true,
  'RGE hors domaine et sous-traitance : le refus qu''on ne voit pas venir',
  'Être RGE ne suffit pas : la qualification doit couvrir le geste réalisé, et c''est celle du professionnel qui a réellement posé qui compte. Deux pièges distincts, un même refus.',
  $json${
    "sections": [
      {
        "heading": "Ce qui déclenche le refus",
        "paragraphs": [
          "Le signe de qualité exigé n'est pas générique : chaque fiche renvoie à des rubriques précises du décret de 2014. L'isolation de combles ou de toiture, l'isolation des murs, le chauffe-eau thermodynamique et la pompe à chaleur air/eau relèvent chacun de rubriques différentes, et une pompe à chaleur qui produit aussi l'eau chaude sanitaire en mobilise deux. Une entreprise qualifiée pour le chauffage qui pose une isolation n'ouvre donc pas droit à l'aide sur ce geste, quelle que soit la qualité de la pose.",
          "Le second piège est la sous-traitance. Les fiches visent le professionnel qui réalise l'opération. Quand un poseur intervient pour le compte du signataire du devis, c'est sa qualification à lui qui doit couvrir le geste. Un dossier qui présente la qualification du signataire alors qu'un tiers a posé décrit une situation qui n'a pas eu lieu.",
          "Ce motif est traître parce qu'il ne se voit sur aucune pièce prise isolément. Le devis est correct, la facture est correcte, le certificat RGE est authentique, et c'est la combinaison qui ne tient pas."
        ]
      },
      {
        "heading": "Ce qui le prévient",
        "paragraphs": [
          "Avant de chiffrer un chantier à plusieurs postes, vérifiez que chaque geste, et pas seulement le principal, relève d'un domaine que vous détenez réellement. Un bouquet de travaux peut exiger deux domaines distincts.",
          "Quand vous sous-traitez, réunissez la qualification du poseur au moment où vous signez avec lui, pas au moment du dépôt. Vérifiez qu'elle couvre le geste concerné et qu'elle est valide à la date utile, exactement comme vous le feriez pour la vôtre."
        ]
      },
      {
        "heading": "Si le refus est déjà tombé",
        "paragraphs": [
          "La reprise dépend de ce qui a réellement eu lieu. Si le poseur détenait bien la qualification requise et que le dossier ne l'a simplement pas présentée, il s'agit d'un défaut de pièce, et c'est reprenable. Si le geste a été posé par une entreprise non qualifiée pour ce domaine, la condition de fond n'était pas remplie et il n'y a pas de pièce à produire. Les voies et délais figurent sur la décision reçue."
        ]
      }
    ],
    "faq": [
      {
        "question": "Mon RGE couvre-t-il automatiquement tous les postes du devis ?",
        "answer": "Non. Chaque geste relève de rubriques précises du décret sur les signes de qualité. Un devis à plusieurs postes peut exiger plusieurs domaines."
      },
      {
        "question": "En sous-traitance, quelle qualification compte ?",
        "answer": "Celle du professionnel qui réalise réellement l'opération. Le dossier doit par ailleurs identifier ce professionnel, ce que prévoit le cadre des attestations."
      }
    ]
  }$json$::jsonb
),

-- 8 ----------------------------------------------------------------------
(
  'resistance-thermique-insuffisante',
  'La résistance thermique est en dessous du seuil',
  'les_deux',
  'La résistance thermique de l''isolation installée doit atteindre le seuil de la fiche applicable au poste isolé. En dessous, l''opération n''ouvre pas droit aux certificats.',
  false,
  true,
  'Résistance thermique insuffisante : les seuils R par poste',
  '7 en comble perdu, 6 en rampant de toiture, 3,7 pour les murs : les seuils de résistance thermique conditionnent l''éligibilité. Ce qui se passe quand l''isolation posée passe en dessous.',
  $json${
    "sections": [
      {
        "heading": "Ce qui déclenche le refus",
        "paragraphs": [
          "Les fiches d'isolation posent un seuil de résistance thermique par poste : au moins 7 m².K/W en comble perdu, au moins 6 m².K/W en rampant de toiture, et au moins 3,7 m².K/W pour l'isolation des murs. C'est une condition de délivrance des certificats, et elle porte sur l'isolation installée, la résistance de l'isolation existante n'étant pas prise en compte.",
          "Une précision qui change la lecture de ce motif selon le poste. Depuis le 30 septembre 2025, MaPrimeRénov' par geste ne finance plus l'isolation des murs : les forfaits correspondants ont été supprimés, ainsi que ceux des chaudières biomasse, pour les demandes déposées à compter de cette date. Le seuil de 3,7 m².K/W reste donc une condition CEE, mais il ne concerne plus un dossier MaPrimeRénov'. Les combles et les planchers, eux, restent financés des deux côtés.",
          "Le point le plus coûteux est l'exclusion de l'existant. Un artisan qui ajoute une couche sur un isolant en place peut atteindre une performance globale confortable et rester sous le seuil au sens de la fiche, puisque seul le procédé installé compte.",
          "L'autre erreur classique est d'annoncer la performance du produit au lieu de celle de l'isolation mise en place, ou de retenir une valeur de catalogue qui ne correspond pas à l'épaisseur réellement posée."
        ]
      },
      {
        "heading": "Ce qui le prévient",
        "paragraphs": [
          "Fixez la résistance thermique au moment du métré, à partir de l'épaisseur que vous allez réellement poser, et reportez cette valeur à l'identique sur le devis puis sur la facture. La valeur doit être évaluée selon la norme applicable au type d'isolant, réfléchissant ou non.",
          "Traitez le cas de l'isolant existant explicitement lors de la visite technique : la fiche demande de vérifier s'il peut être conservé en l'état, et de procéder sinon à sa remise en état ou à sa dépose. Cette décision se prend sur le toit, pas au moment du dépôt."
        ]
      },
      {
        "heading": "Si le refus est déjà tombé",
        "paragraphs": [
          "Une performance réellement inférieure au seuil ne se corrige pas par une pièce : ce serait décrire une isolation qui n'a pas été posée. Ce qui vaut d'être vérifié, c'est la valeur retenue par l'instruction. Si le dossier annonçait la performance du produit seul, ou une valeur de catalogue, alors que l'isolation installée atteint bien le seuil, l'écart relève d'une pièce mal renseignée et se documente.",
          "Reste la voie technique : reprendre le chantier pour atteindre le seuil, avec un nouveau dossier monté dans le bon ordre. C'est parfois économiquement absurde, parfois non, et c'est un calcul à faire plutôt qu'à écarter."
        ]
      }
    ],
    "faq": [
      {
        "question": "Peut-on compter l'isolant déjà en place pour atteindre le seuil ?",
        "answer": "Non. Les fiches précisent que la résistance thermique de l'isolation existante n'est pas prise en compte."
      },
      {
        "question": "7, c'est la performance du produit ou celle de l'isolation posée ?",
        "answer": "Celle de l'isolation installée, évaluée selon la norme correspondant à la nature de l'isolant."
      },
      {
        "question": "L'isolation des murs est-elle encore financée par MaPrimeRénov' ?",
        "answer": "Non, plus dans le parcours par geste : les forfaits correspondants ont été supprimés pour les demandes déposées à compter du 30 septembre 2025, comme ceux des chaudières biomasse. Le seuil de 3,7 m².K/W reste une condition du dispositif CEE."
      }
    ]
  }$json$::jsonb
),

-- 9 ----------------------------------------------------------------------
(
  'performance-equipement-sous-le-seuil',
  'La performance de l''équipement est sous le seuil de la fiche',
  'les_deux',
  'Chaque fiche d''équipement pose un seuil de performance, différent selon l''application ou le profil de soutirage. Un appareil sous le seuil n''ouvre pas droit aux certificats.',
  false,
  true,
  'ETAS, efficacité ECS : quand l''équipement passe sous le seuil',
  '126 % ou 111 % d''ETAS selon l''application pour une PAC air/eau, 95 à 110 % d''efficacité ECS selon le profil de soutirage pour un chauffe-eau thermodynamique. Ce que ces seuils changent au dossier.',
  $json${
    "sections": [
      {
        "heading": "Ce qui déclenche le refus",
        "paragraphs": [
          "Le seuil n'est jamais unique : il dépend de la configuration d'installation.",
          "Pour une pompe à chaleur air/eau, l'efficacité énergétique saisonnière pour le chauffage des locaux doit être d'au moins 126 % en application basse température et d'au moins 111 % en application moyenne ou haute température. Et l'application n'est pas au choix : elle découle de l'installation.",
          "La règle des émetteurs ne vaut que pour une PAC qui assure uniquement le chauffage. Dans ce cas, plancher, plafond ou mur chauffant et ventilo-convecteurs à eau imposent l'application basse température, tandis que tous les autres émetteurs, y compris les radiateurs dits basse température à régime d'eau 45 °C, relèvent de l'application moyenne ou haute. En revanche, dès que la PAC assure le chauffage ET la production d'eau chaude sanitaire, ou qu'elle est associée à un système déporté produisant l'eau chaude, la fiche impose l'application moyenne ou haute température et l'efficacité à 55 °C, quels que soient les émetteurs.",
          "Pour un chauffe-eau thermodynamique à accumulation, l'efficacité énergétique pour le chauffage de l'eau doit atteindre 95 % en profil de soutirage M, 100 % en L et 110 % en XL. Le seuil suit le profil déclaré : déclarer un profil sans le justifier, c'est choisir le seuil auquel on sera jugé.",
          "L'erreur la plus fréquente n'est pas de poser un appareil médiocre. C'est de retenir la mauvaise ligne du tableau, en annonçant l'efficacité à 35 °C sur une installation qui relève du régime à 55 °C."
        ]
      },
      {
        "heading": "Ce qui le prévient",
        "paragraphs": [
          "Déterminez l'application ou le profil avant de choisir l'appareil, à partir de l'installation réelle du logement, et pas l'inverse. C'est la configuration qui commande le seuil, et le seuil qui commande l'appareil éligible.",
          "Reportez ensuite la valeur exacte issue de la documentation du fabricant, pour la configuration retenue, sur le devis et sur la facture. Une valeur générique de plaquette commerciale ne correspond souvent à aucune des lignes du tableau.",
          "Deux conditions de la fiche PAC air/eau se perdent régulièrement parce qu'elles ne portent pas sur la performance de l'appareil. La pompe à chaleur doit être équipée d'un régulateur relevant de l'une des classes IV à VIII. Et le professionnel rédige une note de dimensionnement du générateur par rapport aux déperditions calculées, note qui doit être remise au bénéficiaire à l'engagement de l'opération, puis actualisée et remise à nouveau à l'achèvement des travaux le cas échéant. Une note rédigée après coup pour compléter le dossier ne remplit pas cette condition."
        ]
      },
      {
        "heading": "Si le refus est déjà tombé",
        "paragraphs": [
          "Si l'appareil installé atteint réellement le seuil applicable et que le dossier annonçait la mauvaise valeur, le défaut est documentaire et se reprend avec la documentation constructeur pour la configuration réellement posée. Si l'appareil est effectivement sous le seuil de sa configuration, la condition de fond n'est pas remplie. Les voies et délais figurent sur la décision reçue."
        ]
      }
    ],
    "faq": [
      {
        "question": "Des radiateurs basse température donnent-ils droit au seuil de 126 % ?",
        "answer": "Non. Les radiateurs dits basse température à régime d'eau 45 °C relèvent de l'application moyenne ou haute température, donc du seuil de 111 %."
      },
      {
        "question": "J'ai un plancher chauffant, mais la PAC fait aussi l'eau chaude. Quelle application retenir ?",
        "answer": "Moyenne ou haute température, avec l'efficacité à 55 °C. Dès que la pompe à chaleur assure le chauffage et la production d'eau chaude sanitaire, ou qu'elle est associée à un système déporté produisant l'eau chaude, la fiche impose cette application quels que soient les émetteurs."
      },
      {
        "question": "Une résistance électrique dans le système déporté rend-elle l'opération inéligible ?",
        "answer": "Pas systématiquement. La fiche prévoit une dérogation pour les systèmes déportés intégrant une résistance électrique à des fins de secours ou de cycles anti-légionelle, lorsque la régulation donne la priorité à la pompe à chaleur pour la production d'eau chaude sanitaire."
      },
      {
        "question": "Le seuil d'un chauffe-eau thermodynamique dépend-il de la marque ?",
        "answer": "Non, du profil de soutirage déclaré, M, L ou XL, chacun ayant son seuil."
      }
    ]
  }$json$::jsonb
),

-- 10 ---------------------------------------------------------------------
(
  'non-cumul-cee-entre-gestes',
  'Deux gestes non cumulables ont été valorisés ensemble',
  'cee',
  'Certaines fiches s''excluent mutuellement. Deux gestes valorisés ensemble alors qu''ils ne sont pas cumulables font tomber l''une des deux primes.',
  false,
  true,
  'Non-cumul CEE entre gestes : PAC, solaire et thermodynamique',
  'La PAC air/eau n''est pas cumulable en CEE avec le chauffe-eau solaire, le solaire combiné, le solaire thermique et le chauffe-eau thermodynamique. Un refus qui ne se voit sur aucune pièce.',
  $json${
    "sections": [
      {
        "heading": "Ce qui déclenche le refus",
        "paragraphs": [
          "Le cumul entre dispositifs n'a rien à voir avec le cumul entre fiches. Les fiches elles-mêmes posent des exclusions. Dans les versions applicables en 2026, l'opération de pompe à chaleur air/eau n'est pas cumulable avec le chauffe-eau solaire individuel de métropole, celui d'outre-mer, le système solaire combiné, le chauffe-eau thermodynamique à accumulation et le dispositif solaire thermique. Symétriquement, le chauffe-eau thermodynamique n'est pas cumulable avec les pompes à chaleur air/eau et eau/eau ou eau glycolée/eau.",
          "Ce motif est particulièrement désagréable parce qu'il est invisible à l'échelle d'un dossier. Chaque opération est conforme prise séparément. C'est leur coexistence sur le même logement qui déclenche le rejet, et elle ne se voit qu'en rapprochant deux dossiers, parfois montés à plusieurs mois d'intervalle, parfois par deux entreprises différentes."
        ]
      },
      {
        "heading": "Ce qui le prévient",
        "paragraphs": [
          "Posez la question au client avant de chiffrer, et notez la réponse : d'autres travaux de chauffage ou d'eau chaude ont-ils été réalisés récemment sur ce logement, ou sont-ils prévus ? C'est le seul moment où l'information est accessible.",
          "Avant tout bouquet de travaux, vérifiez dans les fiches en vigueur à la date d'engagement que les gestes retenus sont cumulables entre eux. Les listes d'exclusion figurent en tête de fiche, à la dénomination de l'opération, et elles changent d'une version à l'autre."
        ]
      },
      {
        "heading": "Si le refus est déjà tombé",
        "paragraphs": [
          "L'exclusion étant une condition de fond, elle ne se répare pas par une pièce, et elle porte en général sur l'une des deux opérations, pas sur les deux. La question utile est donc de savoir laquelle a été écartée et pourquoi, ce qui conditionne ce qu'il reste à sauver. Reportez-vous à la décision reçue pour les voies et délais."
        ]
      }
    ],
    "faq": [
      {
        "question": "Le cumul MaPrimeRénov' et CEE est-il concerné ?",
        "answer": "Non, c'est une autre question. Ces exclusions valent entre fiches CEE, sur un même logement."
      },
      {
        "question": "L'exclusion vaut-elle à vie ?",
        "answer": "Elle est posée par les fiches, dans leur version applicable. Vérifiez la version en vigueur à la date d'engagement de l'opération plutôt que de raisonner sur un principe général."
      }
    ]
  }$json$::jsonb
),

-- 11 ---------------------------------------------------------------------
(
  'visite-prealable-absente-ou-non-datee',
  'La visite préalable manque, ou sa date n''est nulle part',
  'cee',
  'La visite technique précède l''établissement du devis, elle est réalisée par l''entreprise titulaire du signe de qualité qui exécute les travaux, et sa date figure parmi les mentions attendues.',
  true,
  true,
  'Visite préalable : la date oubliée qui bloque le dossier',
  'La visite technique doit précéder le devis, être faite par l''entreprise qui pose, et sa date doit figurer sur les pièces. Trois conditions, souvent trois oublis.',
  $json${
    "sections": [
      {
        "heading": "Ce qui déclenche le refus",
        "paragraphs": [
          "Trois exigences se cachent derrière ce qui ressemble à une formalité.",
          "D'abord, la visite technique du bâtiment est réalisée au plus tard avant l'établissement du devis. Le professionnel y valide que le procédé est en adéquation avec le bâtiment et, le cas échéant, que l'isolation existante peut être conservée en l'état ; sinon, il est procédé à sa remise en état ou à sa dépose lors des travaux.",
          "Ensuite, la date de cette visite fait partie des mentions attendues sur la preuve de réalisation. Une visite réellement effectuée mais non datée sur les pièces produit le même effet qu'une visite absente : elle n'est pas vérifiable.",
          "Enfin, la visite est réalisée par l'entreprise qui exécute les travaux, celle qui est titulaire du signe de qualité. En cas de sous-traitance, c'est la date de la visite du sous-traitant qui compte, ou celle du maître d'œuvre lorsqu'il y en a un."
        ]
      },
      {
        "heading": "Ce qui le prévient",
        "paragraphs": [
          "Faites de la visite une étape datée du processus commercial, avant l'édition du devis, et reportez sa date sur le devis puis sur la facture au moment où vous les écrivez. C'est une donnée qui coûte trois secondes à saisir sur place et qui ne se retrouve plus six mois après.",
          "Le cas à surveiller est celui du chiffrage à distance, sur photos ou sur plan. Il peut être commercialement confortable et il ne remplit pas la condition."
        ]
      },
      {
        "heading": "Si le refus est déjà tombé",
        "paragraphs": [
          "Si la visite a réellement eu lieu avant le devis et que seule sa date manque aux pièces, le défaut est documentaire et se corrige avec une pièce conforme à la réalité. Si aucune visite n'a précédé le devis, ou si elle a été faite par une entreprise autre que celle qui a posé, la condition de fond n'est pas remplie et il n'y a pas de pièce à produire. Reportez-vous à la décision reçue pour les voies et délais applicables."
        ]
      }
    ],
    "faq": [
      {
        "question": "Un chiffrage sur photos peut-il remplacer la visite ?",
        "answer": "Non. Le texte demande une visite du bâtiment au cours de laquelle le professionnel valide l'adéquation du procédé."
      },
      {
        "question": "Qui doit faire la visite en sous-traitance ?",
        "answer": "L'entreprise qui réalise les travaux, celle qui est titulaire du signe de qualité, ou le maître d'œuvre lorsqu'il y a recours à celui-ci."
      }
    ]
  }$json$::jsonb
)

on conflict (slug) do nothing;
