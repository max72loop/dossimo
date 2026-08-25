import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Jeton d'ouverture de formulaire : un timestamp signé au rendu serveur de la
 * page, transporté par un champ caché et revérifié à la soumission.
 *
 * Contrairement à un simple `Date.now()` posté par le client (falsifiable par
 * quiconque appelle la Server Action directement), la signature empêche un bot
 * de fabriquer un jeton « déjà vieux » pour contourner le délai minimal : il ne
 * peut que rejouer un jeton réellement vu, et se heurte alors au même délai
 * qu'un humain.
 */

export type VerdictOuverture = "ok" | "trop-tot" | "indisponible";

function signer(horodatage: string, secret: string): string {
  return createHmac("sha256", secret).update(horodatage).digest("hex");
}

export function signerOuvertureFormulaire(): string | null {
  const secret = process.env.FORM_TIMING_SECRET;
  if (!secret) {
    console.error("[forms] FORM_TIMING_SECRET manquant");
    return null;
  }
  const horodatage = Date.now().toString();
  return `${horodatage}.${signer(horodatage, secret)}`;
}

/** @param delaiMinMs Délai minimal entre l'affichage du formulaire et sa soumission. */
export function verifierOuvertureFormulaire(
  jeton: unknown,
  delaiMinMs = 3000,
): VerdictOuverture {
  const secret = process.env.FORM_TIMING_SECRET;
  if (!secret) {
    console.error("[forms] FORM_TIMING_SECRET manquant");
    return "indisponible";
  }
  if (typeof jeton !== "string") return "trop-tot";

  const [horodatage, signature] = jeton.split(".");
  if (!horodatage || !signature) return "trop-tot";

  const attendue = signer(horodatage, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(attendue);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return "trop-tot";

  const ouvert = Number(horodatage);
  if (!Number.isFinite(ouvert)) return "trop-tot";

  return Date.now() - ouvert >= delaiMinMs ? "ok" : "trop-tot";
}
