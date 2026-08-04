-- 0057 — Refonte de la prospection : mise au carré du schéma.
--
-- POURQUOI CETTE MIGRATION EXISTE, ET POURQUOI ELLE EST IDEMPOTENTE
-- Les tables `contacts`, `contact_echanges`, `oppositions` et les vues
-- `contacts_synthese` / `stats_canal` ont été créées À LA MAIN dans l'éditeur SQL
-- Supabase le 2026-08-02, hors migrations. C'est exactement l'accident que
-- l'AGENTS.md interdit en règle n°1 et qui a déjà détruit 0024 et 0025 : la
-- production a changé, l'historique versionné l'ignore, et `supabase migration
-- list` affichait encore 0056 comme dernière migration alors que cinq objets
-- vivaient déjà en base.
--
-- On applique donc le même remède que la 0039 pour `prospects_dossimo` : décrire
-- l'état FINAL voulu, de façon rejouable dans les deux sens.
--   - production : `if not exists` / `create or replace` ne recréent rien, et la
--     migration ne fait qu'AJOUTER ce que la saisie à la main avait laissé de
--     côté (RLS de ceinture, triggers, index nommés, rge_import, rge_rapprocher) ;
--   - environnement neuf (`db reset`, CI) : tout est créé de zéro.
-- À partir d'ici, ces objets sont normaux : toute évolution passe par une
-- migration, jamais par l'éditeur SQL.
--
-- CE QUE LA REFONTE REMPLACE
-- `prospects_dossimo` (3 298 lignes, clé `place_id`) et `prospects` (2 991
-- lignes, clé e-mail) décrivaient les mêmes 2 990 artisans, et l'historique de
-- contact tenait dans onze colonnes plates (`date_envoi`, `date_relance`,
-- `date_nurturing`, `contact_auto_le`, `reponse`…). Conséquences : le téléphone
-- n'avait nulle part où s'écrire, deux appels au même artisan étaient
-- irreprésentables, et une réponse ne portait ni date ni canal, ce qui rendait
-- la question « qui répond par quel canal » structurellement sans réponse.
--   - `contacts`         : QUI, une ligne par entreprise, clé métier = SIREN ;
--   - `contact_echanges` : QUOI, une ligne par échange, dans les deux sens ;
--   - `oppositions`      : le refus durable, généralisé à tous les canaux.
--
-- Les anciennes tables ne sont PAS supprimées ici. La campagne automatique de la
-- 0032 tourne encore (45 messages en file) et l'AGENTS.md interdit un `drop` sans
-- plan. Leur retrait fera l'objet d'une migration dédiée une fois le code basculé.
--
-- PAS D'A/B DANS CE MODÈLE
-- Le sprint bicanal des 0033/0039 assignait 302 contacts à deux bras tirés au
-- sort (151 e-mail, 151 WhatsApp). Il n'a jamais tourné : 9 envois réels, 0
-- réponse, et le compte WhatsApp est depuis bloqué. Le bras A/B disparaît donc du
-- modèle. WhatsApp reste un CANAL d'échange à part entière (l'historique et un
-- éventuel déblocage doivent pouvoir s'écrire), mais plus une population.
-- `prospects_dossimo.canal` reste lisible tant que la table existe : rien n'est
-- perdu, seulement plus porté par le nouveau schéma.

-- ---------------------------------------------------------------------------
-- 1) Normalisation, en base et une seule fois
-- Le téléphone arrive du fichier ADEME sous cinq formes ('01 23 45 67 89',
-- '+33123456789', '0033…'). Le normaliser à la lecture, c'était le refaire à
-- chaque requête et laisser deux écritures diverger. On le fait à l'écriture.
-- ---------------------------------------------------------------------------
create or replace function public.tel_fr_normalise(p_tel text)
returns text
language sql
immutable
as $$
  select case when d ~ '^0[1-9][0-9]{8}$' then d else null end
  from (
    select case
      when chiffres ~ '^0033[1-9][0-9]{8}$' then '0' || substr(chiffres, 5)
      when chiffres ~ '^33[1-9][0-9]{8}$'   then '0' || substr(chiffres, 3)
      else chiffres
    end as d
    from (select regexp_replace(coalesce(p_tel, ''), '\D', '', 'g') as chiffres) c
  ) t;
$$;

comment on function public.tel_fr_normalise(text) is
  'Numéro français en 10 chiffres, ou NULL si inexploitable. Appliqué par trigger '
  'à l''écriture sur contacts.telephone : la colonne ne contient jamais autre chose.';

-- ---------------------------------------------------------------------------
-- 2) `contacts` — qui
-- Clé métier : le SIREN, pas `place_id`. C'est la seule clé partagée avec
-- l'annuaire RGE, donc la seule qui permette de rapprocher un import et de
-- répondre à « y a-t-il des nouveaux ». Les données le supportent : 3 298 SIREN
-- renseignés, 5 doublons seulement.
-- ---------------------------------------------------------------------------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  siren text not null unique,
  -- Ancienne clé de `prospects_dossimo`, conservée pour la traçabilité du
  -- backfill et le rattachement des messages déjà partis. Jamais une clé ici.
  place_id text unique,

  denomination text,
  nom text,
  address text,
  code_postal text,
  city text,
  telephone text,
  -- Dérivée du téléphone par trigger : 06/07 = joignable WhatsApp/SMS. Stockée
  -- plutôt que recalculée pour être indexable et filtrable côté PostgREST.
  telephone_mobile boolean,
  emails text[],
  email_principal text,
  email_valide boolean,
  website text,
  rge_domaines text[],
  tranche_effectif text,
  score numeric,
  -- RGPD art. 14 : d'où vient ce contact. Repris tel quel en pied de message,
  -- donc une phrase lisible, pas un code. NOT NULL, contrairement à
  -- `prospects_dossimo.source` que la 0039 avait dû laisser nullable.
  source text not null,

  -- Cycle de vie dans l'annuaire RGE, alimenté par `rge_rapprocher`.
  premiere_vue_le date not null,
  derniere_vue_le date not null,
  sorti_du_rge_le date,

  -- État commercial. Écrit UNIQUEMENT par le trigger depuis les échanges :
  -- aucune saisie directe, sinon deux sources pour un même fait.
  etat text not null default 'jamais_contacte',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- `etat` : la liste posée à la main comportait 'a_relancer', qui est une
-- fonction du TEMPS ÉCOULÉ, pas un fait. Un trigger ne peut pas la maintenir :
-- la valeur serait juste le jour de l'écriture puis périmée en silence. Elle est
-- donc calculée à la lecture dans `contacts_synthese`, et retirée d'ici. Le
-- resserrement est sans risque : la table est vide à cet instant (le backfill
-- est en 0058), et une CHECK ne se modifie pas autrement en Postgres (même
-- procédé que la 0052, qui l'élargissait).
alter table public.contacts drop constraint if exists contacts_etat_check;
alter table public.contacts add constraint contacts_etat_check
  check (etat in ('jamais_contacte', 'contacte', 'en_discussion', 'client', 'refus', 'injoignable'));

comment on column public.contacts.etat is
  'Fait observé, dérivé des échanges par trigger, jamais saisi. '
  '« a_relancer » n''est PAS un état : c''est une colonne calculée de contacts_synthese, '
  'parce qu''elle dépend du temps écoulé et qu''une valeur stockée serait périmée le lendemain.';
comment on column public.contacts.siren is
  'Clé de rapprochement avec l''annuaire RGE (rge_import / rge_rapprocher). Chiffres seuls.';

create index if not exists contacts_etat_idx on public.contacts (etat);
create index if not exists contacts_premiere_vue_idx on public.contacts (premiere_vue_le desc);
create index if not exists contacts_derniere_vue_idx on public.contacts (derniere_vue_le);
create index if not exists contacts_code_postal_idx on public.contacts (code_postal);

-- ---------------------------------------------------------------------------
-- 3) `contact_echanges` — quoi, une ligne par échange
-- Le cœur de la refonte. Un appel est une ligne, trois appels sont trois lignes,
-- et une réponse WhatsApp à un e-mail est une ligne entrante de canal 'whatsapp'
-- rattachée au même contact. C'est ce croisement, impossible dans l'ancien
-- modèle, qui rend « lesquels répondent par quel canal » calculable.
-- ---------------------------------------------------------------------------
create table if not exists public.contact_echanges (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,

  canal text not null check (canal in ('email', 'whatsapp', 'telephone', 'sms', 'courrier')),
  sens text not null check (sens in ('sortant', 'entrant')),
  nature text not null check (nature in (
    'premier', 'relance', 'nurturing', 'appel',        -- sortant
    'ouverture', 'clic', 'reponse', 'stop', 'bounce',  -- entrant ou signal
    'rdv', 'note'
  )),
  issue text,

  survenu_le timestamptz not null default now(),
  -- Distingue le déclaratif (un humain déclare avoir envoyé) du factuel (la
  -- machine a envoyé). La 0050 avait dû créer deux colonnes pour cette seule
  -- raison ; ici c'est un booléen sur la ligne.
  automatique boolean not null default false,
  campagne_id uuid references public.prospection_campagnes(id) on delete set null,
  message_id uuid references public.prospection_messages(id) on delete set null,
  commentaire text,
  payload jsonb not null default '{}'::jsonb
);

-- `issue` : 'echec_technique' manquait à la liste posée à la main. La 0050
-- explique pourquoi il compte : un envoi en échec APRÈS réservation a pu partir
-- quand même, donc il vaut contact et ne se rejoue jamais. Sans cette valeur, le
-- backfill des 5 échecs n'avait nulle part où le dire. Élargissement, donc
-- aucune ligne existante ne peut le violer.
alter table public.contact_echanges drop constraint if exists contact_echanges_issue_check;
alter table public.contact_echanges add constraint contact_echanges_issue_check
  check (issue is null or issue in (
    'sans_reponse', 'repondeur', 'faux_numero', 'mauvaise_adresse',
    'interesse', 'refus', 'client', 'echec_technique'
  ));

-- Noms repris de la génération automatique de Postgres (`create index on …`
-- sans nom, tel que joué à la main) : `if not exists` en fait donc un no-op en
-- production, et une vraie création sur un environnement neuf.
create index if not exists contact_echanges_contact_id_survenu_le_idx
  on public.contact_echanges (contact_id, survenu_le desc);
create index if not exists contact_echanges_canal_sens_survenu_le_idx
  on public.contact_echanges (canal, sens, survenu_le desc);

comment on table public.contact_echanges is
  'Journal des échanges, dans les deux sens. Remplace date_envoi / date_relance / '
  'date_nurturing / contact_auto_le / reponse de prospects_dossimo.';
comment on column public.contact_echanges.issue is
  'echec_technique : l''envoi a échoué après réservation. Vaut contact (le message '
  'a pu partir), jamais un contact à refaire. Voir migration 0050.';

-- ---------------------------------------------------------------------------
-- 4) `oppositions` — le refus durable, tous canaux
-- `prospection_suppressions` est clé sur l'e-mail seul. Un STOP dit au téléphone
-- ou sur WhatsApp par un contact dont l'adresse est inconnue ne laissait donc
-- aucune trace opposable, et le prochain import le re-sollicitait. Ne se purge
-- jamais, comme son aînée.
-- ---------------------------------------------------------------------------
create table if not exists public.oppositions (
  type text not null check (type in ('email', 'telephone', 'siren')),
  valeur text not null,
  motif text not null,
  created_at timestamptz not null default now(),
  primary key (type, valeur)
);

comment on table public.oppositions is
  'Preuve durable de l''opposition, exigible en cas de contrôle. Ne se purge JAMAIS, '
  'y compris si le contact est supprimé puis réimporté. Généralise '
  'prospection_suppressions (e-mail seul) au téléphone et au SIREN.';

-- ---------------------------------------------------------------------------
-- 5) Triggers — la cohérence tenue par la base, pas par les appelants
-- ---------------------------------------------------------------------------

-- 5a) Normalisation à l'écriture. `prospects_dossimo.updated_at` n'a jamais été
-- mis à jour depuis l'import du 2026-07-08, y compris sur les 229 lignes
-- contactées : il n'y avait pas de trigger. On ne refait pas l'erreur.
create or replace function public.contacts_normaliser()
returns trigger
language plpgsql
as $$
begin
  new.siren := nullif(regexp_replace(coalesce(new.siren, ''), '\D', '', 'g'), '');
  new.telephone := public.tel_fr_normalise(new.telephone);
  new.telephone_mobile := new.telephone is not null and new.telephone ~ '^0[67]';

  -- Adresses en minuscules, dédoublonnées, sans entrée non plausible : c'est ce
  -- qui rend le rapprochement avec `oppositions` fiable (comparaison directe).
  if new.emails is not null then
    new.emails := (
      select coalesce(array_agg(distinct lower(trim(e)) order by lower(trim(e))), '{}'::text[])
      from unnest(new.emails) e
      where e is not null and position('@' in e) > 1
    );
  end if;

  if new.email_principal is null
     or new.emails is null
     or not (lower(trim(new.email_principal)) = any(new.emails)) then
    new.email_principal := (new.emails)[1];
  else
    new.email_principal := lower(trim(new.email_principal));
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists contacts_normaliser_trg on public.contacts;
create trigger contacts_normaliser_trg
  before insert or update on public.contacts
  for each row execute function public.contacts_normaliser();

-- 5b) L'état commercial, calculé depuis les faits.
create or replace function public.contacts_etat_calcule(p_contact_id uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with c as (
    select * from public.contacts where id = p_contact_id
  ),
  e as (
    select * from public.contact_echanges where contact_id = p_contact_id
  )
  select case
    -- Le refus prime sur tout le reste, y compris sur un échange plus récent.
    when exists (
      select 1 from public.oppositions o, c
      where (o.type = 'siren' and o.valeur = c.siren)
         or (o.type = 'telephone' and o.valeur = c.telephone)
         or (o.type = 'email' and o.valeur = any(c.emails))
    ) then 'refus'
    when exists (select 1 from e where nature = 'stop') then 'refus'
    when exists (select 1 from e where issue = 'client') then 'client'
    when exists (select 1 from e where sens = 'entrant' and nature = 'reponse')
      or exists (select 1 from e where issue = 'interesse') then 'en_discussion'
    when not exists (select 1 from e where sens = 'sortant') then 'jamais_contacte'
    -- Toutes les tentatives sortantes ont buté sur une coordonnée morte.
    when not exists (
      select 1 from e
      where sens = 'sortant'
        and coalesce(issue, '') not in ('faux_numero', 'mauvaise_adresse')
    ) then 'injoignable'
    else 'contacte'
  end;
$$;

create or replace function public.contacts_maj_etat()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid := coalesce(new.contact_id, old.contact_id);
begin
  update public.contacts c
     set etat = public.contacts_etat_calcule(v_id)
   where c.id = v_id
     -- Sans ce garde, chaque échange bousculerait `updated_at` sans rien changer.
     and c.etat is distinct from public.contacts_etat_calcule(v_id);
  return null;
end;
$$;

drop trigger if exists contact_echanges_maj_etat_trg on public.contact_echanges;
create trigger contact_echanges_maj_etat_trg
  after insert or update or delete on public.contact_echanges
  for each row execute function public.contacts_maj_etat();

-- Une opposition ne porte pas de `contact_id` (elle survit au contact) : on
-- rattrape les contacts concernés par leurs coordonnées.
create or replace function public.oppositions_maj_etat()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.contacts c
     set etat = public.contacts_etat_calcule(c.id)
   where (new.type = 'siren' and c.siren = new.valeur)
      or (new.type = 'telephone' and c.telephone = new.valeur)
      or (new.type = 'email' and new.valeur = any(c.emails));
  return null;
end;
$$;

drop trigger if exists oppositions_maj_etat_trg on public.oppositions;
create trigger oppositions_maj_etat_trg
  after insert on public.oppositions
  for each row execute function public.oppositions_maj_etat();

-- Recalcul de masse, utilisé par le backfill 0058 et disponible en rattrapage.
create or replace function public.contacts_rafraichir_etats()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_n integer;
begin
  with maj as (
    update public.contacts c
       set etat = public.contacts_etat_calcule(c.id)
     where c.etat is distinct from public.contacts_etat_calcule(c.id)
    returning 1
  )
  select count(*) into v_n from maj;
  return v_n;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6) Vues de lecture
-- `create or replace` impose de conserver les colonnes existantes, dans le même
-- ordre et du même type : celles posées à la main sont reprises à l'identique,
-- les nouvelles sont ajoutées À LA FIN.
-- ---------------------------------------------------------------------------

-- Une ligne par contact : ce qu'une liste d'écran a besoin de savoir.
create or replace view public.contacts_synthese as
select
  c.*,
  max(e.survenu_le) filter (where e.sens = 'sortant') as dernier_contact_le,
  count(*) filter (where e.sens = 'sortant') as nb_sollicitations,
  array_agg(distinct e.canal) filter (where e.sens = 'sortant') as canaux_utilises,
  max(e.survenu_le) filter (where e.sens = 'entrant' and e.nature = 'reponse') as repondu_le,
  (array_agg(e.canal order by e.survenu_le desc)
     filter (where e.sens = 'entrant' and e.nature = 'reponse'))[1] as canal_de_reponse,
  c.telephone_mobile as joignable_whatsapp,
  c.email_valide as joignable_email,
  -- ---- colonnes ajoutées par la 0057 ----
  -- Le canal du DERNIER contact sortant : c'est lui qu'on ne veut pas répéter.
  (array_agg(e.canal order by e.survenu_le desc) filter (where e.sens = 'sortant'))[1]
    as dernier_canal,
  count(*) filter (where e.sens = 'entrant' and e.nature = 'reponse') as nb_reponses,
  count(*) filter (where e.canal = 'telephone' and e.sens = 'sortant') as nb_appels,
  -- Calculé, jamais stocké : dépend du jour où on regarde (cf. commentaire
  -- sur contacts.etat).
  (
    c.etat = 'contacte'
    and max(e.survenu_le) filter (where e.sens = 'sortant')
        < now() - interval '5 days'
  ) as a_relancer,
  (
    extract(day from now() - max(e.survenu_le) filter (where e.sens = 'sortant'))
  )::integer as jours_depuis_contact
from public.contacts c
left join public.contact_echanges e on e.contact_id = c.id
group by c.id;

comment on view public.contacts_synthese is
  'Une ligne par contact, avec son historique agrégé. a_relancer et '
  'jours_depuis_contact sont calculés à la lecture : ils dépendent du jour.';

-- Performance par canal : la réponse à « lequel marche ».
create or replace view public.stats_canal as
select
  canal,
  count(distinct contact_id) filter (where sens = 'sortant') as touches,
  count(distinct contact_id) filter (where sens = 'entrant' and nature = 'reponse') as repondeurs,
  count(distinct contact_id) filter (where sens = 'entrant' and nature = 'stop') as stops,
  -- ---- colonnes ajoutées par la 0057 ----
  count(*) filter (where sens = 'sortant' and nature = 'premier') as premiers,
  count(*) filter (where sens = 'sortant' and nature = 'relance') as relances,
  count(distinct contact_id) filter (where sens = 'entrant' and nature = 'ouverture') as ouvreurs,
  -- NULL tant qu'aucun envoi : jamais un « 0 % » affiché sur une division par zéro.
  case
    when count(distinct contact_id) filter (where sens = 'sortant') = 0 then null
    else round(
      count(distinct contact_id) filter (where sens = 'entrant' and nature = 'reponse')::numeric
      / count(distinct contact_id) filter (where sens = 'sortant'), 4)
  end as taux_reponse
from public.contact_echanges
group by canal;

comment on view public.stats_canal is
  'Taux de réponse par canal. taux_reponse est NULL tant qu''il n''y a aucun envoi : '
  'on ne montre pas un pourcentage calculé sur rien.';

-- ---------------------------------------------------------------------------
-- 7) Rapprochement avec l'annuaire RGE
-- Table de préparation vidée puis remplie à chaque extraction, plus une fonction
-- qui rapproche sur le SIREN. C'est ce qui donne « y a-t-il des nouveaux » :
-- un nouveau est un SIREN absent de `contacts`, et sa date de première vue est
-- posée une fois pour toutes.
-- ---------------------------------------------------------------------------
create table if not exists public.rge_import (
  siren text primary key,
  denomination text,
  nom text,
  address text,
  code_postal text,
  city text,
  telephone text,
  emails text[],
  website text,
  rge_domaines text[],
  tranche_effectif text,
  source text,
  importe_le timestamptz not null default now()
);

comment on table public.rge_import is
  'Table de PRÉPARATION, vidée à chaque extraction de l''annuaire RGE. '
  'Ne jamais y lire un état : la vérité est dans `contacts` après rge_rapprocher().';

create or replace function public.rge_rapprocher(p_jour date default null)
returns table (nouveaux integer, revus integer, disparus integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_jour date := coalesce(p_jour, (now() at time zone 'Europe/Paris')::date);
  v_source_defaut constant text :=
    'votre entreprise figure dans l''annuaire public des professionnels RGE (ADEME / France Rénov'')';
  v_nouveaux integer;
  v_revus integer;
  v_disparus integer;
begin
  -- Un import vide marquerait les 3 293 contacts « sortis du RGE » d'un coup.
  -- On refuse bruyamment plutôt que de produire ce carnage en silence.
  if not exists (select 1 from public.rge_import) then
    raise exception 'rge_import est vide : rien à rapprocher. Chargez l''extraction avant d''appeler rge_rapprocher().';
  end if;

  -- 1) Déjà connus : on tamponne la dernière vue et on rafraîchit les
  -- coordonnées, sans jamais écraser une valeur connue par un NULL de l'import.
  with maj as (
    update public.contacts c
       set derniere_vue_le = v_jour,
           sorti_du_rge_le = null,
           denomination = coalesce(nullif(trim(i.denomination), ''), c.denomination),
           nom = coalesce(nullif(trim(i.nom), ''), c.nom),
           address = coalesce(nullif(trim(i.address), ''), c.address),
           code_postal = coalesce(nullif(trim(i.code_postal), ''), c.code_postal),
           city = coalesce(nullif(trim(i.city), ''), c.city),
           telephone = coalesce(public.tel_fr_normalise(i.telephone), c.telephone),
           website = coalesce(nullif(trim(i.website), ''), c.website),
           tranche_effectif = coalesce(nullif(trim(i.tranche_effectif), ''), c.tranche_effectif),
           -- Les domaines RGE, eux, sont REMPLACÉS : une qualification perdue est
           -- une information, la conserver ferait croire à un RGE encore valide.
           rge_domaines = coalesce(i.rge_domaines, c.rge_domaines),
           emails = (
             select coalesce(array_agg(distinct lower(trim(e))), '{}')
             from unnest(coalesce(c.emails, '{}') || coalesce(i.emails, '{}')) e
             where e is not null and position('@' in e) > 1
           )
      from public.rge_import i
     where c.siren = regexp_replace(coalesce(i.siren, ''), '\D', '', 'g')
    returning 1
  )
  select count(*) into v_revus from maj;

  -- 2) Nouveaux : première vue posée aujourd'hui, c'est elle qui fera « les
  -- nouveaux du mois ».
  with ins as (
    insert into public.contacts (
      siren, denomination, nom, address, code_postal, city, telephone,
      emails, website, rge_domaines, tranche_effectif, source,
      premiere_vue_le, derniere_vue_le
    )
    select
      regexp_replace(coalesce(i.siren, ''), '\D', '', 'g'),
      nullif(trim(i.denomination), ''),
      nullif(trim(i.nom), ''),
      nullif(trim(i.address), ''),
      nullif(trim(i.code_postal), ''),
      nullif(trim(i.city), ''),
      i.telephone,
      i.emails,
      nullif(trim(i.website), ''),
      i.rge_domaines,
      nullif(trim(i.tranche_effectif), ''),
      coalesce(nullif(trim(i.source), ''), v_source_defaut),
      v_jour,
      v_jour
    from public.rge_import i
    where regexp_replace(coalesce(i.siren, ''), '\D', '', 'g') <> ''
      and not exists (
        select 1 from public.contacts c
        where c.siren = regexp_replace(coalesce(i.siren, ''), '\D', '', 'g')
      )
    on conflict (siren) do nothing
    returning 1
  )
  select count(*) into v_nouveaux from ins;

  -- 3) Disparus : présents avant, absents de cette extraction. On les marque, on
  -- ne les supprime pas : un artisan radié reste un contact qu'on a démarché.
  with dis as (
    update public.contacts c
       set sorti_du_rge_le = v_jour
     where c.sorti_du_rge_le is null
       and c.derniere_vue_le < v_jour
       and not exists (
         select 1 from public.rge_import i
         where regexp_replace(coalesce(i.siren, ''), '\D', '', 'g') = c.siren
       )
    returning 1
  )
  select count(*) into v_disparus from dis;

  return query select v_nouveaux, v_revus, v_disparus;
end;
$$;

comment on function public.rge_rapprocher(date) is
  'Rapproche rge_import et contacts sur le SIREN : insère les nouveaux (premiere_vue_le '
  '= aujourd''hui), tamponne les revus, marque sorti_du_rge_le les absents. '
  'Lève si rge_import est vide. « Les nouveaux du mois » = premiere_vue_le >= début du mois.';

-- ---------------------------------------------------------------------------
-- 8) Fermeture
-- Données personnelles de 3 300 artisans : pilotage EXCLUSIVEMENT en
-- service-role, comme les tables des 0032 et 0039.
--
-- La RLS était déjà active sur les trois tables créées à la main (vérifié le
-- 2026-08-02 : une écriture avec la clé anon renvoie « violates row-level
-- security policy »). Le `revoke` de ceinture, lui, MANQUAIT : Supabase accorde
-- `grant all` par défaut à anon/authenticated sur `public`, et la clé anon
-- obtenait bien un 200 sur `contacts` là où `prospects_dossimo` renvoyait 401.
-- Tables vides, donc rien n'a fuité ; une fois les 3 293 contacts chargés par la
-- 0058, une RLS désactivée par erreur aurait suffi. C'est précisément le trou que
-- la 0039 avait bouché sur sa propre table, et la règle « un correctif s'applique
-- partout, pas à une seule table » de l'AGENTS.md.
-- ---------------------------------------------------------------------------
alter table public.contacts enable row level security;
alter table public.contact_echanges enable row level security;
alter table public.oppositions enable row level security;
alter table public.rge_import enable row level security;

revoke all on public.contacts from anon, authenticated;
revoke all on public.contact_echanges from anon, authenticated;
revoke all on public.oppositions from anon, authenticated;
revoke all on public.rge_import from anon, authenticated;

-- Les vues sont le vrai danger ici. Par défaut une vue s'exécute avec les droits
-- de son PROPRIÉTAIRE (postgres) et contourne donc la RLS des tables qu'elle
-- lit : `contacts_synthese` aurait rendu lisible par la clé anon exactement ce
-- que la RLS de `contacts` protège. Deux verrous, pas un.
alter view public.contacts_synthese set (security_invoker = on);
alter view public.stats_canal set (security_invoker = on);

revoke all on public.contacts_synthese from anon, authenticated;
revoke all on public.stats_canal from anon, authenticated;

revoke all on function public.contacts_etat_calcule(uuid) from anon, authenticated;
revoke all on function public.contacts_rafraichir_etats() from anon, authenticated;
revoke all on function public.rge_rapprocher(date) from anon, authenticated;
