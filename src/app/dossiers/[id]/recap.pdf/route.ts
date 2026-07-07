import { getDossier } from "@/lib/dossier/get-dossier";
import { packSlug, renderRecapPdf } from "@/lib/pack/render";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await getDossier(id);
  if (!data) return new Response("Dossier introuvable", { status: 404 });

  const pdf = await renderRecapPdf(data);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recap-${packSlug(data)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
