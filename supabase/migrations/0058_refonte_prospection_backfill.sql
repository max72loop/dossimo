-- 0058 — Refonte de la prospection : reprise des données existantes.
--
-- Verse `prospects_dossimo`, `prospection_messages`, `prospection_evenements` et
-- `prospection_suppressions` dans le modèle posé par la 0057, sans rien perdre.
-- Les tables d'origine ne sont ni vidées ni supprimées : elles restent la source
-- de vérité tant que le code applicatif n'a pas basculé.
--
-- REJOUABLE DANS LES DEUX SENS
--   - production : chaque insertion est gardée par un `not exists` ou un
--     `on conflict do nothing`, donc rejouer la migration n'ajoute rien ;
--   - environnement neuf (`db reset`, CI) : `prospects_dossimo` existe (0039)
--     mais est vide, tout insère 0 ligne, et les contrôles de cohérence de la
--     section 5 passent parce qu'ils comparent des comptes entre eux, jamais à
--     des constantes relevées en production.
--
-- ÉTAT CONSTATÉ AU 2026-08-02, qui explique les choix ci-dessous :
--   3 298 lignes dans `prospects_dossimo`, 3 293 SIREN distincts (5 doublons),
--   9 envois manuels (tous e-mail, le 16/07), 220 envois automatiques
--   (215 « envoye » + 5 « echec », du 19 au 27/07), 0 relance, 0 nurturing,
--   0 réponse, 0 opt-out, 0 suppression. Aucun des 5 SIREN dupliqués n'a jamais
--   été contacté : la fusion ne peut donc effacer aucun historique.

-- ---------------------------------------------------------------------------
-- 1) `contacts` — une ligne par SIREN
--
-- Les 5 doublons de SIREN sont deux fiches ADEME pour un même établissement. On
-- garde la mieux notée et on UNIT les coordonnées des deux plutôt que d'en jeter
-- une : perdre une adresse e-mail, c'est perdre un canal de contact, et surtout
-- une adresse sur laquelle un STOP pourrait un jour être reçu.
--
-- `source` : la colonne vaut 'ademe' pour les 3 298 lignes. Ce n'est pas
-- utilisable tel quel, car `contacts.source` est repris MOT POUR MOT dans le
-- pied des messages au titre de l'article 14 du RGPD (« votre adresse vient
-- de… »), et « ademe » n'est pas une phrase. On le traduit par la formulation
-- déjà employée par l'import vers `prospects`
-- (supabase/scripts/prospection_import_depuis_prospects_dossimo.sql), pour que
-- les deux voies disent la même chose au destinataire.
-- ---------------------------------------------------------------------------
with classe as (
  select
    pd.*,
    regexp_replace(coalesce(pd.siren, ''), '\D', '', 'g') as siren_net,
    row_number() over (
      partition by regexp_replace(coalesce(pd.siren, ''), '\D', '', 'g')
      order by pd.score desc nulls last, pd.place_id
    ) as rang
  from public.prospects_dossimo pd
  where regexp_replace(coalesce(pd.siren, ''), '\D', '', 'g') <> ''
),
agg_mails as (
  select
    regexp_replace(coalesce(pd.siren, ''), '\D', '', 'g') as siren_net,
    array_agg(distinct lower(trim(e))) as emails
  from public.prospects_dossimo pd
  cross join unnest(coalesce(pd.emails, '{}'::text[])) as e
  where regexp_replace(coalesce(pd.siren, ''), '\D', '', 'g') <> ''
    and e is not null
    and position('@' in e) > 1
  group by 1
),
agg_domaines as (
  select
    regexp_replace(coalesce(pd.siren, ''), '\D', '', 'g') as siren_net,
    array_agg(distinct trim(d)) as rge_domaines
  from public.prospects_dossimo pd
  cross join unnest(coalesce(pd.rge_domaines, '{}'::text[])) as d
  where regexp_replace(coalesce(pd.siren, ''), '\D', '', 'g') <> ''
    and nullif(trim(d), '') is not null
  group by 1
),
agg_flags as (
  select
    regexp_replace(coalesce(pd.siren, ''), '\D', '', 'g') as siren_net,
    -- Une adresse validée sur l'une des deux fiches vaut validée pour le contact.
    bool_or(coalesce(pd.email_valide, false)) as email_valide,
    max(pd.score) as score,
    min(pd.created_at)::date as premiere_vue_le
  from public.prospects_dossimo pd
  where regexp_replace(coalesce(pd.siren, ''), '\D', '', 'g') <> ''
  group by 1
)
insert into public.contacts (
  siren, place_id, denomination, nom, address, code_postal, city,
  telephone, emails, email_valide, website, rge_domaines, tranche_effectif,
  score, source, premiere_vue_le, derniere_vue_le, created_at
)
select
  c.siren_net,
  c.place_id,
  nullif(trim(c.denomination), ''),
  nullif(trim(c.name), ''),
  nullif(trim(c.address), ''),
  nullif(trim(c.code_postal), ''),
  nullif(trim(c.city), ''),
  c.phone,                                   -- normalisé par le trigger de la 0057
  coalesce(m.emails, '{}'::text[]),
  f.email_valide,
  nullif(trim(c.website), ''),
  coalesce(g.rge_domaines, '{}'::text[]),
  nullif(trim(c.tranche_effectif), ''),
  f.score,
  case
    when lower(coalesce(trim(c.source), '')) in ('', 'ademe') then
      'votre entreprise figure dans l''annuaire public des professionnels RGE (ADEME / France Rénov'')'
    else trim(c.source)
  end,
  f.premiere_vue_le,
  f.premiere_vue_le,
  c.created_at
from classe c
left join agg_mails m on m.siren_net = c.siren_net
left join agg_domaines g on g.siren_net = c.siren_net
join agg_flags f on f.siren_net = c.siren_net
where c.rang = 1
on conflict (siren) do nothing;

-- ---------------------------------------------------------------------------
-- 2) `contact_echanges` — l'historique, reconstruit
--
-- Le rattachement se fait par SIREN et non par `place_id` : les deux fiches d'un
-- SIREN dupliqué doivent aboutir au même contact, alors que `contacts.place_id`
-- n'en porte qu'une seule.
--
-- Heure : on ne connaît que le JOUR. On pose midi, heure de Paris, pour que la
-- date reste la bonne quel que soit le fuseau d'affichage. Minuit aurait basculé
-- à la veille dès qu'on lit en UTC-1 ou plus à l'ouest.
-- ---------------------------------------------------------------------------

-- 2a) Sprint manuel : premier contact, relance, nurturing. Déclaratif, saisi par
-- un humain, d'où `automatique = false`.
insert into public.contact_echanges (
  contact_id, canal, sens, nature, survenu_le, automatique, commentaire
)
select
  ct.id,
  -- `canal` vaut 'email' pour les 9 lignes concernées ; le coalesce couvre le cas
  -- d'un marquage sans canal, et 'telephone' est déjà une valeur légale (0052).
  case when pd.canal in ('email', 'whatsapp', 'telephone') then pd.canal else 'email' end,
  'sortant',
  v.nature,
  (v.jour + time '12:00') at time zone 'Europe/Paris',
  false,
  'Reprise 0058 depuis prospects_dossimo.' || v.colonne
from public.prospects_dossimo pd
join public.contacts ct
  on ct.siren = regexp_replace(coalesce(pd.siren, ''), '\D', '', 'g')
cross join lateral (
  values
    (pd.date_envoi, 'premier'::text, 'date_envoi'::text),
    (pd.date_relance, 'relance'::text, 'date_relance'::text),
    (pd.date_nurturing, 'nurturing'::text, 'date_nurturing'::text)
) as v(jour, nature, colonne)
where v.jour is not null
  and not exists (
    select 1 from public.contact_echanges e
    where e.contact_id = ct.id
      and e.nature = v.nature
      and e.automatique = false
      and e.survenu_le = (v.jour + time '12:00') at time zone 'Europe/Paris'
  );

-- 2b) Campagne automatique (0032). La source de vérité reste
-- `prospection_messages` ; `contact_auto_le` en est le reflet posé par la 0050.
-- On part de `contact_auto_le` parce qu'il couvre les 220 contacts (215 messages
-- partis + 5 échecs sans message), là où `prospection_messages` n'en connaît que
-- 215. Le `message_id` est rattaché quand il existe, via le `place_id` que
-- l'import avait laissé dans `prospects.notes`.
insert into public.contact_echanges (
  contact_id, canal, sens, nature, survenu_le, automatique, issue,
  campagne_id, message_id, commentaire
)
select
  ct.id,
  'email',
  'sortant',
  'premier',
  (pd.contact_auto_le + time '12:00') at time zone 'Europe/Paris',
  true,
  case when pd.contact_auto_statut = 'echec' then 'echec_technique' end,
  m.campagne_id,
  m.id,
  'Reprise 0058 depuis prospects_dossimo.contact_auto_le (campagne automatique 0032).'
from public.prospects_dossimo pd
join public.contacts ct
  on ct.siren = regexp_replace(coalesce(pd.siren, ''), '\D', '', 'g')
left join lateral (
  select msg.id, msg.campagne_id
  from public.prospection_messages msg
  join public.prospects p on p.id = msg.prospect_id
  where msg.statut = 'envoye'
    and substring(p.notes from 'place_id=(\S+)') = pd.place_id
  order by msg.sent_at desc nulls last
  limit 1
) m on true
where pd.contact_auto_le is not null
  and not exists (
    select 1 from public.contact_echanges e
    where e.contact_id = ct.id
      and e.automatique = true
      and e.nature = 'premier'
  );

-- 2c) Signaux du journal de la 0032 : ouvertures (pixel, migration 0047) et
-- clics. Zéro ligne au 2026-08-02, mais le pixel est en place et peut en produire
-- entre l'écriture de cette migration et son application : on ne les laisse pas
-- au bord de la route.
insert into public.contact_echanges (
  contact_id, canal, sens, nature, survenu_le, automatique, payload, commentaire
)
select
  ct.id,
  'email',
  'entrant',
  ev.type,
  ev.created_at,
  true,
  ev.payload,
  'Reprise 0058 depuis prospection_evenements.'
from public.prospection_evenements ev
join public.prospects p on p.id = ev.prospect_id
join public.contacts ct
  on ct.place_id = substring(p.notes from 'place_id=(\S+)')
where ev.type in ('ouverture', 'clic', 'reponse', 'bounce')
  and not exists (
    select 1 from public.contact_echanges e
    where e.contact_id = ct.id
      and e.nature = ev.type
      and e.survenu_le = ev.created_at
  );

-- ---------------------------------------------------------------------------
-- 3) `oppositions` — les refus, dans leur forme durable
-- ---------------------------------------------------------------------------
insert into public.oppositions (type, valeur, motif, created_at)
select 'email', lower(trim(s.email)), s.motif, s.created_at
from public.prospection_suppressions s
where position('@' in coalesce(s.email, '')) > 1
on conflict (type, valeur) do nothing;

-- `opt_out` était le drapeau NON durable de `prospects_dossimo` (0033) : il
-- disparaissait à tout réimport. On lui donne enfin une trace qui survit, sur le
-- SIREN, qui est stable là où l'adresse peut changer.
insert into public.oppositions (type, valeur, motif, created_at)
select
  'siren',
  regexp_replace(coalesce(pd.siren, ''), '\D', '', 'g'),
  'opt-out repris de prospects_dossimo.opt_out (migration 0058)',
  now()
from public.prospects_dossimo pd
where pd.opt_out is true
  and regexp_replace(coalesce(pd.siren, ''), '\D', '', 'g') <> ''
on conflict (type, valeur) do nothing;

-- ---------------------------------------------------------------------------
-- 4) États commerciaux
-- Les triggers de la 0057 les tiennent à jour à chaque écriture, mais les
-- insertions ci-dessus sont arrivées dans un ordre qui n'a pas vu les
-- oppositions. On recalcule tout une fois, à la fin.
-- ---------------------------------------------------------------------------
select public.contacts_rafraichir_etats();

-- ---------------------------------------------------------------------------
-- 5) Contrôles de cohérence
-- Une migration de reprise qui perd des lignes en silence est pire que pas de
-- reprise du tout : on croirait l'historique complet. Chaque compte est comparé
-- à sa source, jamais à une constante, pour que la migration passe aussi sur un
-- environnement vide.
-- ---------------------------------------------------------------------------
do $$
declare
  v_attendu bigint;
  v_obtenu bigint;
begin
  -- 5a) Un contact par SIREN distinct du fichier.
  select count(distinct regexp_replace(coalesce(siren, ''), '\D', '', 'g'))
    into v_attendu
    from public.prospects_dossimo
   where regexp_replace(coalesce(siren, ''), '\D', '', 'g') <> '';
  select count(*) into v_obtenu from public.contacts;
  if v_obtenu < v_attendu then
    raise exception 'Reprise incomplète : % SIREN distincts dans prospects_dossimo, % contacts.',
      v_attendu, v_obtenu;
  end if;

  -- 5b) Tous les envois manuels sont repris.
  select count(*) into v_attendu
    from public.prospects_dossimo where date_envoi is not null;
  select count(*) into v_obtenu
    from public.contact_echanges
   where automatique = false and nature = 'premier' and sens = 'sortant';
  if v_obtenu <> v_attendu then
    raise exception 'Envois manuels : % attendus, % repris.', v_attendu, v_obtenu;
  end if;

  -- 5c) Tous les envois automatiques sont repris, échecs compris.
  select count(*) into v_attendu
    from public.prospects_dossimo where contact_auto_le is not null;
  select count(*) into v_obtenu
    from public.contact_echanges where automatique = true and nature = 'premier';
  if v_obtenu <> v_attendu then
    raise exception 'Envois automatiques : % attendus, % repris.', v_attendu, v_obtenu;
  end if;

  -- 5d) Aucun contact démarché n'est resté « jamais contacté ».
  select count(*) into v_obtenu
    from public.contacts c
   where c.etat = 'jamais_contacte'
     and exists (
       select 1 from public.contact_echanges e
       where e.contact_id = c.id and e.sens = 'sortant'
     );
  if v_obtenu > 0 then
    raise exception 'Incohérence d''état : % contacts démarchés portent encore « jamais_contacte ».', v_obtenu;
  end if;

  -- 5e) Aucun opposé n'a échappé au recalcul.
  select count(*) into v_obtenu
    from public.contacts c
   where c.etat <> 'refus'
     and exists (
       select 1 from public.oppositions o
       where (o.type = 'siren' and o.valeur = c.siren)
          or (o.type = 'telephone' and o.valeur = c.telephone)
          or (o.type = 'email' and o.valeur = any(c.emails))
     );
  if v_obtenu > 0 then
    raise exception 'Incohérence RGPD : % contacts opposés ne portent pas l''état « refus ».', v_obtenu;
  end if;

  raise notice 'Reprise 0058 : % contacts, % échanges, % oppositions.',
    (select count(*) from public.contacts),
    (select count(*) from public.contact_echanges),
    (select count(*) from public.oppositions);
end $$;
