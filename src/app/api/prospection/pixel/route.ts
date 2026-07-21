import { enregistrerOuverture } from "@/lib/prospection/file";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Pixel de suivi d'ouverture, servi en première partie depuis dossimo.app.
 *
 * `?t=<jeton>` : le message de prospection embarque `<img src=".../pixel?t=…">`.
 * Au chargement de l'image, on journalise une ouverture côté serveur, attribuée
 * au prospect par son jeton. Volontairement non authentifiée : le jeton EST
 * l'autorisation, et il ne donne accès à rien d'autre que ce compteur.
 *
 * Deux garde-fous : la réponse est TOUJOURS le GIF 1×1 (jamais une erreur qui
 * afficherait une image cassée dans le mail), et le suivi ne bloque jamais le
 * rendu. À lire avec le bémol connu du procédé : le préchargement d'images de
 * Gmail/Apple Mail déclenche le pixel sans lecture réelle, la mesure est donc un
 * indicateur, pas une vérité.
 */

// GIF transparent 1×1, la plus petite image valide (43 octets).
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("t");
  if (token) {
    try {
      await enregistrerOuverture(token);
    } catch (err) {
      // Le suivi ne doit jamais casser l'affichage du mail.
      console.error("[prospection] ouverture non journalisée:", err);
    }
  }

  return new Response(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL.length),
      // Sans cela, un mandataire de messagerie mettrait l'image en cache et une
      // seconde ouverture ne rappellerait jamais la route.
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
