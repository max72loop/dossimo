-- Suivi du sprint de prospection bicanal (plan de lancement v3, section 11).
--
-- `prospects_dossimo` est la table des 2 900 contacts issus de l'annuaire public
-- ADEME. Elle a été créée à la main (import), hors migrations : d'où l'absence
-- de création ici. Sa clé est `place_id` (identifiant Google Places). On se
-- contente d'AJOUTER les colonnes de pilotage, de façon additive et rejouable.
--
-- Distinct du système e-mail automatisé (migration 0032, tables `prospects` /
-- `prospection_campagnes`) : ici on pilote le sprint manuel WhatsApp + e-mail
-- et l'A/B test entre canaux, avec un suivi à cinq chiffres par canal.
--
-- Garde-fou : la table n'étant créée par aucune migration, un environnement neuf
-- (supabase db reset, CI) ne la connaît pas. Tout est enveloppé dans un bloc qui
-- s'auto-ignore si la table est absente, pour ne jamais casser un reset ; sur la
-- base réelle où la table existe, le bloc s'applique normalement.

do $$
begin
  if to_regclass('public.prospects_dossimo') is null then
    raise notice 'prospects_dossimo absente (table hors migrations) : 0033 ignorée.';
    return;
  end if;

  -- 1) Colonnes de suivi. `canal` reste `text` (pas de CHECK) pour coller au
  -- plan ; les seules valeurs écrites sont 'email' et 'whatsapp'.
  alter table public.prospects_dossimo
    add column if not exists canal text,
    add column if not exists email_valide boolean,
    add column if not exists date_envoi date,
    add column if not exists date_relance date,
    add column if not exists reponse boolean default false,
    add column if not exists essai_demo boolean default false,
    add column if not exists dossier_paye boolean default false,
    add column if not exists opt_out boolean default false,
    add column if not exists question_posee text,
    add column if not exists notes text;

  -- 2) Verrouillage d'accès. La table porte des données personnelles (nom,
  -- e-mail, téléphone d'artisans). Comme les tables de la 0032, elle doit être
  -- pilotée EXCLUSIVEMENT en service-role (script « lot du jour », actions
  -- admin). RLS activée SANS policy = tout accès anon/authenticated refusé,
  -- quels que soient les grants ; le service-role contourne la RLS et reste
  -- seul à y accéder. L'app ne référence cette table nulle part côté client :
  -- activer la RLS ne casse aucun parcours existant.
  alter table public.prospects_dossimo enable row level security;
end $$;
