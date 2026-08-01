-- 0056 — Retrait du code de lancement DOSSIMO50 de la campagne de prospection.
--
-- Contexte : l'offre DOSSIMO50 est retirée du produit le 2026-08-01. Le coupon
-- et le code promo ne sont plus créés côté Stripe, le champ code promo est fermé
-- au Checkout (`allow_promotion_codes: false`) et la copie a disparu du code
-- (landing, inscription, CGV, paywall, image OG, gabarit HTML de prospection).
--
-- POURQUOI UNE MIGRATION, alors que la copie de campagne est une DONNÉE que 0032
-- voulait corrigeable sans redéploiement : parce que 0032 SEEDE cette copie. Un
-- script joué à la main corrige la production mais laisse tout environnement
-- reconstruit par `db reset` réannoncer un code mort. La règle « la copie se
-- corrige en base » tient toujours pour un ajustement de texte ; le retrait d'une
-- offre disparue du code, lui, doit replayer avec l'historique.
--
-- Réécriture INTÉGRALE du corps, et non ciblée : le texte a déjà été retouché à
-- la main en production (l'échéance est passée du 26 au 31 juillet sans passer
-- par le dépôt), donc lui seul donne un résultat déterministe. Le paragraphe
-- d'offre cède la place à la promesse de tarif fixe, en miroir de l'encadré du
-- gabarit HTML (`src/lib/prospection/message.ts`) : ces deux copies doivent dire
-- la même chose (DESIGN.md, « copie en double source »).
--
-- Garde-fous côté applicatif, posés dans le même commit : `preparerFile()` refuse
-- de remplir la file et `envoyerProchain()` écarte en `echec` tout message dont
-- le corps porte encore le code. La campagne s'arrête bruyamment plutôt que de
-- promettre une remise que plus rien n'honore.

-- 1) Nom et copie de la campagne.
update public.prospection_campagnes
set nom = case
      when nom ilike '%DOSSIMO50%' then 'Prospection artisans RGE — 2026'
      else nom
    end,
    corps = $corps$
{{salutation}}

Monter un dossier MaPrimeRénov' ou CEE, c'est des heures de paperasse :
recopier le client, les montants, les données techniques, vérifier chaque
mention, comparer devis et facture, croiser les dates. Dossimo fait ce travail à
votre place.

Vous envoyez le devis, ou vous le prenez en photo depuis le chantier. Dossimo
recopie les informations, contrôle les mentions obligatoires, la chronologie et
la validité RGE, puis vous sort le pack complet prêt à déposer : récapitulatif
client, checklist des pièces et rapport de contrôle. Votre seul effort, relire
et déposer.

Résultat, un dossier complet et conforme, sans oubli qui ferait sauter la prime,
monté en quelques minutes au lieu de plusieurs heures. Et vous restez maître de
votre client et de votre prime, à l'inverse d'un mandataire qui s'intercale et
en capte une partie. Dossimo ne dépose jamais à votre place et ne touche jamais
la prime.

Un paiement fixe par dossier, connu avant de payer, jamais un pourcentage sur
la prime.

Envoyez un premier devis, deux minutes suffisent :
{{lien_demo}}

Max Landry, Dossimo
max@dossimo.pro

PS : un dossier refusé, c'est la prime entière perdue, souvent plusieurs
milliers d'euros, et le montage à refaire.

--
{{mentions_legales}}
Votre adresse professionnelle : {{source}}.
Pour ne plus recevoir aucun message de ma part : {{lien_desinscription}}
$corps$
where corps ilike '%DOSSIMO50%';

-- 2) Messages déjà en file : leur corps est figé à la mise en file, corriger la
-- campagne ne les corrige pas. On les annule et on remet les prospects en jeu ;
-- la prochaine préparation les reprendra avec la copie à jour.
with annules as (
  update public.prospection_messages m
     set statut = 'annule',
         erreur = 'Copie périmée (DOSSIMO50), message annulé avant envoi.'
   where m.statut in ('en_attente', 'valide')
     and m.corps ilike '%DOSSIMO50%'
  returning m.prospect_id
)
update public.prospects p
   set statut = 'nouveau'
  from annules a
 where p.id = a.prospect_id
   and p.statut = 'en_file';
