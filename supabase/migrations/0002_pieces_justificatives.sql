-- =============================================================================
-- Dossimo — Migration 0002 : pièces justificatives (devis / facture)
-- =============================================================================
-- Ingestion des VRAIES pièces de l'artisan (upload) + extraction VLM, pour la
-- vérification croisée pièce ↔ saisie (cœur de la garantie anti-refus).
-- À exécuter dans Supabase → SQL Editor (idempotent).
-- =============================================================================

do $$ begin
  create type type_piece as enum ('devis', 'facture', 'autre');
exception when duplicate_object then null; end $$;

do $$ begin
  create type statut_extraction as enum ('en_attente', 'ok', 'echec');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Table : pieces_justificatives
-- Métadonnées du fichier stocké (bucket privé « pieces ») + résultat de
-- l'extraction VLM. Le fichier lui-même vit dans Supabase Storage.
-- ---------------------------------------------------------------------------
create table if not exists public.pieces_justificatives (
  id                 uuid primary key default gen_random_uuid(),
  dossier_id         uuid not null references public.dossiers (id) on delete cascade,
  type               type_piece not null,
  storage_path       text not null,
  nom_fichier        text,
  mime               text,
  taille             integer,
  extraction_json    jsonb,
  extraction_statut  statut_extraction not null default 'en_attente',
  extraction_erreur  text,
  created_at         timestamptz not null default now(),
  extracted_at       timestamptz
);

create index if not exists pieces_dossier_id_idx
  on public.pieces_justificatives (dossier_id);

alter table public.pieces_justificatives enable row level security;

-- Un artisan ne gère que les pièces de ses propres dossiers.
drop policy if exists "artisan gere ses pieces" on public.pieces_justificatives;
create policy "artisan gere ses pieces" on public.pieces_justificatives
  for all using (
    dossier_id in (
      select d.id from public.dossiers d
      join public.artisans a on a.id = d.artisan_id
      where a.user_id = (select auth.uid())
    )
  ) with check (
    dossier_id in (
      select d.id from public.dossiers d
      join public.artisans a on a.id = d.artisan_id
      where a.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Storage : bucket privé « pieces »
-- Convention de chemin : {dossier_id}/{fichier}. Le premier segment porte
-- l'appartenance, contrôlée par RLS. (L'app écrit/lit via service-role côté
-- serveur ; ces policies sont une défense en profondeur.)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('pieces', 'pieces', false)
on conflict (id) do nothing;

drop policy if exists "pieces: artisan lit" on storage.objects;
create policy "pieces: artisan lit" on storage.objects
  for select to authenticated using (
    bucket_id = 'pieces'
    and (storage.foldername(name))[1] in (
      select d.id::text from public.dossiers d
      join public.artisans a on a.id = d.artisan_id
      where a.user_id = (select auth.uid())
    )
  );

drop policy if exists "pieces: artisan ecrit" on storage.objects;
create policy "pieces: artisan ecrit" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'pieces'
    and (storage.foldername(name))[1] in (
      select d.id::text from public.dossiers d
      join public.artisans a on a.id = d.artisan_id
      where a.user_id = (select auth.uid())
    )
  );

drop policy if exists "pieces: artisan supprime" on storage.objects;
create policy "pieces: artisan supprime" on storage.objects
  for delete to authenticated using (
    bucket_id = 'pieces'
    and (storage.foldername(name))[1] in (
      select d.id::text from public.dossiers d
      join public.artisans a on a.id = d.artisan_id
      where a.user_id = (select auth.uid())
    )
  );

comment on table public.pieces_justificatives is
  'Devis/facture réels uploadés + extraction VLM, pour la vérification croisée pièce ↔ saisie (anti-refus). Fichiers dans le bucket Storage privé « pieces ».';
