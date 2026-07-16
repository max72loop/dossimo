import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { choisirAccroche, type Bucket } from "./accroches";
import { saluer, messageWhatsApp, messageEmail, lienWhatsApp, normaliserTelephoneFr } from "./message";

/**
 * Sélection du « lot du jour » du sprint de prospection (plan v3, §12, outil 1).
 *
 * Lecture en service-role : `prospects_dossimo` est en RLS fermée, seul le
 * service-role y accède. L'envoi reste manuel (la page génère des messages
 * prêts à copier + des liens wa.me) ; ce module ne fait que préparer le lot.
 */

export type CanalSprint = "whatsapp" | "email";

/** Plafond quotidien par canal, en dur (plan §5). Une règle de sécurité, pas un objectif. */
export const PLAFOND_QUOTIDIEN = 40;

/** Jour courant au format YYYY-MM-DD, en heure de Paris (jamais heure serveur). */
export function jourParis(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(d);
}

export type ContactSprint = {
  placeId: string;
  name: string | null;
  denomination: string | null;
  city: string | null;
  codePostal: string | null;
  phone: string | null;
  email: string | null;
  rgeDomaines: string[];
  bucket: Bucket;
  metier: string;
  fiches: string;
  inconnus: string[];
  /** WhatsApp : le texte ; e-mail : le corps. */
  message: string;
  /** E-mail seulement. */
  objet: string | null;
  /** WhatsApp seulement : lien wa.me pré-rempli, ou null si numéro inexploitable. */
  lienWa: string | null;
};

export type ComptesSprint = {
  totalCanal: number;
  envoyes: number;
  envoyesAujourdhui: number;
  optOut: number;
  restantsPlafond: number;
  plafond: number;
};

export type LotDuJour = {
  canal: CanalSprint;
  contacts: ContactSprint[];
  comptes: ComptesSprint;
  /** Libellés `rge_domaines` non reconnus rencontrés dans ce lot (à corriger, pas deviner). */
  inconnus: string[];
};

/**
 * Charge le lot du jour pour un canal : les contacts assignés à ce canal, non
 * désinscrits, pas encore envoyés, et éligibles (téléphone exploitable pour
 * WhatsApp, e-mail validé pour l'e-mail). Ordonnés par score décroissant.
 */
export async function chargerLotDuJour(canal: CanalSprint, taille: number): Promise<LotDuJour> {
  const admin = createAdminClient();
  const aujourdhui = jourParis();

  // --- Comptes (têtes de requête, sans corps) ---
  const base = () => admin.from("prospects_dossimo").select("place_id", { count: "exact", head: true }).eq("canal", canal);
  const [{ count: totalCanal }, { count: envoyes }, { count: envoyesAujourdhui }, { count: optOut }] = await Promise.all([
    base(),
    base().not("date_envoi", "is", null),
    base().eq("date_envoi", aujourdhui),
    base().eq("opt_out", true),
  ]);

  const restantsPlafond = Math.max(0, PLAFOND_QUOTIDIEN - (envoyesAujourdhui ?? 0));

  // --- Sélection des candidats ---
  let requete = admin
    .from("prospects_dossimo")
    .select("place_id, name, denomination, city, code_postal, phone, email_valide, emails, rge_domaines")
    .eq("canal", canal)
    .eq("opt_out", false)
    .is("date_envoi", null);

  if (canal === "whatsapp") requete = requete.not("phone", "is", null).neq("phone", "");
  else requete = requete.eq("email_valide", true);

  // On sur-échantillonne (×2) puis on affine en JS : certains candidats seront
  // écartés (numéro non normalisable, aucun e-mail dans le tableau).
  const { data, error } = await requete
    .order("score", { ascending: false, nullsFirst: false })
    .limit(Math.max(taille * 2, taille));
  if (error) throw new Error(`Lecture prospects_dossimo : ${error.message}`);

  const inconnusGlobaux = new Set<string>();
  const contacts: ContactSprint[] = [];

  for (const row of data ?? []) {
    if (contacts.length >= taille) break;
    const rge = (row.rge_domaines ?? []).filter(Boolean) as string[];
    const { bucket, accroche, inconnus } = choisirAccroche(rge);
    for (const i of inconnus) inconnusGlobaux.add(i);
    const salutation = saluer(row.name);

    if (canal === "whatsapp") {
      const message = messageWhatsApp({ salutation, ville: row.city, metier: accroche.metier, accroche });
      const lienWa = lienWhatsApp(row.phone, message);
      if (!normaliserTelephoneFr(row.phone)) continue; // numéro inexploitable : on saute
      contacts.push({
        placeId: row.place_id, name: row.name, denomination: row.denomination, city: row.city,
        codePostal: row.code_postal, phone: row.phone, email: null, rgeDomaines: rge,
        bucket, metier: accroche.metier, fiches: accroche.fiches, inconnus,
        message, objet: null, lienWa,
      });
    } else {
      const email = (row.emails ?? []).map((e) => (e ?? "").trim()).find((e) => e.includes("@")) ?? null;
      if (!email) continue; // aucune adresse exploitable : on saute
      const { objet, corps } = messageEmail({ salutation, accroche });
      contacts.push({
        placeId: row.place_id, name: row.name, denomination: row.denomination, city: row.city,
        codePostal: row.code_postal, phone: null, email, rgeDomaines: rge,
        bucket, metier: accroche.metier, fiches: accroche.fiches, inconnus,
        message: corps, objet, lienWa: null,
      });
    }
  }

  return {
    canal,
    contacts,
    comptes: {
      totalCanal: totalCanal ?? 0,
      envoyes: envoyes ?? 0,
      envoyesAujourdhui: envoyesAujourdhui ?? 0,
      optOut: optOut ?? 0,
      restantsPlafond,
      plafond: PLAFOND_QUOTIDIEN,
    },
    inconnus: [...inconnusGlobaux],
  };
}
