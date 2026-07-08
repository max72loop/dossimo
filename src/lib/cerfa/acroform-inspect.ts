import "server-only";

import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFRadioGroup,
  PDFOptionList,
  PDFName,
  PDFString,
  PDFHexString,
} from "pdf-lib";

/**
 * Inspection des champs (AcroForm) d'un PDF téléversé — l'AH que l'obligé
 * remet à l'artisan. On extrait, pour chaque champ, son nom technique, son type,
 * son libellé lisible (tooltip /TU si présent) et ses options éventuelles. Cette
 * métadonnée est ensuite donnée au LLM pour le mapping vers la saisie.
 */

export type FieldType =
  | "text"
  | "checkbox"
  | "dropdown"
  | "radio"
  | "optionlist"
  | "other";

export interface AcroFieldInfo {
  name: string;
  type: FieldType;
  tooltip?: string;
  options?: string[];
}

export interface InspectResult {
  hasForm: boolean;
  fields: AcroFieldInfo[];
}

/** Libellé lisible du champ (entrée /TU « alternate field name ») si présent. */
function tooltipOf(field: { acroField: { dict: unknown } }): string | undefined {
  try {
    const dict = field.acroField.dict as {
      lookup: (k: PDFName) => unknown;
    };
    const tu = dict.lookup(PDFName.of("TU"));
    if (tu instanceof PDFString || tu instanceof PDFHexString) {
      const s = tu.decodeText().trim();
      return s || undefined;
    }
  } catch {
    // pas de tooltip exploitable
  }
  return undefined;
}

/** Charge le PDF et énumère ses champs de formulaire. */
export async function inspectAcroForm(bytes: Uint8Array): Promise<InspectResult> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = doc.getForm();
  const fields = form.getFields();

  const infos: AcroFieldInfo[] = fields.map((field) => {
    const name = field.getName();
    const tooltip = tooltipOf(field as unknown as { acroField: { dict: unknown } });

    if (field instanceof PDFTextField) return { name, type: "text", tooltip };
    if (field instanceof PDFCheckBox) return { name, type: "checkbox", tooltip };
    if (field instanceof PDFDropdown)
      return { name, type: "dropdown", tooltip, options: safeOptions(field) };
    if (field instanceof PDFRadioGroup)
      return { name, type: "radio", tooltip, options: safeOptions(field) };
    if (field instanceof PDFOptionList)
      return { name, type: "optionlist", tooltip, options: safeOptions(field) };
    return { name, type: "other", tooltip };
  });

  return { hasForm: infos.length > 0, fields: infos };
}

function safeOptions(field: {
  getOptions: () => string[];
}): string[] | undefined {
  try {
    const o = field.getOptions();
    return o.length ? o : undefined;
  } catch {
    return undefined;
  }
}
