-- Cluster « refus » : taxonomie des motifs et demandes de diagnostic (lot 1).
--
-- CE QUE CETTE MIGRATION PORTE
-- Deux tables, sans lien entre elles pour l'instant :
--   `refus_motifs`   — la taxonomie éditoriale, qui alimente les pages
--                      /refus/motifs/[slug]. Contenu seedé en 0054.
--   `refus_demandes` — les demandes de diagnostic déposées par le formulaire.
--
-- La table de liaison `refus_demandes_motifs` est VOLONTAIREMENT absente : elle
-- ne sert qu'à l'admin de qualification, prévue au lot 2 (docs/cluster-refus.md
-- § 4). Même chose pour `storage_path` et `creneau_rappel` : pas d'upload, pas
-- de rappel téléphonique en lot 1. On n'ouvre pas de colonne qu'aucun code
-- n'écrit.
--
-- MODÈLE DE SÉCURITÉ
-- Les deux tables sont en RLS SANS POLICY, c'est-à-dire service-role
-- uniquement, comme `leads` (supabase/README.md § 4). C'est intentionnel, pas
-- un oubli :
--   - `refus_demandes` contient un e-mail, un téléphone et un texte libre écrit
--     par un artisan sur son propre dossier refusé. Rien de tout cela n'a à être
--     lisible par `anon` ni par `authenticated`.
--   - `refus_motifs` est du contenu public, mais il est lu au BUILD par un
--     client service-role (`motifs-loader.ts`, calqué sur `gestes-loader.ts`),
--     exactement comme `regles_metier` l'est pour les pages « par geste ». On
--     n'ouvre donc PAS un second accès `anon` : `pricing_tiers` reste le seul du
--     schéma (README § 4).
-- Le `revoke all` est la ceinture par-dessus la RLS : Supabase accorde
-- `grant all` à `anon`/`authenticated` par défaut sur `public`.

-- ---------------------------------------------------------------------------
-- Horodatage : `updated_at` tenu par la base, pas par l'appelant
-- ---------------------------------------------------------------------------
-- Fonction SECURITY INVOKER (le défaut) : elle n'a aucune raison de contourner
-- la RLS, elle ne touche qu'à NEW. `search_path` figé quand même, avec `pg_temp`
-- en DERNIER : mentionné en premier, un appelant pourrait y créer un objet
-- homonyme et détourner la fonction (README § 4).
create or replace function public.refus_touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.refus_touch_updated_at() is
  'Pose updated_at = now() avant tout UPDATE sur les tables du cluster « refus ». '
  'SECURITY INVOKER : aucun besoin de contourner la RLS.';

-- ---------------------------------------------------------------------------
-- Table : refus_motifs — la taxonomie
-- ---------------------------------------------------------------------------
create table if not exists public.refus_motifs (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  libelle          text not null,
  -- `text + check` et non un enum : un `alter type ... add value` ne peut pas
  -- être annulé dans une transaction (README § 6). Les valeurs sont celles du
  -- dispositif dont le motif RELÈVE, pas de celui qui le rencontre le plus.
  aide             text not null
                     check (aide in ('maprimerenov', 'cee', 'les_deux')),
  description      text not null,
  -- « La décision peut-elle être utilement reprise sur ce motif, soit en
  -- contestant, soit en corrigeant et en redéposant ? » Un `false` n'est pas une
  -- fatalité pour l'artisan : c'est un défaut qui ne se répare pas sur CE
  -- dossier. La nuance est portée par le texte, jamais par le seul booléen.
  contestable      boolean not null default false,
  publie           boolean not null default false,
  meta_title       text not null,
  meta_description text not null,
  -- { "sections": [{ "heading", "paragraphs": [] }], "faq": [{ "question", "answer" }] }
  -- La FAQ est facultative : le JSON-LD FAQPage n'est émis que si elle existe
  -- réellement, même règle que `guide-page.tsx`.
  contenu_json     jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- `generateStaticParams` et le sitemap ne lisent que les motifs publiés :
-- l'index porte donc sur le prédicat réellement interrogé.
create index if not exists refus_motifs_publie_idx
  on public.refus_motifs (publie)
  where publie;

drop trigger if exists refus_motifs_touch_updated_at on public.refus_motifs;
create trigger refus_motifs_touch_updated_at
  before update on public.refus_motifs
  for each row execute function public.refus_touch_updated_at();

alter table public.refus_motifs enable row level security;
revoke all on public.refus_motifs from anon, authenticated;

comment on table public.refus_motifs is
  'Taxonomie éditoriale des motifs de refus MaPrimeRénov'' / CEE. Alimente les '
  'pages /refus/motifs/[slug] et, au lot 2, la qualification en admin. RLS sans '
  'policy : lue au build par le service-role (motifs-loader.ts), comme '
  'regles_metier l''est par gestes-loader.ts. Aucun accès anon.';

comment on column public.refus_motifs.publie is
  'false tant que les assertions réglementaires du motif ne sont pas relues. '
  'Un motif non relu existe en base et ne sort pas en page. '
  'Sources et état de relecture : docs/refus/motifs-assertions.md.';

comment on column public.refus_motifs.contestable is
  'La décision peut-elle être utilement reprise sur ce motif (contestation ou '
  'correction puis redépôt) ? false = défaut qui ne se répare pas sur CE dossier, '
  'jamais « dossier perdu ».';

-- ---------------------------------------------------------------------------
-- Table : refus_demandes — les demandes de diagnostic
-- ---------------------------------------------------------------------------
create table if not exists public.refus_demandes (
  id                      uuid primary key default gen_random_uuid(),
  -- Pas de valeur `particulier` : l'aiguillage du cluster mène un particulier
  -- vers une page STATIQUE, sans collecte (docs/cluster-refus.md § 3.4). Le
  -- check est ce qui empêche la branche B2C de rentrer par la porte de service.
  profil                  text not null
                            check (profil in ('artisan_rge', 'autre')),
  aide                    text
                            check (aide is null or aide in ('maprimerenov', 'cee', 'les_deux')),
  geste                   text,
  email                   text not null,
  telephone               text,
  -- Stockée, JAMAIS calculée : aucun compte à rebours, aucun verdict de
  -- recevabilité n'est dérivé de cette date. Elle informe le diagnostic manuel.
  -- Optionnelle : un artisan sans sa notification sous les yeux ne doit pas être
  -- bloqué, et un champ obligatoire ferait chuter la complétion.
  date_notification       date,
  motif_libre             text,
  statut                  text not null default 'nouveau'
                            check (statut in ('nouveau', 'en_cours', 'traite', 'abandonne')),
  -- Consentement unique en lot 1 (être recontacté). Le second consentement, sur
  -- le traitement d'un document, n'a pas d'objet sans upload : il arrivera avec
  -- lui au lot 2. On horodate ET on fige le texte exact : un consentement dont
  -- on ne sait plus à quoi il se rapportait n'en est pas un.
  consentement_contact_at timestamptz,
  consentements_version   text,
  consentements_texte     jsonb,
  utm_source              text,
  utm_medium              text,
  utm_campaign            text,
  diagnostic              text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- L'écran de suivi (lot 2) lit « les demandes non traitées, les plus récentes
-- d'abord ». Index posé maintenant : la colonne et le tri sont déjà connus.
create index if not exists refus_demandes_statut_created_idx
  on public.refus_demandes (statut, created_at desc);

drop trigger if exists refus_demandes_touch_updated_at on public.refus_demandes;
create trigger refus_demandes_touch_updated_at
  before update on public.refus_demandes
  for each row execute function public.refus_touch_updated_at();

alter table public.refus_demandes enable row level security;
revoke all on public.refus_demandes from anon, authenticated;

comment on table public.refus_demandes is
  'Demandes de diagnostic déposées par le formulaire /refus. RLS sans policy : '
  'service-role uniquement, comme leads. Conservation 3 ans après dernier '
  'contact, aligné sur la prospection B2B (docs/cluster-refus.md § 3.7).';

comment on column public.refus_demandes.date_notification is
  'Date de la notification de refus, telle que déclarée. Optionnelle. '
  'AUCUN compte à rebours ni verdict de recevabilité n''est calculé dessus : '
  'elle informe le diagnostic rédigé à la main, rien de plus.';

comment on column public.refus_demandes.consentements_texte is
  'Instantané du texte exact affiché au moment du consentement, avec sa version. '
  'Source unique côté code : src/lib/refus/consentements.ts.';

-- PostgREST met le schéma en cache : sans ce signal, les tables neuves et les
-- droits révoqués ne sont pas vus (README § 4).
notify pgrst, 'reload schema';
