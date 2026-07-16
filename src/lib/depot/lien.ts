import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";

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
 *  - token HMAC-SHA-256 dérivé d'un secret serveur ET d'un aléa propre au lien
 *    (le nonce) : 256 bits, non devinable, non énumérable ;
 *  - seul son SHA-256 est stocké : une fuite de la base n'ouvre aucune porte ;
 *  - il expire, et l'artisan peut le révoquer DÉFINITIVEMENT (voir le nonce) ;
 *  - il n'ouvre AUCUNE policy anonyme : le serveur résout le token puis agit en
 *    service-role, pour ce dossier-là et rien d'autre.
 *
 * LE NONCE, ET POURQUOI IL EXISTE
 * Le token était autrefois dérivé du seul `dossier_id`, donc identique à chaque
 * génération. Une URL révoquée puis regénérée redevenait valide : la révocation
 * ne révoquait rien (cf. migration 0041). Le nonce, tiré au sort à chaque NOUVEAU
 * lien, casse ça : un lien révoqué ne peut plus jamais être ressuscité.
 *
 * Le nonce est en revanche RÉUTILISÉ tant que le lien est actif, pour que l'URL
 * reste stable entre l'écran et les relances. C'est la propriété que l'ancien
 * design déterministe cherchait ; elle est conservée, sans la faille.
 */

/** Durée de vie d'un lien. Au-delà, le client redemande un lien à son artisan. */
const VALIDITE_JOURS = 60;

/**
 * Le secret de dérivation. AUCUN repli : il retombait autrefois sur
 * `SUPABASE_SERVICE_ROLE_KEY`, ce qui cumulait trois défauts. Qui obtenait la clé
 * service-role pouvait calculer hors ligne le token de n'importe quel dossier,
 * sans toucher la base. Toute rotation de cette clé (geste standard après
 * incident) invalidait en silence 100 % des liens en circulation. Et le repli
 * final `|| ""` produisait des HMAC forgeables si les deux variables manquaient,
 * sans lever la moindre erreur.
 *
 * On échoue donc franchement plutôt que de marcher en mode dégradé indiscernable
 * du mode nominal. `DEPOT_LINK_SECRET` est obligatoire (voir .env.example).
 */
function lireSecret(): string {
  const secret = process.env.DEPOT_LINK_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "DEPOT_LINK_SECRET absent ou trop court (32 caractères minimum). " +
        "Générer : openssl rand -base64 32",
    );
  }
  return secret;
}

/** Un aléa de 256 bits, l'ingrédient qui rend chaque lien unique. */
function genererNonce(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Dérive le token d'un lien. Le nonce entre dans la dérivation : même dossier +
 * nonce différent = token différent. C'est toute la mécanique de révocation.
 */
export function genererTokenDossier(
  dossierId: string,
  secret: string,
  nonce: string,
): string {
  if (!secret) throw new Error("Secret de lien de dépôt absent.");
  if (!nonce) throw new Error("Nonce de lien de dépôt absent.");
  return createHmac("sha256", secret)
    .update(`dossimo:depot:v2:${dossierId}:${nonce}`)
    .digest("base64url");
}

export function hacherToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Émet le lien d'un dossier, ou prolonge celui qui est déjà actif.
 *
 * Deux cas, et la distinction est le cœur du correctif :
 *  - un lien ACTIF existe (non révoqué, non expiré, en v2) : on réutilise son
 *    nonce et on repousse l'échéance. Même URL. L'artisan qui prépare une relance
 *    ne casse pas le lien qu'il a déjà envoyé.
 *  - sinon (aucun lien, ou révoqué, ou expiré, ou v1 historique) : nonce NEUF,
 *    donc URL NEUVE. Une URL révoquée ne revient jamais.
 */
export async function emettreLien(dossierId: string): Promise<string> {
  const secret = lireSecret();
  const admin = createAdminClient();
  const expire = new Date(Date.now() + VALIDITE_JOURS * 24 * 60 * 60 * 1000);

  const { data: actif, error: lectureError } = await admin
    .from("liens_depot")
    .select("id, token_nonce, expire_at")
    .eq("dossier_id", dossierId)
    .is("revoque_at", null)
    .gt("expire_at", new Date().toISOString())
    .maybeSingle();
  if (lectureError) {
    throw new Error(`Lecture du lien courant impossible : ${lectureError.message}`);
  }

  // Lien actif en v2 : on prolonge, l'URL ne bouge pas.
  if (actif?.token_nonce) {
    const { error } = await admin
      .from("liens_depot")
      .update({ expire_at: expire.toISOString() })
      .eq("id", actif.id);
    if (error) throw new Error(`Prolongation du lien impossible : ${error.message}`);
    return genererTokenDossier(dossierId, secret, actif.token_nonce);
  }

  // Aucun lien réutilisable. On révoque TOUT ce qui traîne sur ce dossier avant
  // d'insérer : l'index unique partiel `liens_depot_un_actif_par_dossier_idx`
  // (0029) ne porte que sur `revoque_at is null`, donc une ligne expirée mais non
  // révoquée occupe encore la place et ferait échouer l'insert. Ce balayage
  // couvre aussi les liens v1 historiques (nonce NULL), qui sont ainsi retirés de
  // la circulation au lieu d'être ressuscités.
  const { error: revokeError } = await admin
    .from("liens_depot")
    .update({ revoque_at: new Date().toISOString() })
    .eq("dossier_id", dossierId)
    .is("revoque_at", null);
  if (revokeError) {
    throw new Error(`Révocation des anciens liens impossible : ${revokeError.message}`);
  }

  const nonce = genererNonce();
  const token = genererTokenDossier(dossierId, secret, nonce);
  const { error } = await admin.from("liens_depot").insert({
    dossier_id: dossierId,
    token_hash: hacherToken(token),
    token_nonce: nonce,
    expire_at: expire.toISOString(),
  });
  if (error) throw new Error(`Émission du lien impossible : ${error.message}`);

  return token;
}

/**
 * Retrouve le lien actif d'un dossier pour le réafficher à l'artisan, sans en
 * émettre un nouveau.
 *
 * Renvoie null pour un lien v1 historique (nonce NULL) : son token était dérivé
 * de l'ancien secret et n'est plus recalculable. Le lien reste valide pour le
 * bénéficiaire qui l'a déjà (la résolution se fait par hash), mais l'artisan devra
 * en émettre un nouveau pour le revoir, ce qui bascule le dossier en v2.
 */
export async function retrouverLienActif(dossierId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("liens_depot")
    .select("token_nonce, expire_at, revoque_at")
    .eq("dossier_id", dossierId)
    .is("revoque_at", null)
    .maybeSingle();
  if (error) {
    console.error("[depot] lecture du lien actif:", error.message);
    return null;
  }
  if (!data?.token_nonce) return null;
  if (new Date(data.expire_at) < new Date()) return null;
  return genererTokenDossier(dossierId, lireSecret(), data.token_nonce);
}

/**
 * Révoque tous les liens actifs d'un dossier, définitivement : le prochain lien
 * émis recevra un nonce neuf, donc une URL différente.
 *
 * Lève si l'écriture échoue. Une révocation est une promesse de sécurité faite à
 * l'artisan ; échouer en silence lui laisserait croire que l'accès est coupé
 * alors qu'il ne l'est pas.
 */
export async function revoquerLiens(dossierId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("liens_depot")
    .update({ revoque_at: new Date().toISOString() })
    .eq("dossier_id", dossierId)
    .is("revoque_at", null);
  if (error) throw new Error(`Révocation impossible : ${error.message}`);
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
