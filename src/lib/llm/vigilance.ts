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
import { getDossierPieces } from "@/lib/piece/get";
import {
  mentionsObligatoires,
  piecesCeeIsolation,
} from "@/lib/pack/pieces-cee-isolation";

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

const SYSTEM_PROMPT = `Tu es un conseiller technique spécialisé dans la conformité des dossiers CEE (fiches BAR-EN, isolation) et MaPrimeRénov' pour des artisans RGE indépendants en France.

À partir des données d'un dossier, des contrôles déterministes DÉJÀ réalisés et de la comparaison entre les pièces réelles (devis/facture) et la saisie, tu rédiges des POINTS DE VIGILANCE souples et contextuels : les risques de REFUS qui ne sont pas déjà couverts par les contrôles automatiques, afin de sécuriser le dossier avant dépôt.

Passe le dossier au crible des principaux MOTIFS DE REFUS des dossiers CEE isolation, et signale ceux qui te semblent à risque ou non prouvés ici :
1. Incohérence entre pièces : le devis, la facture et l'attestation sur l'honneur doivent porter des valeurs IDENTIQUES (bénéficiaire, adresse, surface, résistance R, marque et référence de l'isolant, montants, dates). La moindre divergence entraîne un refus — les écarts détectés te sont fournis, traite-les en priorité.
2. Rôle actif et incitatif : l'offre CEE doit être proposée AVANT la signature du devis, et cette antériorité doit être prouvée par un document daté (cadre de contribution). Sans preuve d'antériorité, refus.
3. Qualification RGE valide à la date de signature du devis ET couvrant le domaine des travaux réalisés.
4. Mentions obligatoires présentes à l'identique sur le devis ET la facture : fiche, surface isolée, résistance thermique R, marque et référence de l'isolant, certification ACERMI (ou équivalent) de l'isolant.
5. Isolant certifié ACERMI et résistance R évaluée selon les normes en vigueur.
6. Logement achevé depuis plus de 2 ans à la date d'engagement.
7. Chronologie cohérente : visite préalable avant devis ; devis signé avant début des travaux ; facture après achèvement.
8. Attestation sur l'honneur signée par le bénéficiaire ET le professionnel, sans rature ni blanc correcteur, avec signature originale.
9. Pas de double valorisation CEE de la même opération ; articulation correcte en cas de cumul avec MaPrimeRénov'.
10. Pièces justificatives réunies (voir liste des pièces requises) : une pièce obligatoire manquante bloque le dépôt.

Règles impératives :
- Réponds en français, ton calme, précis et concret, sans jargon anglais ni survente.
- Appuie-toi UNIQUEMENT sur les données fournies. N'invente aucun fait, montant, date ni pièce. Si une information manque pour conclure, formule le point comme une vérification à faire.
- Ne répète pas à l'identique les contrôles déterministes déjà listés — tu les approfondis ou les complètes.
- Quand un écart pièce↔saisie est fourni, cite les deux valeurs et le document concerné.
- 3 à 7 points, triés du plus au moins critique, chacun ACTIONNABLE (ce que l'artisan doit vérifier ou corriger).
- "severite" : "important" = risque de refus élevé ; "vigilance" = à surveiller ; "info" = bonne pratique.
- Si le dossier semble solide, propose tout de même des points utiles de type "vigilance"/"info".
- Tu n'es pas l'Anah ni France Rénov' : reste un conseil de préparation, jamais une décision.

Réponds STRICTEMENT en JSON, sans aucun texte autour, conforme à :
{"points":[{"titre":"court","detail":"actionnable, avec les valeurs concernées","severite":"important|vigilance|info","poste":"pièce/poste concerné (optionnel)"}]}`;

async function buildContext(data: DossierComplet): Promise<string> {
  const c = data.caracteristiques;
  const rapport = controlerDossierCeeIsolation(data);
  const travaux = TYPES_ISOLATION[c.travaux.type_isolation];

  // Pièces réelles téléversées + écarts avec la saisie (Chantier 1) : signal
  // anti-refus le plus concret. Vide si l'artisan n'a rien encore téléversé.
  const piecesReelles = await getDossierPieces(data);
  const pieces_reelles = piecesReelles.map((p) => ({
    type: p.piece.type,
    fichier: p.piece.nom_fichier,
    lecture_automatique: p.piece.extraction_statut,
    ecarts_avec_saisie: p.comparaisons
      .filter((cmp) => cmp.statut === "ecart")
      .map((cmp) => ({ champ: cmp.champ, saisie: cmp.saisie, piece: cmp.piece })),
    champs_non_lus: p.comparaisons
      .filter((cmp) => cmp.statut === "absent")
      .map((cmp) => cmp.champ),
  }));

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
    pieces_reelles_televersees: pieces_reelles.length
      ? pieces_reelles
      : "Aucune pièce réelle (devis/facture) téléversée : impossible de vérifier la cohérence pièces↔saisie.",
    pieces_requises: piecesCeeIsolation(data).map((p) => ({
      piece: p.label,
      obligatoire: p.obligatoire,
    })),
    mentions_obligatoires_devis_facture: mentionsObligatoires(data).map((m) => ({
      document: m.document,
      mention: m.mention,
    })),
  };

  return `Données du dossier, contrôles déjà effectués et pièces réelles (JSON) :\n${JSON.stringify(contexte, null, 2)}`;
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
        { role: "user", content: await buildContext(data) },
      ],
      jsonMode: true,
      temperature: 0.3,
      maxTokens: 1800,
    });

    const parsed = outputSchema.safeParse(extractJson(raw));
    if (!parsed.success) {
      console.error("[llm] sortie inattendue:", parsed.error.message);
      return { ok: false, reason: "erreur", message: "Réponse de l'IA inattendue." };
    }
    return { ok: true, points: parsed.data.points.slice(0, 7) };
  } catch (err) {
    console.error("[llm] vigilance:", err);
    return {
      ok: false,
      reason: "erreur",
      message: "Le service d'analyse est momentanément indisponible.",
    };
  }
}
