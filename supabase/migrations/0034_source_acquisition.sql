-- Attribution d'acquisition par canal (plan de lancement v3, section 12.5).
--
-- Le sprint de prospection pose un `utm_source` sur chaque lien envoyé
-- (dossimo.app/demo?utm_source=whatsapp|email). Sans mémoriser d'où vient un
-- artisan, l'A/B test WhatsApp vs e-mail est aveugle aux étapes qui comptent :
-- essais, dossiers créés, paiements. On stocke donc le canal d'origine.
--
-- Aucun mouchard, aucun tiers : la valeur est captée côté site en first-party
-- (sessionStorage), passée aux métadonnées de l'inscription, et figée ici. Le
-- champ est un simple libellé de canal (whatsapp, email, direct…), pas une
-- donnée de navigation.

-- ---------------------------------------------------------------------------
-- 1) Colonnes `source`
-- Sur l'artisan : attribution de premier contact (le canal qui a amené le
-- compte). Sur le dossier : figée à la création, héritée de l'artisan, pour
-- compter dossiers et paiements par canal sans jointure.
-- ---------------------------------------------------------------------------
alter table public.artisans add column if not exists source text;
alter table public.dossiers add column if not exists source text;

-- ---------------------------------------------------------------------------
-- 2) Le trigger de création de fiche recopie la source des métadonnées
-- La fiche artisan est créée par ce trigger au moment de l'inscription, à
-- partir de `raw_user_meta_data`. On y ajoute `source` : posée par le
-- formulaire d'inscription, elle survit même si la confirmation e-mail se fait
-- dans un autre onglet (le trigger tire des métadonnées, pas du sessionStorage).
-- `nullif(trim(...), '')` : une source absente reste NULL, jamais chaîne vide.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_artisan_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.artisans (user_id, entreprise, nom, prenom, email, telephone, source)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'entreprise'), ''), 'Entreprise à compléter'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nom'), ''), 'À compléter'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'prenom'), ''), 'À compléter'),
    coalesce(new.email, new.id::text || '@compte.local'),
    nullif(trim(new.raw_user_meta_data ->> 'telephone'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'source'), '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;
