import { describe, expect, it } from "vitest";
import { isReminderSendWindow, nextReminder } from "@/lib/reminders/schedule";

const schedule = { enabled: true, enabledAt: new Date("2026-07-13T08:00:00.000Z"), cadenceDays: [0, 3, 7, 14], maxReminders: 4, optOutAt: null };

describe("moteur de relance", () => {
  it("programme J+0 puis J+3 sans rejouer une étape journalisée", () => {
    const now = new Date("2026-07-13T10:00:00.000Z");
    expect(nextReminder(schedule, [], now)?.cadenceStep).toBe(0);
    expect(nextReminder(schedule, [{ cadenceStep: 0, channel: "email" }], new Date("2026-07-16T10:00:00.000Z"))?.cadenceStep).toBe(1);
  });

  it("ne programme rien avant l'échéance, après désinscription ou hors créneau", () => {
    expect(nextReminder(schedule, [{ cadenceStep: 0, channel: "email" }], new Date("2026-07-14T10:00:00.000Z"))).toBeNull();
    expect(nextReminder({ ...schedule, optOutAt: new Date() }, [], new Date("2026-07-13T10:00:00.000Z"))).toBeNull();
    expect(isReminderSendWindow(new Date("2026-07-12T10:00:00.000Z"))).toBe(false);
    expect(isReminderSendWindow(new Date("2026-07-13T06:00:00.000Z"))).toBe(false);
  });
});
