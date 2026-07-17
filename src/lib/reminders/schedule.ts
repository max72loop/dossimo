export const DEFAULT_CADENCE_DAYS = [0, 3, 7, 14] as const;

export type ReminderSchedule = {
  enabled: boolean;
  enabledAt: Date | null;
  cadenceDays: readonly number[];
  maxReminders: number;
  optOutAt: Date | null;
};

export type ReminderLog = { cadenceStep: number; channel: "email" | "sms" | "manual" };

export type NextReminder = { cadenceStep: number; dueAt: Date };

/** Ligne brute de `reminder_schedules` (snake_case, `cadence_days` en jsonb). */
export type ReminderScheduleRow = {
  enabled: boolean;
  enabled_at: string | null;
  cadence_days: unknown;
  max_reminders: number | null;
  opt_out_at: string | null;
} | null;

/** Convertit un `cadence_days` jsonb en tableau de jours sûr, retombe sur le défaut. */
function lireCadence(value: unknown): number[] {
  return Array.isArray(value) && value.every((n) => typeof n === "number")
    ? (value as number[])
    : [...DEFAULT_CADENCE_DAYS];
}

/** Cartographie une ligne brute (ou son absence) vers un `ReminderSchedule`. */
export function scheduleFromRow(row: ReminderScheduleRow): ReminderSchedule {
  return {
    enabled: row?.enabled ?? false,
    enabledAt: row?.enabled_at ? new Date(row.enabled_at) : null,
    cadenceDays: lireCadence(row?.cadence_days),
    maxReminders: row?.max_reminders ?? DEFAULT_CADENCE_DAYS.length,
    optOutAt: row?.opt_out_at ? new Date(row.opt_out_at) : null,
  };
}

function parisParts(now: Date) {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

/** Envoi autorisé de 9 h inclus à 19 h exclu, jamais le dimanche (heure de Paris). */
export function isReminderSendWindow(now: Date): boolean {
  const parts = parisParts(now);
  const hour = Number(parts.hour);
  return !parts.weekday.startsWith("dim") && hour >= 9 && hour < 19;
}

/**
 * Renvoie la prochaine étape à traiter. La présence d'un log, même si le job a
 * été interrompu, réserve l'étape : le cron peut être relancé sans doublonner.
 */
/**
 * `ignoreWindow` : en relance assistée, l'artisan est l'expéditeur et consigne
 * quand il veut (un dimanche soir compris) ; la fenêtre 9h-19h/hors dimanche ne
 * garde que l'auto-envoi serveur (phase 2), qui l'active en la laissant à false.
 */
export function nextReminder(
  schedule: ReminderSchedule,
  logs: readonly ReminderLog[],
  now: Date,
  options?: { ignoreWindow?: boolean },
): NextReminder | null {
  if (!schedule.enabled || !schedule.enabledAt || schedule.optOutAt) return null;
  if (!options?.ignoreWindow && !isReminderSendWindow(now)) return null;
  const steps = schedule.cadenceDays.slice(0, schedule.maxReminders);
  for (let index = 0; index < steps.length; index += 1) {
    if (logs.some((log) => log.cadenceStep === index)) continue;
    const dueAt = new Date(schedule.enabledAt.getTime() + steps[index] * 86_400_000);
    if (now >= dueAt) return { cadenceStep: index, dueAt };
    return null;
  }
  return null;
}
