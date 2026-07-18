-- Alimente la file d'envoi automatisée (`prospects`, migration 0032) à partir du
-- fichier ADEME du sprint (`prospects_dossimo`, migration 0039).
--
-- À EXÉCUTER À LA MAIN dans l'éditeur SQL Supabase. Pas une migration : c'est une
-- opération de DONNÉES, rejouable (idempotente), pas du schéma.
--
-- POURQUOI CES DEUX TABLES NE SE MÉLANGENT PAS
-- `prospects_dossimo` sert le sprint MANUEL (WhatsApp + e-mail copié-collé). Le
-- tirage (prospect_dossimo_tirage.sql) réserve 300 contacts au sprint en leur
-- posant un `canal` ('email' / 'whatsapp'). `prospects` sert l'envoi AUTOMATIQUE.
-- Pour ne jamais contacter deux fois le même artisan, on n'importe ICI que les
-- contacts LIBRES du sprint : `canal is null`. Les 300 assignés restent au sprint.
--
-- GARDE-FOUS RGPD / DÉLIVRABILITÉ (mêmes règles que l'import CSV de l'admin) :
--   - `source` obligatoire (art. 14 RGPD) : reprise du fichier, sinon phrase par
--     défaut, à la première personne, reprise telle quelle en pied de message ;
--   - opt-out durable respecté : jamais un e-mail présent dans
--     `prospection_suppressions` (qui ne se purge jamais) ;
--   - jamais un client déjà en base (`artisans`) : le prospecter, c'est lui dire
--     qu'on ne sait pas qui il est ;
--   - jamais un doublon : dédoublonnage sur lower(email), dans le fichier
--     (DISTINCT ON) comme contre l'existant (ON CONFLICT DO NOTHING).
--
-- NOTE DÉLIVRABILITÉ : ce script n'exige PAS `email_valide = true`. Si la
-- validation des adresses n'a pas encore tourné, envoyer sur des adresses non
-- vérifiées fait grimper les bounces et abîme la réputation du domaine. Pour ne
-- retenir que les adresses validées, décommentez la ligne `email_valide` ci-bas.

insert into public.prospects (email, entreprise, ville, code_postal, source, notes)
select distinct on (lower(trim(pd.emails[1])))
  lower(trim(pd.emails[1]))                              as email,
  nullif(trim(coalesce(pd.denomination, pd.name)), '')  as entreprise,
  nullif(trim(pd.city), '')                             as ville,
  nullif(trim(pd.code_postal), '')                      as code_postal,
  coalesce(
    nullif(trim(pd.source), ''),
    'votre entreprise figure dans l''annuaire public des professionnels RGE (ADEME / France Rénov'')'
  )                                                     as source,
  'import prospects_dossimo · place_id=' || pd.place_id as notes
from public.prospects_dossimo pd
where pd.opt_out is not true
  and pd.canal is null                       -- réservés au sprint manuel : on ne double pas le contact
  -- and pd.email_valide is true             -- décommenter pour n'envoyer QU'aux adresses validées
  and pd.emails is not null
  and array_length(pd.emails, 1) >= 1
  and pd.emails[1] ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  and not exists (
    select 1 from public.prospection_suppressions s
    where s.email = lower(trim(pd.emails[1]))
  )
  and not exists (
    select 1 from public.artisans a
    where lower(a.email) = lower(trim(pd.emails[1]))
  )
order by lower(trim(pd.emails[1])), pd.score desc nulls last
on conflict (lower(email)) do nothing;

-- Contrôle : combien de prospects disponibles pour l'envoi automatique.
-- select statut, count(*) from public.prospects group by statut order by statut;
