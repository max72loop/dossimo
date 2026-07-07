-- =============================================================================
-- Dossimo — Schéma initial (CLAUDE.md §7)
-- =============================================================================
-- À exécuter dans Supabase → SQL Editor, ou via `supabase db push`.
-- Idempotent autant que possible (IF NOT EXISTS / DROP POLICY IF EXISTS).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Types énumérés
-- ---------------------------------------------------------------------------
do $$ begin
  create type statut_dossier as enum ('nouveau', 'en_traitement', 'livre');
exception when duplicate_object then null; end $$;

do $$ begin
  create type dispositif as enum ('maprimerenov', 'cee');
exception when duplicate_object then null; end $$;

do $$ begin
  create type statut_abonnement as enum ('aucun', 'actif', 'expire');
exception when duplicate_object then null; end $$;

do $$ begin
  create type type_paiement as enum ('abonnement', 'ponctuel');
exception when duplicate_object then null; end $$;

do $$ begin
  create type statut_paiement as enum ('en_attente', 'paye', 'echoue', 'rembourse');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Table: artisans
-- Un artisan = un compte de l'espace. `user_id` relie à Supabase Auth pour la
-- Row Level Security. Nullable pour permettre une création avant activation
-- du compte (import, prospect converti).
-- ---------------------------------------------------------------------------
create table if not exists public.artisans (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid unique references auth.users (id) on delete set null,
  entreprise          text not null,
  nom                 text not null,
  prenom              text not null,
  email               text not null,
  telephone           text,
  ville               text,
  siret               text,
  qualification_rge   text,
  statut_abonnement   statut_abonnement not null default 'aucun',
  created_at          timestamptz not null default now()
);

create index if not exists artisans_user_id_idx on public.artisans (user_id);
create index if not exists artisans_email_idx on public.artisans (lower(email));

-- ---------------------------------------------------------------------------
-- Table: dossiers
-- Saisie unique du chantier. Les données techniques variables vivent en JSONB
-- (`dates_json`, `caracteristiques_techniques_json`) pour rester souples sans
-- migration à chaque type de travaux.
-- ---------------------------------------------------------------------------
create table if not exists public.dossiers (
  id                               uuid primary key default gen_random_uuid(),
  artisan_id                       uuid references public.artisans (id) on delete cascade,
  statut                           statut_dossier not null default 'nouveau',
  dispositif                       dispositif not null,
  type_travaux                     text not null,
  commune                          text,
  code_postal                      text,
  statut_rge                       text,
  client_identifie                 boolean not null default false,
  montant_estime                   numeric(12, 2),
  dates_json                       jsonb not null default '{}'::jsonb,
  caracteristiques_techniques_json jsonb not null default '{}'::jsonb,
  formule                          text,
  created_at                       timestamptz not null default now(),
  delivered_at                     timestamptz
);

create index if not exists dossiers_artisan_id_idx on public.dossiers (artisan_id);
create index if not exists dossiers_statut_idx on public.dossiers (statut);
create index if not exists dossiers_dispositif_travaux_idx
  on public.dossiers (dispositif, type_travaux);

-- ---------------------------------------------------------------------------
-- Table: regles_metier
-- Cœur pilotable du contrôle anti-refus. JAMAIS de règle en dur dans le code :
-- conditions, pièces requises et points de vigilance sont éditables et
-- versionnés. `version_formulaire` porte la version du Cerfa en vigueur (§8).
-- ---------------------------------------------------------------------------
create table if not exists public.regles_metier (
  id                    uuid primary key default gen_random_uuid(),
  dispositif            dispositif not null,
  type_travaux          text not null,
  condition_json        jsonb not null default '{}'::jsonb,
  pieces_requises_json  jsonb not null default '[]'::jsonb,
  points_vigilance_json jsonb not null default '[]'::jsonb,
  version_formulaire    text,
  version               integer not null default 1,
  actif                 boolean not null default true,
  created_at            timestamptz not null default now()
);

-- Une seule règle active par (dispositif, type_travaux, version).
create unique index if not exists regles_metier_unique_version_idx
  on public.regles_metier (dispositif, type_travaux, version);

create index if not exists regles_metier_lookup_idx
  on public.regles_metier (dispositif, type_travaux, actif);

-- ---------------------------------------------------------------------------
-- Table: paiements
-- Lié à un dossier (ponctuel) ou à un artisan (abonnement). Rempli côté serveur
-- via webhook Stripe (client service-role).
-- ---------------------------------------------------------------------------
create table if not exists public.paiements (
  id           uuid primary key default gen_random_uuid(),
  dossier_id   uuid references public.dossiers (id) on delete set null,
  artisan_id   uuid references public.artisans (id) on delete set null,
  stripe_id    text,
  montant      numeric(12, 2),
  statut       statut_paiement not null default 'en_attente',
  type         type_paiement not null,
  created_at   timestamptz not null default now()
);

create index if not exists paiements_dossier_id_idx on public.paiements (dossier_id);
create index if not exists paiements_artisan_id_idx on public.paiements (artisan_id);
create unique index if not exists paiements_stripe_id_idx
  on public.paiements (stripe_id) where stripe_id is not null;

-- ---------------------------------------------------------------------------
-- Table: leads
-- Capture des prospects depuis la landing page (formulaire → Server Action →
-- client service-role + Resend). Pas de compte associé.
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  nom         text,
  entreprise  text,
  telephone   text,
  message     text,
  source      text,
  created_at  timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- =============================================================================
-- Row Level Security
-- =============================================================================
-- Principe : le client (anon / authenticated) n'accède qu'à ses propres données.
-- Le code serveur de confiance (webhooks Stripe, capture de leads, génération)
-- utilise la clé service-role qui CONTOURNE la RLS — aucune policy nécessaire
-- pour ces flux.
-- =============================================================================

alter table public.artisans      enable row level security;
alter table public.dossiers      enable row level security;
alter table public.regles_metier enable row level security;
alter table public.paiements     enable row level security;
alter table public.leads         enable row level security;

-- --- artisans : chacun voit / édite sa propre fiche ---
drop policy if exists "artisan lit sa fiche" on public.artisans;
create policy "artisan lit sa fiche" on public.artisans
  for select using (user_id = (select auth.uid()));

drop policy if exists "artisan cree sa fiche" on public.artisans;
create policy "artisan cree sa fiche" on public.artisans
  for insert with check (user_id = (select auth.uid()));

drop policy if exists "artisan modifie sa fiche" on public.artisans;
create policy "artisan modifie sa fiche" on public.artisans
  for update using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- --- dossiers : accès complet à ses propres dossiers ---
drop policy if exists "artisan gere ses dossiers" on public.dossiers;
create policy "artisan gere ses dossiers" on public.dossiers
  for all using (
    artisan_id in (
      select id from public.artisans where user_id = (select auth.uid())
    )
  )
  with check (
    artisan_id in (
      select id from public.artisans where user_id = (select auth.uid())
    )
  );

-- --- paiements : lecture seule de ses propres paiements ---
drop policy if exists "artisan lit ses paiements" on public.paiements;
create policy "artisan lit ses paiements" on public.paiements
  for select using (
    artisan_id in (
      select id from public.artisans where user_id = (select auth.uid())
    )
    or dossier_id in (
      select d.id from public.dossiers d
      join public.artisans a on a.id = d.artisan_id
      where a.user_id = (select auth.uid())
    )
  );

-- --- regles_metier : données de référence, lecture pour tout utilisateur connecté ---
drop policy if exists "regles actives lisibles" on public.regles_metier;
create policy "regles actives lisibles" on public.regles_metier
  for select to authenticated using (actif = true);

-- --- leads : aucun accès client. Insertion/lecture via service-role uniquement. ---
-- (Aucune policy = tout refusé pour anon/authenticated ; service-role bypasse.)

-- =============================================================================
-- Commentaires (documentation en base)
-- =============================================================================
comment on table public.regles_metier is
  'Moteur de contrôle pilotable. Jamais de règle en dur dans le code. version_formulaire = version du Cerfa en vigueur (CLAUDE.md §8).';
comment on column public.dossiers.caracteristiques_techniques_json is
  'Données techniques variables selon type_travaux (surface isolée, R, matériau, etc.).';
comment on column public.artisans.user_id is
  'Lien vers auth.users pour la RLS. Nullable : fiche créable avant activation du compte.';
