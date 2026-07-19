import "server-only";

import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import type { DossierComplet } from "@/lib/dossier/get-dossier";
import {
  AttestationControleDocument,
  ChecklistDocument,
  ControleDocument,
  FeuilleRouteDocument,
  FicheClientDocument,
  PackCoverDocument,
  RecapDocument,
} from "@/lib/pack/documents";
import type { FeuilleRoute } from "@/lib/dossier/feuille-route";
import { controlerDossier } from "@/lib/rules/controle-dossier";
import type { RapportControle } from "@/lib/rules/types";
import {
  AttestationHonneurDocument,
  type AhRef,
} from "@/lib/cerfa/ah-document";
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

export function renderFeuilleRoutePdf(
  data: DossierComplet,
  feuille: FeuilleRoute,
  pieces?: { reunies: number; total: number; manquantes: string[] },
): Promise<Buffer> {
  return renderToBuffer(
    createElement(FeuilleRouteDocument, { data, feuille, pieces }) as unknown as DocElement,
  );
}

/**
 * Rapport de contrôle. `rapport` doit venir de `rapportComplet()` (saisie + pièces
 * réelles) : sans lui, on retombe sur le contrôle de la seule saisie, qui ignore les
 * écarts et les mentions manquantes relevés sur le devis et la facture.
 */
export function renderControlePdf(
  data: DossierComplet,
  vigilance?: PointVigilance[],
  rapport?: RapportControle,
): Promise<Buffer> {
  return renderToBuffer(
    createElement(ControleDocument, {
      data,
      rapport: rapport ?? controlerDossier(data),
      vigilance,
    }) as unknown as DocElement,
  );
}

export function renderAhCeePdf(
  data: DossierComplet,
  ref: AhRef,
): Promise<Buffer> {
  return renderToBuffer(
    createElement(AttestationHonneurDocument, {
      data,
      template: ref,
    }) as unknown as DocElement,
  );
}

/**
 * Fiche client : la pièce destinée au bénéficiaire, que l'artisan lui remet.
 * Ton grand public, la prime et les étapes à sa charge. `primeMontant` est le
 * montant retenu (ou estimé) ; `pieces` liste ses justificatifs et leur état.
 */
export function renderFicheClientPdf(
  data: DossierComplet,
  primeMontant: number | null,
  pieces: { titre: string; deposee: boolean }[],
): Promise<Buffer> {
  return renderToBuffer(
    createElement(FicheClientDocument, {
      data,
      primeMontant,
      pieces,
    }) as unknown as DocElement,
  );
}

/**
 * Attestation de pré-contrôle : preuve datée du passage du contrôle Dossimo.
 * `rapport` doit venir de `rapportComplet()` pour porter le même verdict que
 * l'écran. `dateControle` est la date de délivrance (ISO yyyy-mm-dd).
 */
export function renderAttestationPdf(
  data: DossierComplet,
  rapport: RapportControle,
  dateControle: string,
): Promise<Buffer> {
  return renderToBuffer(
    createElement(AttestationControleDocument, {
      data,
      rapport,
      dateControle,
    }) as unknown as DocElement,
  );
}

export function renderPackCoverPdf(
  data: DossierComplet,
  opts: { rapport: RapportControle; cerfaTitre?: string; hasVigilance: boolean },
): Promise<Buffer> {
  return renderToBuffer(
    createElement(PackCoverDocument, { data, ...opts }) as unknown as DocElement,
  );
}

/**
 * Concatène plusieurs PDF (déjà rendus) en un seul, dans l'ordre fourni.
 * Sert à assembler le pack complet en un unique fichier téléchargeable.
 */
export async function mergePdfs(
  parts: Array<Uint8Array | Buffer>,
): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const part of parts) {
    const src = await PDFDocument.load(
      part instanceof Buffer ? new Uint8Array(part) : part,
    );
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const page of pages) out.addPage(page);
  }
  return out.save();
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
