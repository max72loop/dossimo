import { getDossier } from "@/lib/dossier/get-dossier";
import { verrouGesteDocumente, verrouLivrable } from "@/lib/dossier/acces";
import { packSlug, renderFicheClientPdf } from "@/lib/pack/render";
import { rapportComplet } from "@/lib/dossier/rapport";
import { estimerPrime } from "@/lib/dossier/prime";
import { piecesAttendues } from "@/lib/depot/pieces-attendues";

export const runtime = "nodejs";

/**
 * Fiche client à remettre au bénéficiaire. Générée côté artisan (auth-scopée),
 * PAS exposée sur la page de dépôt publique : cette dernière est volontairement
 * muette sur les montants (si le lien fuite, il ne révèle rien). La prime n'a
 * donc sa place que sur ce document que l'artisan remet en main propre.
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

  const { pieces } = await rapportComplet(data);
  // Une pièce rejetée n'est pas une pièce reçue (même logique que la checklist).
  const presents = new Set(
    pieces
      .filter((p) => p.piece.validation_status !== "rejected")
      .map((p) => p.piece.type),
  );
  const piecesClient = piecesAttendues(data).map((p) => ({
    titre: p.titre,
    deposee: presents.has(p.type),
  }));

  const primeMontant =
    data.caracteristiques.montants.prime_estime ??
    estimerPrime(data)?.montant ??
    null;

  const pdf = await renderFicheClientPdf(data, primeMontant, piecesClient);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="fiche-client-${packSlug(data)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
