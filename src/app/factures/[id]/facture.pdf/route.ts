import { getFacture } from "@/lib/factures/get-facture";
import { renderFacturePdf } from "@/lib/factures/render";
import { mentionsIncompletes } from "@/lib/legal/editeur";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Auth-scopé : la RLS renvoie null pour la facture d'un autre artisan.
  const data = await getFacture(id);
  if (!data) return new Response("Facture introuvable", { status: 404 });

  // Sans identité d'émetteur (raison sociale, SIRET, adresse), le PDF porterait
  // « [À COMPLÉTER] » : une facture non conforme vaut moins que pas de facture.
  // La donnée, elle, est déjà figée en base et le PDF deviendra disponible dès
  // que `editeur.ts` sera renseigné.
  if (mentionsIncompletes()) {
    return new Response(
      "Facture indisponible : l'identité de l'émetteur n'est pas encore renseignée.",
      { status: 409 },
    );
  }

  const pdf = await renderFacturePdf(data);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${data.facture.numero}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
