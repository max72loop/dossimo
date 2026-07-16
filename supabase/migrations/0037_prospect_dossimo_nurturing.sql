-- Nurturing mensuel du fichier de prospection (plan de lancement v3, sections 7 et 12).
--
-- La 0033 a posé `date_envoi` (premier contact) et `date_relance` (relance J+5),
-- mais rien pour le nurturing : or celui-ci est RÉCURRENT (une édition par mois),
-- là où les deux autres sont uniques. Sans date du dernier envoi de nurturing, on
-- ne peut ni exclure ceux qui ont déjà reçu l'édition du mois, ni étaler les
-- envois sur 2-3 jours sans doublon. D'où cette colonne.
--
-- Même garde-fou que la 0033 : `prospects_dossimo` a été créée à la main (import
-- hors migrations), donc un environnement neuf (`supabase db reset`, CI) ne la
-- connaît pas. Le bloc s'auto-ignore si la table est absente.

do $$
begin
  if to_regclass('public.prospects_dossimo') is null then
    raise notice 'prospects_dossimo absente (table hors migrations) : 0037 ignorée.';
    return;
  end if;

  -- Date du dernier envoi de nurturing. NULL = n'en a jamais reçu.
  -- La cadence est mensuelle par ÉDITION (une par mois civil), pas par fenêtre
  -- glissante de 30 jours : un contact est éligible dès que sa dernière date de
  -- nurturing est antérieure au 1er du mois courant.
  alter table public.prospects_dossimo
    add column if not exists date_nurturing date;

  -- Le lot du jour filtre sur ces dates à chaque chargement de la console.
  -- Index partiels : seules les lignes assignées à un canal sont interrogées.
  create index if not exists prospects_dossimo_nurturing_idx
    on public.prospects_dossimo (date_nurturing)
    where canal is not null;

  create index if not exists prospects_dossimo_relance_idx
    on public.prospects_dossimo (date_envoi, date_relance)
    where canal is not null;
end $$;
