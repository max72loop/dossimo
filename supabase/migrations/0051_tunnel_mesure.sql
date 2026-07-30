-- ---------------------------------------------------------------------------
-- Tunnel d'entreprise : mesurer ce qui se vend, pas seulement ce qui se
-- construit.
--
-- Le produit savait déjà compter les contacts (`prospects_dossimo`), les
-- inscriptions (`artisans.source`), les dossiers, les paiements et l'issue du
-- dépôt (`retours_depot`). Trois maillons manquaient, et ce sont ceux qui
-- décident de la rentabilité :
--
--   1. L'ESSAI. `analyserDevisInitial` posait un cookie et n'écrivait rien :
--      un artisan qui dépose un devis, voit le résultat et repart ne laissait
--      aucune trace. C'est exactement l'étape où le parcours se perd.
--   2. LE COÛT. `postChat` lisait `choices[0]` et jetait `usage` : recettes
--      connues, dépenses inconnues, donc aucune marge calculable par palier.
--   3. LA REPRISE. `retours_depot` sait dire accepté ou refusé, pas « accepté
--      après qu'on m'a demandé de corriger ». La métrique principale du
--      pilote — dossier payé PUIS accepté SANS reprise — était incalculable.
--
-- Deux tables neuves + deux colonnes. Aucune donnée nominative n'y entre : ni
-- nom, ni e-mail, ni adresse IP, ni identifiant de visiteur. Un événement
-- d'essai anonyme est un compteur, pas une personne (RGPD : pas de traceur, pas
-- de profil, donc rien à purger ni à faire exercer).
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Table: evenements_parcours
-- Les étapes du tunnel qu'aucune table ne portait. Volontairement pauvre : un
-- type, un rattachement facultatif, un motif. Tout ce qui est déjà déductible
-- d'une autre table (inscription, dossier, paiement) N'A PAS à être dupliqué
-- ici : deux sources pour un même chiffre est la garantie qu'elles divergeront.
-- ---------------------------------------------------------------------------
create table if not exists public.evenements_parcours (
  id          uuid primary key default gen_random_uuid(),
  -- text + check plutôt qu'un enum : `alter type ... add value` ne s'annule pas
  -- dans une transaction (README §6).
  type        text not null check (type in (
                'essai_commence',   -- un devis a été soumis à la lecture
                'devis_lu',         -- la lecture a abouti
                'devis_echec',      -- la lecture a échoué : `motif` dit pourquoi
                'assistance'        -- temps humain passé, saisi à la main
              )),
  -- Nuls quand l'essai est anonyme : c'est le cas le plus intéressant à mesurer,
  -- pas une anomalie.
  dossier_id  uuid references public.dossiers (id) on delete set null,
  artisan_id  uuid references public.artisans (id) on delete set null,
  -- Attribution utm, même vocabulaire que `artisans.source` / `dossiers.source`.
  source      text,
  -- `devis_echec` : 'non_configure' | 'illisible' | 'service_indisponible'.
  -- La distinction n'est pas cosmétique : un service tombé et un document
  -- illisible appellent deux décisions opposées.
  motif       text,
  -- `assistance` uniquement : minutes de temps humain passées sur le dossier.
  minutes     integer check (minutes is null or minutes >= 0),
  detail_json jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists evenements_parcours_type_date_idx
  on public.evenements_parcours (type, created_at desc);
create index if not exists evenements_parcours_dossier_idx
  on public.evenements_parcours (dossier_id);

comment on table public.evenements_parcours is
  'Étapes du tunnel commercial absentes des tables métier (essai, lecture de devis, temps d assistance). Aucune donnée nominative, aucun identifiant de visiteur.';

-- ---------------------------------------------------------------------------
-- Table: appels_llm
-- Un appel = une ligne. Sans elle, le coût de production d un dossier est une
-- inconnue et la grille 49/149/249 € ne se juge sur rien.
--
-- Le coût est stocké en MICRO-USD entier, pas en cents : un appel coûte de
-- l ordre de 0,0004 $, qu un arrondi au cent ramènerait à zéro. C est la même
-- discipline que « argent en cents » (README §6) — un entier, jamais un
-- flottant — à l échelle des sommes réellement manipulées ici.
--
-- Nullable à dessein : tous les fournisseurs ne renvoient pas le coût. Un coût
-- inconnu reste inconnu et s affiche « — ». On n en invente jamais un à partir
-- d une grille tarifaire recopiée dans le code (AGENTS.md).
-- ---------------------------------------------------------------------------
create table if not exists public.appels_llm (
  id             uuid primary key default gen_random_uuid(),
  dossier_id     uuid references public.dossiers (id) on delete set null,
  artisan_id     uuid references public.artisans (id) on delete set null,
  -- D'où part l'appel : 'extraction_devis', 'mentions', 'avis_imposition',
  -- 'vigilance', 'cerfa_oblige', 'admin_nl', 'inconnu'. Pas de `check` : la
  -- liste bougera plus vite qu'une migration, et un contexte inattendu doit
  -- être enregistré, pas rejeté au point d'échouer l'appel qu'il mesure.
  contexte       text not null,
  modele         text not null,
  tokens_entree  integer not null default 0 check (tokens_entree >= 0),
  tokens_sortie  integer not null default 0 check (tokens_sortie >= 0),
  cout_micro_usd integer check (cout_micro_usd is null or cout_micro_usd >= 0),
  created_at     timestamptz not null default now()
);

create index if not exists appels_llm_dossier_idx on public.appels_llm (dossier_id);
create index if not exists appels_llm_date_idx on public.appels_llm (created_at desc);

comment on table public.appels_llm is
  'Consommation LLM par appel, rattachée au dossier quand il existe. Base du coût de production et de la marge réelle par palier. Coût en micro-USD entier ; NULL = non communiqué par le fournisseur, jamais estimé.';

-- ---------------------------------------------------------------------------
-- Sécurité : RLS activée, AUCUNE policy = service-role uniquement.
-- Intentionnel, au même titre que `leads`, `prospects*` et `facture_compteurs`
-- (README §4) : ce sont des tables de pilotage interne, l'artisan n'a rien à y
-- lire ni à y écrire. Le `revoke` est la ceinture : Supabase accorde `grant all`
-- à `anon`/`authenticated` par défaut sur `public`, et la RLS seule ferme la
-- porte — deux verrous valent mieux qu'un.
-- ---------------------------------------------------------------------------
alter table public.evenements_parcours enable row level security;
alter table public.appels_llm enable row level security;

revoke all on public.evenements_parcours from anon, authenticated;
revoke all on public.appels_llm from anon, authenticated;

-- ---------------------------------------------------------------------------
-- retours_depot : la reprise.
--
-- `reprise_demandee` est un booléen NULLABLE SANS DÉFAUT, et c'est le point
-- important. Un `default false` transformerait d'un coup tous les retours déjà
-- saisis en « accepté sans reprise » : le produit fabriquerait lui-même la
-- preuve de sa propre réussite. NULL = la question n'a pas été posée.
--
-- Pas de `revoke update` + `grant update (colonnes)` ici, contrairement à
-- `artisans` (0031) et `dossiers` (0045) : ces deux tables portent des colonnes
-- que leur propriétaire ne doit pas pouvoir réécrire (solde de crédits, prix).
-- `retours_depot` n'en a aucune — chacune de ses colonnes EST la déclaration de
-- l'artisan. La règle 5 du README demande de chercher les jumeaux ; celui-ci
-- n'en est pas un, et c'est écrit ici pour que la question ne se repose pas.
-- ---------------------------------------------------------------------------
alter table public.retours_depot
  add column if not exists reprise_demandee boolean,
  add column if not exists motif_reprise    text;

comment on column public.retours_depot.reprise_demandee is
  'L organisme a-t-il demandé une correction avant d accepter ? NULL = non renseigné (ne jamais compter comme un « sans reprise »).';

notify pgrst, 'reload schema';
