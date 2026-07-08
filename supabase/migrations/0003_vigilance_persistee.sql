-- Points de vigilance rédigés (LLM) persistés par dossier.
--
-- Objectif : générer l'analyse assistée UNE fois (appel LLM ~coûteux/lent), puis
-- l'afficher instantanément à chaque visite et l'inclure dans le rapport PDF sans
-- re-générer. La régénération reste possible à la demande.
--
-- Pas de changement de RLS : la table `dossiers` est déjà protégée (un artisan ne
-- voit que ses dossiers via artisans.user_id = auth.uid()).

alter table public.dossiers
  add column if not exists vigilance_json jsonb,
  add column if not exists vigilance_at timestamptz;

comment on column public.dossiers.vigilance_json is
  'Points de vigilance rédigés par le LLM (tableau JSON), persistés pour affichage et rapport.';
comment on column public.dossiers.vigilance_at is
  'Horodatage de la dernière génération des points de vigilance.';
