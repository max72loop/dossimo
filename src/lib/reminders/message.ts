export function formatReminderMessage(input: { prenom: string; entreprise: string; documents: { label: string; reason?: string | null }[]; url: string }) {
  const list = input.documents.map((document) => `- ${document.label}${document.reason ? ` (à remplacer : ${document.reason})` : ""}`).join("\n");
  return {
    subject: `Documents manquants pour votre dossier de prime, ${input.entreprise}`,
    body: `Bonjour ${input.prenom},\n\nIl manque encore ${input.documents.length > 1 ? "les documents suivants" : "le document suivant"} pour votre dossier de prime :\n${list}\n\nVous pouvez les déposer de façon sécurisée ici :\n${input.url}\n\nCe lien est personnel. Merci de ne pas le partager.\n\n${input.entreprise}`,
  };
}
