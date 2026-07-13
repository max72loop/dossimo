import { describe, expect, it } from "vitest";
import { formatReminderMessage } from "@/lib/reminders/message";

describe("message de relance", () => {
  it("regroupe les pièces et conserve le motif de rejet", () => {
    const message = formatReminderMessage({ prenom: "Léa", entreprise: "Martin Énergie", url: "https://dossimo.app/depot/token", documents: [{ label: "Votre RIB" }, { label: "Votre avis d’imposition", reason: "photo illisible" }] });
    expect(message.subject).toContain("Martin Énergie");
    expect(message.body).toContain("Votre RIB");
    expect(message.body).toContain("photo illisible");
  });
});
