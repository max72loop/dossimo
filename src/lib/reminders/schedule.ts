export const DEFAULT_CADENCE_DAYS = [0, 3, 7, 14] as const;

export type ReminderSchedule = {
  enabled: boolean;
  enabledAt: Date | null;
  cadenceDays: readonly number[];
  maxReminders: number;
  optOutAt: Date | null;
};

export type ReminderLog = { cadenceStep: number; channel: "email" | "sms" };

export type NextReminder = { cadenceStep: number; dueAt: Date };

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
export function nextReminder(schedule: ReminderSchedule, logs: readonly ReminderLog[], now: Date): NextReminder | null {
  if (!schedule.enabled || !schedule.enabledAt || schedule.optOutAt || !isReminderSendWindow(now)) return null;
  const steps = schedule.cadenceDays.slice(0, schedule.maxReminders);
  for (let index = 0; index < steps.length; index += 1) {
    if (logs.some((log) => log.cadenceStep === index)) continue;
    const dueAt = new Date(schedule.enabledAt.getTime() + steps[index] * 86_400_000);
    if (now >= dueAt) return { cadenceStep: index, dueAt };
    return null;
  }
  return null;
}
