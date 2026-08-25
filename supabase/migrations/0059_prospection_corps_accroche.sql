-- 0059 — Copie courte + {{accroche}} métier sur la campagne automatique.
--
-- Contexte : le 25/08/2026, la copie de premier contact est raccourcie (perte
-- d'abord, question à la fin) et gagne `{{accroche}}`, substituée à la
-- préparation depuis `prospects_dossimo.rge_domaines` (même mapping que le
-- sprint). L'objet en base devient le fallback générique ; les messages
-- importés depuis le fichier ADEME portent l'objet métier posé par
-- `preparerFile`.
--
-- POURQUOI UNE MIGRATION, alors que 0032 voulait la copie corrigible sans
-- redéploiement : parce que 0032 SEEDE cette copie, et 0056 l'a déjà
-- réécrite. Un script joué à la main corrige la production mais laisse tout
-- environnement reconstruit par `db reset` sur l'ancienne copie longue.
-- La règle « la copie se corrige en base » tient pour un ajustement de
-- virgule ; un changement de structure (variable nouvelle, objet métier)
-- doit replayer avec l'historique.
--
-- Réécriture INTÉGRALE : 0056 a déjà divergé de 0032. Lui seul donne un
-- résultat déterministe. Le gabarit HTML vit dans
-- `src/lib/prospection/message.ts` et doit dire la même chose.

-- 1) Objet fallback + corps.
update public.prospection_campagnes
set objet = 'Devis rénovation : la relecture qui évite un refus',
    corps = $corps$
{{salutation}}

Un dossier MaPrimeRénov' ou CEE refusé, c'est la prime perdue et le montage à refaire. {{accroche}}

J'ai créé Dossimo pour ça : vous envoyez le devis (PDF ou photo), il recopie, contrôle, et vous sort le pack prêt à déposer. Vous relisez, vous déposez. Pas de mandataire : le client et la prime restent les vôtres.

Deux minutes, avec un de vos devis :
{{lien_demo}}

Vous avez un devis en cours sur lequel vous avez un doute ? Répondez-moi, c'est moi qui lis.


Max Landry, Dossimo
max@dossimo.pro

--
{{mentions_legales}}
Votre adresse professionnelle : {{source}}.
Pour ne plus recevoir aucun message de ma part : {{lien_desinscription}}
$corps$
where actif;

-- 2) Messages déjà en file : leur corps est figé à la mise en file, corriger
-- la campagne ne les corrige pas. On les annule tous (en_attente / valide) et
-- on remet les prospects en jeu ; la prochaine préparation les reprendra
-- avec la copie à jour et l'objet métier.
with annules as (
  update public.prospection_messages m
     set statut = 'annule',
         erreur = 'Copie courte + accroche métier, message annulé avant envoi.'
   where m.statut in ('en_attente', 'valide')
  returning m.prospect_id
)
update public.prospects p
   set statut = 'nouveau'
  from annules a
 where p.id = a.prospect_id
   and p.statut = 'en_file';
