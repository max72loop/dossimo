import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  nextReminder,
  scheduleFromRow,
  type NextReminder,
  type ReminderLog,
} from "@/lib/reminders/schedule";

export type EtatRelance = {
  /** Les relances sont activées sur ce dossier. */
  active: boolean;
  /** Le bénéficiaire s'est désinscrit : plus aucune relance ne doit être proposée. */
  desinscrit: boolean;
  /** Nombre de relances déjà consignées. */
  envoyees: number;
  /** Plafond de relances pour ce dossier. */
  plafond: number;
  /** L'étape due maintenant, ou null (pas encore l'heure, hors fenêtre, plafond atteint). */
  due: NextReminder | null;
};

/**
 * État de relance d'un dossier, vu de l'artisan. RLS-scopé : les deux tables
 * n'exposent que les dossiers de l'artisan authentifié, `chargerEtatRelance` ne
 * sert donc jamais l'état d'un dossier qui n'est pas le sien.
 *
 * Pur côté décision : toute la logique d'échéance vit dans `schedule.ts`, ici on
 * ne fait que charger et cartographier. `now` est injectable pour les tests.
 */
export async function chargerEtatRelance(
  dossierId: string,
  now: Date = new Date(),
): Promise<EtatRelance> {
  const supabase = await createClient();
  const [{ data: sched }, { data: logs }] = await Promise.all([
    supabase
      .from("reminder_schedules")
      .select("enabled,enabled_at,cadence_days,max_reminders,opt_out_at")
      .eq("dossier_id", dossierId)
      .maybeSingle(),
    supabase.from("reminder_logs").select("cadence_step,channel").eq("dossier_id", dossierId),
  ]);

  const schedule = scheduleFromRow(sched ?? null);
  const mappedLogs: ReminderLog[] = (logs ?? []).map((l) => ({
    cadenceStep: l.cadence_step,
    channel: l.channel,
  }));

  return {
    active: schedule.enabled && !schedule.optOutAt,
    desinscrit: Boolean(schedule.optOutAt),
    envoyees: mappedLogs.length,
    plafond: schedule.maxReminders,
    due: nextReminder(schedule, mappedLogs, now, { ignoreWindow: true }),
  };
}
