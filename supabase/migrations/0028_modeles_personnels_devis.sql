create table public.user_quote_templates (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references public.artisans(id) on delete cascade,
  gesture_id uuid not null references public.quote_gestures(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  field_values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (artisan_id, gesture_id, name)
);
alter table public.user_quote_templates enable row level security;
create policy "artisan gere ses modeles de devis" on public.user_quote_templates for all to authenticated
  using (exists (select 1 from public.artisans a where a.id = artisan_id and a.user_id = auth.uid()))
  with check (exists (select 1 from public.artisans a where a.id = artisan_id and a.user_id = auth.uid()));
