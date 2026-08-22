import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

type Client = SupabaseClient<Database>;

/**
 * Rétention des données de prospection — jumeau de `src/lib/piece/retention.ts`
 * (README §1, règle 5 : un motif s'applique partout, pas à une table).
 *
 * CNIL prospection B2B : les coordonnées d'un professionnel peuvent être
 * conservées le temps de la relation commerciale, puis ~3 ans après le dernier
 * contact. Passé ce délai sans aucune réponse, le contact est un mort statistique :
 * on le purge plutôt que de porter indéfiniment sa donnée personnelle.
 *
 * ⚠️ CE QUI N'EST JAMAIS PURGÉ ICI :
 *  - `oppositions` : liste d'opposition, nécessité légale (c'est elle qui interdit
 *    de re-contacter). Sans limite de conservation.
 *  - Les contacts JAMAIS sollicités (aucun échange sortant) : ils sont l'actif
 *    annuaire ADEME documenté en `source` (art. 14 RGPD). Purger un prospect
 *    qu'on n'a jamais approché détruirait l'actif sans obligation.
 *  - Les tables héritage `prospects` / `prospects_dossimo` : en sursis, leur
 *    retrait fera l'objet d'une migration dédiée (README §3).
 */

/**
 * Délai après le DERNIER contact sortant sans aucune réponse (ni réponse, ni RDV,
 * ni clic) au-delà duquel un contact est purgé, avec ses échanges (cascade).
 * CNIL : ~3 ans après le dernier contact en prospection B2B.
 */
export const RETENTION_CONTACT_SANS_REPONSE_JOURS = 3 * 365;

/** Plafond absolu d'un lead depuis sa capture, converti ou non. */
export const RETENTION_LEAD_JOURS = 3 * 365;

/**
 * Fenêtre technique du limiteur : 15 min par défaut, quelques usages à la journée.
 * Sept jours couvrent largement toute fenêtre utile avant purge.
 */
export const RETENTION_RATE_LIMIT_JOURS = 7;

const JOUR_MS = 24 * 60 * 60 * 1000;

/** Données minimales d'un contact pour la décision de purge. */
export type ContactRetention = {
  /** Date du dernier échange SORTANT ; null si le contact n'a jamais été sollicité. */
  dernierContactLe: string | null;
  /** Au moins un signal positif entrant : réponse, RDV ou clic. */
  aRepondu: boolean;
};

/**
 * Un contact est purgeable si : il a été sollicité, il n'a JAMAIS montré
 * d'intérêt, et son dernier contact sortant date de plus de trois ans.
 * Fonction pure, testée unitairement.
 */
export function estContactPurgeable(contact: ContactRetention, now: Date): boolean {
  if (!contact.dernierContactLe) return false;
  if (contact.aRepondu) return false;
  const age = now.getTime() - new Date(contact.dernierContactLe).getTime();
  return age > RETENTION_CONTACT_SANS_REPONSE_JOURS * JOUR_MS;
}

/** Un lead est purgeable au plafond absolu, sauf s'il correspond à un artisan. */
export function estLeadPurgeable(
  lead: { createdAt: string; email: string },
  emailsArtisans: Set<string>,
  now: Date,
): boolean {
  const age = now.getTime() - new Date(lead.createdAt).getTime();
  return age > RETENTION_LEAD_JOURS * JOUR_MS && !emailsArtisans.has(lead.email.toLowerCase());
}

function chunk<T>(xs: T[], taille: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += taille) out.push(xs.slice(i, i + taille));
  return out;
}

const LOT = 200;

export type RapportPurgeProspection = {
  contactsSupprimes: number;
  leadsSupprimes: number;
  rateLimitsSupprimes: number;
};

/**
 * Purge les données de prospection échues. Comme pour la purge des pièces :
 * service-role (RLS ferme ces tables à tout le monde), fail loud — un échec
 * silencieux ici, ce sont des données personnelles qu'on croit effacées alors
 * qu'elles persistent. Le lot en échec n'est pas supprimé et sera retenté au
 * prochain passage du cron.
 */
export async function purgerProspectionExpiree(
  admin: Client,
  now: Date = new Date(),
): Promise<RapportPurgeProspection> {
  // --- 1) Contacts dormants depuis trois ans sans aucune réponse -------------
  // L'agrégat est lu depuis les échanges : `etat` ne se lit pas (recalculé par
  // trigger) et ne distingue de toute façon pas « répondu un jour » de « récent ».
  const { data, error } = await admin
    .from("contact_echanges")
    .select("contact_id, sens, nature, survenu_le")
    .order("survenu_le", { ascending: false });

  if (error) throw new Error(`purge_prospection/echanges: ${error.message}`);

  const dernierSortant = new Map<string, string>();
  const repondants = new Set<string>();
  for (const e of data ?? []) {
    const cid = e.contact_id as string;
    if ((e.sens as string) === "sortant") {
      const connu = dernierSortant.get(cid);
      if (!connu || (e.survenu_le as string) > connu) {
        dernierSortant.set(cid, e.survenu_le as string);
      }
    }
    if (
      (e.sens as string) === "entrant" &&
      ["reponse", "rdv", "clic"].includes(e.nature as string)
    ) {
      repondants.add(cid);
    }
  }

  const contactsPurgeables = [...dernierSortant.entries()]
    .filter(([cid, derniere]) =>
      estContactPurgeable({ dernierContactLe: derniere, aRepondu: repondants.has(cid) }, now),
    )
    .map(([cid]) => cid);

  let contactsSupprimes = 0;
  for (const lot of chunk(contactsPurgeables, LOT)) {
    // La suppression cascade vers contact_echanges (0057, on delete cascade) :
    // l'historique d'un contact purgé disparaît avec lui.
    const { error: delErr } = await admin.from("contacts").delete().in("id", lot);
    if (delErr) throw new Error(`purge_prospection/contacts: ${delErr.message}`);
    contactsSupprimes += lot.length;
  }

  // --- 2) Leads au plafond, sauf convertis -----------------------------------
  const coupureLead = new Date(now.getTime() - RETENTION_LEAD_JOURS * JOUR_MS).toISOString();
  const { data: vieuxLeads, error: leadsErr } = await admin
    .from("leads")
    .select("id, email, created_at")
    .lt("created_at", coupureLead);

  if (leadsErr) throw new Error(`purge_prospection/leads: ${leadsErr.message}`);

  const { data: artisans, error: artisansErr } = await admin.from("artisans").select("email");
  if (artisansErr) throw new Error(`purge_prospection/artisans: ${artisansErr.message}`);
  const emailsArtisans = new Set((artisans ?? []).map((a) => (a.email as string).toLowerCase()));

  const leadsPurgeables = (vieuxLeads ?? [])
    .map((l) => ({ id: l.id as string, email: l.email as string, createdAt: l.created_at as string }))
    .filter((l) => estLeadPurgeable(l, emailsArtisans, now));

  let leadsSupprimes = 0;
  for (const lot of chunk(leadsPurgeables, LOT)) {
    const { error: delErr } = await admin
      .from("leads")
      .delete()
      .in("id", lot.map((l) => l.id));
    if (delErr) throw new Error(`purge_prospection/leads_delete: ${delErr.message}`);
    leadsSupprimes += lot.length;
  }

  // --- 3) Rate limits échus --------------------------------------------------
  const coupureRl = new Date(now.getTime() - RETENTION_RATE_LIMIT_JOURS * JOUR_MS).toISOString();
  const { error: rlErr, count } = await admin
    .from("auth_rate_limits")
    .delete({ count: "exact" })
    .lt("window_started_at", coupureRl);
  if (rlErr) throw new Error(`purge_prospection/rate_limits: ${rlErr.message}`);

  return {
    contactsSupprimes,
    leadsSupprimes,
    rateLimitsSupprimes: count ?? 0,
  };
}
