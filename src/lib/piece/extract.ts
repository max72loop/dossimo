import "server-only";

import { z } from "zod";

import { isLlmConfigured, openRouterVision } from "@/lib/llm/openrouter";
import type { TypePiece } from "@/lib/database.types";

/**
 * Extraction des champs d'une pièce réelle (devis / facture) via un VLM.
 * Objectif : comparer ensuite ces valeurs à la saisie unique (vérification
 * croisée anti-refus). L'IA extrait, le code compare, l'artisan tranche.
 */

// Nombre tolérant aux formats FR : "4 200,00 €", "95 m²", "7,5" → number.
const frNum = z.preprocess((v) => {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const cleaned = v.replace(/\s| | /g, "").replace(/[^\d.,-]/g, "");
    const n = parseFloat(cleaned.replace(",", "."));
    return Number.isNaN(n) ? null : n;
  }
  return null;
}, z.number().nullable());

const str = z.preprocess(
  (v) => (typeof v === "string" && v.trim() ? v.trim() : null),
  z.string().nullable(),
);

const extractedSchema = z.object({
  beneficiaire_nom: str,
  adresse: str,
  code_postal: str,
  surface_isolee_m2: frNum,
  resistance_thermique_r: frNum,
  isolant_marque: str,
  isolant_reference: str,
  montant_ht: frNum,
  montant_ttc: frNum,
  date: str, // date du devis / de la facture, telle qu'écrite
  rge_numero: str,
  fiche: str, // ex. BAR-EN-101 si présent
});

export type ExtractedPiece = z.infer<typeof extractedSchema>;

export type ExtractResult =
  | { ok: true; data: ExtractedPiece }
  | { ok: false; reason: "non-configure" | "erreur"; message?: string };

const SYSTEM = `Tu es un moteur d'extraction de documents pour la conformité CEE / MaPrimeRénov'.
On te fournit un DEVIS ou une FACTURE de travaux d'isolation. Tu extrais uniquement ce qui est écrit, sans rien deviner.

Renvoie STRICTEMENT un JSON conforme à ce schéma (mets null si l'information n'est pas présente) :
{
  "beneficiaire_nom": "nom du client bénéficiaire",
  "adresse": "adresse du chantier",
  "code_postal": "code postal du chantier",
  "surface_isolee_m2": nombre (m² isolés),
  "resistance_thermique_r": nombre (résistance thermique R, m²·K/W),
  "isolant_marque": "marque de l'isolant",
  "isolant_reference": "référence produit de l'isolant",
  "montant_ht": nombre (total HT en euros),
  "montant_ttc": nombre (total TTC en euros),
  "date": "date du document (JJ/MM/AAAA)",
  "rge_numero": "numéro de qualification RGE de l'entreprise",
  "fiche": "fiche CEE si mentionnée (ex. BAR-EN-101)"
}
Les nombres sont des nombres (pas de symbole, séparateur décimal au choix). Aucune phrase autour du JSON.`;

function extractJson(raw: string): unknown {
  let s = raw.trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) s = fenced[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}

export async function extractPiece(params: {
  bytes: Uint8Array;
  mime: string;
  filename: string;
  type: TypePiece;
}): Promise<ExtractResult> {
  if (!isLlmConfigured()) return { ok: false, reason: "non-configure" };

  const label = params.type === "facture" ? "une FACTURE" : "un DEVIS";
  const dataUrl = `data:${params.mime};base64,${Buffer.from(params.bytes).toString("base64")}`;

  try {
    const raw = await openRouterVision({
      system: SYSTEM,
      userText: `Voici ${label} de travaux d'isolation. Extrais les champs demandés en JSON.`,
      file: { mime: params.mime, dataUrl, filename: params.filename },
      jsonMode: true,
      maxTokens: 1200,
    });
    const parsed = extractedSchema.safeParse(extractJson(raw));
    if (!parsed.success) {
      console.error("[piece] extraction inattendue:", parsed.error.message);
      return { ok: false, reason: "erreur", message: "Lecture du document impossible." };
    }
    return { ok: true, data: parsed.data };
  } catch (err) {
    console.error("[piece] extraction:", err);
    return {
      ok: false,
      reason: "erreur",
      message: "L'analyse du document a échoué. Réessayez avec un fichier plus lisible.",
    };
  }
}
