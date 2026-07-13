-- Référentiel des obligés CEE et retour terrain après dépôt.
-- Les exigences particulières restent vides jusqu'à leur validation documentée.

create table if not exists public.obliges (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  actif boolean not null default true,
  exigences_json jsonb not null default '{}'::jsonb,
  source_url text,
  revue_le date,
  created_at timestamptz not null default now()
);

alter table public.dossiers add column if not exists oblige_id uuid
  references public.obliges(id) on delete set null;

create table if not exists public.retours_depot (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null unique references public.dossiers(id) on delete cascade,
  statut text not null check (statut in ('en_cours', 'accepte', 'refuse', 'abandonne')),
  motif text,
  detail text,
  declared_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dossiers_oblige_id_idx on public.dossiers(oblige_id);
create index if not exists retours_depot_statut_idx on public.retours_depot(statut);

alter table public.obliges enable row level security;
alter table public.retours_depot enable row level security;

create policy "obliges actifs lisibles" on public.obliges for select to authenticated using (actif);
create policy "artisan gere ses retours de depot" on public.retours_depot for all to authenticated
  using (exists (select 1 from public.dossiers d join public.artisans a on a.id = d.artisan_id where d.id = dossier_id and a.user_id = auth.uid()))
  with check (exists (select 1 from public.dossiers d join public.artisans a on a.id = d.artisan_id where d.id = dossier_id and a.user_id = auth.uid()));

insert into public.obliges (nom) values
  ('À définir'),
  ('EDF'),
  ('TotalEnergies'),
  ('Engie'),
  ('Autre obligé CEE')
on conflict (nom) do nothing;

comment on table public.retours_depot is
  'Retour terrain déclaré par l artisan après dépôt : base du pilotage des motifs de refus, jamais une décision réglementaire automatique.';
