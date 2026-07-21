import { describe, expect, it } from "vitest";
import { formatReminderMessage } from "@/lib/reminders/message";

describe("message de relance", () => {
  it("regroupe les pièces et conserve le motif de rejet", () => {
    const message = formatReminderMessage({ prenom: "Léa", entreprise: "Martin Énergie", url: "https://dossimo.app/depot/token", documents: [{ label: "Votre RIB" }, { label: "Votre avis d’imposition", reason: "photo illisible" }] });
    expect(message.subject).toContain("Martin Énergie");
    expect(message.body).toContain("Votre RIB");
    expect(message.body).toContain("photo illisible");
  });

  it("porte la mention d'indépendance obligatoire (CLAUDE.md §2)", () => {
    // Seul e-mail transactionnel qui l'oubliait. Un bénéficiaire dépose son RIB et son
    // avis d'imposition depuis ce message : il doit savoir que Dossimo n'est pas l'Anah.
    const message = formatReminderMessage({ prenom: "Léa", entreprise: "Martin Énergie", url: "https://dossimo.app/depot/token", documents: [{ label: "Votre RIB" }] });
    expect(message.body).toContain("non affilié à l'Anah ni à France Rénov'");
    expect(message.body).toContain("ne dépose pas le dossier");
  });
});
