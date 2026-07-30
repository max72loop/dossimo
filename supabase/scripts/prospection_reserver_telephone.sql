-- Réserve des contacts du fichier ADEME à la prospection TÉLÉPHONIQUE.
--
-- À EXÉCUTER À LA MAIN dans l'éditeur SQL Supabase, comme le tirage et l'import.
-- Pas une migration : c'est une opération de DONNÉES (quels contacts, choisis
-- quand), pas du schéma. Le schéma qu'elle suppose vient de la migration 0052.
--
-- POURQUOI DEUX ÉCRITURES, ET LES DEUX COMPTENT
-- Le même artisan existe dans deux tables qui décident chacune de leur côté qui
-- démarcher. Réserver dans une seule ne réserve rien :
--   1. `prospects_dossimo.canal = 'telephone'` le sort du tirage du sprint
--      (`prospect_dossimo_tirage.sql`, qui pioche dans `canal is null`) et de
--      l'import vers la file automatique (`prospection_import_…sql`, même filtre) ;
--   2. `prospects.statut = 'reserve_telephone'` le sort de la file automatique
--      elle-même (`preparerFile`, src/lib/prospection/file.ts, lit `nouveau`),
--      pour la ligne DÉJÀ importée — l'import passé ne se rejoue pas en arrière.
-- Sans la seconde, un contact appelé le matin reçoit l'e-mail automatique le
-- lendemain. C'est l'accident que la 0050 a documenté, vu depuis le téléphone.
--
-- Le lien entre les deux tables est le `place_id`, recopié dans `prospects.notes`
-- à l'import (« … place_id=<id> »). C'est la seule jointure disponible, et elle
-- est fiable : `prospection_import_depuis_prospects_dossimo.sql` l'écrit toujours.
--
-- APRÈS L'APPEL : poser `date_envoi` sur la ligne `prospects_dossimo` (le jour de
-- l'appel), et `reponse = true` si l'artisan a répondu. Ce sont les mêmes colonnes
-- que le sprint manuel, et c'est ce qui fait basculer le contact de « jamais
-- contacté » à « contacté » dans le pilotage (`ChiffresFichier`), qui ne regarde
-- pas le canal. Un STOP passe par `marquerStop` (src/lib/sprint/actions.ts), pas
-- par ici : l'opposition doit atterrir dans `prospection_suppressions`.
--
-- POUR RENDRE UN CONTACT À LA FILE (appel sans suite, mauvais numéro), l'inverse
-- exact, en bas de ce fichier.

-- --- Réservation -------------------------------------------------------------
-- Remplacer la liste par les `place_id` visés. Le filtre `canal is null` est une
-- ceinture : on ne vole jamais un contact déjà assigné à un bras du sprint, et
-- relancer le script est donc sans effet sur les lignes déjà réservées.
with cibles(place_id) as (
  values
    ('ademe:41346429800053'),  -- LES TROIS ARCS, Boulogne-Billancourt (92100)
    ('ademe:90795204800037'),  -- ITAL-ISOL, Saint-Pierre-du-Perray (91280)
    ('ademe:95261147300010')   -- ECOWAVE, Paris 4e (75004)
)
update public.prospects_dossimo p
set canal = 'telephone'
from cibles c
where p.place_id = c.place_id
  and p.canal is null
  and p.opt_out is not true;

-- La ligne jumelle côté file automatique, retrouvée par le place_id des notes.
-- `statut = 'nouveau'` : on ne touche ni à un message déjà en file, ni à un
-- contact déjà parti — dans ces deux cas il est trop tard pour réserver, et
-- l'écraser masquerait un envoi réel.
update public.prospects
set statut = 'reserve_telephone'
where statut = 'nouveau'
  and split_part(notes, 'place_id=', 2) in (
    'ademe:41346429800053',
    'ademe:90795204800037',
    'ademe:95261147300010'
  );

-- Contrôle : les trois doivent apparaître réservées des deux côtés.
-- select p.place_id, p.name, p.canal, p.date_envoi, x.statut
-- from public.prospects_dossimo p
-- left join public.prospects x on split_part(x.notes, 'place_id=', 2) = p.place_id
-- where p.canal = 'telephone';

-- --- Rendre un contact à la file (inverse) -----------------------------------
-- update public.prospects_dossimo set canal = null
--   where place_id = '<place_id>' and canal = 'telephone' and date_envoi is null;
-- update public.prospects set statut = 'nouveau'
--   where statut = 'reserve_telephone' and split_part(notes, 'place_id=', 2) = '<place_id>';
