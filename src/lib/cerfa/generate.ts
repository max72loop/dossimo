import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { PDFDocument } from "pdf-lib";

import type { DossierComplet } from "@/lib/dossier/get-dossier";
import { resolveCerfaTemplate, type CerfaTemplate } from "@/lib/cerfa/registry";
import { buildPlaceholderDoc } from "@/lib/cerfa/placeholder-template";
import { fillAndFlatten } from "@/lib/cerfa/fill";
import { fillByOverlay } from "@/lib/cerfa/overlay";
import { mapDossierToAhCee, mapDossierToMandatMpr } from "@/lib/cerfa/mapping";

export interface CerfaMeta {
  id: string;
  titre: string;
  arrete: string;
  version: string;
  official: boolean;
}

export type GenerateResult =
  | { ok: true; bytes: Uint8Array; meta: CerfaMeta }
  | { ok: false; reason: string };

const toMeta = (t: CerfaTemplate): CerfaMeta => ({
  id: t.id,
  titre: t.titre,
  arrete: t.arrete,
  version: t.version,
  official: t.official,
});

/** Date pertinente pour choisir la version : date de devis, sinon création. */
function referenceDate(data: DossierComplet): string {
  return data.dates?.devis || data.dossier.created_at;
}

function officialPath(t: CerfaTemplate): string {
  return path.join(process.cwd(), "public", "cerfa", t.file ?? `${t.id}.pdf`);
}

/**
 * Résout le modèle en vigueur pour un dossier (sans générer le PDF) — utilisé
 * par l'UI pour afficher titre / arrêté / version / garde-fou.
 */
export function resolveCerfaMeta(
  data: DossierComplet,
): { ok: true; meta: CerfaMeta } | { ok: false; reason: string } {
  const res = resolveCerfaTemplate(
    data.dossier.dispositif,
    data.caracteristiques?.fiche,
    referenceDate(data),
  );
  return res.ok ? { ok: true, meta: toMeta(res.template) } : res;
}

/**
 * Génère le formulaire officiel rempli pour un dossier, sur le modèle en vigueur
 * à la date pertinente. Deux stratégies selon le modèle : remplissage AcroForm
 * ou surimpression sur un PDF officiel statique. Refuse si aucun modèle n'est
 * enregistré (§8).
 */
export async function generateCerfa(data: DossierComplet): Promise<GenerateResult> {
  const res = resolveCerfaTemplate(
    data.dossier.dispositif,
    data.caracteristiques?.fiche,
    referenceDate(data),
  );
  if (!res.ok) return res;
  const t = res.template;

  if (t.strategy === "overlay") {
    const bytes = await fillByOverlay(
      new Uint8Array(await readFile(officialPath(t))),
      t.overlay ?? [],
      mapDossierToMandatMpr(data),
    );
    return { ok: true, bytes, meta: toMeta(t) };
  }

  // acroform : PDF officiel à champs si présent, sinon placeholder généré.
  const doc = t.official
    ? await PDFDocument.load(new Uint8Array(await readFile(officialPath(t))))
    : await buildPlaceholderDoc(t);
  const bytes = await fillAndFlatten(doc, mapDossierToAhCee(data));
  return { ok: true, bytes, meta: toMeta(t) };
}
