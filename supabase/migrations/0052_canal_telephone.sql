-- Faire exister le canal TÉLÉPHONE, des deux côtés de la prospection.
--
-- LE TROU QU'ELLE BOUCHE
-- Le fichier ADEME alimente deux systèmes, et chacun sait dire « celui-là est à
-- moi, n'y touche pas » : `prospects_dossimo.canal` réserve un contact à un bras
-- du sprint manuel (0033), `prospects.statut` le sort de la file d'envoi
-- automatique (0032). Aucun des deux ne sait dire « réservé au téléphone ». Un
-- contact retenu pour un appel reste donc `canal is null` d'un côté et
-- `statut = 'nouveau'` de l'autre, c'est-à-dire disponible pour les DEUX : le
-- tirage (`supabase/scripts/prospect_dossimo_tirage.sql`) peut l'assigner à un
-- bras, et `preparerFile` (src/lib/prospection/file.ts) peut lui envoyer un
-- e-mail le lendemain de l'appel. C'est le même angle mort que la 0050 a bouché
-- entre les deux systèmes, vu depuis un troisième canal.
--
-- POURQUOI PAS `exclu`
-- `prospects.statut = 'exclu'` existe déjà et sortirait bien le contact de la
-- file. Mais `filtrerExclus` (src/lib/prospection/file.ts) ne l'écrit que dans
-- deux cas, tous deux définitifs : opposition enregistrée, ou artisan déjà
-- client. Y verser un contact simplement mis de côté pour un appel, c'est perdre
-- la raison : plus personne ne distingue ensuite « on n'a pas le droit » de « on
-- s'en occupe autrement », et rendre le contact à la file si l'appel ne donne
-- rien devient un pari.
--
-- CE QUE `telephone` NE FAIT PAS
-- `CanalSprint` (src/lib/sprint/lot.ts) reste 'whatsapp' | 'email', et ne doit
-- pas bouger : l'A/B du sprint compare deux bras tirés au sort, le téléphone
-- n'en est pas un troisième — il est choisi à la main, donc jamais comparable.
-- Toutes les lectures de `lot.ts` et `pilotage.ts` filtrent sur
-- `eq("canal", canal)` avec ces deux valeurs : une ligne `telephone` leur est
-- invisible, et c'est voulu. Elle reste en revanche visible dans la couverture
-- du fichier (`ChiffresFichier`, pilotage.ts), qui ne regarde pas le canal : un
-- appel passé pose `date_envoi` comme un envoi manuel, et compte donc pour ce
-- qu'il est, un contact.

-- 1) Fichier de prospection : `telephone` devient une valeur légitime de `canal`.
--
-- La colonne était `text` nu depuis la 0033, tenue par la seule discipline des
-- appelants. On pose la contrainte maintenant qu'une troisième valeur arrive :
-- c'est le moment où une faute de frappe ('tel', 'téléphone') cesserait d'être
-- visible, puisqu'une valeur inconnue n'apparaît dans AUCUN écran — ni dans les
-- lots (filtrés sur email/whatsapp), ni dans le tirage (filtré sur `canal is
-- null`). Elle rendrait le contact durablement intouchable, en silence.
-- Vérifié avant écriture : la table ne contient que null, 'email', 'whatsapp'.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.prospects_dossimo'::regclass
      and conname = 'prospects_dossimo_canal_check'
  ) then
    alter table public.prospects_dossimo
      add constraint prospects_dossimo_canal_check
      check (canal is null or canal in ('email', 'whatsapp', 'telephone'));
  end if;
end $$;

comment on column public.prospects_dossimo.canal is
  'email | whatsapp : les deux bras tirés au sort du sprint A/B. '
  'telephone : contact réservé à un appel, choisi à la main, hors A/B. '
  'null = libre, donc éligible au tirage et à l''import vers la file automatique.';

-- 2) File automatique : un contact réservé au téléphone en sort.
--
-- `preparerFile` et `etatFile` puisent dans `statut = 'nouveau'` : toute autre
-- valeur suffit à mettre le contact hors de portée de l'envoi automatique. On
-- élargit donc la contrainte plutôt que de détourner une valeur existante.
--
-- Le `drop` porte sur une contrainte CHECK, pas sur des données, et la nouvelle
-- liste est un SUR-ENSEMBLE strict de l'ancienne : aucune ligne existante ne peut
-- la violer. Les deux ordres partent dans la même transaction de migration, donc
-- la table n'est jamais sans contrainte pour une autre session. C'est la seule
-- façon d'élargir une CHECK en Postgres ; ce n'est pas la réécriture d'une
-- migration appliquée que l'AGENTS.md interdit, la 0032 reste intacte.
alter table public.prospects drop constraint if exists prospects_statut_check;
alter table public.prospects add constraint prospects_statut_check
  check (statut in (
    'nouveau', 'en_file', 'contacte', 'repondu', 'desinscrit', 'bounce', 'exclu',
    'reserve_telephone'
  ));

comment on column public.prospects.statut is
  'nouveau = disponible pour l''envoi automatique (seule valeur que preparerFile lit). '
  'reserve_telephone = mis de côté pour un appel, réversible : le remettre à '
  '« nouveau » le rend à la file. À ne pas confondre avec « exclu », qui est '
  'définitif (opposition enregistrée ou artisan déjà client).';
