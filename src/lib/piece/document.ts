import "server-only";

import { PDFDocument } from "pdf-lib";

/**
 * Préparation d'un document avant sa lecture par un VLM.
 *
 * Deux rôles, tenus une seule fois pour toutes les passes :
 *  1. Borner le volume : au-delà de quelques pages, un PDF n'est plus un
 *     justificatif mais un lot scanné. Le modèle le lit mal, le facture au prorata
 *     de ses pages, et met d'autant plus de temps ; un devis ou un avis d'imposition
 *     tient en quelques pages.
 *  2. Encoder le document en data URL UNE fois. Le devis passe deux fois au VLM
 *     (valeurs puis mentions) : sans préparation partagée, les ~20 Mo de base64
 *     d'un fichier de 15 Mo étaient reconstruits à chaque passe.
 */

/**
 * Plafond de pages d'un PDF lu. Large à dessein : un devis détaillé avec CGV et
 * annexes peut atteindre plusieurs pages, et on ne veut jamais refuser un vrai
 * document. Le but est d'arrêter le « scan de tout le classeur », pas de valider.
 */
export const MAX_PAGES_PDF = 12;

export interface DocumentPrepare {
  mime: string;
  filename: string;
  /** `data:<mime>;base64,<...>`, construit une seule fois, réutilisé à chaque passe. */
  dataUrl: string;
}

export type PreparationResult =
  | { ok: true; doc: DocumentPrepare }
  | { ok: false; reason: "trop-de-pages"; pages: number; message: string };

/**
 * Prépare `bytes` pour la lecture VLM : contrôle le volume d'un PDF, puis encode.
 * À n'appeler que sur le chemin de lecture — une pièce simplement rangée (RIB,
 * photo, certificat RGE) n'a ni à être comptée ni à être encodée.
 */
export async function preparerDocument(params: {
  bytes: Uint8Array;
  mime: string;
  filename: string;
}): Promise<PreparationResult> {
  const { bytes, mime, filename } = params;

  if (mime === "application/pdf") {
    const pages = await compterPages(bytes);
    if (pages > MAX_PAGES_PDF) {
      return {
        ok: false,
        reason: "trop-de-pages",
        pages,
        message: `Ce PDF fait ${pages} pages. Déposez uniquement le document demandé (${MAX_PAGES_PDF} pages maximum) : un devis ou un avis d'imposition tient en quelques pages.`,
      };
    }
  }

  const dataUrl = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
  return { ok: true, doc: { mime, filename, dataUrl } };
}

/**
 * Nombre de pages d'un PDF, ou 0 si pdf-lib ne sait pas l'ouvrir. Un PDF chiffré ou
 * corrompu ne doit pas faire échouer le dépôt ici : le comptage est un garde-fou de
 * volume, pas un validateur de format. `ignoreEncryption` couvre les PDF « protégés »
 * à mot de passe propriétaire vide, courants et parfaitement lisibles par ailleurs.
 */
async function compterPages(bytes: Uint8Array): Promise<number> {
  try {
    const pdf = await PDFDocument.load(bytes, {
      ignoreEncryption: true,
      updateMetadata: false,
    });
    return pdf.getPageCount();
  } catch {
    return 0;
  }
}

/**
 * Déballe le JSON d'une réponse VLM : retire d'éventuelles balises markdown et le
 * texte autour, ne garde que du premier `{` au dernier `}`. Lève si le résultat
 * n'est pas du JSON — l'appelant traite l'exception comme une lecture en échec.
 */
export function extraireJson(raw: string): unknown {
  let s = raw.trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) s = fenced[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}
