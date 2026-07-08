"use server";

import { getDossier } from "@/lib/dossier/get-dossier";
import { isLlmConfigured } from "@/lib/llm/openrouter";
import { inspectAcroForm } from "@/lib/cerfa/acroform-inspect";
import {
  canonicalFacts,
  mapAhFields,
  fillUploadedAh,
} from "@/lib/cerfa/oblige-fill";

const TAILLE_MAX = 15 * 1024 * 1024; // 15 Mo

export type RemplirAhResult =
  | {
      ok: true;
      filledBase64: string;
      filename: string;
      appliedCount: number;
      totalFields: number;
      /** Libellés/noms des champs laissés vides faute de correspondance sûre. */
      laissesVides: string[];
    }
  | { ok: false; reason: string };

/**
 * Pré-remplit l'AH que l'obligé a remise à l'artisan, si c'est un PDF à champs.
 * Auth-scopé (getDossier via RLS). On ne remplit que ce qui matche la saisie avec
 * confiance — le reste reste vide, à compléter/vérifier par l'artisan. Le PDF
 * source n'est pas conservé : traitement en mémoire, on renvoie le PDF rempli.
 */
export async function remplirAhOblige(
  dossierId: string,
  formData: FormData,
): Promise<RemplirAhResult> {
  const data = await getDossier(dossierId);
  if (!data) return { ok: false, reason: "Dossier introuvable." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, reason: "Aucun fichier reçu." };
  }
  if (file.type !== "application/pdf") {
    return { ok: false, reason: "L'AH de l'obligé doit être un fichier PDF." };
  }
  if (file.size > TAILLE_MAX) {
    return { ok: false, reason: "Fichier trop volumineux (15 Mo max)." };
  }
  if (!isLlmConfigured()) {
    return {
      ok: false,
      reason: "Service d'appariement indisponible (LLM non configuré).",
    };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  let inspect;
  try {
    inspect = await inspectAcroForm(bytes);
  } catch {
    return {
      ok: false,
      reason: "PDF illisible ou protégé — impossible d'analyser ses champs.",
    };
  }

  if (!inspect.hasForm) {
    return {
      ok: false,
      reason:
        "Ce PDF n'est pas un formulaire à champs remplissable. Utilisez la reproduction Dossimo, ou faites-la remplir à la main.",
    };
  }

  const facts = canonicalFacts(data);

  let mappings;
  try {
    mappings = await mapAhFields(inspect.fields, facts);
  } catch (err) {
    console.error("[ah-oblige] mapping:", err);
    return {
      ok: false,
      reason: "L'appariement automatique a échoué. Réessayez.",
    };
  }

  const filled = await fillUploadedAh(bytes, mappings);

  const appliedSet = new Set(filled.applied);
  const laissesVides = inspect.fields
    .filter((f) => !appliedSet.has(f.name))
    .map((f) => f.tooltip || f.name);

  const base = file.name.replace(/\.pdf$/i, "");
  return {
    ok: true,
    filledBase64: Buffer.from(filled.bytes).toString("base64"),
    filename: `${base}-prerempli.pdf`,
    appliedCount: filled.applied.length,
    totalFields: inspect.fields.length,
    laissesVides,
  };
}
