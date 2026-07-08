import { getDossier } from "@/lib/dossier/get-dossier";
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

  // On inclut les points de vigilance DÉJÀ générés (persistés). On ne les
  // (re)génère pas ici : ça ajouterait un appel LLM lent au téléchargement du
  // rapport. S'ils n'ont pas encore été générés depuis l'espace dossier, le
  // rapport se produit simplement sans la section assistée.
  const stored = storedVigilance(data);
  const pdf = await renderControlePdf(data, stored?.points);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="rapport-controle-${packSlug(data)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
