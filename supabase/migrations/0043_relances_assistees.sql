-- Phase 1 des relances « pièce manquante » assistées.
--
-- L'app détecte l'échéance et l'artisan reste l'expéditeur (WhatsApp / SMS /
-- copie) ; il consigne son envoi, ce qui réserve l'étape et fait avancer la
-- cadence. Jusqu'ici `reminder_logs` n'était jamais écrite (cf. supabase/README §8).
--
-- Deux ajustements, tous deux additifs :
--   1. autoriser le canal 'manual' : l'artisan n'envoie ni par 'email' ni par
--      'sms' côté serveur, c'est lui qui envoie depuis son propre outil ;
--   2. ouvrir l'INSERT du journal à l'artisan propriétaire — 0027 n'avait ouvert
--      que le SELECT, donc consigner une relance était impossible sous RLS.

alter table public.reminder_logs drop constraint if exists reminder_logs_channel_check;
alter table public.reminder_logs
  add constraint reminder_logs_channel_check check (channel in ('email', 'sms', 'manual'));

drop policy if exists "artisan consigne ses relances" on public.reminder_logs;
create policy "artisan consigne ses relances"
  on public.reminder_logs for insert to authenticated
  with check (exists (
    select 1 from public.dossiers d
    join public.artisans a on a.id = d.artisan_id
    where d.id = dossier_id and a.user_id = (select auth.uid())
  ));
