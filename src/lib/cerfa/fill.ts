import "server-only";

import { type PDFDocument, StandardFonts } from "pdf-lib";

import type { CerfaValues } from "@/lib/cerfa/mapping";
import { winAnsiSafe } from "@/lib/cerfa/winansi";

/**
 * Remplit les champs (AcroForm) d'un document — qu'il vienne du modèle officiel
 * chargé ou du placeholder construit en mémoire — puis aplatit le formulaire
 * (valeurs figées, non éditables). Le remplissage opère sur le document fourni
 * (pas de save/reload intermédiaire) pour préserver le /DA des champs.
 * Les champs absents du modèle sont ignorés sans faire échouer la génération.
 */
export async function fillAndFlatten(
  doc: PDFDocument,
  values: CerfaValues,
): Promise<Uint8Array> {
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const form = doc.getForm();

  for (const [name, value] of Object.entries(values)) {
    try {
      if (typeof value === "boolean") {
        const cb = form.getCheckBox(name);
        if (value) cb.check();
        else cb.uncheck();
      } else if (value !== "" && value != null) {
        form.getTextField(name).setText(winAnsiSafe(String(value)));
      }
    } catch {
      // Champ non présent dans ce modèle : on l'ignore.
      console.warn(`[cerfa] champ ignoré (absent du modèle) : ${name}`);
    }
  }

  form.updateFieldAppearances(font);
  form.flatten();
  return doc.save();
}
