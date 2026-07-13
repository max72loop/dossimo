"use server";

import { familleDeGeste } from "@/lib/dossier/cee-isolation";
import { getDossier } from "@/lib/dossier/get-dossier";
import { createClient } from "@/lib/supabase/server";
import { extractPiece } from "@/lib/piece/extract";
import { comparerPiece, type Comparaison } from "@/lib/piece/compare";
import { verifierMentions, type MentionVerifiee } from "@/lib/piece/mentions";
import { mentionsTemplates } from "@/lib/pack/pieces-cee-isolation";
import { ACCEPTED_DOCUMENT_MIMES, isAcceptedDocument } from "@/lib/piece/file-validation";
import type { Json, TypePiece } from "@/lib/database.types";

const TAILLE_MAX = 15 * 1024 * 1024; // 15 Mo

export type UploadResult =
  | {
      ok: true;
      comparaisons: Comparaison[];
      mentions: MentionVerifiee[];
      statut: "ok" | "echec";
      message?: string;
    }
  | { ok: false; error: string };

/**
 * Pièces que l'ARTISAN dépose. Les pièces du bénéficiaire (identité, avis
 * d'imposition, titre, RIB) passent par son lien de dépôt : elles ne sont pas les
 * siennes à fournir, et il ne doit pas pouvoir les verser à sa place.
 */
const TYPES_ARTISAN = new Set<TypePiece>([
  "devis",
  "facture",
  "qualification_rge",
  "fiche_technique",
  "cadre_contribution",
  "attestation_honneur",
  "photo_avant",
  "photo_apres",
  "autre",
]);

/**
 * Upload d'une pièce de l'artisan → Storage (bucket privé « pieces »), lecture VLM
 * pour le devis et la facture, comparaison à la saisie, persistance. Auth-scopé : la
 * RLS garantit l'appartenance du dossier et l'isolation du fichier.
 */
export async function uploadPiece(
  dossierId: string,
  type: TypePiece,
  formData: FormData,
): Promise<UploadResult> {
  const data = await getDossier(dossierId);
  if (!data) return { ok: false, error: "Dossier introuvable." };

  if (!TYPES_ARTISAN.has(type)) {
    return {
      ok: false,
      error: "Cette pièce est fournie par le bénéficiaire, via son lien de dépôt.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Aucun fichier reçu." };
  }
  if (!ACCEPTED_DOCUMENT_MIMES.has(file.type)) {
    return { ok: false, error: "Format non supporté (JPG, PNG, WEBP ou PDF)." };
  }
  if (file.size > TAILLE_MAX) {
    return { ok: false, error: "Fichier trop volumineux (15 Mo max)." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isAcceptedDocument(bytes, file.type)) {
    return { ok: false, error: "Le contenu du fichier ne correspond pas au format annoncé." };
  }
  const supabase = await createClient();

  // Chemin : {dossierId}/{uuid}.<ext> — le premier segment porte la RLS.
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const pieceId = crypto.randomUUID();
  const path = `${dossierId}/${pieceId}.${ext}`;

  const up = await supabase.storage
    .from("pieces")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (up.error) {
    console.error("[piece] upload:", up.error.message);
    return { ok: false, error: "Échec de l'envoi du fichier." };
  }

  // Seuls le devis et la facture sont LUS. Eux seuls portent les caractéristiques du
  // chantier et les mentions exigées par la fiche ; eux seuls peuvent donc contredire
  // la saisie. Passer un certificat RGE ou une photo de combles au modèle coûterait un
  // appel pour ne rien juger — et le contrôle des mentions y répondrait « toutes
  // absentes », ce qui n'aurait aucun sens.
  //
  // Le certificat RGE, en particulier, n'a pas besoin d'être lu : le dossier est déjà
  // confronté à l'annuaire officiel RGE (`controle-dossier.ts`), ce qui vaut mieux que
  // la lecture d'un PDF que l'artisan fournit lui-même.
  const lisible = type === "devis" || type === "facture";

  // Deux passes VLM sur le même document, en parallèle (best-effort : la pièce est
  // conservée même si l'IA échoue) :
  //  1. les VALEURS, que le code compare ensuite à la saisie (écarts) ;
  //  2. les MENTIONS OBLIGATOIRES exigées par la fiche, que le document doit porter.
  // La seconde est celle qui attrape les refus « chiffres justes, mention manquante ».
  const famille = familleDeGeste(data.caracteristiques.geste ?? "isolation");
  const [ex, mn] = lisible
    ? await Promise.all([
        extractPiece({ bytes, mime: file.type, filename: file.name, type, famille }),
        verifierMentions({
          bytes,
          mime: file.type,
          filename: file.name,
          type,
          mentions: mentionsTemplates(data),
        }),
      ])
    : [null, null];

  const comparaisons = ex?.ok ? comparerPiece(data, ex.data, type) : [];
  const mentions = mn?.ok ? mn.mentions : [];

  const { error: insErr } = await supabase.from("pieces_justificatives").insert({
    id: pieceId,
    dossier_id: dossierId,
    type,
    storage_path: path,
    nom_fichier: file.name,
    mime: file.type,
    taille: file.size,
    extraction_json: ex?.ok ? ex.data : null,
    // Une pièce non lisible n'est pas une pièce en échec : elle n'avait rien à lire.
    // « en_attente » dit « non lu », là où « echec » dirait « illisible » et
    // ferait remonter un avertissement au rapport.
    extraction_statut: ex ? (ex.ok ? "ok" : "echec") : "en_attente",
    extraction_erreur: ex && !ex.ok ? (ex.message ?? "Extraction impossible.") : null,
    // null (et non []) si le contrôle n'a pas tourné : « non vérifié » n'est pas
    // « aucune mention manquante ».
    mentions_json: mn?.ok ? (mn.mentions as unknown as Json) : null,
    extracted_at: ex ? new Date().toISOString() : null,
  });
  if (insErr) {
    console.error("[piece] insert:", insErr.message);
    return { ok: false, error: "Pièce envoyée, mais enregistrement impossible." };
  }

  return {
    ok: true,
    // Une pièce qu'on ne lit pas est « reçue », jamais « en échec » : l'artisan ne
    // doit pas voir « document illisible » sur une photo qu'on n'a pas cherché à lire.
    statut: ex ? (ex.ok ? "ok" : "echec") : "ok",
    message: ex && !ex.ok ? ex.message : undefined,
    comparaisons,
    mentions,
  };
}

/** Supprime une pièce (fichier Storage + ligne). */
export async function deletePiece(
  dossierId: string,
  pieceId: string,
): Promise<{ ok: boolean }> {
  const data = await getDossier(dossierId);
  if (!data) return { ok: false };
  const supabase = await createClient();

  const { data: piece } = await supabase
    .from("pieces_justificatives")
    .select("storage_path")
    .eq("id", pieceId)
    .eq("dossier_id", dossierId)
    .maybeSingle();

  if (piece?.storage_path) {
    await supabase.storage.from("pieces").remove([piece.storage_path]);
  }
  await supabase.from("pieces_justificatives").delete().eq("id", pieceId);
  return { ok: true };
}
