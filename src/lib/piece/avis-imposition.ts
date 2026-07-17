import "server-only";

import { z } from "zod";

import { isLlmConfigured, LlmIndisponibleError, openRouterVision } from "@/lib/llm/openrouter";
import { extraireJson, type DocumentPrepare } from "@/lib/piece/document";
import { parseNombreFr } from "@/lib/piece/num";

/**
 * Lecture de l'avis d'imposition du bénéficiaire.
 *
 * C'est la pièce la plus lourde de conséquences du dossier : le revenu fiscal de
 * référence et la composition du foyer déterminent la catégorie de revenus, donc le
 * montant de l'aide. Une précarité surestimée à la saisie ne se voit pas — jusqu'à
 * l'instruction, qui recalcule tout et refuse.
 *
 * Le modèle CONSTATE ce qui est écrit ; c'est `controle-avis.ts` qui JUGE, en
 * confrontant le RFR aux plafonds de ressources en vigueur.
 *
 * On n'extrait QUE ce qui sert au contrôle. Ni numéro fiscal, ni adresse, ni détail
 * des revenus : ces données n'ajouteraient rien au jugement et tout au risque.
 */

const num = z.preprocess(parseNombreFr, z.number().nullable());

const str = z.preprocess(
  (v) => (typeof v === "string" && v.trim() ? v.trim() : null),
  z.string().nullable(),
);

const avisSchema = z.object({
  /** Le RFR du foyer, en euros. La ligne « Revenu fiscal de référence ». */
  revenu_fiscal_reference: num,
  /** Année des REVENUS (2025 sur un avis reçu en 2026), pas celle de l'avis. */
  annee_revenus: num,
  /** Nombre de personnes du foyer : déclarants + personnes à charge. */
  foyer_personnes: num,
  /** Nombre de parts fiscales — sert de recours si le foyer n'est pas lisible. */
  nombre_parts: num,
  /** Nom du ou des déclarants, tel qu'écrit. */
  declarant: str,
  /** true si le document n'est manifestement pas un avis d'imposition. */
  hors_sujet: z.preprocess((v) => v === true, z.boolean()),
});

export type AvisImposition = z.infer<typeof avisSchema>;

export type AvisResult =
  | { ok: true; data: AvisImposition }
  | { ok: false; reason: "non-configure" | "erreur"; message?: string };

const SYSTEM = `Tu lis un AVIS D'IMPOSITION français (avis d'impôt sur le revenu).
Tu extrais uniquement ce qui est écrit, sans rien deviner ni recalculer.

Renvoie STRICTEMENT ce JSON (null si l'information ne figure pas sur le document) :
{
  "revenu_fiscal_reference": nombre (le « Revenu fiscal de référence », en euros),
  "annee_revenus": nombre (l'année des REVENUS déclarés, ex. 2025 — PAS l'année d'émission de l'avis),
  "foyer_personnes": nombre (nombre de personnes du foyer = déclarants + personnes à charge),
  "nombre_parts": nombre (le nombre de parts fiscales, ex. 2.5),
  "declarant": "nom du ou des déclarants, tel qu'écrit",
  "hors_sujet": true si ce document n'est PAS un avis d'imposition, false sinon
}

Précisions :
- "foyer_personnes" : compte les déclarants (1 si célibataire, 2 si couple) PLUS les
  personnes à charge. Un couple avec deux enfants = 4. Si le document ne permet pas
  de trancher, mets null — ne devine pas à partir des parts.
- "hors_sujet" : mets true si on t'a donné autre chose (facture, RIB, pièce d'identité).
  Dans ce cas, tous les autres champs sont null.

Aucune phrase autour du JSON.`;

export async function lireAvisImposition(params: {
  doc: DocumentPrepare;
}): Promise<AvisResult> {
  if (!isLlmConfigured()) return { ok: false, reason: "non-configure" };

  try {
    const raw = await openRouterVision({
      system: SYSTEM,
      userText:
        "Voici un avis d'imposition. Relève le revenu fiscal de référence, l'année des revenus et la composition du foyer.",
      file: params.doc,
      jsonMode: true,
      maxTokens: 800,
    });
    const parsed = avisSchema.safeParse(extraireJson(raw));
    if (!parsed.success) {
      console.error("[avis] lecture inattendue:", parsed.error.message);
      return { ok: false, reason: "erreur", message: "Lecture de l'avis impossible." };
    }
    return { ok: true, data: parsed.data };
  } catch (err) {
    console.error("[avis] lecture:", err);
    return {
      ok: false,
      reason: "erreur",
      message:
        err instanceof LlmIndisponibleError
          ? "Le service de lecture est momentanément indisponible. L'avis est bien enregistré ; la lecture sera reprise."
          : "L'analyse de l'avis a échoué. Réessayez avec un scan plus net.",
    };
  }
}
