-- Dépôt des pièces par le BÉNÉFICIAIRE, via un lien partagé par l'artisan.
--
-- Contrainte produit : l'artisan ne doit rien avoir à gérer. Il génère un lien,
-- l'envoie à son client par le canal qu'il utilise déjà (WhatsApp, SMS), et les
-- pièces atterrissent dans le dossier, lues et contrôlées. Aucun compte à créer
-- pour le bénéficiaire, aucun e-mail à envoyer par Dossimo.
--
-- Contrainte de sécurité : cette URL publique collecte de l'avis d'imposition, du
-- RIB et de l'identité. Le token n'est donc JAMAIS stocké en clair (seul son SHA-256
-- l'est), il expire, il est révocable, et il n'ouvre AUCUNE policy anonyme sur les
-- données : le dépôt passe par le service-role, côté serveur, après résolution du
-- token — le même patron que la capture de leads.

-- 1. Qui a déposé la pièce ------------------------------------------------------

alter table public.pieces_justificatives
  add column if not exists deposant text not null default 'artisan'
    check (deposant in ('artisan', 'beneficiaire'));

comment on column public.pieces_justificatives.deposant is
  'Origine de la pièce. « beneficiaire » = déposée via un lien de dépôt, sans session.';

-- 2. Les liens de dépôt ---------------------------------------------------------

create table if not exists public.liens_depot (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  -- SHA-256 du token, en hexadécimal. Le token en clair n'existe qu'une fois, dans
  -- la réponse à l'artisan qui le génère : une fuite de la base ne donne aucun accès.
  token_hash text not null unique,
  expire_at timestamptz not null,
  revoque_at timestamptz,
  derniere_visite_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists liens_depot_dossier_id_idx
  on public.liens_depot (dossier_id);
create index if not exists liens_depot_token_hash_idx
  on public.liens_depot (token_hash);

alter table public.liens_depot enable row level security;

-- L'artisan gère les liens de SES dossiers (créer, lister, révoquer). Le bénéficiaire,
-- lui, n'a aucun rôle en base : il ne lit rien, il n'écrit rien. Le serveur résout son
-- token en service-role et agit pour lui.
create policy "artisan gere les liens de ses dossiers"
  on public.liens_depot
  for all
  to authenticated
  using (
    dossier_id in (
      select d.id from public.dossiers d
      join public.artisans a on a.id = d.artisan_id
      where a.user_id = (select auth.uid())
    )
  )
  with check (
    dossier_id in (
      select d.id from public.dossiers d
      join public.artisans a on a.id = d.artisan_id
      where a.user_id = (select auth.uid())
    )
  );

-- 3. Plafonds de ressources -----------------------------------------------------
--
-- Ce qui permet de JUGER l'avis d'imposition déposé : le revenu fiscal de référence
-- lu sur le document est-il cohérent avec la catégorie de revenus déclarée au dossier ?
-- Une précarité surestimée fait recalculer toute la prime à l'instruction.
--
-- Table éditable et versionnée (CLAUDE.md §7/§8) : ces plafonds sont révisés chaque
-- année par arrêté. Les coder en dur reviendrait à fabriquer le refus qu'on prétend
-- éviter, dès la première révision.

create table if not exists public.plafonds_ressources (
  id uuid primary key default gen_random_uuid(),
  -- Année du barème (celle de la demande, pas celle des revenus).
  annee int not null,
  -- 'idf' (Paris + petite/grande couronne) ou 'hors_idf' : les plafonds diffèrent.
  zone text not null check (zone in ('idf', 'hors_idf')),
  -- Nombre de personnes composant le ménage. La dernière ligne (personnes = 0) porte
  -- l'incrément « par personne supplémentaire » au-delà de 5.
  personnes int not null,
  -- Plafonds de RFR, en euros. En dessous de `grande_precarite` : ménage très modeste.
  -- Entre les deux : modeste. Au-dessus de `precaire` : revenus classiques.
  plafond_grande_precarite int not null,
  plafond_precaire int not null,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  unique (annee, zone, personnes)
);

alter table public.plafonds_ressources enable row level security;

-- Barème public : tout artisan connecté le lit. Personne ne l'écrit depuis l'app.
create policy "plafonds lisibles"
  on public.plafonds_ressources
  for select
  to authenticated
  using (actif);

-- Barème 2026 — RFR de l'année N-1 (revenus 2025).
-- « grande_precarite » = plafond Bleu (très modeste) ; « precaire » = plafond Jaune
-- (modeste). Au-delà : classique. Source : service-public.gouv.fr, fiche F35083.
insert into public.plafonds_ressources
  (annee, zone, personnes, plafond_grande_precarite, plafond_precaire)
values
  (2026, 'hors_idf', 1, 17363, 22259),
  (2026, 'hors_idf', 2, 25393, 32553),
  (2026, 'hors_idf', 3, 30540, 39148),
  (2026, 'hors_idf', 4, 35676, 45735),
  (2026, 'hors_idf', 5, 40835, 52348),
  (2026, 'hors_idf', 0,  5151,  6598), -- par personne supplémentaire
  (2026, 'idf', 1, 24031, 29253),
  (2026, 'idf', 2, 35270, 42933),
  (2026, 'idf', 3, 42357, 51564),
  (2026, 'idf', 4, 49455, 60208),
  (2026, 'idf', 5, 56580, 68877),
  (2026, 'idf', 0,  7116,  8663)       -- par personne supplémentaire
on conflict (annee, zone, personnes) do nothing;
