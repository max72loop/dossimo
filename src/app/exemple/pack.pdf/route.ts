import { DATE_CONTROLE_EXEMPLE, dossierExemple } from "@/lib/pack/exemple";
import {
  mergePdfs,
  renderChecklistPdf,
  renderControlePdf,
  renderPackCoverPdf,
  renderRecapPdf,
} from "@/lib/pack/render";
import { controlerDossier } from "@/lib/rules/controle-dossier";

export const runtime = "nodejs";

/**
 * Pack d'exemple, public et sans compte.
 *
 * Volontairement SANS les gardes de `/dossiers/[id]/pack.pdf` (auth, geste,
 * paiement) : il n'y a rien à garder. La route n'accepte aucun paramètre, ne
 * touche jamais la table `dossiers`, et rend un dossier fictif construit en
 * mémoire (`dossierExemple`). Aucune donnée d'artisan ou de bénéficiaire réel
 * ne peut transiter par ici.
 *
 * Le pack public s'arrête aux pièces DESCRIPTIVES — page de garde,
 * récapitulatif, rapport de contrôle, checklist. L'attestation de pré-contrôle
 * et le Cerfa en sont exclus : ils se signent et se déposent, et un spécimen
 * librement téléchargeable serait une pièce qu'on peut tenter de faire passer
 * pour un contrôle réel.
 *
 * Le rapport est produit par le vrai moteur (`controlerDossier`), à date figée :
 * ce que le visiteur lit est ce que le moteur dit, pas une maquette rédigée.
 */
export async function GET() {
  const data = await dossierExemple();
  const rapport = controlerDossier(data, DATE_CONTROLE_EXEMPLE);

  const [cover, recap, controle, checklist] = await Promise.all([
    renderPackCoverPdf(data, { rapport, hasVigilance: false }),
    renderRecapPdf(data),
    renderControlePdf(data, undefined, rapport),
    renderChecklistPdf(data),
  ]);

  const merged = await mergePdfs([cover, recap, controle, checklist]);

  return new Response(new Uint8Array(merged), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="dossimo-pack-exemple.pdf"',
      // Le pack ne dépend que du barème en base : une heure de cache CDN suffit
      // à absorber le trafic vitrine sans figer un changement de barème.
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
