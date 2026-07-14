-- Prospection B2B : campagne, prospects importés, file de validation, envois.
--
-- Un seul message par prospect (décision : pas de relance). La conformité tient
-- à trois choses inscrites dans le schéma, pas dans le code applicatif :
--   1) `prospects.source` est NOT NULL : l'article 14 du RGPD impose de dire au
--      destinataire d'où vient son adresse, on ne peut donc pas importer un
--      prospect sans savoir où on l'a trouvé ;
--   2) `prospection_suppressions` ne se purge jamais et est consultée avant tout
--      envoi : un désinscrit reste désinscrit même si sa fiche prospect est
--      supprimée, sinon le prochain import le re-solliciterait ;
--   3) l'index unique sur (campagne, prospect) rend un second envoi
--      structurellement impossible.

-- ---------------------------------------------------------------------------
-- 1) Campagne
-- Objet et corps vivent EN BASE, pas dans le code : la copie doit pouvoir être
-- corrigée entre deux envois sans redéploiement (même principe que regles_metier).
-- ---------------------------------------------------------------------------
create table if not exists public.prospection_campagnes (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  from_email text not null,
  objet text not null,
  corps text not null,
  demarre_le date not null,
  termine_le date not null,
  -- Plafond haut. Le plafond RÉEL du jour est plus bas pendant la montée en
  -- charge (voir src/lib/prospection/cadence.ts) : une boîte neuve qui envoie
  -- 40 messages le premier jour se fait classer en spam.
  daily_cap_max integer not null default 40 check (daily_cap_max between 1 and 200),
  en_pause boolean not null default false,
  motif_pause text,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

-- Une seule campagne active à la fois : le tick n'a pas à arbitrer entre deux
-- campagnes qui se disputeraient le plafond quotidien de la même boîte.
create unique index if not exists prospection_une_campagne_active
  on public.prospection_campagnes ((actif)) where actif;

-- ---------------------------------------------------------------------------
-- 2) Prospects
-- ---------------------------------------------------------------------------
create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  prenom text,
  nom text,
  entreprise text,
  ville text,
  code_postal text,
  -- D'où vient l'adresse. Repris tel quel dans le pied du message (RGPD art. 14).
  source text not null,
  statut text not null default 'nouveau'
    check (statut in ('nouveau', 'en_file', 'contacte', 'repondu', 'desinscrit', 'bounce', 'exclu')),
  unsubscribe_token uuid not null default gen_random_uuid(),
  notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists prospects_email_key
  on public.prospects (lower(email));
create unique index if not exists prospects_unsubscribe_token_key
  on public.prospects (unsubscribe_token);
create index if not exists prospects_statut_idx on public.prospects (statut);

-- ---------------------------------------------------------------------------
-- 3) File d'envoi
-- Rien ne part sans être passé par `valide` : c'est ce qui empêche qu'un prénom
-- mal importé (« Bonjour SARL, ») parte chez quarante artisans d'un coup.
-- ---------------------------------------------------------------------------
create table if not exists public.prospection_messages (
  id uuid primary key default gen_random_uuid(),
  campagne_id uuid not null references public.prospection_campagnes(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  statut text not null default 'en_attente'
    check (statut in ('en_attente', 'valide', 'envoye', 'echec', 'annule')),
  objet text not null,
  corps text not null,
  scheduled_on date not null,
  sent_at timestamptz,
  erreur text,
  created_at timestamptz not null default now()
);

-- « On ne le contacte qu'une fois » : garanti par le schéma, pas par le code.
create unique index if not exists prospection_un_message_par_prospect
  on public.prospection_messages (campagne_id, prospect_id)
  where statut <> 'annule';

create index if not exists prospection_messages_file_idx
  on public.prospection_messages (statut, scheduled_on);

-- ---------------------------------------------------------------------------
-- 4) Journal
-- ---------------------------------------------------------------------------
create table if not exists public.prospection_evenements (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references public.prospects(id) on delete set null,
  type text not null
    check (type in ('envoi', 'clic', 'desinscription', 'bounce', 'reponse')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists prospection_evenements_prospect_idx
  on public.prospection_evenements (prospect_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 5) Liste de suppression — ne se purge JAMAIS
-- C'est la preuve de l'opposition, exigible en cas de contrôle, et le seul
-- rempart contre une re-sollicitation au prochain import.
-- ---------------------------------------------------------------------------
create table if not exists public.prospection_suppressions (
  email text primary key,
  motif text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6) Désinscription atomique
-- Trois écritures qui doivent réussir ensemble : inscrire l'opposition, marquer
-- le prospect, annuler ce qui n'est pas encore parti. Une désinscription qui
-- laisserait un message « valide » dans la file enverrait quand même.
-- ---------------------------------------------------------------------------
create or replace function public.prospection_desinscrire(p_email text, p_motif text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if v_email = '' or v_email is null then
    raise exception 'email vide';
  end if;

  insert into public.prospection_suppressions (email, motif)
  values (v_email, p_motif)
  on conflict (email) do nothing;

  update public.prospects
     set statut = 'desinscrit'
   where lower(email) = v_email
     and statut <> 'desinscrit';

  update public.prospection_messages m
     set statut = 'annule',
         erreur = 'désinscription'
    from public.prospects p
   where m.prospect_id = p.id
     and lower(p.email) = v_email
     and m.statut in ('en_attente', 'valide');
end;
$$;

-- ---------------------------------------------------------------------------
-- 7) Fermeture
-- Aucune de ces tables n'est lisible par un client : la prospection est
-- entièrement pilotée en service-role (routes de cron, actions admin). RLS
-- activée sans policy = tout refusé, y compris en cas de grant résiduel.
-- ---------------------------------------------------------------------------
alter table public.prospection_campagnes enable row level security;
alter table public.prospects enable row level security;
alter table public.prospection_messages enable row level security;
alter table public.prospection_evenements enable row level security;
alter table public.prospection_suppressions enable row level security;

revoke all on public.prospection_campagnes from anon, authenticated;
revoke all on public.prospects from anon, authenticated;
revoke all on public.prospection_messages from anon, authenticated;
revoke all on public.prospection_evenements from anon, authenticated;
revoke all on public.prospection_suppressions from anon, authenticated;
revoke all on function public.prospection_desinscrire(text, text) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8) Campagne de lancement
-- Fenêtre : premier envoi le 15 juillet 2026 (après-midi), dernier envoi le
-- vendredi 24, pour que le message arrive avant la fin du code DOSSIMO50 le
-- dimanche 26 (src/lib/stripe/actions.ts).
-- ---------------------------------------------------------------------------
insert into public.prospection_campagnes (nom, from_email, objet, corps, demarre_le, termine_le)
select
  'Lancement DOSSIMO50 — juillet 2026',
  'max@dossimo.pro',
  'Vos dossiers MaPrimeRénov'', montés à votre place',
  $corps$
{{salutation}}

Monter un dossier MaPrimeRénov' ou CEE, c'est des heures de paperasse :
recopier le client, les montants, les données techniques, vérifier chaque
mention, comparer devis et facture, croiser les dates. Dossimo fait ce travail à
votre place.

Vous envoyez le devis, ou vous le prenez en photo depuis le chantier. Dossimo
recopie les informations, contrôle les mentions obligatoires, la chronologie et
la validité RGE, puis vous sort le pack complet prêt à déposer : récapitulatif
client, checklist des pièces et rapport de contrôle. Votre seul effort, relire
et déposer.

Résultat, un dossier complet et conforme, sans oubli qui ferait sauter la prime,
monté en quelques minutes au lieu de plusieurs heures. Et vous restez maître de
votre client et de votre prime, à l'inverse d'un mandataire qui s'intercale et
en capte une partie. Dossimo ne dépose jamais à votre place et ne touche jamais
la prime.

Pour le lancement, votre premier dossier est à moitié prix avec le code
DOSSIMO50, jusqu'au 26 juillet : à partir de 24,50 € au lieu de 49 €, en un
paiement, jamais un pourcentage sur la prime.

Envoyez un premier devis, deux minutes suffisent :
{{lien_demo}}

Max Landry, Dossimo
max@dossimo.pro

PS : un dossier refusé, c'est la prime entière perdue, souvent plusieurs
milliers d'euros, et le montage à refaire.

--
{{mentions_legales}}
Votre adresse professionnelle : {{source}}.
Pour ne plus recevoir aucun message de ma part : {{lien_desinscription}}
$corps$,
  date '2026-07-15',
  date '2026-07-24'
where not exists (select 1 from public.prospection_campagnes where actif);
