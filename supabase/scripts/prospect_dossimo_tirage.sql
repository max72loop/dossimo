-- Tirage aléatoire des groupes du sprint de prospection (plan v3, section 11).
--
-- À EXÉCUTER UNE SEULE FOIS, À LA MAIN, dans l'éditeur SQL Supabase, au
-- démarrage du sprint (après `0033_prospect_dossimo_suivi.sql` et, idéalement,
-- après la validation des e-mails du fichier).
--
-- Ce fichier n'est PAS une migration : `supabase db push` n'applique que
-- `supabase/migrations/*.sql`. On le garde hors des migrations car c'est une
-- opération de DONNÉES non déterministe (`random()`), pas du schéma : la mettre
-- dans une migration versionnée la rendrait non rejouable et l'exécuterait au
-- mauvais moment.
--
-- Clé de la table : `place_id` (identifiant Google Places).
--
-- Le tirage aléatoire est ce qui rend l'A/B test valable : pas de tri manuel.
-- Il n'assigne que les lignes encore libres (`canal IS NULL`) et non désinscrites,
-- donc le relancer n'écrase jamais une assignation ni un opt-out existant : il
-- complète seulement les nouveaux contacts.

with tirage as (
  select place_id, row_number() over (order by random()) as rn
  from public.prospects_dossimo
  where opt_out is not true and canal is null
)
update public.prospects_dossimo p
set canal = case when t.rn <= 150 then 'email' else 'whatsapp' end
from tirage t
where p.place_id = t.place_id and t.rn <= 300;

-- Contrôle : répartition obtenue.
-- select canal, count(*) from public.prospects_dossimo group by canal;
