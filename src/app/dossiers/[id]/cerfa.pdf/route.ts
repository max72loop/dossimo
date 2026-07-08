import { getDossier } from "@/lib/dossier/get-dossier";
import { verrouGesteDocumente, verrouLivrable } from "@/lib/dossier/acces";
import { generateCerfa } from "@/lib/cerfa/generate";
import { packSlug } from "@/lib/pack/render";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Auth-scopé : getDossier renvoie null si le dossier n'appartient pas à
  // l'artisan connecté (RLS).
  const data = await getDossier(id);
  if (!data) return new Response("Dossier introuvable", { status: 404 });

  const gesteVerrou = verrouGesteDocumente(data);
  if (gesteVerrou) return gesteVerrou;

  const verrou = await verrouLivrable(data);
  if (verrou) return verrou;

  let res;
  try {
    res = await generateCerfa(data);
  } catch (err) {
    console.error("[cerfa] génération:", err);
    return new Response("Erreur lors de la génération du formulaire.", {
      status: 500,
    });
  }

  if (!res.ok) {
    // Aucun modèle officiel en vigueur : on refuse de produire plutôt que de
    // deviner un modèle (§8).
    return new Response(res.reason, { status: 422 });
  }

  return new Response(new Uint8Array(res.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="cerfa-${packSlug(data)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
