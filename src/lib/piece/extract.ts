import "server-only";

import { z } from "zod";

import { isLlmConfigured, openRouterVision } from "@/lib/llm/openrouter";
import type { Famille } from "@/lib/dossier/cee-isolation";
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

/**
 * Un seul schéma pour toutes les familles : tous les champs sont nullables, et le
 * modèle ne se voit demander que ceux de la famille du dossier (les autres
 * reviennent absents, donc null). Cela garde `ExtractedPiece` sérialisable tel quel
 * dans `extraction_json`, et laisse les pièces extraites AVANT l'ajout d'un champ se
 * relire sans migration : une clé manquante vaut null.
 */
const extractedSchema = z.object({
  famille: z.enum(["isolation", "pac_air_eau", "cet", "bois"]).nullable().optional(),
  dispositif: z.enum(["cee", "maprimerenov"]).nullable().optional(),
  // Communs à toutes les familles
  beneficiaire_nom: str,
  adresse: str,
  code_postal: str,
  commune: str, // ville du chantier (ex. "Bagnolet"), souvent collée au code postal
  montant_ht: frNum,
  montant_ttc: frNum,
  date: str, // date du devis / de la facture, telle qu'écrite
  rge_numero: str,
  rge_domaine: str, // domaine / mention RGE (ex. "QUALIBAT 7131")
  rge_validite: str, // date de fin de validité RGE (ex. "31/12/2026")
  fiche: str, // ex. BAR-EN-101 si présent

  // Isolation
  isolation_emplacement: str, // ex. "combles perdus", "rampants", "murs", "plancher bas"
  surface_isolee_m2: frNum,
  resistance_thermique_r: frNum,
  isolant_epaisseur_mm: frNum, // épaisseur posée, en millimètres
  isolant_marque: str,
  isolant_reference: str,

  // Pompe à chaleur air/eau
  pac_etas: frNum,
  pac_puissance_kw: frNum,
  pac_marque: str,
  pac_reference: str,
  pac_regulateur_classe: str,

  // Chauffe-eau thermodynamique
  cet_cop: frNum,
  cet_volume_l: frNum,
  cet_profil_soutirage: str,
  cet_marque: str,
  cet_reference: str,

  // Appareil de chauffage au bois
  bois_rendement: frNum,
  bois_emissions_co: frNum,
  bois_marque: str,
  bois_reference: str,
});

export type ExtractedPiece = z.infer<typeof extractedSchema>;

export type ExtractResult =
  | { ok: true; data: ExtractedPiece }
  | { ok: false; reason: "non-configure" | "erreur"; message?: string };

/** Champs communs, demandés quelle que soit la famille. */
const CHAMPS_COMMUNS = `  "beneficiaire_nom": "nom du client bénéficiaire",
  "adresse": "adresse du chantier (voie et numéro, sans le code postal ni la ville)",
  "code_postal": "code postal du chantier (5 chiffres)",
  "commune": "ville du chantier — le nom qui suit le code postal (ex. 93170 Bagnolet -> Bagnolet)",
  "montant_ht": nombre (total HT en euros),
  "montant_ttc": nombre (total TTC en euros),
  "date": "date du document (JJ/MM/AAAA)",
  "rge_numero": "numéro de qualification RGE de l'entreprise",
  "rge_domaine": "domaine ou mention RGE tel qu'écrit, organisme compris (ex. QUALIBAT 7131, Qualibat 7131 Isolation)",
  "rge_validite": "date de fin de validité de la qualification RGE, JJ/MM/AAAA (ex. \\"valide jusqu'au 31/12/2026\\" -> 31/12/2026)",
  "fiche": "fiche CEE si mentionnée (ex. BAR-EN-101, BAR-TH-171)"`;

/**
 * Ce que le modèle doit chercher sur la pièce, PAR FAMILLE. Ne demander que les
 * champs du geste évite au modèle d'halluciner une surface isolée sur un devis de
 * pompe à chaleur pour satisfaire le schéma. Ajouter un geste = ajouter un cas ici.
 */
const BLOC: Record<Famille, { objet: string; champs: string }> = {
  isolation: {
    objet: "travaux d'isolation",
    champs: `  "isolation_emplacement": "partie isolée en clair (ex. combles perdus, rampants de toiture, murs, plancher bas)",
  "surface_isolee_m2": nombre (m² isolés),
  "resistance_thermique_r": nombre (résistance thermique R, en m²·K/W),
  "isolant_epaisseur_mm": nombre (épaisseur de l'isolant posé, en millimètres — ex. 292),
  "isolant_marque": "marque de l'isolant",
  "isolant_reference": "référence produit de l'isolant"`,
  },
  pac_air_eau: {
    objet: "installation d'une pompe à chaleur air/eau",
    champs: `  "pac_etas": nombre (efficacité énergétique saisonnière ETAS, en %),
  "pac_puissance_kw": nombre (puissance thermique, en kW),
  "pac_marque": "marque de la pompe à chaleur",
  "pac_reference": "référence / modèle de la pompe à chaleur",
  "pac_regulateur_classe": "classe du régulateur (ex. IV, V, VI)"`,
  },
  cet: {
    objet: "installation d'un chauffe-eau thermodynamique",
    champs: `  "cet_cop": nombre (coefficient de performance COP, norme EN 16147),
  "cet_volume_l": nombre (volume du ballon, en litres),
  "cet_profil_soutirage": "profil de soutirage (M, L ou XL)",
  "cet_marque": "marque du chauffe-eau",
  "cet_reference": "référence / modèle du chauffe-eau"`,
  },
  bois: {
    objet: "installation d'un appareil de chauffage au bois",
    champs: `  "bois_rendement": nombre (rendement énergétique, en %),
  "bois_emissions_co": nombre (émissions de monoxyde de carbone, en mg/Nm³),
  "bois_marque": "marque de l'appareil",
  "bois_reference": "référence / modèle de l'appareil"`,
  },
};

const BLOC_AUTO = {
  objet: "travaux de renovation energetique",
  champs: Object.values(BLOC).map((bloc) => bloc.champs).join(",\n"),
};

function systemPrompt(famille: Famille | "auto"): string {
  const { objet, champs } = famille === "auto" ? BLOC_AUTO : BLOC[famille];
  return `Tu es un moteur d'extraction de documents pour la conformité CEE / MaPrimeRénov'.
On te fournit un DEVIS ou une FACTURE portant sur : ${objet}. Tu extrais uniquement ce qui est écrit, sans rien deviner.

Renvoie STRICTEMENT un JSON conforme à ce schéma (mets null si l'information n'est pas présente sur le document) :
{
  "famille": "isolation" | "pac_air_eau" | "cet" | "bois" | null,
  "dispositif": "cee" | "maprimerenov" | null,
${CHAMPS_COMMUNS},
${champs}
}
Les nombres sont des nombres (pas de symbole, séparateur décimal au choix). Aucune phrase autour du JSON.`;
}

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
  /** Famille du geste du dossier : détermine les champs techniques à chercher. */
  famille: Famille | "auto";
}): Promise<ExtractResult> {
  if (!isLlmConfigured()) return { ok: false, reason: "non-configure" };

  const label = params.type === "facture" ? "une FACTURE" : "un DEVIS";
  const bloc = params.famille === "auto" ? BLOC_AUTO : BLOC[params.famille];
  const dataUrl = `data:${params.mime};base64,${Buffer.from(params.bytes).toString("base64")}`;

  try {
    const raw = await openRouterVision({
      system: systemPrompt(params.famille),
      userText: `Voici ${label} portant sur : ${bloc.objet}. Identifie le type de travaux et extrais les champs demandés en JSON.`,
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
