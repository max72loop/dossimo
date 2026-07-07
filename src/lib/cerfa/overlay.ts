import "server-only";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import type { OverlaySpec } from "@/lib/cerfa/registry";
import type { CerfaValues } from "@/lib/cerfa/mapping";
import { winAnsiSafe } from "@/lib/cerfa/winansi";

/**
 * Surimprime des valeurs sur un PDF officiel STATIQUE (sans champ), aux
 * coordonnées mesurées. On ne modifie pas la structure du document officiel :
 * on ajoute uniquement du texte par-dessus les pages existantes.
 */
export async function fillByOverlay(
  officialBytes: Uint8Array,
  specs: readonly OverlaySpec[],
  values: CerfaValues,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(officialBytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const ink = rgb(0.05, 0.06, 0.12);

  for (const spec of specs) {
    const value = values[spec.key];
    if (value == null || value === "" || value === false) continue;
    const page = pages[spec.page];
    if (!page) continue;
    page.drawText(winAnsiSafe(String(value)), {
      x: spec.x,
      y: spec.y,
      size: spec.size ?? 9,
      font,
      color: ink,
    });
  }

  return doc.save();
}
