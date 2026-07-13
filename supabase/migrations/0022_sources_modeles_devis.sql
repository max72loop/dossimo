-- Traçabilité de la source réglementaire et de la revue métier d'un modèle de devis.
alter table public.quote_templates add column if not exists source_url text;
alter table public.quote_templates add column if not exists reviewed_by text;
alter table public.quote_templates add column if not exists reviewed_at timestamptz;
alter table public.quote_templates add column if not exists notes text;
