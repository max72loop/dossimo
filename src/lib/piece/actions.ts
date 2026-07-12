"use server";

import { familleDeGeste } from "@/lib/dossier/cee-isolation";
import { getDossier } from "@/lib/dossier/get-dossier";
import { createClient } from "@/lib/supabase/server";
import { extractPiece } from "@/lib/piece/extract";
import { comparerPiece, type Comparaison } from "@/lib/piece/compare";
import { verifierMentions, type MentionVerifiee } from "@/lib/piece/mentions";
import { mentionsTemplates } from "@/lib/pack/pieces-cee-isolation";
import type { Json, TypePiece } from "@/lib/database.types";

const MIMES_OK = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
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
 * Upload d'une pièce réelle (devis/facture) → Storage (bucket privé « pieces »),
 * extraction VLM, comparaison à la saisie, persistance. Auth-scopé : la RLS
 * garantit l'appartenance du dossier et l'isolation du fichier.
 */
export async function uploadPiece(
  dossierId: string,
  type: TypePiece,
  formData: FormData,
): Promise<UploadResult> {
  const data = await getDossier(dossierId);
  if (!data) return { ok: false, error: "Dossier introuvable." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Aucun fichier reçu." };
  }
  if (!MIMES_OK.has(file.type)) {
    return { ok: false, error: "Format non supporté (JPG, PNG, WEBP ou PDF)." };
  }
  if (file.size > TAILLE_MAX) {
    return { ok: false, error: "Fichier trop volumineux (15 Mo max)." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
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

  // Deux passes VLM sur le même document, en parallèle (best-effort : la pièce est
  // conservée même si l'IA échoue) :
  //  1. les VALEURS, que le code compare ensuite à la saisie (écarts) ;
  //  2. les MENTIONS OBLIGATOIRES exigées par la fiche, que le document doit porter.
  // La seconde est celle qui attrape les refus « chiffres justes, mention manquante ».
  const famille = familleDeGeste(data.caracteristiques.geste ?? "isolation");
  const [ex, mn] = await Promise.all([
    extractPiece({ bytes, mime: file.type, filename: file.name, type, famille }),
    verifierMentions({
      bytes,
      mime: file.type,
      filename: file.name,
      type,
      mentions: mentionsTemplates(data),
    }),
  ]);

  const comparaisons = ex.ok ? comparerPiece(data, ex.data, type) : [];
  const mentions = mn.ok ? mn.mentions : [];

  const { error: insErr } = await supabase.from("pieces_justificatives").insert({
    id: pieceId,
    dossier_id: dossierId,
    type,
    storage_path: path,
    nom_fichier: file.name,
    mime: file.type,
    taille: file.size,
    extraction_json: ex.ok ? ex.data : null,
    extraction_statut: ex.ok ? "ok" : "echec",
    extraction_erreur: ex.ok ? null : ex.message ?? "Extraction impossible.",
    // null (et non []) si le contrôle n'a pas tourné : « non vérifié » n'est pas
    // « aucune mention manquante ».
    mentions_json: mn.ok ? (mn.mentions as unknown as Json) : null,
    extracted_at: new Date().toISOString(),
  });
  if (insErr) {
    console.error("[piece] insert:", insErr.message);
    return { ok: false, error: "Pièce envoyée, mais enregistrement impossible." };
  }

  return {
    ok: true,
    statut: ex.ok ? "ok" : "echec",
    message: ex.ok ? undefined : ex.message,
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
