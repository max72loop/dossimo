-- Relance de la campagne e-mail automatisée (table `prospection_campagnes`).
--
-- À EXÉCUTER UNE FOIS, À LA MAIN, dans l'éditeur SQL Supabase.
--
-- Ce fichier n'est PAS une migration : `supabase db push` n'applique que
-- `supabase/migrations/*.sql`. Objet, corps, dates et plafond d'une campagne
-- sont des DONNÉES (cf. 0032 : « la copie doit pouvoir être corrigée sans
-- redéploiement »), on les modifie donc ici, en service-role, jamais en dur.
--
-- CE QUE FAIT CE SCRIPT (décisions du 2026-07-18) :
--   - démarrage le 2026-07-18 (samedi) : la montée en charge (src/lib/
--     prospection/cadence.ts) repart au premier palier, soit 15 le premier jour.
--     Attention : la fenêtre d'envoi du samedi (9h30-17h30) est peut-être déjà
--     passée au moment où tu joues ce script ; dans ce cas les premiers envois
--     réels partent le dimanche, où la rampe est déjà à 25 ;
--   - fin repoussée au 2026-09-30 : la campagne de lancement s'arrêtait le
--     24/07 et `plafondDuJour` renvoie 0 au-delà ; l'objectif (10 artisans
--     payants) vise mi-septembre ;
--   - plafond nominal à 40 : la rampe 15 → 25 → 35 → 40 (jours 1 à 4), puis
--     40/jour ;
--   - campagne active et hors pause.
--
-- ATTENTION COPIE : le `corps` en base annonce le code DOSSIMO50 « jusqu'au
-- 31 juillet ». Il reste juste jusqu'au 31/07. Pour tout envoi en août, il faut
-- réécrire cette phrase (et se souvenir que la date de fin du coupon vit AUSSI
-- dans src/lib/stripe/actions.ts : les deux ne se synchronisent pas).

update public.prospection_campagnes
set demarre_le    = date '2026-07-18',
    termine_le    = date '2026-09-30',
    daily_cap_max = 40,
    en_pause      = false,
    motif_pause   = null,
    actif         = true
where actif;

-- Contrôle : l'état de la campagne après mise à jour.
-- select nom, demarre_le, termine_le, daily_cap_max, en_pause, actif
-- from public.prospection_campagnes where actif;
