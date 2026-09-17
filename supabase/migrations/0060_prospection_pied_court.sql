-- 0060 — Pied de message court, sans donnée personnelle de l'expéditeur.
--
-- Contexte : le 17/09/2026, le bas du message de prospection perd le nom, la
-- raison sociale et l'adresse postale de l'éditeur, et se réduit à trois
-- lignes : l'invitation à répondre, la mention d'indépendance avec l'origine
-- de l'adresse (RGPD art. 14), le lien de désinscription. L'expéditeur reste
-- identifiable par la marque, l'en-tête `From` et `/mentions-legales`.
--
-- Migration plutôt que script à la main, pour la même raison que 0059 : la
-- copie est seedée, un `db reset` doit rejouer le pied à jour. Réécriture
-- INTÉGRALE du corps, seule voie déterministe. Le gabarit HTML vit dans
-- `src/lib/prospection/message.ts` et dit la même chose.
--
-- Pas d'annulation de file ici : au moment de l'écriture la campagne est en
-- pause et aucun message n'attend (`en_attente` / `valide` = 0).

update public.prospection_campagnes
set corps = $corps$
{{salutation}}

Un dossier MaPrimeRénov' ou CEE refusé, c'est la prime perdue et le montage à refaire. {{accroche}}

J'ai créé Dossimo pour ça : vous envoyez le devis (PDF ou photo), il recopie, contrôle, et vous sort le pack prêt à déposer. Vous relisez, vous déposez. Pas de mandataire : le client et la prime restent les vôtres.

Deux minutes, avec un de vos devis :
{{lien_demo}}

Une question sur un devis en cours ? Répondez à ce mail.

--
{{mentions_legales}} Pourquoi ce message : {{source}}.
Se désinscrire : {{lien_desinscription}}
$corps$
where actif;
