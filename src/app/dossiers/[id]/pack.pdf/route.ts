import { getDossier } from "@/lib/dossier/get-dossier";
import { rapportComplet } from "@/lib/dossier/rapport";
import {
  mergePdfs,
  packSlug,
  renderChecklistPdf,
  renderControlePdf,
  renderPackCoverPdf,
  renderRecapPdf,
} from "@/lib/pack/render";
import { generateCerfa } from "@/lib/cerfa/generate";
import { storedVigilance } from "@/lib/llm/vigilance";
import { verrouGesteDocumente, verrouLivrable } from "@/lib/dossier/acces";

export const runtime = "nodejs";

/**
 * Pack documentaire complet en un seul PDF : page de garde + récapitulatif +
 * rapport de contrôle (avec les points de vigilance déjà générés) + checklist +
 * formulaire officiel (AH reproduction / mandat MPR). Auth-scopé via getDossier.
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

  const stored = storedVigilance(data);
  // Saisie + pièces réelles : la page de garde et le rapport du pack portent le
  // même verdict que l'écran, écarts et mentions manquantes compris.
  const { rapport } = await rapportComplet(data);

  // Le formulaire officiel peut ne pas être résolu (aucun modèle en vigueur) :
  // le pack reste produit sans lui, plutôt que d'échouer.
  const cerfa = await generateCerfa(data);

  const [cover, recap, controle, checklist] = await Promise.all([
    renderPackCoverPdf(data, {
      rapport,
      cerfaTitre: cerfa.ok ? cerfa.meta.titre : undefined,
      hasVigilance: !!stored && stored.points.length > 0,
    }),
    renderRecapPdf(data),
    renderControlePdf(data, stored?.points, rapport),
    renderChecklistPdf(data),
  ]);

  const parts: Array<Uint8Array | Buffer> = [cover, recap, controle, checklist];
  if (cerfa.ok) parts.push(cerfa.bytes);

  const merged = await mergePdfs(parts);

  return new Response(new Uint8Array(merged), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="pack-${packSlug(data)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
