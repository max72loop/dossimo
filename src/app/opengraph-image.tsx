import { ImageResponse } from "next/og";

import {
  DECLINAISONS,
  LOCKUP_VIEWBOX,
  MOT_SIGNE_D,
  RATIO_LOCKUP,
  SYMBOLE_D,
  ZONE_PROTECTION,
} from "@/lib/brand/mark";

/**
 * Carte de partage social (LinkedIn, WhatsApp, SMS — les canaux par lesquels un
 * artisan recommande un outil à un autre). Sans elle, chaque lien partagé affichait
 * un rectangle vide.
 *
 * Générée au build par `next/og`, aux couleurs de la marque (papier / encre / tampon).
 * `twitter-image.tsx` la réutilise telle quelle.
 *
 * Le logo vient de `@/lib/brand/mark`, comme partout ailleurs. Avant la refonte du
 * 2026-07-25, cette carte redessinait le mot-signe en texte (`d` + `o` bleu + …) :
 * une deuxième définition du logo, qui a survécu telle quelle à un changement de
 * palette et affichait donc un logo que le site n'utilisait plus.
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

/** Hauteur du logo sur la carte, en pixels de l'image 1200 × 630. */
const LOGO_H = 46;

/**
 * Zone de protection du logo (DESIGN.md §5), appliquée et non recopiée : rien ne
 * s'approche du signe à moins de la moitié de sa hauteur. C'est la seule surface
 * du produit dont la composition autour du logo est fixée au pixel, donc le seul
 * endroit où la règle peut être tenue par le code plutôt que par la vigilance.
 */
const GARDE = Math.round(LOGO_H * ZONE_PROTECTION);

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
        <svg
          width={Math.round(LOGO_H * RATIO_LOCKUP)}
          height={LOGO_H}
          viewBox={LOCKUP_VIEWBOX}
          style={{ marginBottom: GARDE }}
        >
          <path fill={DECLINAISONS.encre.symbole} d={SYMBOLE_D} />
          <path fill={DECLINAISONS.encre.motSigne} d={MOT_SIGNE_D} />
        </svg>

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
          <span>Code DOSSIMO50 · −50 %</span>
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
