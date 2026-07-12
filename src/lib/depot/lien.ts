import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import type { DossierComplet } from "@/lib/dossier/get-dossier";
import {
  fetchRegleActive,
  type RegleMetierResolue,
} from "@/lib/rules/regles-metier";

/**
 * Le lien de dépôt : la porte par laquelle le client de l'artisan verse ses pièces,
 * sans compte et sans mot de passe.
 *
 * Cette URL collecte un avis d'imposition, un RIB et une pièce d'identité. Elle est
 * donc traitée comme un secret :
 *  - token de 32 octets aléatoires (256 bits) — non devinable ;
 *  - seul son SHA-256 est stocké : une fuite de la base n'ouvre aucune porte, et
 *    Dossimo lui-même est incapable de réafficher un lien déjà émis ;
 *  - il expire, et l'artisan peut révoquer d'un coup tous les liens d'un dossier ;
 *  - il n'ouvre AUCUNE policy anonyme : le serveur résout le token puis agit en
 *    service-role, pour ce dossier-là et rien d'autre.
 */

/** Durée de vie d'un lien. Au-delà, le client redemande un lien à son artisan. */
const VALIDITE_JOURS = 60;

export function genererToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hacherToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Émet un lien pour un dossier. Le token en clair n'est renvoyé QU'ICI, une fois :
 * il n'est stocké nulle part et ne pourra pas être réaffiché.
 *
 * Les liens déjà émis restent valides. C'est délibéré : révoquer l'ancien à chaque
 * clic couperait l'accès au client qui est peut-être déjà en train de déposer ses
 * pièces. La révocation existe, mais elle est un geste explicite.
 */
export async function emettreLien(dossierId: string): Promise<string> {
  const token = genererToken();
  const expire = new Date(Date.now() + VALIDITE_JOURS * 24 * 60 * 60 * 1000);

  const admin = createAdminClient();
  const { error } = await admin.from("liens_depot").insert({
    dossier_id: dossierId,
    token_hash: hacherToken(token),
    expire_at: expire.toISOString(),
  });
  if (error) throw new Error(`Émission du lien impossible : ${error.message}`);

  return token;
}

/** Révoque tous les liens actifs d'un dossier. */
export async function revoquerLiens(dossierId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("liens_depot")
    .update({ revoque_at: new Date().toISOString() })
    .eq("dossier_id", dossierId)
    .is("revoque_at", null);
}

export interface LienResolu {
  lienId: string;
  dossierId: string;
  data: DossierComplet;
}

/**
 * Résout un token en dossier, ou null. C'est LA garde de tout le parcours public :
 * aucune route de dépôt ne doit toucher à un dossier sans être passée par ici.
 *
 * Volontairement muette sur la cause de l'échec (inconnu / expiré / révoqué) : la
 * réponse ne doit pas aider à sonder les tokens.
 */
export async function resoudreLien(token: string): Promise<LienResolu | null> {
  if (!token || token.length < 20) return null;

  const admin = createAdminClient();
  const { data: lien } = await admin
    .from("liens_depot")
    .select("id, dossier_id, expire_at, revoque_at")
    .eq("token_hash", hacherToken(token))
    .maybeSingle();

  if (!lien) return null;
  if (lien.revoque_at) return null;
  if (new Date(lien.expire_at) < new Date()) return null;

  const { data: dossier } = await admin
    .from("dossiers")
    .select("*")
    .eq("id", lien.dossier_id)
    .maybeSingle();
  if (!dossier) return null;

  const { data: artisan } = dossier.artisan_id
    ? await admin
        .from("artisans")
        .select("*")
        .eq("id", dossier.artisan_id)
        .maybeSingle()
    : { data: null };

  let regle: RegleMetierResolue | null = null;
  try {
    regle = await fetchRegleActive(
      admin,
      dossier.dispositif,
      dossier.type_travaux,
    );
  } catch {
    regle = null; // Le repli codé suffit à savoir quoi réclamer au bénéficiaire.
  }

  return {
    lienId: lien.id,
    dossierId: lien.dossier_id,
    data: {
      dossier,
      artisan: artisan ?? null,
      caracteristiques:
        dossier.caracteristiques_techniques_json as unknown as DossierComplet["caracteristiques"],
      dates: dossier.dates_json as unknown as DossierComplet["dates"],
      regle,
    },
  };
}

/** Trace la visite, sans bloquer le parcours si l'écriture échoue. */
export async function marquerVisite(lienId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("liens_depot")
    .update({ derniere_visite_at: new Date().toISOString() })
    .eq("id", lienId);
}
