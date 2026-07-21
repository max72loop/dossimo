import { DISCLAIMER_DOSSIMO_COMPLET } from "@/lib/legal/mentions";

export function formatReminderMessage(input: { prenom: string; entreprise: string; documents: { label: string; reason?: string | null }[]; url: string }) {
  const list = input.documents.map((document) => `- ${document.label}${document.reason ? ` (à remplacer : ${document.reason})` : ""}`).join("\n");
  return {
    subject: `Documents manquants pour votre dossier de prime, ${input.entreprise}`,
    // La mention d'indépendance est obligatoire sur chaque e-mail transactionnel
    // (CLAUDE.md §2). Cet e-mail est signé par l'artisan (`entreprise`) mais transite
    // par Dossimo : le pied de message dit qui édite l'outil, ne dépose pas et ne
    // touche pas la prime — le bénéficiaire doit le savoir avant de déposer un RIB.
    body: `Bonjour ${input.prenom},\n\nIl manque encore ${input.documents.length > 1 ? "les documents suivants" : "le document suivant"} pour votre dossier de prime :\n${list}\n\nVous pouvez les déposer de façon sécurisée ici :\n${input.url}\n\nCe lien est personnel. Merci de ne pas le partager.\n\n${input.entreprise}\n\n${DISCLAIMER_DOSSIMO_COMPLET}`,
  };
}
