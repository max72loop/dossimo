import "server-only";

import { z } from "zod";

import type { DossierComplet } from "@/lib/dossier/get-dossier";
import { controlerDossierCeeIsolation } from "@/lib/rules/cee-isolation";
import {
  LOGEMENT_TYPES,
  OCCUPATIONS,
  PRECARITES,
  TYPES_ISOLATION,
} from "@/lib/dossier/cee-isolation";
import { SEVERITE_LABEL } from "@/lib/rules/types";
import { isLlmConfigured, openRouterChat } from "@/lib/llm/openrouter";

/**
 * Règles souples + points de vigilance rédigés (CLAUDE.md §5/§9). Le contrôle
 * déterministe reste la source de vérité (règles dures) ; le LLM AJOUTE des
 * points contextuels qui ne sont pas couverts par le code, pour réduire le
 * risque de refus. Sortie strictement structurée et validée côté serveur.
 */

const pointSchema = z.object({
  titre: z.string().min(1),
  detail: z.string().min(1),
  severite: z.enum(["info", "vigilance", "important"]),
  poste: z.string().optional(),
});
const outputSchema = z.object({ points: z.array(pointSchema) });

export type PointVigilance = z.infer<typeof pointSchema>;

export type VigilanceResult =
  | { ok: true; points: PointVigilance[] }
  | { ok: false; reason: "non-configure" | "erreur"; message?: string };

const SYSTEM_PROMPT = `Tu es un conseiller technique spécialisé dans la conformité des dossiers CEE et MaPrimeRénov' pour des artisans RGE indépendants en France.

À partir des données d'un dossier et des contrôles déterministes DÉJÀ réalisés, tu rédiges des POINTS DE VIGILANCE souples et contextuels : des risques, incohérences potentielles ou rappels qui ne sont pas déjà couverts par les contrôles automatiques, afin d'éviter un refus au moment du dépôt.

Règles impératives :
- Réponds en français, ton calme, précis et concret, sans jargon anglais ni survente.
- Appuie-toi UNIQUEMENT sur les données fournies. N'invente aucun fait, montant, date ni pièce.
- Ne répète pas les contrôles déterministes déjà listés — tu les complètes.
- 3 à 6 points maximum, chacun actionnable (que doit vérifier ou faire l'artisan).
- "severite" : "important" = risque de refus élevé ; "vigilance" = à surveiller ; "info" = bonne pratique.
- Si le dossier semble solide, propose tout de même des points utiles de type "vigilance"/"info".
- Tu n'es pas l'Anah ni France Rénov' : reste un conseil de préparation, jamais une décision.

Réponds STRICTEMENT en JSON, sans aucun texte autour, conforme à :
{"points":[{"titre":"court","detail":"actionnable","severite":"important|vigilance|info","poste":"fiche/poste concerné (optionnel)"}]}`;

function buildContext(data: DossierComplet): string {
  const c = data.caracteristiques;
  const rapport = controlerDossierCeeIsolation(data);
  const travaux = TYPES_ISOLATION[c.travaux.type_isolation];

  const contexte = {
    dispositif: data.dossier.dispositif,
    fiche: c.fiche,
    travaux: {
      poste: travaux?.label ?? c.travaux.type_isolation,
      surface_isolee_m2: c.travaux.surface_isolee_m2,
      resistance_thermique_r: c.travaux.resistance_thermique_r,
      isolant_type: c.travaux.isolant_type,
      isolant_marque: c.travaux.isolant_marque,
      isolant_reference: c.travaux.isolant_reference,
      epaisseur_mm: c.travaux.epaisseur_mm,
    },
    beneficiaire: {
      occupation: OCCUPATIONS[c.beneficiaire.occupation],
      precarite: PRECARITES[c.beneficiaire.precarite],
      commune: c.beneficiaire.commune,
      code_postal: c.beneficiaire.code_postal,
    },
    logement: {
      type: LOGEMENT_TYPES[c.logement.type],
      annee_construction: c.logement.annee_construction,
      surface_habitable: c.logement.surface_habitable,
    },
    montants: c.montants,
    rge: c.rge,
    chronologie: data.dates,
    controles_deterministes: rapport.findings.map((f) => ({
      severite: SEVERITE_LABEL[f.severite],
      categorie: f.categorie,
      titre: f.titre,
      detail: f.detail,
    })),
    synthese_controle: {
      conforme: rapport.conforme,
      bloquants: rapport.nbBloquants,
      a_verifier: rapport.nbAvertissements,
    },
  };

  return `Données du dossier et contrôles déjà effectués (JSON) :\n${JSON.stringify(contexte, null, 2)}`;
}

/** Extrait un objet JSON d'une réponse LLM (retire d'éventuelles clôtures markdown). */
function extractJson(raw: string): unknown {
  let s = raw.trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) s = fenced[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}

export async function generateVigilancePoints(
  data: DossierComplet,
): Promise<VigilanceResult> {
  if (!isLlmConfigured()) return { ok: false, reason: "non-configure" };

  try {
    const raw = await openRouterChat({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildContext(data) },
      ],
      jsonMode: true,
      temperature: 0.3,
      maxTokens: 1200,
    });

    const parsed = outputSchema.safeParse(extractJson(raw));
    if (!parsed.success) {
      console.error("[llm] sortie inattendue:", parsed.error.message);
      return { ok: false, reason: "erreur", message: "Réponse de l'IA inattendue." };
    }
    return { ok: true, points: parsed.data.points.slice(0, 6) };
  } catch (err) {
    console.error("[llm] vigilance:", err);
    return {
      ok: false,
      reason: "erreur",
      message: "Le service d'analyse est momentanément indisponible.",
    };
  }
}
