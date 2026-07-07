import "server-only";

import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

import type { CerfaTemplate } from "@/lib/cerfa/registry";
import { winAnsiSafe } from "@/lib/cerfa/winansi";

/**
 * Construit un modele PDF a champs (AcroForm) pour un template donne, tant que
 * le PDF officiel n'est pas depose. Les noms de champs correspondent EXACTEMENT
 * a `template.fields` -> le moteur de remplissage les retrouve. Un filigrane
 * « MODELE NON OFFICIEL » interdit toute confusion avec le document reglementaire.
 */
export async function buildPlaceholderDoc(
  template: CerfaTemplate,
): Promise<PDFDocument> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const form = doc.getForm();

  const A4: [number, number] = [595.28, 841.89];
  const ink = rgb(0.1, 0.12, 0.17);
  const muted = rgb(0.35, 0.4, 0.45);
  const line = rgb(0.75, 0.75, 0.72);
  const warn = rgb(0.7, 0.2, 0.15);

  const draw = (
    page: ReturnType<typeof doc.addPage>,
    text: string,
    opts: Parameters<ReturnType<typeof doc.addPage>["drawText"]>[1],
  ) => page.drawText(winAnsiSafe(text), opts);

  const stamp = (page: ReturnType<typeof doc.addPage>) =>
    draw(page, "MODELE NON OFFICIEL", {
      x: 60,
      y: 430,
      size: 34,
      font: bold,
      color: warn,
      rotate: degrees(35),
      opacity: 0.12,
    });

  let page = doc.addPage(A4);
  stamp(page);
  draw(page, template.titre, { x: 40, y: 800, size: 14, font: bold, color: ink });
  draw(page, `${template.arrete} - version ${template.version}`, {
    x: 40,
    y: 784,
    size: 8,
    font,
    color: muted,
  });
  draw(
    page,
    "Document de travail genere par Dossimo - a remplacer par le formulaire officiel avant depot.",
    { x: 40, y: 772, size: 7, font, color: warn },
  );

  let y = 745;
  for (const f of template.fields ?? []) {
    if (y < 70) {
      page = doc.addPage(A4);
      stamp(page);
      y = 795;
    }
    if (f.type === "check") {
      const cb = form.createCheckBox(f.name);
      cb.addToPage(page, {
        x: 40,
        y: y - 1,
        width: 12,
        height: 12,
        borderWidth: 1,
        borderColor: line,
      });
      draw(page, f.label, { x: 58, y, size: 9, font, color: ink });
      y -= 28;
    } else {
      draw(page, f.label, { x: 40, y: y + 15, size: 8, font, color: muted });
      const tf = form.createTextField(f.name);
      tf.addToPage(page, {
        x: 40,
        y: y - 4,
        width: 515,
        height: 17,
        borderWidth: 1,
        borderColor: line,
        backgroundColor: rgb(0.99, 0.99, 0.98),
      });
      // Après addToPage : appeler setFontSize avant corromprait le /DA du champ.
      tf.setFontSize(10);
      y -= 38;
    }
  }

  // Le remplissage (setText + updateFieldAppearances) se fait dans CE document,
  // où pdf-lib gère la police par défaut des champs — un save/reload perdrait
  // le /DA et ferait échouer le remplissage.
  return doc;
}
