-- Rendre visible, dans `prospects_dossimo`, ce que la campagne AUTOMATIQUE a fait.
--
-- LE TROU QU'ELLE BOUCHE
-- Deux systèmes contactent les mêmes artisans et ne se parlent pas :
--   - le sprint MANUEL écrit dans `prospects_dossimo` (`canal`, `date_envoi`) ;
--   - la campagne AUTOMATIQUE (0032) écrit dans `prospects` / `prospection_messages`,
--     alimentée depuis `prospects_dossimo` par
--     `supabase/scripts/prospection_import_depuis_prospects_dossimo.sql`.
-- Au 27/07/2026 : 215 messages réellement envoyés côté automatique, et
-- `prospects_dossimo` n'en portait aucune trace (9 `date_envoi`, tous manuels).
-- Lire le fichier de prospection ne disait donc PAS qui avait été contacté, et le
-- tirage du sprint (`prospect_dossimo_tirage.sql`, qui pioche dans `canal is null`)
-- pouvait rassigner à un bras manuel un artisan déjà démarché par e-mail.
--
-- POURQUOI DEUX COLONNES ET PAS `canal` / `date_envoi`
-- Verser ces contacts dans `canal = 'email'` aurait fait trois dégâts :
--   1. l'A/B du sprint compare 150 e-mails à 150 WhatsApp tirés au sort ; y verser
--      215 contacts d'une autre campagne, sélectionnés autrement, invalide la
--      comparaison (`src/lib/sprint/pilotage.ts`) ;
--   2. `date_envoi` renseignée rend éligible au lot de RELANCE J+5 du sprint
--      (`src/lib/sprint/lot.ts`), alors que la campagne automatique a été conçue
--      SANS relance (0032) : 215 artisans auraient reçu un second message ;
--   3. `date_envoi` est écrite par un humain qui déclare son envoi ; ces colonnes-ci
--      sont écrites par la machine qui l'a fait. Le pilotage distingue déjà le
--      déclaratif du factuel, on ne les mélange pas.
--
-- La source de vérité reste `prospection_messages`. Ces colonnes en sont un reflet,
-- écrit au moment de l'envoi par `envoyerProchain` (src/lib/prospection/file.ts) et
-- rattrapable à tout moment, sans perte, par
-- `supabase/scripts/prospects_dossimo_rattrapage_contact_auto.sql`.

alter table public.prospects_dossimo
  -- Jour (heure de Paris) où le message automatique est sorti de la boîte.
  add column if not exists contact_auto_le date,
  -- 'envoye' : parti, confirmé par Gmail.
  -- 'echec'  : l'appel a échoué APRÈS la réservation optimiste. Le message a pu
  --            partir quand même (cf. `envoyerProchain`) : on le traite comme un
  --            contact, jamais comme un contact à refaire.
  add column if not exists contact_auto_statut text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.prospects_dossimo'::regclass
      and conname = 'prospects_dossimo_contact_auto_statut_check'
  ) then
    alter table public.prospects_dossimo
      add constraint prospects_dossimo_contact_auto_statut_check
      check (contact_auto_statut is null or contact_auto_statut in ('envoye', 'echec'));
  end if;
end $$;

-- Sert les exclusions « déjà démarché » du tirage et des lots : on ne lit que les
-- lignes contactées, minoritaires dans une table de 3 300 contacts.
create index if not exists prospects_dossimo_contact_auto_idx
  on public.prospects_dossimo (contact_auto_le)
  where contact_auto_le is not null;

comment on column public.prospects_dossimo.contact_auto_le is
  'Jour (Paris) du message envoyé par la campagne automatique (0032). '
  'Distinct de date_envoi, qui est le sprint manuel. Null = jamais démarché par cette voie.';
comment on column public.prospects_dossimo.contact_auto_statut is
  'envoye | echec. « echec » vaut contact : le message a pu partir malgré l''erreur.';
