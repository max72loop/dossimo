"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getDossier } from "@/lib/dossier/get-dossier";
import { emettreLien, resoudreLien, revoquerLiens } from "@/lib/depot/lien";
import { piecesAttendues, PIECES_BENEFICIAIRE } from "@/lib/depot/pieces-attendues";
import { lireAvisImposition } from "@/lib/piece/avis-imposition";
import { preparerDocument, type DocumentPrepare } from "@/lib/piece/document";
import { ACCEPTED_DOCUMENT_MIMES, isAcceptedDocument } from "@/lib/piece/file-validation";
import type { Json, TypePiece } from "@/lib/database.types";

const TAILLE_MAX = 15 * 1024 * 1024; // 15 Mo

/* ------------------------------------------------------------ Côté artisan */

/**
 * Émet un lien de dépôt pour ce dossier et renvoie l'URL complète. Auth-scopé :
 * `getDossier` passe par la RLS, un artisan ne peut ouvrir un lien que sur ses
 * dossiers.
 *
 * Le jeton stable est dérivé d'un secret serveur et seul son hash est stocké.
 * Ainsi la même URL peut être réutilisée dans l'écran et les relances sans exposer
 * de secret en base.
 */
export async function creerLienDepot(
  dossierId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const data = await getDossier(dossierId);
  if (!data) return { ok: false, error: "Dossier introuvable." };

  if (piecesAttendues(data).length === 0) {
    return {
      ok: false,
      error: "Ce dossier ne réclame aucune pièce au bénéficiaire.",
    };
  }

  try {
    const token = await emettreLien(dossierId);
    const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
    revalidatePath(`/dossiers/${dossierId}`);
    return { ok: true, url: `${base}/depot/${token}` };
  } catch (err) {
    console.error("[depot] emission:", err);
    return { ok: false, error: "Impossible de générer le lien." };
  }
}

/**
 * Marque les pièces du bénéficiaire comme vues : l'artisan vient d'ouvrir le dossier.
 *
 * C'est ce qui éteint le signal « nouveau » dans la liste. On revalide la liste, pas
 * le dossier : revalider la page depuis laquelle l'appel part la ferait se recharger
 * en boucle.
 */
export async function marquerPiecesVues(
  dossierId: string,
): Promise<{ ok: boolean }> {
  const data = await getDossier(dossierId);
  if (!data) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("dossiers")
    .update({ pieces_vues_at: new Date().toISOString() })
    .eq("id", dossierId);

  if (error) {
    console.error("[depot] vues:", error.message);
    return { ok: false };
  }
  revalidatePath("/dossiers");
  return { ok: true };
}

/**
 * Coupe l'accès de tous les liens émis pour ce dossier, définitivement : le
 * prochain lien émis aura une URL différente (nonce neuf, cf. lien.ts).
 *
 * On ne renvoie `ok: true` que si l'écriture a réellement eu lieu. Annoncer une
 * révocation qui n'a pas été enregistrée, c'est promettre à l'artisan que l'accès
 * est coupé alors que l'URL fuitée fonctionne toujours.
 */
export async function revoquerLienDepot(
  dossierId: string,
): Promise<{ ok: boolean }> {
  const data = await getDossier(dossierId);
  if (!data) return { ok: false };
  try {
    await revoquerLiens(dossierId);
  } catch (err) {
    console.error("[depot] revocation:", err);
    return { ok: false };
  }
  revalidatePath(`/dossiers/${dossierId}`);
  return { ok: true };
}

/* -------------------------------------------------------- Côté bénéficiaire */

export interface PieceDeposee {
  id: string;
  type: TypePiece;
  nomFichier: string | null;
  createdAt: string;
}

export type DepotResult =
  | { ok: true; piece: PieceDeposee }
  | { ok: false; error: string };

const TYPES_AUTORISES = new Set<string>(PIECES_BENEFICIAIRE);

/**
 * Dépôt d'une pièce par le bénéficiaire, sans compte et sans session.
 *
 * Toute la garde tient dans `resoudreLien` : un token valide vaut autorisation pour
 * CE dossier et lui seul. Le `dossierId` n'est jamais reçu du client — il est
 * dérivé du token, ce qui rend impossible de déposer une pièce dans le dossier
 * d'un autre.
 *
 * L'écriture passe en service-role : la RLS de `pieces_justificatives` et du bucket
 * reste strictement réservée aux artisans authentifiés, et aucune policy anonyme
 * n'est ouverte sur des données qui contiennent un avis d'imposition et un RIB.
 */
export async function deposerPiece(
  token: string,
  type: TypePiece,
  formData: FormData,
): Promise<DepotResult> {
  const lien = await resoudreLien(token);
  if (!lien) return { ok: false, error: "Ce lien n'est plus valide." };

  if (!TYPES_AUTORISES.has(type)) {
    return { ok: false, error: "Type de pièce non attendu." };
  }
  // Et pas seulement « une pièce bénéficiaire » : une pièce que CE dossier réclame.
  if (!piecesAttendues(lien.data).some((p) => p.type === type)) {
    return { ok: false, error: "Ce dossier ne demande pas cette pièce." };
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

  // Seul l'avis d'imposition est lu : c'est lui qui commande le montant de l'aide,
  // donc le seul dont le contenu peut contredire le dossier. Les autres pièces sont
  // reçues et rangées, sans être passées à un modèle — traiter un RIB ou une carte
  // d'identité n'apporterait rien au contrôle et beaucoup au risque.
  //
  // Volume borné avant l'upload sur ce seul chemin de lecture : un avis tient en
  // quelques pages, un lot scanné n'a pas à être stocké ni lu.
  const aLire = type === "avis_imposition";
  let doc: DocumentPrepare | null = null;
  if (aLire) {
    const prep = await preparerDocument({ bytes, mime: file.type, filename: file.name });
    if (!prep.ok) return { ok: false, error: prep.message };
    doc = prep.doc;
  }

  const admin = createAdminClient();

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const pieceId = crypto.randomUUID();
  const path = `${lien.dossierId}/${pieceId}.${ext}`;

  const up = await admin.storage
    .from("pieces")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (up.error) {
    console.error("[depot] upload:", up.error.message);
    return { ok: false, error: "L'envoi a échoué. Réessayez." };
  }

  const lu = doc ? await lireAvisImposition({ doc }) : null;

  const { error: insErr } = await admin.from("pieces_justificatives").insert({
    id: pieceId,
    dossier_id: lien.dossierId,
    type,
    storage_path: path,
    nom_fichier: file.name,
    mime: file.type,
    taille: file.size,
    deposant: "beneficiaire",
    extraction_json: lu?.ok ? (lu.data as unknown as Json) : null,
    extraction_statut: lu ? (lu.ok ? "ok" : "echec") : "en_attente",
    extraction_erreur: lu && !lu.ok ? (lu.message ?? "Lecture impossible.") : null,
    extracted_at: lu ? new Date().toISOString() : null,
  });
  if (insErr) {
    console.error("[depot] insert:", insErr.message);
    return { ok: false, error: "Pièce envoyée, mais enregistrement impossible." };
  }

  // Le rapport de l'artisan doit voir la pièce arriver.
  revalidatePath(`/dossiers/${lien.dossierId}`);

  return {
    ok: true,
    piece: {
      id: pieceId,
      type,
      nomFichier: file.name,
      createdAt: new Date().toISOString(),
    },
  };
}

/** Retire une pièce que le bénéficiaire vient de déposer (erreur de fichier). */
export async function retirerPiece(
  token: string,
  pieceId: string,
): Promise<{ ok: boolean }> {
  const lien = await resoudreLien(token);
  if (!lien) return { ok: false };

  const admin = createAdminClient();

  // Le bénéficiaire ne peut retirer que SES pièces, et seulement dans SON dossier :
  // il ne touche jamais au devis ni à la facture de l'artisan.
  const { data: piece } = await admin
    .from("pieces_justificatives")
    .select("id, storage_path")
    .eq("id", pieceId)
    .eq("dossier_id", lien.dossierId)
    .eq("deposant", "beneficiaire")
    .maybeSingle();

  if (!piece) return { ok: false };

  if (piece.storage_path) {
    await admin.storage.from("pieces").remove([piece.storage_path]);
  }
  await admin.from("pieces_justificatives").delete().eq("id", piece.id);

  revalidatePath(`/dossiers/${lien.dossierId}`);
  return { ok: true };
}

/** Pièces déjà déposées par le bénéficiaire, pour l'affichage de la page publique. */
export async function piecesDuBeneficiaire(
  token: string,
): Promise<PieceDeposee[]> {
  const lien = await resoudreLien(token);
  if (!lien) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("pieces_justificatives")
    .select("id, type, nom_fichier, created_at")
    .eq("dossier_id", lien.dossierId)
    .eq("deposant", "beneficiaire")
    .order("created_at", { ascending: true });

  return (data ?? []).map((p) => ({
    id: p.id,
    type: p.type,
    nomFichier: p.nom_fichier,
    createdAt: p.created_at,
  }));
}
