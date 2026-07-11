import { ImageResponse } from "next/og";

/**
 * Carte de partage social (LinkedIn, WhatsApp, SMS — les canaux par lesquels un
 * artisan recommande un outil à un autre). Sans elle, chaque lien partagé affichait
 * un rectangle vide.
 *
 * Générée au build par `next/og`, aux couleurs de la marque (papier / encre / tampon).
 * `twitter-image.tsx` la réutilise telle quelle.
 */

export const alt =
  "Dossimo — des dossiers MaPrimeRénov' et CEE qui passent du premier coup";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPIER = "#f3f0e9";
const ENCRE = "#16202b";
const TAMPON = "#35507f";
const ARDOISE = "#5b636d";
const FILIGRANE = "#e2ddd1";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPIER,
          padding: "72px 80px",
          // Filet d'encre en pied : la signature « papeterie » de la marque.
          borderBottom: `16px solid ${ENCRE}`,
        }}
      >
        {/* Mot-signe : les deux « o » en bleu, comme le logo du site. */}
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: ENCRE }}>
          <span>d</span>
          <span style={{ color: TAMPON }}>o</span>
          <span>ssim</span>
          <span style={{ color: TAMPON }}>o</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              lineHeight: 1.12,
              fontWeight: 600,
              color: ENCRE,
              letterSpacing: "-0.02em",
            }}
          >
            Des dossiers de prime qui passent.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              lineHeight: 1.12,
              fontWeight: 600,
              color: TAMPON,
              letterSpacing: "-0.02em",
            }}
          >
            Du premier coup.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 30,
              lineHeight: 1.4,
              color: ARDOISE,
              maxWidth: 900,
            }}
          >
            MaPrimeRénov&apos; et CEE, vérifiés avant le dépôt. Sans mandataire :
            vous gardez votre client et votre prime.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            fontSize: 24,
            color: ENCRE,
            borderTop: `2px solid ${FILIGRANE}`,
            paddingTop: 28,
          }}
        >
          <span>Premier dossier offert</span>
          <span style={{ color: FILIGRANE }}>·</span>
          <span>Contrôle anti-refus</span>
          <span style={{ color: FILIGRANE }}>·</span>
          <span>Pack prêt à déposer</span>
        </div>
      </div>
    ),
    size,
  );
}
