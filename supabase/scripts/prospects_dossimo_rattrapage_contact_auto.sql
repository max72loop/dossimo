-- Reporte dans `prospects_dossimo` les envois déjà faits par la campagne
-- automatique (`prospection_messages`, migration 0032).
--
-- À EXÉCUTER À LA MAIN dans l'éditeur SQL Supabase, APRÈS la migration 0050.
-- Pas une migration : c'est une opération de DONNÉES, rejouable à volonté.
--
-- POURQUOI IL EXISTE
-- La campagne automatique a démarré le 19/07/2026 sans rien écrire dans le fichier
-- de prospection. Résultat au 27/07 : 215 artisans démarchés par e-mail, invisibles
-- dans `prospects_dossimo`, donc impossibles à distinguer des 2 998 jamais
-- contactés. `envoyerProchain` écrit désormais ces colonnes à chaque envoi ; ce
-- script rattrape l'historique, et sert de filet si une écriture est perdue plus
-- tard (elle est journalisée, non bloquante, côté application).
--
-- RÉCONCILIATION
-- L'import (`prospection_import_depuis_prospects_dossimo.sql`) écrit l'origine dans
-- `prospects.notes` sous la forme « … place_id=<id> » : c'est la clé de jointure,
-- exacte et stable. Repli sur l'adresse e-mail pour les prospects importés
-- autrement (CSV admin), où `emails[1]` du fichier correspond à `prospects.email`.
-- Le repli ne se déclenche que si le place_id est absent des notes.
--
-- IDEMPOTENT : la clause finale n'écrit que ce qui change réellement.

with envoyes as (
  -- Un prospect peut porter plusieurs messages (campagne de relance) : on retient
  -- le plus significatif, puis le plus récent. « echec » vaut contact — le message
  -- a pu partir malgré l'erreur (cf. `envoyerProchain`) — mais « envoye » prime.
  select distinct on (m.prospect_id)
    m.prospect_id,
    case when m.statut = 'envoye' then 'envoye' else 'echec' end as contact_statut,
    coalesce((m.sent_at at time zone 'Europe/Paris')::date, m.scheduled_on) as contact_jour
  from public.prospection_messages m
  where m.statut in ('envoye', 'echec')
  order by m.prospect_id,
           (m.statut = 'envoye') desc,
           m.sent_at desc nulls last,
           m.created_at desc
),
cible as (
  select
    coalesce(
      nullif(substring(p.notes from 'place_id=([^[:space:]]+)$'), ''),
      pd_email.place_id
    )                as place_id,
    e.contact_statut,
    e.contact_jour
  from envoyes e
  join public.prospects p on p.id = e.prospect_id
  -- Repli par adresse : uniquement quand les notes ne portent pas de place_id.
  left join lateral (
    select pd.place_id
    from public.prospects_dossimo pd
    where p.notes !~ 'place_id='
      and pd.emails is not null
      and exists (
        select 1 from unnest(pd.emails) as adresse
        where lower(trim(adresse)) = lower(trim(p.email))
      )
    order by pd.place_id
    limit 1
  ) pd_email on true
),
retenu as (
  -- Deux prospects peuvent retomber sur le même contact (plusieurs adresses du
  -- même artisan) : on garde le contact le plus ancien, c'est lui le premier
  -- démarchage.
  select distinct on (place_id) place_id, contact_statut, contact_jour
  from cible
  where place_id is not null
  order by place_id, contact_jour asc, (contact_statut = 'envoye') desc
)
update public.prospects_dossimo pd
   set contact_auto_le = r.contact_jour,
       contact_auto_statut = r.contact_statut
  from retenu r
 where pd.place_id = r.place_id
   and (pd.contact_auto_le is distinct from r.contact_jour
        or pd.contact_auto_statut is distinct from r.contact_statut);

-- Contrôles à passer après coup :
--
-- 1) Ce que le fichier sait désormais :
-- select contact_auto_statut, count(*)
--   from public.prospects_dossimo group by 1 order by 1;
--
-- 2) Rien ne doit manquer : messages partis sans contact rattaché au fichier.
--    Un reliquat est normal si des prospects viennent d'un import CSV hors ADEME.
-- select count(*) from public.prospection_messages m
--  where m.statut in ('envoye','echec')
--    and not exists (
--      select 1 from public.prospects p
--      join public.prospects_dossimo pd
--        on pd.place_id = substring(p.notes from 'place_id=([^[:space:]]+)$')
--       where p.id = m.prospect_id and pd.contact_auto_le is not null
--    );
--
-- 3) Aucun contact ne doit être démarché deux fois : un artisan marqué par les
--    DEUX voies. Doit renvoyer 0.
-- select count(*) from public.prospects_dossimo
--  where contact_auto_le is not null and date_envoi is not null;
