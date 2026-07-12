import "server-only";

import { z } from "zod";

import type { DossierComplet } from "@/lib/dossier/get-dossier";
import type { Dispositif } from "@/lib/database.types";
import { controlerDossier } from "@/lib/rules/controle-dossier";
import {
  LOGEMENT_TYPES,
  OCCUPATIONS,
  PRECARITES,
} from "@/lib/dossier/cee-isolation";
import {
  lignesTechniques,
  titreSectionTechnique,
} from "@/lib/dossier/geste-technique";
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
  | { ok: true; points: PointVigilance[]; generatedAt?: string }
  | { ok: false; reason: "non-configure" | "erreur"; message?: string };

/**
 * Modèle dédié à la vigilance : rapide et peu coûteux (le contexte enrichi rend
 * le gros modèle texte trop lent pour une action synchrone). Surchargeable.
 */
const VIGILANCE_MODEL =
  process.env.OPENROUTER_VIGILANCE_MODEL || "google/gemini-2.5-flash";

/** Relit les points de vigilance persistés sur le dossier (jsonb), validés. */
export function storedVigilance(
  data: DossierComplet,
): { points: PointVigilance[]; at: string | null } | null {
  const raw = data.dossier.vigilance_json;
  if (raw == null) return null;
  const parsed = z.array(pointSchema).safeParse(raw);
  if (!parsed.success) return null;
  return { points: parsed.data, at: data.dossier.vigilance_at ?? null };
}

const INTRO = `Tu es un conseiller technique spécialisé dans la conformité des dossiers de rénovation énergétique (CEE et MaPrimeRénov') pour des artisans RGE indépendants en France.

À partir des données d'un dossier, des contrôles déterministes DÉJÀ réalisés et de la comparaison entre les pièces réelles (devis/facture) et la saisie, tu rédiges des POINTS DE VIGILANCE souples et contextuels : les risques de REFUS qui ne sont pas déjà couverts par les contrôles automatiques, afin de sécuriser le dossier avant dépôt.`;

const MOTIFS_CEE = `Ce dossier vise les CERTIFICATS D'ÉCONOMIES D'ÉNERGIE (CEE). Passe-le au crible des principaux motifs de refus CEE :
1. Cohérence stricte entre pièces : le devis, la facture ET l'attestation sur l'honneur doivent porter des valeurs identiques (bénéficiaire, adresse, surface, résistance R, marque et référence de l'isolant, montants, dates). La moindre divergence entraîne un refus ; les écarts détectés te sont fournis, traite-les en priorité.
2. Rôle actif et incitatif : l'offre CEE doit être proposée AVANT la signature du devis, avec une preuve datée (cadre de contribution). Sans antériorité, refus.
3. Qualification RGE valide à la date de signature du devis et couvrant le domaine des travaux.
4. Mentions obligatoires présentes à l'identique sur devis ET facture (fiche, surface, résistance R, marque et référence de l'isolant, certification ACERMI).
5. Isolant certifié ACERMI, résistance R évaluée selon les normes.
6. Logement achevé depuis plus de 2 ans à la date d'engagement.
7. Chronologie cohérente : visite préalable avant devis ; devis signé avant début des travaux ; facture après achèvement.
8. Attestation sur l'honneur signée par le bénéficiaire ET le professionnel, sans rature, signature originale.
9. Pas de double valorisation CEE de la même opération.
10. Pièces justificatives réunies (voir la liste fournie) : une pièce obligatoire manquante bloque le dépôt.`;

const MOTIFS_MPR = `Ce dossier vise MAPRIMERÉNOV' (aide de l'Anah, déposée en ligne par le particulier). Passe-le au crible des principaux motifs de refus MaPrimeRénov' :
1. Cohérence stricte devis / facture (bénéficiaire, adresse, surface, résistance R, marque et référence de l'isolant, montants, dates). Les écarts détectés te sont fournis, traite-les en priorité.
2. Ancienneté du logement : achevé depuis plus de 15 ANS à la date de la demande (spécifique à MaPrimeRénov', ne pas confondre avec les 2 ans des CEE).
3. Résidence principale : logement occupé au moins 8 mois par an, occupé dans l'année qui suit les travaux.
4. Antériorité de la demande : la demande MaPrimeRénov' doit être déposée et l'accord obtenu AVANT le début des travaux ; ne jamais démarrer avant l'accord.
5. Éligibilité du geste au parcours par geste 2026 : l'isolation des murs n'est plus éligible ; combles/toiture et planchers bas restent éligibles.
6. Qualification RGE valide à la date du devis, couvrant le geste réalisé.
7. Profil de revenus : avis d'imposition du foyer cohérent avec le montant de l'aide (barème par couleur).
8. Pièces du particulier réunies : pièce d'identité, avis d'imposition, titre de propriété ou justificatif d'occupation, RIB au nom du bénéficiaire.
9. En cas de cumul avec les CEE, articulation correcte (ne pas déclarer deux fois la même aide).
10. Ne PAS exiger de « rôle actif et incitatif » ni d'attestation sur l'honneur CEE : ces notions sont propres aux CEE, pas à MaPrimeRénov'.`;

const REGLES = `Règles impératives :
- Réponds en français, ton calme, précis et concret, sans jargon anglais ni survente.
- Appuie-toi UNIQUEMENT sur les données fournies. N'invente aucun fait, montant, date ni pièce. Si une information manque pour conclure, formule le point comme une vérification à faire.
- Ne répète pas à l'identique les contrôles déterministes déjà listés ; approfondis-les ou complète-les.
- Quand un écart pièce/saisie est fourni, cite les deux valeurs et le document concerné.
- 3 à 7 points, triés du plus au moins critique, chacun ACTIONNABLE (ce que l'artisan doit vérifier ou corriger).
- "severite" : "important" = risque de refus élevé ; "vigilance" = à surveiller ; "info" = bonne pratique.
- Si le dossier semble solide, propose tout de même des points utiles de type "vigilance"/"info".
- Tu n'es pas l'Anah ni France Rénov' : reste un conseil de préparation, jamais une décision.

Réponds STRICTEMENT en JSON, sans aucun texte autour, conforme à :
{"points":[{"titre":"court","detail":"actionnable, avec les valeurs concernées","severite":"important|vigilance|info","poste":"pièce/poste concerné (optionnel)"}]}`;

function systemPrompt(dispositif: Dispositif): string {
  const motifs = dispositif === "maprimerenov" ? MOTIFS_MPR : MOTIFS_CEE;
  return `${INTRO}\n\n${motifs}\n\n${REGLES}`;
}

async function buildContext(data: DossierComplet): Promise<string> {
  const c = data.caracteristiques;
  const rapport = controlerDossier(data);

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
    // Bloc technique du geste réel (isolation, PAC, CET ou bois). `lignesTechniques`
    // est le point unique de vérité de ce dispatch : un dossier ne porte que le bloc
    // de sa famille, et supposer l'isolation ici enverrait un contexte faux au LLM
    // — ou lèverait, pour les gestes sans bloc `travaux`.
    travaux: {
      poste: titreSectionTechnique(c),
      ...Object.fromEntries(
        lignesTechniques(c).map((l) => [l.label, l.value]),
      ),
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
        { role: "system", content: systemPrompt(data.dossier.dispositif) },
        { role: "user", content: await buildContext(data) },
      ],
      jsonMode: true,
      temperature: 0.3,
      maxTokens: 1800,
      model: VIGILANCE_MODEL,
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
