import { getDossier } from "@/lib/dossier/get-dossier";
import { verrouGesteDocumente, verrouLivrable } from "@/lib/dossier/acces";
import { packSlug, renderChecklistPdf } from "@/lib/pack/render";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await getDossier(id);
  if (!data) return new Response("Dossier introuvable", { status: 404 });

  const gesteVerrou = verrouGesteDocumente(data);
  if (gesteVerrou) return gesteVerrou;

  const verrou = await verrouLivrable(data);
  if (verrou) return verrou;

  const pdf = await renderChecklistPdf(data);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="checklist-${packSlug(data)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
