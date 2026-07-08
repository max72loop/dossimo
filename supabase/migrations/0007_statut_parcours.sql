-- Parcours du dossier : cycle de vie visible et pilotable à la main.
--
-- L'enum statut_dossier ne comptait que 3 états ('nouveau', 'en_traitement',
-- 'livre'). On ajoute les 2 étapes manquantes du parcours réel (CEE et surtout
-- MaPrimeRénov' : demande -> accord -> travaux -> solde) :
--
--   nouveau -> en_traitement (En préparation) -> pret_depot (Prêt à déposer)
--           -> depose (Déposé) -> livre (Soldé)
--
-- ADD VALUE IF NOT EXISTS : idempotent, et ne peut pas tourner dans la même
-- transaction que l'utilisation des nouvelles valeurs (ici on ne fait qu'ajouter).

alter type statut_dossier add value if not exists 'pret_depot';
alter type statut_dossier add value if not exists 'depose';
