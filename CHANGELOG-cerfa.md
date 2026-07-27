# Journal des modèles documentaires

Ce journal fait partie de la preuve de conformité de Dossimo. Toute modification
d'une fiche, d'une attestation ou d'un Cerfa doit être consignée ici avant sa mise
en production, avec les sources, les tests PDF et la personne ayant validé la revue.

## En attente de validation initiale

- **Périmètre :** attestations sur l'honneur CEE, BAR-EN-101/102/103,
  BAR-TH-171, BAR-TH-148 et BAR-TH-112.
- **Période :** sixième période CEE, opérations engagées à compter du 1er avril 2026.
- **Action requise :** comparer chaque cadre A/B/C et les mentions CNIL à la source
  réglementaire et au modèle de l'obligé retenu ; archiver le PDF source, le rendu
  Dossimo et le résultat de la revue.
- **Statut :** non validé — aucune promesse de formulaire officiel ne doit être faite
  tant que cette revue n'est pas signée.

### Ce statut est désormais tenu par le code (2026-07-25)

Le blocage ne repose plus sur la vigilance de qui écrit la copie. Un modèle du
registre ne peut se dire conforme que s'il porte un champ `revue`
(`RevueModele` dans [`registry.ts`](src/lib/cerfa/registry.ts)) : date, personne
qui a signé, obligé de référence. **Absence de `revue` = non validé**, c'est le
sens sûr.

En dérivent, sans décision locale : le badge et la notice de la page dossier
(« Modèle Dossimo » au lieu de « Reproduction conforme »), le libellé du bouton
de téléchargement, et le pied de page du PDF d'attestation. Un test
(`registry.test.ts`) échoue si une reproduction du registre se dit conforme.

**Pour lever le statut :** faire la revue, remplir `revue` sur les modèles
concernés, ajouter l'entrée datée ci-dessous, mettre à jour le test
« aucune reproduction du registre ne se dit conforme aujourd'hui ». Les quatre
gestes vont ensemble.

### Comment mener la revue

1. Choisir **un** obligé et récupérer son modèle d'AH pour la fiche visée.
2. Comparer cadre par cadre (A / B / C, engagements, mentions CNIL, zones de
   signature) le modèle de l'obligé, la source réglementaire (annexe 7-1) et le
   rendu Dossimo (`/dossiers/<id>/cerfa.pdf`).
3. Archiver les trois PDF et le relevé des écarts.
4. Trancher : écarts corrigeables dans la reproduction, ou modèle de l'obligé
   imposé ? Dans le second cas, la reproduction devient un secours et le chemin
   de téléversement (`AhObligeFill`) devient le chemin principal.

## 2026-07-25 — Revue de l'AH CEE, première passe (NON contresignée)

**Source opposée :** annexe 7 de l'arrêté du 4 septembre 2014 modifié, texte
consolidé en vigueur au 25/07/2026 (Légifrance, JORFTEXT000029460644). Citations
verbatim ci-dessous.

**Modèle d'obligé : non obtenu, et c'est un résultat en soi.** Aucun obligé ne
publie d'AH vierge téléchargeable (Sonergia, EDF, Effy, Primesénergie : l'AH est
générée par dossier depuis l'espace client, ou envoyée par e-mail). C'est la
conséquence directe de la règle ci-dessous : l'AH vierge est un document que
**seul le demandeur peut émettre**.

### La règle qui tranche

> « les informations portées dans la partie réservée au demandeur, les éléments
> entre crochets ([raison sociale du demandeur]) figurant dans les parties B et C
> et la mention […] dite mention CNIL, du demandeur doivent être renseignés de
> façon dactylographiée avant la signature »

> « **En dehors de ces éléments qui doivent être personnalisés par le demandeur,
> aucune modification du contenu et de l'organisation de l'attestation sur
> l'honneur n'est autorisée.** »

L'AH n'est donc pas un modèle à reproduire fidèlement : c'est un document dont la
forme ET le fond sont figés, que le demandeur (l'obligé) personnalise seul, et
que personne d'autre n'a le droit de réorganiser.

### Relevé d'écarts — annexe 7 contre `ah-document.tsx`

| Exigence annexe 7 | Ce que produit Dossimo | Verdict |
|---|---|---|
| Un titre | « Attestation sur l'honneur » | conforme |
| Une introduction (contenu fixé en annexe 7-1) | Introduction rédigée par Dossimo | écart |
| **Une partie réservée au demandeur ; « les mentions de la raison sociale du demandeur et de son numéro SIREN sont obligatoires »** | Absente. L'en-tête porte le logo **Dossimo**, qui n'est pas le demandeur | **bloquant** |
| Partie A relative aux opérations standardisées (format fixé par l'arrêté de la fiche) | Cadre A dont Dossimo choisit les champs | écart |
| Partie B bénéficiaire, avec les éléments entre crochets `[raison sociale du demandeur]` | Cadre B, 4 champs, sans les crochets demandeur | écart |
| Partie C professionnel, idem | Cadre C, 4 champs | écart |
| **« mention CNIL relative au ministère chargé de l'énergie et […] mention CNIL du demandeur »** | Les deux absentes | **bloquant** |
| « Le remplissage des champs précédés d'un astérisque est obligatoire » | Aucun astérisque | écart |
| « les caractères sont de couleur noire sur fond clair » | Bandeau d'en-tête encre, texte clair, filet d'accent bleu | écart |
| « au minimum […] 8 points en caractères droits, police **Times New Roman** » | **Helvetica** (React-PDF ne charge que les polices standard) | écart |
| Pagination numéro de page / nombre total | `Page X/Y` | conforme |
| « aucune modification du contenu et de l'organisation […] n'est autorisée » | Cadre « Coût de l'opération et aides (6e période) » ajouté ; engagements rédigés par Dossimo | **rédhibitoire** |

### Conclusion de la première passe

La reproduction **n'est pas une attestation sur l'honneur recevable**, et aucune
correction cosmétique ne la rend recevable : la règle interdit la reproduction
par un tiers, indépendamment de sa fidélité.

Le basculement vers « le remplissage AcroForm officiel » n'est pas non plus une
issue : il n'existe pas d'AH vierge officielle à remplir. Le vierge naît chez le
demandeur, qui y dactylographie sa raison sociale, son SIREN et sa mention CNIL.

**Seul chemin conforme : l'AH remise par l'obligé, pré-remplie.** C'est
exactement ce que fait déjà `AhObligeFill` / `oblige-actions.ts`. Ce chemin
cesse d'être un confort et devient le produit.

**À contresigner par un humain**, et à confronter à un modèle d'obligé réel dès
qu'un compte partenaire est ouvert.

### Suite donnée le 2026-07-25 : requalification

Décision : le document reste, mais **cesse d'être une AH**. Il devient une fiche
de préparation des valeurs à reporter sur l'AH de l'obligé.

- `CerfaKind` et `CerfaStrategy` : `reproduction` → `preparation`. L'identifiant
  qui décrivait l'ancienne intention ne survit nulle part.
- Le PDF perd les cadres A/B/C, l'engagement sur l'honneur et les zones de
  signature ; il gagne un avertissement en tête (« Ceci n'est pas une attestation
  sur l'honneur ») et un bloc « Ce qu'il vous reste à faire ».
- Le téléversement de l'AH de l'obligé (`AhObligeFill`) passe **devant** le
  téléchargement : c'est le chemin recevable, plus un confort.
- `revueValidee()` perd son passe-droit au `kind: "officiel"` : le mandat MPR est
  bien le PDF de l'État, mais ses coordonnées de surimpression sont mesurées chez
  nous et ne sont pas contre-vérifiées. L'écran le dit désormais.

Reste ouvert : la confrontation à un modèle d'obligé réel, qui vaudra
contre-signature de la présente revue.

## 2026-07-25 — BAR-TH-171 : le cadre A manquait quatre champs à la saisie

**Source :** annexe 1 de la fiche BAR-TH-171 (vA78.4, en vigueur au 01/01/2026),
téléchargée sur ecologie.gouv.fr. Cette annexe **définit champ par champ le
contenu de la partie A de l'attestation sur l'honneur** : ce n'est pas l'obligé
qui choisit, c'est l'arrêté de la fiche.

Confrontée à la saisie Dossimo, elle a révélé quatre absences :

| Champ du cadre A | Astérisque | État avant |
|---|---|---|
| Surface chauffée par la PAC installée (m²) | oui | absent |
| Usage couvert par la PAC (chauffage / chauffage + ECS) | oui | absent |
| PAC associée à un système déporté pour l'ECS (+ marque, référence) | oui | absent |
| Référence de la facture | non | absent |

Conséquence avant correctif : l'artisan arrivait devant l'AH de son obligé avec
quatre cases à remplir de mémoire, hors de la saisie unique. C'est exactement le
mécanisme d'incohérence entre pièces que Dossimo prétend supprimer.

**Correctif :** champs ajoutés au schéma (`cee-isolation.ts`), à la persistance,
au type de lecture, à la fiche de préparation et au formulaire. Les trois champs
à astérisque sont bloquants ; la référence de facture ne l'est pas, conformément
à l'annexe. Tests : `cee-isolation.test.ts`, un cas conforme et un cas de refus
par champ, plus la réciproque (un dossier isolation ne les réclame pas).

**Non retenu :** plusieurs sites affirment que le numéro **EPREL** de la PAC est
obligatoire sur l'AH depuis janvier 2026, sous peine de rejet. Le mot n'apparaît
pas une seule fois dans la fiche vA78.4 en vigueur. Information écartée. À
revérifier sur la vA82.5 annoncée au 01/09/2026.

**Reste à faire :** la même confrontation pour BAR-EN-101/102/103, BAR-TH-148,
BAR-TH-112 et BAR-TH-101. Chaque fiche a sa propre annexe définissant son cadre A,
donc chacune peut cacher le même type de trou.

## 2026-07-25 — Confrontation des six fiches au cadre A officiel

**Méthode.** Chaque fiche publie, à part, un PDF « Partie A » qui définit le
contenu du cadre A de l'AH. Ils sont listés sur la page « Opérations
standardisées » d'ecologie.gouv.fr. Tous téléchargés, texte extrait, comparés
champ par champ à la saisie Dossimo.

**Piège de version.** Chaque fiche a DEUX fichiers Partie A : l'historique, et
un « **Partie A à compter du 01-07-2026** ». C'est ce dernier qui fait foi
depuis le 1er juillet 2026. Toute revue doit partir de celui-là.

### Défaut transversal aux six fiches

**Le bloc sous-traitant est absent de Dossimo.** Les six Partie A portent, à
astérisque : « Identité du professionnel titulaire du signe de qualité ayant
réalisé l'opération, s'il n'est pas le signataire de cette attestation
(sous-traitant par exemple) : *Nom, *Prénom, *Raison sociale, *N° SIRET ».

Dossimo ne modélise aucun sous-traitant. Le PDF de préparation va jusqu'à
affirmer que les matériaux ont été posés « par l'entreprise mentionnée au cadre C,
ou par son sous-traitant déclaré » sans jamais avoir demandé qui il est. La
sous-traitance non déclarée est un motif de refus classique.

Le coût HT/TTC et les aides publiques hors CEE figurent aux six Partie A : déjà
couverts par la saisie.

### Par fiche

| Fiche | Manque | Gravité |
|---|---|---|
| BAR-EN-101 / 102 / 103 | Pare-vapeur (sans astérisque) ; *date de visite préalable et *date de début des travaux acceptées vides alors qu'elles sont obligatoires au cadre A | moyen |
| BAR-TH-101 (CESI) | *Le CESI couvre la totalité du besoin ECS (O/N) ; *les capteurs sont non hybrides (O/N) | moyen |
| BAR-TH-112 (bois) | rien, hors le bloc sous-traitant | faible |
| BAR-TH-148 (CET) | **le critère n'est plus le COP** (voir ci-dessous) | **élevé** |
| BAR-TH-171 (PAC) | corrigé ce jour ; vA82.5 au 01/09/2026 en ajoute deux (voir ci-dessous) | à venir |

### BAR-TH-148 : Dossimo contrôle un critère abrogé

Le mot « COP » **n'apparaît pas une seule fois** dans la fiche BAR-TH-148 vA78-4
en vigueur depuis le 01/01/2026. Le critère du cadre A est :

> *Efficacité énergétique pour le chauffage de l'eau, pour le profil de soutirage
> déclaré (en %), supérieure ou égale à : M 95 %, L 100 %, XL 110 %.

Or `controle-dossier.ts` bloque sur `cop >= 2.5` (surchargeable par `cop_min`),
la règle `0010` exige la mention du COP sur le devis, et la saisie ne capture pas
l'efficacité énergétique ECS. Les deux sens sont fautifs : un appareil conforme
peut être bloqué à tort, et un appareil sous le plancher d'efficacité peut
passer. À traiter en premier.

### Correctif du 2026-07-25 : le CET contrôle désormais le bon critère

- `controle-dossier.ts` : le contrôle `technique_cop` disparaît, remplacé par
  `technique_efficacite_ecs`. Plancher en repli par profil (M 95 %, L 100 %,
  XL 110 %), surchargeable par `condition_json.efficacite_ecs_min` — même motif
  que le CESI, qui avait déjà ce besoin.
- Saisie : `cet_efficacite_ecs` devient obligatoire, `cet_cop` passe facultatif.
  Le COP est conservé plutôt que supprimé : il figure encore sur beaucoup de
  devis, et le retirer ferait perdre la comparaison devis / saisie sur les
  dossiers qui le portent.
- Mentions du devis : la ligne « COP (norme EN 16147) » cède la place à
  l'efficacité ECS. L'exiger encore aurait fait signaler un devis conforme.
- Migration `0049` : règles CET en **version 2**, version 1 désactivée. Pas de
  réécriture de la ligne d'origine, l'historique des règles opposées à un
  dossier déjà contrôlé doit rester lisible. Valeurs de prime reprises de l'état
  courant (après `0046`), pas du seed `0010`.
- `cop_min` reste déclaré au schéma de condition mais n'est plus lu, avec le
  commentaire qui l'explique.

Tests : plancher par profil dans les deux sens, surcharge par la règle,
efficacité absente, et la réciproque explicite « un COP bas ne bloque plus ».

### Correctif du 2026-07-26 : le sous-traitant, sur les six fiches

Question posée à **tout** dossier, hors des branches par geste, puisque les six
cadres A la portent : « Les travaux ont-ils été réalisés par une autre
entreprise ? ». Jamais préremplie — supposer « non » reviendrait à répondre à la
place de l'artisan sur une déclaration qu'il signe sur l'honneur.

Si oui : nom, prénom, raison sociale et SIRET (14 chiffres), les quatre champs à
astérisque. Un SIRET identique à celui du signataire est refusé : le cadre
n'existe que pour le cas « ce n'est pas le signataire », le remplir avec sa
propre entreprise produirait une déclaration qui se contredit.

**Le contrôle qui en découle.** Quand un sous-traitant pose, c'est SA
qualification RGE qui doit couvrir les travaux, alors que toute la vérification
RGE de `controle-dossier.ts` porte sur le SIRET du signataire. Impossible de la
trancher automatiquement sans interroger l'annuaire pour le sous-traitant :
le moteur émet donc un avertissement explicite plutôt que de laisser croire que
la qualification a été vérifiée. Non bloquant — c'est un point à vérifier, pas
un motif de refus établi.

Trois états distincts, et la distinction porte le sens :

- `null` : sous-traitance déclarée absente, aucun constat ;
- objet : sous-traitance déclarée, avertissement sur la qualification ;
- `undefined` : dossier antérieur à la question, avertissement distinct
  (« cadre A à compléter »), qui s'éteint de lui-même pour les dossiers créés
  depuis.

**Reste ouvert :** vérifier le SIRET et le RGE du sous-traitant contre les
annuaires officiels, comme `verifierEntreprise` le fait déjà pour le signataire.
C'est ce qui transformerait l'avertissement en contrôle.

### Correctif du 2026-07-26 : les champs restants, par geste

**Chauffe-eau solaire (BAR-TH-101).** Deux cases à astérisque ajoutées et
obligatoires : « Le chauffe-eau solaire installé permet de couvrir la totalité du
besoin en eau chaude sanitaire du logement » et « Les capteurs solaires sont des
capteurs non hybrides ». La seconde n'est pas une formalité : un capteur hybride
photovoltaïque / thermique ne relève pas de cette fiche.

**Isolation, pare-vapeur.** Champ ajouté, facultatif — l'annexe ne le marque pas
d'un astérisque. Affiché uniquement hors murs : le BAR-EN-102 est la seule fiche
d'isolation à ne pas poser la question, et la montrer sur un dossier de murs
inventerait une exigence.

**Isolation, les deux dates du cadre A.** Les BAR-EN marquent d'un astérisque la
date de visite préalable et la date de début des travaux (pose de l'isolant) ;
les fiches chauffage, non. Elles restent **facultatives au schéma** : un dossier
se prépare souvent avant le chantier, et les rendre bloquantes interdirait ce
cas. C'est le moteur qui les réclame, en avertissement, pour que le trou se voie
avant le dépôt et non devant l'AH de l'obligé.

Tests : cas conforme et cas de refus pour les deux cases du CESI, réciproque sur
le pare-vapeur facultatif, et pour la règle de dates les deux dates séparément,
l'absence de blocage, et la non-application aux gestes chauffage.

### EPREL : deux rectifications successives, et l'obligation est ACTUELLE

Ce point a été mal instruit deux fois. Le récit sert d'avertissement.

1. Première passe : l'obligation EPREL est **écartée** parce que `grep -i eprel`
   ne renvoie rien dans la fiche vA78.4.
2. Deuxième passe : elle est requalifiée en **échéance du 01/09/2026**, trouvée
   dans la vA82.5 sous le libellé « la référence du modèle de la PAC ».
3. Troisième passe, en comparant les deux cadres A ligne à ligne : la vA78.4
   porte déjà, **à astérisque**, « *Le numéro du modèle de la PAC, défini à
   l'article 2 du règlement (UE) 2017/1369 ». La vA82.5 ne fait que remplacer
   « le numéro » par « la référence ».

**L'obligation est donc en vigueur depuis le 01/01/2026**, et l'était déjà quand
la première passe a conclu l'inverse.

La cause de l'erreur : avoir cherché le nom d'usage (« EPREL ») dans un texte
réglementaire qui ne l'emploie jamais. Une fiche désigne ses objets par leur
base juridique, pas par le nom que le secteur leur donne. **Chercher la référence
du règlement, pas le sobriquet.** Les sources secondaires qui annonçaient un
« numéro EPREL obligatoire depuis janvier 2026 » avaient raison sur toute la
ligne.

### Correctif du 2026-07-26 : référence du modèle, et bonification

- `pac_reference_modele` : **obligatoire**, puisque l'exigence est en vigueur.
  Reporté dans la fiche de préparation, et ajouté aux champs que l'extraction
  cherche sur le devis.
- `pac_numero_agrement` : facultatif. N'est exigé qu'à compter du 01/09/2026, et
  seulement pour les PAC bénéficiant de la bonification du 1° du IV de
  l'article 3-6 de l'arrêté du 29 décembre 2014 modifié.

**Reste à faire au 01/09/2026** : basculer `version_formulaire` de la règle
BAR-TH-171 sur « BAR-TH-171 vA82.5 ». Pas de mécanisme de bascule à date dans
`regles_metier` — c'est une opération datée, à faire à la main, pas un défaut à
contourner par du code.

Le reste du cadre A vA82.5 est identique à la vA78.4 : comparaison des champs à
astérisque faite, aucun autre ajout ni retrait. L'annexe 2 de la vA82.5 est un
tableau récapitulatif à l'usage du demandeur, hors périmètre artisan.

## 2026-07-26 — Relecture systématique, et ce qu'elle a encore trouvé

Après l'affaire EPREL, reprise de la comparaison par une **méthode mécanique**
plutôt que par lecture en prose : extraction de TOUS les champs à astérisque de
chaque Partie A, sans troncature, puis pointage un par un contre la saisie.

Nombre de champs à astérisque par fiche : EN-101 20, EN-102 19, EN-103 18,
TH-101 25, TH-112 16, TH-148 17, TH-171 26.

La PAC en portait 26, et c'est la seule dont je n'avais jamais listé les champs —
je l'avais lue en prose. Trois trous supplémentaires y sont apparus, tous à
astérisque, tous corrigés ce jour :

- **« La PAC est équipée d'un régulateur : OUI / NON »** : Dossimo ne portait que
  la classe, et facultative de surcroît alors qu'elle est à astérisque. La classe
  est désormais exigée dès qu'un régulateur est déclaré ; sa présence ne se
  déduit plus d'une case remplie.
- **« Une note de dimensionnement a été remise au bénéficiaire : OUI / NON »** :
  déclaration absente. Elle ne fait pas doublon avec la pièce du même nom : la
  checklist suit le document que Dossimo détient, le cadre A déclare sa remise
  au client. Deux faits distincts.
- **« […] le système déporté consomme de l'énergie pour la production de l'eau
  chaude sanitaire […] »** : absente, conditionnée à l'existence d'un déporté.

### Le seul écart restant, et pourquoi il n'est pas traité ici

**« *Pour les personnes morales : nom du site des travaux ou nom de la
copropriété »** figure aux SIX Partie A, à astérisque. Dossimo n'a pas de champ
correspondant, et n'en aura pas tant que le modèle de bénéficiaire restera une
personne physique (`nom` + `prenom`). Un bénéficiaire personne morale (SCI,
copropriété, bailleur social) est une évolution du modèle de données, pas un
champ à ajouter : à traiter comme telle, ou à assumer comme hors périmètre.

Note : le BAR-TH-101 porte DEUX lignes à astérisque sur ce point (« pour les
personnes morales… » puis « Nom du site des travaux »). Redondance du texte
officiel, pas une erreur de lecture.

## Format des prochaines entrées

`YYYY-MM-DD — [fiche/modèle] — source officielle — changement — tests exécutés — validé par`

