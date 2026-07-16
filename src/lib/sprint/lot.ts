import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { choisirAccroche, type Bucket } from "./accroches";
import {
  saluer,
  messageWhatsApp,
  messageEmail,
  messageRelanceWhatsApp,
  messageRelanceEmail,
  lienWhatsApp,
  normaliserTelephoneFr,
} from "./message";
import { debutDuMoisParis, editionDuMois, messageNurturing, moisParis } from "./nurturing";

/**
 * Sélection du « lot du jour » du sprint de prospection (plan v3, §12, outils 1 et 3).
 *
 * Lecture en service-role : `prospects_dossimo` est en RLS fermée, seul le
 * service-role y accède. L'envoi reste manuel (la page génère des messages
 * prêts à copier + des liens wa.me) ; ce module ne fait que préparer le lot.
 */

export type CanalSprint = "whatsapp" | "email";

/**
 * Les trois temps d'un contact (plan §12, outil 3) :
 * - `premier`   : jamais contacté ;
 * - `relance`   : contacté il y a 5 jours ou plus, silencieux, jamais relancé (une seule fois) ;
 * - `nurturing` : sorti de la prospection active, reçoit l'édition mensuelle.
 */
export type ModeSprint = "premier" | "relance" | "nurturing";

/** Plafond quotidien par canal, en dur (plan §5). Une règle de sécurité, pas un objectif. */
export const PLAFOND_QUOTIDIEN = 40;

/** Délai avant la relance unique, en jours (plan §6 : « relance J+5 »). */
export const DELAI_RELANCE_JOURS = 5;

/** Jour courant au format YYYY-MM-DD, en heure de Paris (jamais heure serveur). */
export function jourParis(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(d);
}

/** Jour - n, au format YYYY-MM-DD, en heure de Paris. Sert la borne J+5. */
export function jourParisMoins(n: number, d: Date = new Date()): string {
  return jourParis(new Date(d.getTime() - n * 24 * 60 * 60 * 1000));
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
  mode: ModeSprint;
  /**
   * Canal de RENDU du message, distinct du canal d'affectation A/B : le
   * nurturing part toujours par e-mail (plan §7), y compris pour les contacts
   * du bras WhatsApp, dont on conserve l'affectation pour l'attribution.
   */
  canalRendu: CanalSprint;
  contacts: ContactSprint[];
  comptes: ComptesSprint;
  /** Libellés `rge_domaines` non reconnus rencontrés dans ce lot (à corriger, pas deviner). */
  inconnus: string[];
  /**
   * Nurturing seulement : le mois visé et son édition. `editionManquante` à true
   * quand l'édition du mois n'a pas encore été écrite dans `nurturing.ts` — dans
   * ce cas le lot est vide volontairement, on n'envoie pas une coquille.
   */
  mois: string;
  editionManquante: boolean;
};

/**
 * Charge le lot du jour pour un canal : les contacts assignés à ce canal, non
 * désinscrits, pas encore envoyés, et éligibles (téléphone exploitable pour
 * WhatsApp, e-mail validé pour l'e-mail). Ordonnés par score décroissant.
 */
export async function chargerLotDuJour(
  canal: CanalSprint,
  taille: number,
  mode: ModeSprint = "premier",
): Promise<LotDuJour> {
  const admin = createAdminClient();
  const aujourdhui = jourParis();
  const mois = moisParis();
  const edition = mode === "nurturing" ? editionDuMois(mois) : null;

  // Le nurturing part par e-mail quel que soit le bras A/B du contact (plan §7).
  const canalRendu: CanalSprint = mode === "nurturing" ? "email" : canal;

  // --- Comptes (têtes de requête, sans corps) ---
  const base = () => admin.from("prospects_dossimo").select("place_id", { count: "exact", head: true }).eq("canal", canal);
  // Le plafond protège le numéro WhatsApp et la réputation du domaine : il porte
  // donc sur TOUS les messages partis aujourd'hui, pas sur les premiers contacts
  // seuls. Un premier contact, une relance et un nurturing pèsent pareil.
  const partisAujourdhui = () =>
    base().or(
      `date_envoi.eq.${aujourdhui},date_relance.eq.${aujourdhui},date_nurturing.eq.${aujourdhui}`,
    );
  const [{ count: totalCanal }, { count: envoyes }, { count: envoyesAujourdhui }, { count: optOut }] = await Promise.all([
    base(),
    base().not("date_envoi", "is", null),
    partisAujourdhui(),
    base().eq("opt_out", true),
  ]);

  const restantsPlafond = Math.max(0, PLAFOND_QUOTIDIEN - (envoyesAujourdhui ?? 0));

  // --- Sélection des candidats ---
  let requete = admin
    .from("prospects_dossimo")
    .select("place_id, name, denomination, city, code_postal, phone, email_valide, emails, rge_domaines")
    .eq("canal", canal)
    .eq("opt_out", false);

  if (mode === "premier") {
    requete = requete.is("date_envoi", null);
  } else if (mode === "relance") {
    // Contacté il y a 5 jours ou plus, silencieux, jamais relancé (§12 : une
    // seule relance par contact, d'où `date_relance is null`).
    requete = requete
      .not("date_envoi", "is", null)
      .lte("date_envoi", jourParisMoins(DELAI_RELANCE_JOURS))
      .eq("reponse", false)
      .is("date_relance", null);
  } else {
    // Nurturing : sorti de la prospection active. §7 le place APRÈS la relance
    // J+5, d'où `date_relance not null` — sans quoi un contact recevrait relance
    // et nurturing la même semaine. Cadence par mois civil : éligible tant que
    // sa dernière édition reçue est antérieure au 1er du mois courant.
    requete = requete
      .not("date_envoi", "is", null)
      .not("date_relance", "is", null)
      .eq("reponse", false)
      .or(`date_nurturing.is.null,date_nurturing.lt.${debutDuMoisParis()}`);
  }

  // Éligibilité par canal de rendu : le nurturing exige une adresse validée même
  // pour un contact du bras WhatsApp.
  if (canalRendu === "whatsapp") requete = requete.not("phone", "is", null).neq("phone", "");
  else requete = requete.eq("email_valide", true);

  // On sur-échantillonne (×2) puis on affine en JS : certains candidats seront
  // écartés (numéro non normalisable, aucun e-mail dans le tableau).
  // Nurturing sans édition écrite : on n'interroge même pas la base, le lot est
  // vide et la console explique pourquoi. Mieux vaut rien qu'une coquille.
  const { data, error } =
    mode === "nurturing" && !edition
      ? { data: [] as never[], error: null }
      : await requete.order("score", { ascending: false, nullsFirst: false }).limit(Math.max(taille * 2, taille));
  if (error) throw new Error(`Lecture prospects_dossimo : ${error.message}`);

  const inconnusGlobaux = new Set<string>();
  const contacts: ContactSprint[] = [];

  for (const row of data ?? []) {
    if (contacts.length >= taille) break;
    const rge = (row.rge_domaines ?? []).filter(Boolean) as string[];
    const { bucket, accroche, inconnus } = choisirAccroche(rge);
    for (const i of inconnus) inconnusGlobaux.add(i);
    const salutation = saluer(row.name);

    if (canalRendu === "whatsapp") {
      const message =
        mode === "relance"
          ? messageRelanceWhatsApp({ salutation })
          : messageWhatsApp({ salutation, ville: row.city, metier: accroche.metier, accroche });
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
      const { objet, corps } =
        mode === "relance"
          ? messageRelanceEmail({ salutation, accroche })
          : mode === "nurturing" && edition
            ? messageNurturing({ salutation, edition })
            : messageEmail({ salutation, accroche });
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
    mode,
    canalRendu,
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
    mois,
    editionManquante: mode === "nurturing" && !edition,
  };
}
