import "server-only";

import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";

import type { DossierComplet } from "@/lib/dossier/get-dossier";
import {
  ChecklistDocument,
  ControleDocument,
  RecapDocument,
} from "@/lib/pack/documents";
import { controlerDossierCeeIsolation } from "@/lib/rules/cee-isolation";
import type { PointVigilance } from "@/lib/llm/vigilance";

// renderToBuffer type son argument comme un élément <Document> ; nos wrappers
// paramétrés déclenchent un faux positif → cast vers le type attendu.
type DocElement = Parameters<typeof renderToBuffer>[0];

export function renderRecapPdf(data: DossierComplet): Promise<Buffer> {
  return renderToBuffer(createElement(RecapDocument, { data }) as unknown as DocElement);
}

export function renderChecklistPdf(data: DossierComplet): Promise<Buffer> {
  return renderToBuffer(createElement(ChecklistDocument, { data }) as unknown as DocElement);
}

export function renderControlePdf(
  data: DossierComplet,
  vigilance?: PointVigilance[],
): Promise<Buffer> {
  const rapport = controlerDossierCeeIsolation(data);
  return renderToBuffer(
    createElement(ControleDocument, {
      data,
      rapport,
      vigilance,
    }) as unknown as DocElement,
  );
}

/** Slug de fichier à partir du nom du bénéficiaire. */
export function packSlug(data: DossierComplet): string {
  const { prenom, nom } = data.caracteristiques.beneficiaire;
  return `${prenom}-${nom}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les diacritiques
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
