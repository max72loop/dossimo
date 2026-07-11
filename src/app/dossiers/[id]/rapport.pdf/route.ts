import { getDossier } from "@/lib/dossier/get-dossier";
import { rapportComplet } from "@/lib/dossier/rapport";
import { verrouLivrable } from "@/lib/dossier/acces";
import { packSlug, renderControlePdf } from "@/lib/pack/render";
import { storedVigilance } from "@/lib/llm/vigilance";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await getDossier(id);
  if (!data) return new Response("Dossier introuvable", { status: 404 });

  const verrou = await verrouLivrable(data);
  if (verrou) return verrou;

  // On inclut les points de vigilance DÉJÀ générés (persistés). On ne les
  // (re)génère pas ici : ça ajouterait un appel LLM lent au téléchargement du
  // rapport. S'ils n'ont pas encore été générés depuis l'espace dossier, le
  // rapport se produit simplement sans la section assistée.
  const stored = storedVigilance(data);
  // Rapport complet : saisie + pièces réelles (écarts, mentions manquantes,
  // concordance devis/facture). Le livrable dit ce que la page affiche.
  const { rapport } = await rapportComplet(data);
  const pdf = await renderControlePdf(data, stored?.points, rapport);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="rapport-controle-${packSlug(data)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
