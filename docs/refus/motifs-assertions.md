# Motifs de refus, lot 1 : assertions réglementaires

> **Source unique des sources.** Une ligne par affirmation réglementaire portée
> par les onze motifs du cluster `/refus`, avec le **slug du motif** qu'elle
> soutient, sa source primaire, sa référence exacte, la **version** du texte et
> sa **date d'applicabilité**.
>
> Le texte des motifs, lui, vit en base et sa source est
> [`0054_seed_refus_motifs.sql`](../../supabase/migrations/0054_seed_refus_motifs.sql).
> Il n'en existe volontairement **aucune copie en markdown** : le brouillon de
> rédaction `motifs-lot1.md` a été supprimé une fois le seed écrit, deux copies
> d'un même texte dérivant toujours.
>
> **Règle de maintenance.** Toute migration qui modifie le texte d'un motif met à
> jour ce fichier **dans le même commit**, au même titre que `database.types.ts`
> pour un changement de schéma (CLAUDE.md §11).

**État au 30 juillet 2026** : aucune assertion ouverte, les onze motifs sont à
`publie = true`.

**Méthode.** Deux familles de sources, toutes primaires.

- **Fiches d'opérations standardisées** : PDF archivés dans
  [`../sources-reglementaires/cee/`](../sources-reglementaires/cee/), téléchargés
  le 13 juillet 2026 depuis le ministère chargé de l'énergie, relus
  intégralement le 30 juillet 2026 (texte extrait du PDF archivé).
- **Textes législatifs et réglementaires** : consultés sur Légifrance le
  30 juillet 2026, article par article, dans leur version en vigueur.

Aucune source secondaire (site d'agrégation, blog sectoriel, cabinet) n'établit
une assertion de cette liste. Les motifs ont été amorcés depuis les règles dures
déjà validées ([`src/lib/rules/`](../../src/lib/rules/)) et les seeds de
`regles_metier`.

---

## 1. Voies de contestation

| Id | Motif (slug) | Assertion | Source | Version / applicabilité |
|---|---|---|---|---|
| **A1** | `travaux-demarres-avant-engagement`, `qualification-rge-invalide-a-la-date` | L'introduction d'un recours contre une décision relative à la prime de transition énergétique **est subordonnée à l'exercice préalable d'un recours administratif auprès du directeur général de l'Anah**. Le silence gardé plus de quatre mois vaut décision de rejet. | Décret n° 2020-26 du 14 janvier 2020, **art. 9** | Version en vigueur au **23/11/2025**, consultée le 30/07/2026 |
| **A1b** | (transverse) | **L'article 9 ne fixe lui-même aucun délai** pour exercer ce recours préalable. Le seul délai qu'il énonce est celui de quatre mois de silence valant rejet. | Décret n° 2020-26, art. 9 | idem |
| **A2** | (transverse, tous les motifs) | « Les délais de recours contre une décision administrative **ne sont opposables qu'à la condition d'avoir été mentionnés, ainsi que les voies de recours, dans la notification de la décision**. » | **Art. R. 421-5 du code de justice administrative** | En vigueur, cité mot à mot le 30/07/2026 |
| **A2b** | (transverse) | Le délai de recours contentieux de droit commun est de **deux mois à compter de la notification ou de la publication**. | **Art. R. 421-1 du code de justice administrative** | En vigueur, 30/07/2026 |

**Correction apportée le 30/07/2026.** La formulation « recours gracieux, en
principe dans les deux mois de la notification » était fausse deux fois : ce
n'est pas un recours gracieux facultatif mais un **RAPO** (sans lui, la requête
est irrecevable), et **le délai de deux mois n'est pas celui du RAPO** mais celui
du recours contentieux. Purgée de tout le cluster.

**Ligne éditoriale.** Les pages disent que le recours préalable devant le
directeur général de l'Anah est obligatoire, et renvoient pour les délais à ce
que porte la notification, en s'appuyant sur A2 : un délai qui n'y figure pas
n'est pas opposable. **Aucune page n'annonce de délai chiffré.**

**Point volontairement hors du texte** : l'articulation entre délai du RAPO et
délai contentieux relève des règles générales du CRPA, non vérifiées. A2 permet
de ne pas s'y aventurer.

**Côté CEE**, aucune assertion sur la nature de la décision : le refus vient de
l'obligé ou de son délégataire, et les pages se limitent à décrire ce qui, dans
le dossier, a déclenché le rejet.

---

## 2. Chronologie

| Id | Motif (slug) | Assertion | Source | Version / applicabilité |
|---|---|---|---|---|
| **A3** | `offre-cee-posterieure-au-devis` | Le demandeur de CEE doit justifier de son rôle actif et incitatif. **La contractualisation intervient au plus tard à la date d'engagement de l'opération.** | **Art. R. 221-22 du code de l'énergie** | Version en vigueur **depuis le 28/12/2022**, consultée le 30/07/2026 |
| **A3b** | `offre-cee-posterieure-au-devis`, `travaux-demarres-avant-engagement` | **Lorsque le bénéficiaire est une personne physique ou un syndicat de copropriétaires, cette contractualisation intervient au plus tard quatorze jours après la date d'engagement, et avant le début de réalisation.** | Art. R. 221-22 du code de l'énergie | idem. Corroboré par l'annexe 5 de l'arrêté du 4 septembre 2014 |
| **A3c** | `offre-cee-posterieure-au-devis` | Pour les opérations standardisées envers personnes physiques ou syndicats, la valeur de la contribution est déterminée au plus tard quatorze jours après l'engagement et avant la réalisation. | Art. R. 221-22 du code de l'énergie | idem |
| **A4** | `travaux-demarres-avant-engagement` | « **Seuls les travaux et prestations commencés après l'accusé de réception par l'Agence nationale de l'habitat de la demande de prime y ouvrent droit. Cet accusé de réception ne vaut pas décision d'octroi de la prime.** » | Décret n° 2020-26, **art. 2** | Version en vigueur, consultée le 30/07/2026 |
| **A4b** | `travaux-demarres-avant-engagement` | Le directeur général de l'Anah peut **exceptionnellement accepter une demande déposée après le commencement des travaux**, notamment en cas de travaux urgents justifiés par un risque manifeste pour la santé ou la sécurité, ou de dommages consécutifs à une catastrophe naturelle ou technologique. | Décret n° 2020-26, art. 2 | idem |
| **A23** | `offre-cee-posterieure-au-devis`, `qualification-rge-invalide-a-la-date` | L'appréciation de la qualification RGE dans le dispositif CEE s'effectue **à la date d'engagement de l'opération**, laquelle est, le plus fréquemment pour un particulier, **la date d'acceptation du devis**. | Ministère chargé de l'énergie, questions-réponses officielles CEE | Consulté le 30/07/2026 |

---

## 3. Isolation

| Id | Motif (slug) | Assertion | Source | Version / applicabilité |
|---|---|---|---|---|
| **A5** | `delai-sept-jours-francs-isolation` | Un délai minimal de **sept jours francs** est respecté entre la date d'acceptation du devis et la date de début des travaux (pose de l'isolant). | BAR-EN-101, § 3 | **vA64-6**, applicable au **01/01/2025**, fiche abrogée au 01/05/2027 |
| **A6** | `delai-sept-jours-francs-isolation` | Même délai de sept jours francs pour l'isolation des murs. | BAR-EN-102, § 3 | **vA65-4**, applicable au **01/01/2025**, abrogée au 01/05/2027 |
| **A7** | `mention-obligatoire-absente`, `visite-prealable-absente-ou-non-datee` | La preuve de réalisation mentionne : la mise en place d'une isolation ; marque, référence, épaisseur et surface d'isolant ; la résistance thermique évaluée selon la norme applicable ; les aménagements nécessaires (coffrage ou écran autour des conduits de fumées et éclairages encastrés, rehausse au-dessus de la trappe, pare-vapeur ou équivalent) ; **la date de la visite du bâtiment**. | BAR-EN-101, § 3 | vA64-6, 01/01/2025 |
| **A8** | `mention-obligatoire-absente` | À défaut, la preuve mentionne le matériau (marque, référence), la surface et la date de visite, **complétée par un document du fabricant ou d'un organisme accrédité NF EN ISO/IEC 17065 par le COFRAC**. **L'ACERMI n'est pas nommé par la fiche.** | BAR-EN-101, § 3 | vA64-6, 01/01/2025 |
| **A25** | `mention-obligatoire-absente` | **Tolérance : lorsque ce document du fabricant porte une date de validité, il est considéré comme valable jusqu'à un an après sa date de fin de validité.** | BAR-EN-101 § 3, BAR-EN-102 § 3, BAR-TH-171 § 3 | vA64-6 / vA65-4 / vA78-4 et vA82-5 |
| **A26** | `mention-obligatoire-absente` | Pour les références proposées en différentes épaisseurs, la preuve de réalisation, si elle ne mentionne pas la résistance thermique de l'isolation installée, **doit impérativement en préciser l'épaisseur**. | BAR-EN-101 § 3, BAR-EN-102 § 3 | vA64-6 / vA65-4, 01/01/2025 |
| **A11** | `resistance-thermique-insuffisante` | R de l'isolation installée ≥ **7 m².K/W en comble perdu** et **6 m².K/W en rampant de toiture**. La résistance de l'isolation **existante n'est pas prise en compte**. | BAR-EN-101, § 3 | vA64-6, 01/01/2025 |
| **A12** | `resistance-thermique-insuffisante` | R ≥ **3,7 m².K/W** pour l'isolation des murs, l'existant non pris en compte. | BAR-EN-102, § 3 | vA65-4, 01/01/2025 |
| **A13** | `resistance-thermique-insuffisante` | R évaluée selon NF EN 12664, 12667 ou 12939 (isolants non réfléchissants) et NF EN ISO 22097 (réfléchissants). | BAR-EN-101 § 3, BAR-EN-102 § 3 | vA64-6 / vA65-4 |
| **A14** | `visite-prealable-absente-ou-non-datee`, `resistance-thermique-insuffisante` | Visite technique du bâtiment **au plus tard avant l'établissement du devis** (BAR-EN-101) / **avant l'établissement du devis** (BAR-EN-102) ; le professionnel y valide l'adéquation du procédé et s'assure que l'isolation existante peut être conservée, sinon remise en état ou dépose. | BAR-EN-101 § 3, BAR-EN-102 § 3 | vA64-6 / vA65-4 |
| **A22** | `visite-prealable-absente-ou-non-datee` | La visite préalable est réalisée par l'entreprise qui exécute les travaux et qui est titulaire du signe de qualité. La facture comporte la date de cette visite, effectuée par l'entreprise ayant réalisé les travaux (le cas échéant un sous-traitant) ou par le maître d'œuvre. | Ministère chargé de l'énergie, questions-réponses CEE | Consulté le 30/07/2026. Recoupe A7 et A14 |

---

## 4. Qualification du professionnel

| Id | Motif (slug) | Assertion | Source | Version / applicabilité |
|---|---|---|---|---|
| **A9** | `qualification-rge-invalide-a-la-date`, `rge-hors-domaine-ou-sous-traitance` | Le professionnel **réalisant l'opération** est titulaire d'un signe de qualité répondant aux exigences de l'**art. 2 du décret n° 2014-812 du 16 juillet 2014**. | BAR-EN-101, BAR-EN-102, BAR-TH-148, BAR-TH-171, § 3 de chacune | vA64-6 / vA65-4 / vA78-4 / vA78-4 et vA82-5 |
| **A10** | `rge-hors-domaine-ou-sous-traitance` | Le signe de qualité correspond, au I de l'art. 1er du même décret, aux **11°, 13° ou 14°** (combles ou toiture), **11° ou 12°** (murs), **6°** (chauffe-eau thermodynamique), **5°** (PAC air/eau chauffage seul) ou **5° et 6°** (PAC assurant aussi l'ECS). | Les quatre fiches, § 3 | idem |

---

## 5. Équipements

| Id | Motif (slug) | Assertion | Source | Version / applicabilité |
|---|---|---|---|---|
| **A15** | `performance-equipement-sous-le-seuil` | Etas de la PAC air/eau (règlement UE n° 813/2013, conditions climatiques moyennes) ≥ **126 % en application basse température**, **111 % en moyenne ou haute température**. Etas de la PAC seule, hors régulation. | BAR-TH-171, § 3 | **vA78-4 (01/01/2026) ET vA82-5 (01/09/2026)** : identique |
| **A16** | `performance-equipement-sous-le-seuil` | Pour une PAC assurant **uniquement le chauffage** : plancher, plafond, mur chauffants et ventilo-convecteurs à eau relèvent de la basse température (Etas à 35 °C) ; tous les autres émetteurs, y compris les radiateurs dits basse température à régime 45 °C, de la moyenne ou haute (Etas à 55 °C). | BAR-TH-171, § 3 | vA78-4 et vA82-5 |
| **A29** | `performance-equipement-sous-le-seuil` | **Pour une PAC assurant le chauffage ET l'ECS, et pour toute association de système déporté produisant l'ECS, la PAC est d'application moyenne ou haute température et l'Etas à 55 °C est à considérer**, quels que soient les émetteurs. | BAR-TH-171, § 3 | vA78-4 et vA82-5 |
| **A28** | `performance-equipement-sous-le-seuil` | **Dérogation** : les systèmes déportés intégrant une résistance électrique à des fins de secours ou de cycles anti-légionelle, et pour lesquels la régulation priorise la PAC pour la production d'ECS, **sont éligibles**. | BAR-TH-171, § 3 | vA78-4 et vA82-5 |
| **A30** | `performance-equipement-sous-le-seuil` | La PAC est équipée d'un **régulateur de classe IV, V, VI, VII ou VIII** (§ 6.1 de la communication 2014/C 207/02). | BAR-TH-171, § 3 | vA78-4 et vA82-5 |
| **A27** | `performance-equipement-sous-le-seuil` | Le professionnel rédige une **note de dimensionnement** du générateur par rapport aux déperditions calculées à T = Tbase ; la PAC installée y est conforme. **Cette note est remise au bénéficiaire à l'engagement de l'opération**, et le cas échéant actualisée et remise à l'achèvement des travaux. | BAR-TH-171, § 3 | vA78-4 et vA82-5 |
| **A17** | `performance-equipement-sous-le-seuil` | Efficacité énergétique pour le chauffage de l'eau (règlement délégué UE n° 814/2013) d'un chauffe-eau thermodynamique à accumulation, pour un profil de soutirage déclaré M, L ou XL : ≥ **95 % (M)**, **100 % (L)**, **110 % (XL)**. | BAR-TH-148, § 3 | **vA78-4**, applicable au **01/01/2026**, opérations engagées avant le 01/01/2031 |

---

## 6. Non-cumuls et périmètre des aides

| Id | Motif (slug) | Assertion | Source | Version / applicabilité |
|---|---|---|---|---|
| **A18** | `non-cumul-cee-entre-gestes` | L'opération PAC air/eau **n'est pas cumulable** avec BAR-TH-101, BAR-TH-124, BAR-TH-143, **BAR-TH-148** et BAR-TH-168. | BAR-TH-171, § 2 | **vA78-4 et vA82-5**, liste identique. S'applique aux opérations engagées jusqu'au 31/12/2030 |
| **A19** | `non-cumul-cee-entre-gestes` | L'opération chauffe-eau thermodynamique **n'est pas cumulable** avec BAR-TH-171 et BAR-TH-172. | BAR-TH-148, § 2 | vA78-4, opérations engagées avant le 01/01/2031 |
| **A24** | `resistance-thermique-insuffisante` | L'arrêté du 8 septembre 2025 **supprime les forfaits correspondant aux chaudières biomasse et aux travaux d'isolation des murs** dans le parcours par geste. | Arrêté du 8 septembre 2025 modifiant l'arrêté du 14 janvier 2020 | Entrée en vigueur au **30/09/2025**, applicable aux demandes déposées à compter de cette date (art. 6) |

**Portée de A18 et A19.** Les exclusions sont posées **par la version de la fiche
applicable à la date d'engagement de l'opération**. Une opération engagée avant le
01/01/2026 relevait d'une version antérieure, non archivée ici, et ne peut pas
être jugée sur celles-ci. Le motif dit « dans les versions applicables en 2026 »
pour cette raison.

---

## 7. Durées de vie et versions (veille, non cité en page)

| Id | Assertion | Source |
|---|---|---|
| **A20** | BAR-EN-101 et BAR-EN-102 **abrogées à compter du 01/05/2027**. BAR-TH-171 s'applique aux opérations engagées **jusqu'au 31/12/2030**. BAR-TH-148, aux opérations engagées **avant le 01/01/2031**. | § 2 de chaque fiche |
| **A21** | Entre BAR-TH-171 **vA78-4** et **vA82-5** (bascule au 01/09/2026), les seuils Etas, les rubriques du décret de 2014, les règles d'application et la liste de non-cumul sont **identiques**. Les différences portent sur les montants en kWh cumac et les bornes de surface du § 5. | Comparaison des deux PDF archivés, 30/07/2026 |

**Conséquence** : aucune page du cluster ne devient fausse au 1er septembre 2026.
Raison de plus pour ne jamais citer de montant de prime ici.

---

## 8. Passe de relecture du 30/07/2026

Deux questions posées à chaque assertion, après que trois des quatre corrections
initiales eurent révélé le même défaut : une prose écrite à l'absolu recouvrant
un texte qui prévoyait une exception.

1. **Le texte source contient-il une tolérance, une dérogation, un délai de
   régularisation ou un régime transitoire que la prose traite comme absolu ?**
2. **L'assertion porte-t-elle la version de la fiche et sa date
   d'applicabilité ?**

**Résultat de la question 1** : le défaut était présent dans **deux motifs sur les
huit** restants, et les deux ont été corrigés.

- `mention-obligatoire-absente` ignorait **A25** (justificatif fabricant valable
  un an après sa date de fin de validité) et **A26** (voie alternative par
  l'épaisseur). Un artisan dont le document fabricant a expiré depuis huit mois
  croyait son dossier mort alors qu'il ne l'est pas. Même défaut que A3b.
- `performance-equipement-sous-le-seuil` posait la règle des émetteurs (A16)
  comme universelle, alors qu'elle ne vaut que pour une PAC assurant uniquement
  le chauffage (**A29**), ignorait la dérogation des systèmes déportés (**A28**),
  et passait sous silence deux conditions de délivrance qui ne portent pas sur la
  performance : le régulateur de classe IV à VIII (**A30**) et la note de
  dimensionnement remise au bénéficiaire **à l'engagement** (**A27**).

**Résultat de la question 2** : la version et la date d'applicabilité sont
désormais portées par **chaque ligne**, et non plus par une note globale ni par
la mémoire d'une session. C'est ce qui rend vérifiable, sans relire les PDF,
qu'une assertion survit à la bascule BAR-TH-171 du 1er septembre (A21).

---

## 9. Écarts relevés entre les textes et le produit

Cinq constats, ouverts en tickets dans
[`SUIVI-PROJET.md`](../../SUIVI-PROJET.md). Les deux premiers sont **corrigés**,
les trois autres restent ouverts.

1. ~~**`chrono_offre_cee` refuse plus strictement que le texte** (A3b). Le plus
   grave : un faux positif fait abandonner un dossier valide.~~ **Corrigé le
   01/08/2026.** `controlerDossier` applique désormais la fenêtre de quatorze
   jours d'A3b : une offre postérieure au devis n'est bloquante que si l'écart
   dépasse quatorze jours (A3b), ou si les travaux avaient déjà commencé (la
   double condition du texte). Quand le début des travaux n'est pas renseigné, la
   seconde condition est invérifiable et le finding passe en avertissement plutôt
   que de trancher dans un sens ou dans l'autre. La fenêtre est ouverte sans
   condition parce que le modèle ne sait décrire qu'un bénéficiaire personne
   physique ; elle devra être refermée pour une personne morale, à qui le texte ne
   l'offre pas. Quatre cas de test couvrent la correction dans
   [`controle-dossier.test.ts`](../../src/lib/rules/controle-dossier.test.ts).
2. ~~**Le délai de sept jours francs n'est contrôlé nulle part** (A5,
   A6).~~ **Corrigé le 01/08/2026.** `controlerDossier` applique désormais le
   délai aux seules fiches BAR-EN-101 et BAR-EN-102 : le jour d'acceptation du
   devis et le jour de pose sont exclus du décompte, si bien que J+8 est le
   premier démarrage conforme. Un écart plus court produit le finding bloquant
   `chrono_delai_franc_isolation`. Deux cas paramétrés sur les deux fiches
   couvrent J+5 refusé et J+8 accepté dans
   [`controle-dossier.test.ts`](../../src/lib/rules/controle-dossier.test.ts).
3. **Le non-cumul du chauffe-eau thermodynamique est absent du moteur**
   (A18, A19).
4. **La mention ACERMI du seed `regles_metier` est plus stricte que la fiche**
   (A8), et le moteur ignore la tolérance d'un an sur le justificatif fabricant
   (A25).
5. **La note de dimensionnement n'est pas contrôlée** (A27). `controle-dossier.ts`
   se contente de la mentionner en passant dans le finding sur le régulateur,
   alors que c'est une condition de délivrance datée, à remettre au bénéficiaire
   à l'engagement de l'opération.
