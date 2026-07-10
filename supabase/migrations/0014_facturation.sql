-- =============================================================================
-- Facturation professionnelle
--
-- Émission d'une facture par paiement encaissé. Contraintes portées par le CGI
-- (art. 242 nonies A) et le code de commerce (art. L441-9) :
--   · numérotation chronologique, continue, SANS TROU ;
--   · facture immuable une fois émise ;
--   · identité de l'acheteur figée au moment de l'émission.
--
-- L'identité du VENDEUR n'est pas figée en base : elle vit dans le code
-- (`src/lib/legal/editeur.ts`), source unique déjà utilisée par les mentions
-- légales et les CGV. Dossimo est une entité unique ; figer un instantané par
-- facture gèlerait les `[À COMPLÉTER]` actuels et rendrait les factures
-- déjà émises impossibles à corriger une fois l'entité constituée.
-- =============================================================================

-- --- Adresse de facturation de l'acheteur (mention obligatoire) --------------
-- `ville` existe déjà. On complète la voie et le code postal.
alter table public.artisans add column if not exists adresse     text;
alter table public.artisans add column if not exists code_postal text;

comment on column public.artisans.adresse is
  'Adresse de facturation (voie). Mention obligatoire sur la facture (art. 242 nonies A du CGI).';

-- ---------------------------------------------------------------------------
-- Compteur de numérotation, une ligne par année.
--
-- Une séquence Postgres ne convient PAS : elle laisse des trous en cas de
-- rollback. Ici le compteur est incrémenté DANS la transaction qui insère la
-- facture, donc un rollback annule aussi l'incrément. L'UPDATE pose un verrou
-- de ligne qui sérialise les émissions concurrentes.
-- ---------------------------------------------------------------------------
create table if not exists public.facture_compteurs (
  annee        integer primary key,
  dernier_rang integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Table: factures
-- ---------------------------------------------------------------------------
create table if not exists public.factures (
  id              uuid primary key default gen_random_uuid(),

  -- Numérotation : FA-2026-00001. `rang` unique par année, sans trou.
  numero          text not null unique,
  annee           integer not null,
  rang            integer not null,

  -- Un paiement encaissé => au plus une facture. Support de l'idempotence.
  paiement_id     uuid not null unique references public.paiements (id) on delete restrict,
  artisan_id      uuid references public.artisans (id) on delete restrict,
  dossier_id      uuid references public.dossiers (id) on delete set null,

  emise_le        timestamptz not null default now(),

  -- Instantanés figés : l'acheteur peut changer de raison sociale ou d'adresse
  -- plus tard, une facture émise ne bouge pas.
  acheteur_json   jsonb not null,
  lignes_json     jsonb not null,

  -- Montants en centimes (entiers) : aucune erreur d'arrondi flottant.
  total_ht_cents  integer not null,
  tva_taux        numeric(5, 2) not null default 0,
  total_tva_cents integer not null default 0,
  total_ttc_cents integer not null,

  -- Régime de TVA figé au moment de l'émission : il peut changer (sortie de la
  -- franchise en base), les anciennes factures doivent garder leur mention.
  mention_tva     text not null,

  constraint factures_annee_rang_unique unique (annee, rang),
  constraint factures_totaux_coherents check (total_ht_cents + total_tva_cents = total_ttc_cents)
);

create index if not exists factures_artisan_id_idx on public.factures (artisan_id);
create index if not exists factures_dossier_id_idx on public.factures (dossier_id);

comment on table public.factures is
  'Factures émises. Immuables (trigger). Numérotation continue par année via facture_compteurs.';

-- ---------------------------------------------------------------------------
-- Immuabilité : ni UPDATE ni DELETE, même en service-role (les triggers ne
-- sont pas contournés par le bypass RLS). Une erreur de facturation se corrige
-- par un avoir, jamais par une réécriture.
-- ---------------------------------------------------------------------------
create or replace function public.factures_immuables()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'Une facture émise est immuable (art. 242 nonies A du CGI). Émettre un avoir.';
end;
$$;

drop trigger if exists factures_pas_de_modification on public.factures;
create trigger factures_pas_de_modification
  before update or delete on public.factures
  for each row execute function public.factures_immuables();

-- ---------------------------------------------------------------------------
-- Émission. Idempotente : rejouée sur le même paiement, elle renvoie la facture
-- existante SANS toucher au compteur (sinon un rejeu de webhook Stripe créerait
-- un trou dans la numérotation).
--
-- `p_tva_taux` / `p_mention_tva` viennent du code (`editeur.tva`) : le régime
-- fiscal est une décision d'entreprise, pas une donnée de base.
-- ---------------------------------------------------------------------------
create or replace function public.emettre_facture(
  p_paiement_id uuid,
  p_tva_taux    numeric,
  p_mention_tva text
)
returns public.factures
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existante public.factures;
  v_paiement  public.paiements;
  v_artisan   public.artisans;
  v_dossier   public.dossiers;
  v_annee     integer;
  v_rang      integer;
  v_ttc       integer;
  v_ht        integer;
  v_tva       integer;
  v_designation text;
  v_detail      text;
  v_benef       jsonb;
  v_facture   public.factures;
begin
  -- Sérialise les émissions concurrentes sur le MÊME paiement (deux webhooks
  -- Stripe simultanés). Sans ce verrou, les deux passeraient le test
  -- d'existence, incrémenteraient le compteur, et l'un échouerait sur la
  -- contrainte d'unicité en laissant un trou.
  perform pg_advisory_xact_lock(hashtext(p_paiement_id::text));

  select * into v_existante from public.factures where paiement_id = p_paiement_id;
  if found then
    return v_existante;
  end if;

  select * into v_paiement from public.paiements where id = p_paiement_id;
  if not found then
    raise exception 'Paiement % introuvable.', p_paiement_id;
  end if;
  if v_paiement.statut <> 'paye' then
    raise exception 'Paiement % non encaissé : pas de facture.', p_paiement_id;
  end if;

  select * into v_artisan from public.artisans where id = v_paiement.artisan_id;
  if not found then
    raise exception 'Artisan du paiement % introuvable.', p_paiement_id;
  end if;

  -- Montants. Le prix encaissé est le TTC (décision produit). En franchise en
  -- base (taux 0), HT = TTC. Sinon on démonte la TVA depuis le TTC.
  v_ttc := round(coalesce(v_paiement.montant, 0) * 100)::integer;
  if p_tva_taux = 0 then
    v_ht  := v_ttc;
    v_tva := 0;
  else
    v_ht  := round(v_ttc / (1 + p_tva_taux / 100))::integer;
    v_tva := v_ttc - v_ht;
  end if;

  -- Désignation depuis le dossier réglé, quand il y en a un.
  v_designation := 'Pack Dossimo';
  v_detail      := 'Contrôle anti-refus et pack documentaire.';
  if v_paiement.dossier_id is not null then
    select * into v_dossier from public.dossiers where id = v_paiement.dossier_id;
    if found then
      v_benef := v_dossier.caracteristiques_techniques_json -> 'beneficiaire';
      if v_benef ? 'nom' then
        v_designation := 'Pack Dossimo, dossier '
          || coalesce(v_benef ->> 'prenom', '') || ' ' || coalesce(v_benef ->> 'nom', '');
      end if;
      v_detail := 'Contrôle anti-refus et pack documentaire ('
        || coalesce(v_dossier.caracteristiques_techniques_json ->> 'fiche', v_dossier.type_travaux)
        || ').';
    end if;
  end if;

  -- Compteur : l'UPDATE ... RETURNING pose le verrou de ligne. Un rollback
  -- ultérieur annule l'incrément, donc pas de trou.
  v_annee := extract(year from now())::integer;
  insert into public.facture_compteurs (annee, dernier_rang)
    values (v_annee, 0)
    on conflict (annee) do nothing;
  update public.facture_compteurs
     set dernier_rang = dernier_rang + 1
   where annee = v_annee
  returning dernier_rang into v_rang;

  insert into public.factures (
    numero, annee, rang,
    paiement_id, artisan_id, dossier_id,
    acheteur_json, lignes_json,
    total_ht_cents, tva_taux, total_tva_cents, total_ttc_cents,
    mention_tva
  ) values (
    'FA-' || v_annee || '-' || lpad(v_rang::text, 5, '0'),
    v_annee,
    v_rang,
    p_paiement_id,
    v_paiement.artisan_id,
    v_paiement.dossier_id,
    jsonb_build_object(
      'entreprise',  v_artisan.entreprise,
      'nom',         v_artisan.nom,
      'prenom',      v_artisan.prenom,
      'email',       v_artisan.email,
      'siret',       v_artisan.siret,
      'adresse',     v_artisan.adresse,
      'code_postal', v_artisan.code_postal,
      'ville',       v_artisan.ville
    ),
    jsonb_build_array(jsonb_build_object(
      'designation',    v_designation,
      'detail',         v_detail,
      'quantite',       1,
      'pu_ht_cents',    v_ht,
      'total_ht_cents', v_ht
    )),
    v_ht, p_tva_taux, v_tva, v_ttc,
    p_mention_tva
  )
  returning * into v_facture;

  return v_facture;
end;
$$;

-- L'émission n'appartient qu'au serveur (webhook Stripe, service-role).
revoke all on function public.emettre_facture(uuid, numeric, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS : l'artisan lit ses factures, personne ne les écrit depuis le client.
-- Aucune policy d'insertion/modification = tout refusé (service-role bypasse).
-- ---------------------------------------------------------------------------
alter table public.factures         enable row level security;
alter table public.facture_compteurs enable row level security;

drop policy if exists "artisan lit ses factures" on public.factures;
create policy "artisan lit ses factures" on public.factures
  for select to authenticated using (
    artisan_id in (
      select id from public.artisans where user_id = (select auth.uid())
    )
  );

-- facture_compteurs : aucune policy. Invisible et intouchable côté client.
