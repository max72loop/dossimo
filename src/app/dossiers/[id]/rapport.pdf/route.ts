import { getDossier } from "@/lib/dossier/get-dossier";
import { packSlug, renderControlePdf } from "@/lib/pack/render";
import { generateVigilancePoints } from "@/lib/llm/vigilance";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await getDossier(id);
  if (!data) return new Response("Dossier introuvable", { status: 404 });

  // Points de vigilance rédigés (LLM) en best-effort : le rapport se génère
  // avec ou sans eux (non configuré / erreur → simplement omis).
  const vig = await generateVigilancePoints(data);
  const pdf = await renderControlePdf(data, vig.ok ? vig.points : undefined);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="rapport-controle-${packSlug(data)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
