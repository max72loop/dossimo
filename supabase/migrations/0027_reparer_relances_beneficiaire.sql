-- Reprise sûre d'une exécution partielle de 0025_relances_beneficiaire.sql.
-- Ne supprime aucune donnée existante ; peut être exécutée même si 0025 est passée.
create table if not exists public.reminder_schedules (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null unique references public.dossiers(id) on delete cascade,
  enabled boolean not null default false,
  enabled_at timestamptz,
  channels jsonb not null default '["email"]'::jsonb,
  cadence_days jsonb not null default '[0,3,7,14]'::jsonb,
  max_reminders integer not null default 4 check (max_reminders between 1 and 10),
  opt_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(channels) = 'array'),
  check (jsonb_typeof(cadence_days) = 'array')
);

create table if not exists public.reminder_logs (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  cadence_step integer not null check (cadence_step >= 0),
  document_types jsonb not null default '[]'::jsonb,
  channel text not null check (channel in ('email', 'sms')),
  status text not null check (status in ('queued', 'sent', 'delivered', 'bounced', 'failed', 'skipped')),
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  provider_message_id text,
  error_detail text,
  created_at timestamptz not null default now(),
  unique (dossier_id, cadence_step, channel),
  check (jsonb_typeof(document_types) = 'array')
);

create index if not exists reminder_logs_dossier_created_idx on public.reminder_logs (dossier_id, created_at desc);

alter table public.reminder_schedules enable row level security;
alter table public.reminder_logs enable row level security;

drop policy if exists "artisan gere ses relances" on public.reminder_schedules;
create policy "artisan gere ses relances"
  on public.reminder_schedules for all to authenticated
  using (exists (select 1 from public.dossiers d join public.artisans a on a.id = d.artisan_id where d.id = dossier_id and a.user_id = auth.uid()))
  with check (exists (select 1 from public.dossiers d join public.artisans a on a.id = d.artisan_id where d.id = dossier_id and a.user_id = auth.uid()));

drop policy if exists "artisan lit le journal de ses relances" on public.reminder_logs;
create policy "artisan lit le journal de ses relances"
  on public.reminder_logs for select to authenticated
  using (exists (select 1 from public.dossiers d join public.artisans a on a.id = d.artisan_id where d.id = dossier_id and a.user_id = auth.uid()));
