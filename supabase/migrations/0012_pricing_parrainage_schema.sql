-- =============================================================================
-- Dossimo — Pricing 3 paliers + Parrainage artisan → artisan (SCHÉMA)
-- =============================================================================
-- Partie 1/2 : types, tables, seed des paliers, RLS, triggers de garde.
-- Les fonctions métier (RPC) vivent dans 0013_pricing_parrainage_functions.sql.
--
-- Règles d'or :
--   • Argent TOUJOURS en cents (integer). Jamais de float / numeric.
--   • Les seuils de paliers vivent EN BASE (pricing_tiers), jamais en dur.
--   • Le prix final est TOUJOURS recalculé côté serveur (fonctions SECURITY
--     DEFINER + trigger de garde), jamais accepté depuis le client.
-- =============================================================================

create extension if not exists pgcrypto;  -- gen_random_bytes pour les codes parrain

-- ---------------------------------------------------------------------------
-- Types énumérés
-- ---------------------------------------------------------------------------

-- Cycle de vie FACTURATION du dossier. Distinct de la colonne existante
-- `dossiers.statut` (statut_dossier) qui décrit le PARCOURS opérationnel
-- (nouveau → en_traitement → pret_depot → depose → livre). Ici on suit l'axe
-- argent : brouillon → tarifé → payé → déposé → (refusé) → prime versée.
do $$ begin
  create type dossier_billing_status as enum
    ('draft', 'priced', 'paid', 'deposited', 'refused', 'paid_out');
exception when duplicate_object then null; end $$;

do $$ begin
  create type referral_status as enum
    ('pending', 'rewarded', 'capped', 'self_blocked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type referral_credit_status as enum
    ('active', 'expired', 'consumed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Table: pricing_tiers  (seuils PILOTABLES, jamais en dur)
-- ---------------------------------------------------------------------------
-- Un palier matche quand :  aid >= aid_min_cents
--                       AND (aid_max_cents IS NULL OR aid <= aid_max_cents)
-- Bornes INCLUSIVES des deux côtés ; on découpe proprement en cents pour
-- coller au barème métier (< 1000 € / 1000–5000 € / > 5000 €).
-- ---------------------------------------------------------------------------
create table if not exists public.pricing_tiers (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  aid_min_cents  integer not null,
  aid_max_cents  integer,               -- NULL = sans plafond (∞)
  price_cents    integer not null check (price_cents >= 0),
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  constraint pricing_tiers_bornes_chk
    check (aid_max_cents is null or aid_max_cents >= aid_min_cents)
);

-- Seed des 3 paliers. Bornes en cents :
--   P1 Essentiel : 0 … 999,99 €   → 0 … 99 999
--   P2 Pivot     : 1000 … 5000 €  → 100 000 … 500 000
--   P3 Premium   : > 5000 €       → 500 001 … ∞
insert into public.pricing_tiers (name, aid_min_cents, aid_max_cents, price_cents)
select * from (values
  ('Essentiel',      0,      99999,  4900),
  ('Pivot',     100000,     500000, 14900),
  ('Premium',   500001,       null, 24900)
) as v(name, aid_min_cents, aid_max_cents, price_cents)
where not exists (select 1 from public.pricing_tiers);

-- ---------------------------------------------------------------------------
-- artisans : ajout code parrain + solde de crédits matérialisé
-- ---------------------------------------------------------------------------
alter table public.artisans
  add column if not exists referral_code        text,
  add column if not exists credit_balance_cents  integer not null default 0
    check (credit_balance_cents >= 0);

create unique index if not exists artisans_referral_code_idx
  on public.artisans (referral_code);

-- Génère un code court non ambigu (32 symboles, sans O/0/I/1).
create or replace function public.gen_referral_code(len int default 8)
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  b bytea := gen_random_bytes(len);
  i int;
begin
  for i in 0..len-1 loop
    code := code || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
  end loop;
  return code;
end $$;

-- Affecte un code unique à l'insertion s'il manque (retry anti-collision).
create or replace function public.set_referral_code()
returns trigger
language plpgsql
as $$
begin
  if new.referral_code is null then
    loop
      new.referral_code := public.gen_referral_code(8);
      exit when not exists (
        select 1 from public.artisans where referral_code = new.referral_code
      );
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists artisans_set_referral_code on public.artisans;
create trigger artisans_set_referral_code
  before insert on public.artisans
  for each row execute function public.set_referral_code();

-- Backfill des artisans déjà présents.
do $$
declare r record; c text;
begin
  for r in select id from public.artisans where referral_code is null loop
    loop
      c := public.gen_referral_code(8);
      exit when not exists (select 1 from public.artisans where referral_code = c);
    end loop;
    update public.artisans set referral_code = c where id = r.id;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- dossiers : colonnes pricing + facturation
-- ---------------------------------------------------------------------------
-- estimated_aid_cents  : aide ESTIMÉE à la simulation → détermine le palier.
-- tier_id / base_price : palier retenu + son prix de base.
-- discount_cents       : remise filleul (−30 € sur 1er dossier).
-- credit_applied_cents : crédits parrain consommés sur CE dossier.
-- final_price_cents    : base − discount − credit (borné à 0), recalc serveur.
-- price_locked_at      : prix FIGÉ au paiement ; plus aucune recompute ensuite.
-- price_warning        : prix > 12 % de l'aide estimée (signale, ne bloque pas).
alter table public.dossiers
  add column if not exists estimated_aid_cents  integer,
  add column if not exists tier_id              uuid references public.pricing_tiers (id),
  add column if not exists base_price_cents     integer,
  add column if not exists discount_cents       integer not null default 0 check (discount_cents >= 0),
  add column if not exists credit_applied_cents integer not null default 0 check (credit_applied_cents >= 0),
  add column if not exists final_price_cents    integer,
  add column if not exists status               dossier_billing_status not null default 'draft',
  add column if not exists price_locked_at      timestamptz,
  add column if not exists price_warning        boolean not null default false;

create index if not exists dossiers_status_idx on public.dossiers (status);

-- ---------------------------------------------------------------------------
-- Table: referrals  (une ligne = un parrainage)
-- ---------------------------------------------------------------------------
create table if not exists public.referrals (
  id                        uuid primary key default gen_random_uuid(),
  referrer_id               uuid not null references public.artisans (id) on delete cascade,
  referee_id                uuid not null references public.artisans (id) on delete cascade,
  code_used                 text not null,
  status                    referral_status not null default 'pending',
  referee_first_dossier_id  uuid references public.dossiers (id) on delete set null,
  rewarded_at               timestamptz,
  created_at                timestamptz not null default now(),
  constraint referrals_no_self_chk check (referrer_id <> referee_id)
);

-- Un filleul ne peut être parrainé qu'une seule fois.
create unique index if not exists referrals_referee_unique_idx
  on public.referrals (referee_id);
create index if not exists referrals_referrer_idx on public.referrals (referrer_id);
-- Comptage du cap trimestriel glissant : parrain × récompenses récentes.
create index if not exists referrals_reward_window_idx
  on public.referrals (referrer_id, rewarded_at) where status = 'rewarded';

-- ---------------------------------------------------------------------------
-- Table: referral_credits  (crédits parrain, cumulables, expirant à 12 mois)
-- ---------------------------------------------------------------------------
-- source_referral_id UNIQUE : un parrainage n'émet qu'UN crédit → idempotence
-- de la récompense garantie au niveau schéma.
create table if not exists public.referral_credits (
  id                  uuid primary key default gen_random_uuid(),
  artisan_id          uuid not null references public.artisans (id) on delete cascade,
  amount_cents        integer not null check (amount_cents > 0),
  source_referral_id  uuid unique references public.referrals (id) on delete set null,
  issued_at           timestamptz not null default now(),
  expires_at          timestamptz not null,
  consumed_cents      integer not null default 0 check (consumed_cents >= 0),
  status              referral_credit_status not null default 'active',
  constraint referral_credits_consumed_chk check (consumed_cents <= amount_cents)
);

create index if not exists referral_credits_artisan_idx
  on public.referral_credits (artisan_id);
-- Consommation FIFO par date d'expiration + sélection des crédits vivants.
create index if not exists referral_credits_fifo_idx
  on public.referral_credits (artisan_id, expires_at)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- Table: credit_applications  (ajout hors-brief, voir note ci-dessous)
-- ---------------------------------------------------------------------------
-- Grand-livre de consommation : quel crédit a payé quel dossier, de combien.
-- Nécessaire pour (a) une consommation FIFO ré-exécutable / idempotente,
-- (b) l'auditabilité, (c) pouvoir « rembourser » un crédit si un dossier est
-- retarifé avant paiement. À valider : je l'ajoute car sans lui,
-- apply_credits_to_dossier ne peut pas être rejouée sans double-compter.
create table if not exists public.credit_applications (
  id            uuid primary key default gen_random_uuid(),
  credit_id     uuid not null references public.referral_credits (id) on delete cascade,
  dossier_id    uuid not null references public.dossiers (id) on delete cascade,
  amount_cents  integer not null check (amount_cents > 0),
  created_at    timestamptz not null default now()
);

create index if not exists credit_applications_dossier_idx
  on public.credit_applications (dossier_id);
create index if not exists credit_applications_credit_idx
  on public.credit_applications (credit_id);

-- ---------------------------------------------------------------------------
-- Garde-fou : les colonnes d'argent du dossier ne sont écrites QUE par les
-- fonctions serveur. Un client authenticated passe par la policy "for all" des
-- dossiers ; ce trigger annule toute tentative de toucher aux champs pricing
-- hors d'une fonction (qui pose le GUC app.allow_pricing_write='on').
-- ---------------------------------------------------------------------------
create or replace function public.protect_dossier_pricing()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('app.allow_pricing_write', true), '') <> 'on' then
    new.tier_id              := old.tier_id;
    new.base_price_cents     := old.base_price_cents;
    new.discount_cents       := old.discount_cents;
    new.credit_applied_cents := old.credit_applied_cents;
    new.final_price_cents    := old.final_price_cents;
    new.estimated_aid_cents  := old.estimated_aid_cents;
    new.status               := old.status;
    new.price_locked_at      := old.price_locked_at;
    new.price_warning        := old.price_warning;
  end if;
  return new;
end $$;

drop trigger if exists dossiers_protect_pricing on public.dossiers;
create trigger dossiers_protect_pricing
  before update on public.dossiers
  for each row execute function public.protect_dossier_pricing();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.pricing_tiers       enable row level security;
alter table public.referrals           enable row level security;
alter table public.referral_credits    enable row level security;
alter table public.credit_applications enable row level security;

-- pricing_tiers : référentiel lisible par tout utilisateur connecté.
drop policy if exists "paliers lisibles" on public.pricing_tiers;
create policy "paliers lisibles" on public.pricing_tiers
  for select to authenticated using (active = true);

-- referrals : lisibles par le parrain ET le filleul concernés.
drop policy if exists "parrain et filleul lisent le parrainage" on public.referrals;
create policy "parrain et filleul lisent le parrainage" on public.referrals
  for select using (
    referrer_id in (select id from public.artisans where user_id = (select auth.uid()))
    or referee_id in (select id from public.artisans where user_id = (select auth.uid()))
  );

-- referral_credits : chaque artisan lit ses propres crédits.
drop policy if exists "artisan lit ses credits" on public.referral_credits;
create policy "artisan lit ses credits" on public.referral_credits
  for select using (
    artisan_id in (select id from public.artisans where user_id = (select auth.uid()))
  );

-- credit_applications : lisibles par le propriétaire du dossier concerné.
drop policy if exists "artisan lit ses consommations de credit" on public.credit_applications;
create policy "artisan lit ses consommations de credit" on public.credit_applications
  for select using (
    dossier_id in (
      select d.id from public.dossiers d
      join public.artisans a on a.id = d.artisan_id
      where a.user_id = (select auth.uid())
    )
  );

-- NB : aucune policy INSERT/UPDATE/DELETE sur ces 4 tables → tout écriture
-- client est refusée. Les mutations passent par les fonctions SECURITY DEFINER
-- (0013) ou par le service-role (webhook Stripe), qui contournent la RLS.

-- =============================================================================
-- Commentaires (documentation en base)
-- =============================================================================
comment on table public.pricing_tiers is
  'Seuils de tarification pilotables (jamais en dur). Palier = aide estimée entre aid_min_cents et aid_max_cents inclus.';
comment on column public.dossiers.status is
  'Axe FACTURATION (draft→priced→paid→deposited/refused→paid_out). Distinct de dossiers.statut (parcours opérationnel).';
comment on column public.dossiers.price_locked_at is
  'Prix figé au paiement. Une fois posé, price_dossier() ne recalcule plus.';
comment on column public.referral_credits.source_referral_id is
  'UNIQUE : un parrainage n''émet qu''un seul crédit → idempotence de la récompense.';
comment on table public.credit_applications is
  'Grand-livre FIFO crédit→dossier. Rend apply_credits_to_dossier() ré-exécutable et auditable.';
