import { getDossier } from "@/lib/dossier/get-dossier";
import { verrouGesteDocumente, verrouLivrable } from "@/lib/dossier/acces";
import { packSlug, renderFeuilleRoutePdf } from "@/lib/pack/render";
import { feuilleRoute } from "@/lib/dossier/feuille-route";
import { rapportComplet } from "@/lib/dossier/rapport";
import { checklistDossier, resumePieces } from "@/lib/piece/checklist";

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

  const { pieces } = await rapportComplet(data);
  const resume = resumePieces(
    checklistDossier(
      data,
      pieces.map((p) => p.piece),
    ),
  );

  const pdf = await renderFeuilleRoutePdf(data, feuilleRoute(data), resume);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="feuille-route-${packSlug(data)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
