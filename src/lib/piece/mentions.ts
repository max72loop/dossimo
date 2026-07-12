import "server-only";

import { z } from "zod";

import { isLlmConfigured, openRouterVision } from "@/lib/llm/openrouter";
import type { TypePiece } from "@/lib/database.types";

/**
 * Seconde passe du VLM sur une pièce réelle : la vérification des MENTIONS
 * OBLIGATOIRES.
 *
 * La première passe (`extract.ts`) relève des VALEURS et le code les compare à la
 * saisie. Elle ne dit rien de ce que la fiche CEE exige de voir écrit sur le devis
 * et la facture — et l'absence d'une mention (certification ACERMI, n° RGE, fiche
 * BAR…) fait refuser un dossier dont tous les chiffres sont pourtant justes.
 *
 * Ici, on donne au modèle la liste des mentions exigées, déjà interpolée aux valeurs
 * du dossier, et on lui demande, mention par mention, ce qu'il trouve sur le document.
 * Le modèle CONSTATE (présente / absente / divergente + verbatim + confiance) ;
 * c'est le moteur de règles qui JUGE (`controle-pieces.ts`), et l'artisan qui tranche.
 */

export type StatutMention = "presente" | "absente" | "divergente";

export interface MentionVerifiee {
  /** Le texte exigé, tel que la règle métier le formule. */
  mention: string;
  statut: StatutMention;
  /** Ce qui est réellement écrit sur le document, cité. null si rien trouvé. */
  verbatim: string | null;
  /** Confiance de LECTURE (0–1) : sépare « ce n'est pas écrit » de « je n'ai pas su lire ». */
  confiance: number;
}

const mentionSchema = z.object({
  mention: z.string(),
  statut: z.enum(["presente", "absente", "divergente"]),
  verbatim: z.preprocess(
    (v) => (typeof v === "string" && v.trim() ? v.trim() : null),
    z.string().nullable(),
  ),
  confiance: z.preprocess((v) => {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.min(1, Math.max(0, n));
  }, z.number()),
});

const reponseSchema = z.object({ mentions: z.array(mentionSchema) });

export type MentionsResult =
  | { ok: true; mentions: MentionVerifiee[] }
  | { ok: false; reason: "non-configure" | "erreur"; message?: string };

const SYSTEM = `Tu es un vérificateur de conformité documentaire CEE / MaPrimeRénov'.
On te fournit un DEVIS ou une FACTURE de travaux de rénovation énergétique, et la liste des MENTIONS OBLIGATOIRES que ce document doit porter.

Pour CHAQUE mention de la liste, tu cherches dans le document et tu constates. Tu ne devines jamais, tu ne complètes jamais : tu rapportes ce qui est écrit.

Statut à attribuer :
- "presente"    : la mention figure au document et concorde avec ce qui est exigé.
- "divergente"  : la mention figure MAIS avec une valeur différente de celle exigée
                  (ex. on exige « R = 7 m²·K/W », le document porte « R = 6,5 »).
- "absente"     : la mention ne figure nulle part sur le document.

Champ "verbatim" : cite MOT POUR MOT le passage du document qui porte la mention
(ou la valeur divergente). null si tu n'as rien trouvé.

Champ "confiance" : ta confiance dans ta LECTURE du document (0 à 1) — PAS dans ton
jugement. Document net et intégralement lisible = proche de 1. Scan flou, page coupée,
zone illisible = bas. C'est ce qui permet de distinguer « ce n'est pas écrit »
(confiance haute + absente) de « je n'ai pas réussi à lire » (confiance basse).

Renvoie STRICTEMENT ce JSON, une entrée par mention exigée, dans le même ordre :
{"mentions":[{"mention":"<recopie la mention exigée>","statut":"presente|absente|divergente","verbatim":"..."|null,"confiance":0.0}]}
Aucune phrase autour du JSON.`;

function extractJson(raw: string): unknown {
  let s = raw.trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) s = fenced[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}

/**
 * Réaligne la réponse du modèle sur la liste EXIGÉE : on n'accepte que les mentions
 * demandées, dans l'ordre demandé. Une mention que le modèle aurait omise est traitée
 * comme non vérifiée (absente, confiance 0) plutôt que silencieusement perdue — sans
 * quoi une mention manquante au document pourrait disparaître du contrôle.
 */
function realigner(
  exigees: readonly string[],
  lues: MentionVerifiee[],
): MentionVerifiee[] {
  const parTexte = new Map(lues.map((m) => [m.mention.trim(), m]));
  return exigees.map((mention, i) => {
    const lue = parTexte.get(mention.trim()) ?? lues[i];
    if (!lue) {
      return { mention, statut: "absente" as const, verbatim: null, confiance: 0 };
    }
    return { ...lue, mention };
  });
}

export async function verifierMentions(params: {
  bytes: Uint8Array;
  mime: string;
  filename: string;
  type: TypePiece;
  /** Mentions exigées, déjà interpolées aux valeurs du dossier. */
  mentions: readonly string[];
}): Promise<MentionsResult> {
  if (!isLlmConfigured()) return { ok: false, reason: "non-configure" };
  if (params.mentions.length === 0) return { ok: true, mentions: [] };

  const label = params.type === "facture" ? "une FACTURE" : "un DEVIS";
  const dataUrl = `data:${params.mime};base64,${Buffer.from(params.bytes).toString("base64")}`;
  const liste = params.mentions.map((m, i) => `${i + 1}. ${m}`).join("\n");

  try {
    const raw = await openRouterVision({
      system: SYSTEM,
      userText: `Voici ${label}. Vérifie sur ce document, une par une, les ${params.mentions.length} mentions obligatoires suivantes :\n\n${liste}`,
      file: { mime: params.mime, dataUrl, filename: params.filename },
      jsonMode: true,
      maxTokens: 2000,
    });
    const parsed = reponseSchema.safeParse(extractJson(raw));
    if (!parsed.success) {
      console.error("[piece] mentions inattendues:", parsed.error.message);
      return { ok: false, reason: "erreur", message: "Contrôle des mentions impossible." };
    }
    return { ok: true, mentions: realigner(params.mentions, parsed.data.mentions) };
  } catch (err) {
    console.error("[piece] mentions:", err);
    return {
      ok: false,
      reason: "erreur",
      message: "Le contrôle des mentions a échoué. Réessayez avec un fichier plus lisible.",
    };
  }
}
