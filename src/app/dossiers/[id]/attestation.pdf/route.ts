import { getDossier } from "@/lib/dossier/get-dossier";
import { verrouGesteDocumente, verrouLivrable } from "@/lib/dossier/acces";
import { packSlug, renderAttestationPdf } from "@/lib/pack/render";
import { rapportComplet } from "@/lib/dossier/rapport";

export const runtime = "nodejs";

/**
 * Attestation de pré-contrôle : preuve datée que le dossier a passé le contrôle
 * anti-refus de Dossimo. Le verdict vient de `rapportComplet` (saisie + pièces
 * réelles) : il ne peut pas contredire l'écran ni le rapport du pack.
 */
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

  const { rapport } = await rapportComplet(data);
  const dateControle = new Date().toISOString().slice(0, 10);

  const pdf = await renderAttestationPdf(data, rapport, dateControle);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="attestation-controle-${packSlug(data)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
