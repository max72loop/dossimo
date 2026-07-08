import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { PDFDocument } from "pdf-lib";

import type { DossierComplet } from "@/lib/dossier/get-dossier";
import {
  resolveCerfaTemplate,
  type CerfaTemplate,
  type CerfaKind,
} from "@/lib/cerfa/registry";
import { fillAndFlatten } from "@/lib/cerfa/fill";
import { fillByOverlay } from "@/lib/cerfa/overlay";
import { mapDossierToAhCee, mapDossierToMandatMpr } from "@/lib/cerfa/mapping";
import { renderAhCeePdf } from "@/lib/pack/render";

export interface CerfaMeta {
  id: string;
  titre: string;
  arrete: string;
  version: string;
  official: boolean;
  kind: CerfaKind;
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
  kind: t.kind,
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

  if (t.strategy === "reproduction") {
    // Reproduction fidèle du modèle réglementaire (React-PDF), pré-remplie.
    const buf = await renderAhCeePdf(data, {
      titre: t.titre,
      arrete: t.arrete,
      version: t.version,
      variant: t.ahVariant ?? "p5",
      // Référence de fiche pilotée par la règle métier (§7/§8) : correcte pour
      // chaque fiche (BAR-EN-101/102/103), au lieu d'une valeur codée en dur.
      ficheRef: data.regle?.versionFormulaire ?? data.caracteristiques.fiche,
    });
    return { ok: true, bytes: new Uint8Array(buf), meta: toMeta(t) };
  }

  // acroform : PDF officiel réel à champs (déposé dans public/cerfa/).
  const doc = await PDFDocument.load(
    new Uint8Array(await readFile(officialPath(t))),
  );
  const bytes = await fillAndFlatten(doc, mapDossierToAhCee(data));
  return { ok: true, bytes, meta: toMeta(t) };
}
