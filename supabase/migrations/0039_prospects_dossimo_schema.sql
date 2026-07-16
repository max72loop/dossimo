-- Fait entrer `prospects_dossimo` dans le schéma versionné.
--
-- POURQUOI CETTE MIGRATION EXISTE
-- La table des ~2 900 contacts issus de l'annuaire public ADEME a été créée À LA
-- MAIN (import), hors migrations. Les migrations 0033 et 0037 se contentent d'y
-- AJOUTER des colonnes, et s'auto-ignorent si la table est absente. Résultat :
--   - en production, la table existe et le code marche ;
--   - sur tout environnement neuf (supabase db reset, CI, nouveau poste), la
--     table n'existe PAS, 0033 et 0037 s'ignorent, et toute la console
--     /admin/sprint casse au premier appel (src/lib/sprint/{lot,message,
--     pilotage}.ts et src/app/admin/sprint/pilotage/page.tsx l'interrogent).
-- Le schéma versionné ne décrivait donc pas la production.
--
-- POURQUOI ICI ET PAS EN 0033
-- 0033 et 0037 sont déjà appliquées en production : on ne réécrit pas une
-- migration passée. On crée donc la table APRÈS elles, dans sa forme finale
-- (colonnes de base + colonnes de 0033 + colonne de 0037). L'ordre fonctionne
-- dans les deux sens :
--   - environnement neuf : 0033 s'ignore, 0037 s'ignore, 0039 crée tout ;
--   - production : `if not exists` ne fait rien, les colonnes sont déjà là.
-- Les index et la RLS sont repris ici pour la même raison : sur un environnement
-- neuf, ceux de 0033/0037 n'ont jamais été créés.
--
-- À PARTIR DE MAINTENANT : cette table est une table normale. Toute évolution
-- passe par une migration, jamais par un import manuel ni par l'éditeur SQL.

create table if not exists public.prospects_dossimo (
  -- Identifiant Google Places. Clé naturelle du fichier : c'est lui qui
  -- dédoublonne les imports successifs.
  place_id text primary key,

  -- Données de l'annuaire ADEME / Google Places (import).
  name text,
  address text,
  code_postal text,
  city text,
  phone text,
  website text,
  emails text[],
  siren text,
  denomination text,
  tranche_effectif text,
  rge_domaines text[],
  score numeric,
  statut text,
  -- RGPD art. 14 : d'où vient ce contact. La 0032 impose `source not null` sur
  -- `prospects` pour rendre structurellement impossible un import sans origine.
  -- Ici la colonne reste nullable : les lignes importées à la main l'ont parfois
  -- laissée vide, et un `not null` rétroactif casserait la table en production.
  -- Tout nouvel import DOIT la renseigner.
  source text,
  source_query text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Colonnes de pilotage du sprint (ajoutées par 0033).
  -- `canal` reste `text` sans CHECK pour coller au plan v3 ; seules valeurs
  -- écrites : 'email' et 'whatsapp'.
  canal text,
  email_valide boolean,
  date_envoi date,
  date_relance date,
  reponse boolean default false,
  essai_demo boolean default false,
  dossier_paye boolean default false,
  -- Opt-out de confort, NON durable : il disparaît si la ligne est supprimée
  -- puis réimportée. La preuve durable du refus vit dans
  -- `prospection_suppressions` (clé = e-mail), qui ne se purge jamais. Voir
  -- `marquerStop` dans src/lib/sprint/actions.ts : elle écrit dans les DEUX.
  opt_out boolean default false,
  question_posee text,
  notes text,

  -- Nurturing mensuel (ajouté par 0037).
  date_nurturing date
);

-- Index de la 0037, repris pour les environnements neufs où elle s'est ignorée.
create index if not exists prospects_dossimo_nurturing_idx
  on public.prospects_dossimo (date_nurturing)
  where canal is not null;

create index if not exists prospects_dossimo_relance_idx
  on public.prospects_dossimo (date_envoi, date_relance)
  where canal is not null;

-- RLS de la 0033, reprise pour la même raison. Données personnelles (nom,
-- e-mail, téléphone d'artisans) : pilotage EXCLUSIVEMENT en service-role.
-- RLS activée SANS policy = tout accès anon/authenticated refusé quels que
-- soient les grants ; le service-role contourne la RLS et reste seul à entrer.
alter table public.prospects_dossimo enable row level security;

-- Ceinture, comme la 0032 le fait pour ses propres tables : Supabase accorde par
-- défaut `grant all` à anon/authenticated sur `public`. La RLS seule suffit,
-- mais si elle était un jour désactivée par erreur la table deviendrait
-- immédiatement lisible. On retire les grants par défaut.
revoke all on public.prospects_dossimo from anon, authenticated;

comment on table public.prospects_dossimo is
  'Fichier de prospection ADEME du sprint de lancement. Service-role uniquement. '
  'Opt-out durable dans prospection_suppressions, pas ici.';
