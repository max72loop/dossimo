import "server-only";

import { createHash, createHmac } from "node:crypto";

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
 *  - token HMAC-SHA-256 stable par dossier — non devinable ;
 *  - seul son SHA-256 est stocké : une fuite de la base n'ouvre aucune porte, et
 *    le serveur peut le recalculer, mais une fuite de la base ne suffit pas ;
 *  - il expire, et l'artisan peut révoquer d'un coup tous les liens d'un dossier ;
 *  - il n'ouvre AUCUNE policy anonyme : le serveur résout le token puis agit en
 *    service-role, pour ce dossier-là et rien d'autre.
 */

/** Durée de vie d'un lien. Au-delà, le client redemande un lien à son artisan. */
const VALIDITE_JOURS = 60;

export function genererTokenDossier(dossierId: string, secret: string): string {
  if (!secret) throw new Error("Secret de lien de dépôt absent.");
  return createHmac("sha256", secret)
    .update(`dossimo:depot:v1:${dossierId}`)
    .digest("base64url");
}

export function hacherToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Émet ou prolonge l'unique lien d'un dossier. Le jeton stable est recalculable
 * uniquement avec le secret serveur ; les anciens liens aléatoires sont révoqués.
 */
export async function emettreLien(dossierId: string): Promise<string> {
  const secret = process.env.DEPOT_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const token = genererTokenDossier(dossierId, secret);
  const tokenHash = hacherToken(token);
  const expire = new Date(Date.now() + VALIDITE_JOURS * 24 * 60 * 60 * 1000);

  const admin = createAdminClient();
  const { error: revokeError } = await admin
    .from("liens_depot")
    .update({ revoque_at: new Date().toISOString() })
    .eq("dossier_id", dossierId)
    .is("revoque_at", null)
    .neq("token_hash", tokenHash);
  if (revokeError) {
    throw new Error(`Révocation des anciens liens impossible : ${revokeError.message}`);
  }

  const { error } = await admin.from("liens_depot").upsert({
    dossier_id: dossierId,
    token_hash: tokenHash,
    expire_at: expire.toISOString(),
    revoque_at: null,
  }, { onConflict: "token_hash" });
  if (error) throw new Error(`Émission du lien impossible : ${error.message}`);

  return token;
}

/** Retrouve le jeton stable s'il a déjà été émis et reste actif. */
export async function retrouverLienActif(dossierId: string): Promise<string | null> {
  const secret = process.env.DEPOT_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!secret) return null;
  const token = genererTokenDossier(dossierId, secret);
  const admin = createAdminClient();
  const { data } = await admin
    .from("liens_depot")
    .select("expire_at,revoque_at")
    .eq("dossier_id", dossierId)
    .eq("token_hash", hacherToken(token))
    .maybeSingle();
  if (!data || data.revoque_at || new Date(data.expire_at) < new Date()) return null;
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
