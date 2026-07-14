-- Sécurité des comptes : profil créé après confirmation et rate limiting partagé.

create table if not exists public.auth_rate_limits (
  action text not null,
  key_hash text not null,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 1,
  primary key (action, key_hash)
);

alter table public.auth_rate_limits enable row level security;
-- Aucune policy : seule la service-role peut lire ou écrire cette table.

create or replace function public.consume_auth_rate_limit(
  p_action text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_attempts integer;
begin
  insert into public.auth_rate_limits as limits
    (action, key_hash, window_started_at, attempts)
  values (p_action, p_key_hash, now(), 1)
  on conflict (action, key_hash) do update
    set attempts = case
          when limits.window_started_at < now() - make_interval(secs => p_window_seconds)
            then 1
          else limits.attempts + 1
        end,
        window_started_at = case
          when limits.window_started_at < now() - make_interval(secs => p_window_seconds)
            then now()
          else limits.window_started_at
        end
  returning attempts into current_attempts;

  return current_attempts <= p_limit;
end;
$$;

revoke all on function public.consume_auth_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_auth_rate_limit(text, text, integer, integer)
  to service_role;

-- La fiche métier est créée par Auth au moment de l'inscription. Elle reste
-- inaccessible tant que l'adresse n'est pas confirmée et qu'aucune session
-- authenticated n'existe.
create or replace function public.handle_new_artisan_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.artisans (user_id, entreprise, nom, prenom, email, telephone)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'entreprise'), ''), 'Entreprise à compléter'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nom'), ''), 'À compléter'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'prenom'), ''), 'À compléter'),
    coalesce(new.email, new.id::text || '@compte.local'),
    nullif(trim(new.raw_user_meta_data ->> 'telephone'), '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_artisan on auth.users;
create trigger on_auth_user_created_create_artisan
  after insert on auth.users
  for each row execute function public.handle_new_artisan_user();
