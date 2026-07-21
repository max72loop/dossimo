-- Suivi d'ouverture des messages de prospection.
--
-- Jusqu'ici, seul le clic sur le lien de démo était journalisé : la campagne ne
-- posait aucun pixel, par choix. Décision revue — on veut désormais connaître le
-- taux d'ouverture. Un pixel 1×1 servi en première partie depuis dossimo.app
-- (src/app/api/prospection/pixel) enregistre un événement à chaque chargement.
--
-- On ne pose donc qu'un nouveau type d'événement dans le journal existant, à côté
-- de 'clic'. Comme le clic, une ouverture peut se répéter (rechargement d'image) :
-- on stocke chaque ligne brute et on compte les prospects distincts côté lecture.
--
-- La contrainte CHECK a été créée en ligne dans 0032 : Postgres l'a nommée
-- `prospection_evenements_type_check`. On la remplace pour élargir l'énumération.

alter table public.prospection_evenements
  drop constraint if exists prospection_evenements_type_check;

alter table public.prospection_evenements
  add constraint prospection_evenements_type_check
  check (type in ('envoi', 'clic', 'desinscription', 'bounce', 'reponse', 'ouverture'));