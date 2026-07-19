import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CampagneProspection,
  MessageProspection,
  Prospect,
  StatutMessageProspection,
} from "@/lib/database.types";
import { dansLaFenetre, jourParis, plafondDuJour } from "@/lib/prospection/cadence";
import {
  corpsHtmlPourProspect,
  corpsPourProspect,
  lienDesinscription,
} from "@/lib/prospection/message";
import { envoyerMessage } from "@/lib/prospection/envoi";

/**
 * File d'envoi : préparation (la veille ou le matin), puis envoi au compte-gouttes.
 *
 * Deux principes tiennent tout le reste :
 *
 *  - **Rien ne part sans validation humaine.** La préparation crée des messages
 *    `en_attente` ; seul l'admin les passe en `valide`. Le tick n'envoie que du
 *    `valide`.
 *  - **En cas de doute, on n'envoie pas.** Un message est marqué `envoye` AVANT
 *    l'appel réseau (réservation optimiste) : si deux ticks se chevauchent, le
 *    second ne trouve plus rien. Un envoi perdu se rejoue à la main ; un double
 *    envoi chez un artisan ne se rattrape pas.
 */

type Client = ReturnType<typeof createAdminClient>;

export async function campagneActive(
  supabase: Client = createAdminClient(),
): Promise<CampagneProspection | null> {
  const { data } = await supabase
    .from("prospection_campagnes")
    .select("*")
    .eq("actif", true)
    .maybeSingle();
  return data ?? null;
}

export interface EtatFile {
  campagne: CampagneProspection | null;
  jour: string;
  plafond: number;
  envoyes: number;
  enAttente: number;
  valides: number;
  echecs: number;
  prospectsDisponibles: number;
}

export async function etatFile(maintenant = new Date()): Promise<EtatFile> {
  const supabase = createAdminClient();
  const campagne = await campagneActive(supabase);
  const jour = jourParis(maintenant);

  if (!campagne) {
    return {
      campagne: null,
      jour,
      plafond: 0,
      envoyes: 0,
      enAttente: 0,
      valides: 0,
      echecs: 0,
      prospectsDisponibles: 0,
    };
  }

  const compte = async (statut: StatutMessageProspection) => {
    const { count } = await supabase
      .from("prospection_messages")
      .select("id", { count: "exact", head: true })
      .eq("campagne_id", campagne.id)
      .eq("scheduled_on", jour)
      .eq("statut", statut);
    return count ?? 0;
  };

  const { count: disponibles } = await supabase
    .from("prospects")
    .select("id", { count: "exact", head: true })
    .eq("statut", "nouveau");

  return {
    campagne,
    jour,
    plafond: plafondDuJour({
      debut: campagne.demarre_le,
      fin: campagne.termine_le,
      jour,
      capMax: campagne.daily_cap_max,
    }),
    envoyes: await compte("envoye"),
    enAttente: await compte("en_attente"),
    valides: await compte("valide"),
    echecs: await compte("echec"),
    prospectsDisponibles: disponibles ?? 0,
  };
}

/**
 * Prépare la file du jour : sélectionne des prospects jamais contactés, rend leur
 * message, et les pose en `en_attente`. Idempotent : rappelée deux fois le même
 * jour, elle complète jusqu'au plafond sans jamais le dépasser.
 *
 * Les exclusions sont vérifiées ICI, à chaque préparation, et pas seulement à
 * l'import : entre deux imports, un prospect a pu se désinscrire ou devenir client.
 */
export async function preparerFile(
  maintenant = new Date(),
): Promise<{ crees: number; motif?: string }> {
  const supabase = createAdminClient();
  const campagne = await campagneActive(supabase);
  if (!campagne) return { crees: 0, motif: "Aucune campagne active." };
  if (campagne.en_pause) return { crees: 0, motif: "Campagne en pause." };

  const jour = jourParis(maintenant);
  const plafond = plafondDuJour({
    debut: campagne.demarre_le,
    fin: campagne.termine_le,
    jour,
    capMax: campagne.daily_cap_max,
  });
  if (plafond === 0) {
    return { crees: 0, motif: "Hors fenêtre de campagne (week-end ou dates)." };
  }

  const { count: dejaPrevus } = await supabase
    .from("prospection_messages")
    .select("id", { count: "exact", head: true })
    .eq("campagne_id", campagne.id)
    .eq("scheduled_on", jour)
    .in("statut", ["en_attente", "valide", "envoye"]);

  const aCreer = plafond - (dejaPrevus ?? 0);
  if (aCreer <= 0) return { crees: 0, motif: "Plafond du jour déjà atteint." };

  // On tire large : une partie des candidats sera écartée par les exclusions.
  const { data: candidats } = await supabase
    .from("prospects")
    .select("*")
    .eq("statut", "nouveau")
    .order("created_at", { ascending: true })
    .limit(aCreer * 3 + 20);

  const retenus = await filtrerExclus(supabase, candidats ?? []);
  const lot = retenus.slice(0, aCreer);
  if (lot.length === 0) return { crees: 0, motif: "Aucun prospect disponible." };

  const messages = lot.map((p) => ({
    campagne_id: campagne.id,
    prospect_id: p.id,
    objet: campagne.objet,
    corps: corpsPourProspect(campagne.corps, p),
    scheduled_on: jour,
    statut: "en_attente" as const,
  }));

  const { data: crees, error } = await supabase
    .from("prospection_messages")
    .insert(messages)
    .select("prospect_id");
  if (error) throw new Error(`Préparation de la file : ${error.message}`);

  const ids = (crees ?? []).map((m) => m.prospect_id);
  if (ids.length > 0) {
    await supabase
      .from("prospects")
      .update({ statut: "en_file" })
      .in("id", ids);
  }

  return { crees: ids.length };
}

/**
 * Écarte les prospects qu'on n'a pas le droit (ou pas d'intérêt) à contacter :
 * une opposition déjà exprimée, ou un artisan déjà client. Prospecter un client
 * existant, c'est lui dire qu'on ne sait pas qui il est.
 */
async function filtrerExclus(
  supabase: Client,
  candidats: Prospect[],
): Promise<Prospect[]> {
  if (candidats.length === 0) return [];
  const emails = candidats.map((p) => p.email.toLowerCase());

  const [{ data: supprimes }, { data: clients }] = await Promise.all([
    supabase.from("prospection_suppressions").select("email").in("email", emails),
    supabase.from("artisans").select("email").in("email", emails),
  ]);

  const exclus = new Set([
    ...(supprimes ?? []).map((s) => s.email.toLowerCase()),
    ...(clients ?? []).map((a) => (a.email ?? "").toLowerCase()),
  ]);

  const aExclure = candidats.filter((p) => exclus.has(p.email.toLowerCase()));
  if (aExclure.length > 0) {
    await supabase
      .from("prospects")
      .update({ statut: "exclu" })
      .in("id", aExclure.map((p) => p.id));
  }

  return candidats.filter((p) => !exclus.has(p.email.toLowerCase()));
}

export type ResultatTick =
  | { envoye: false; motif: string }
  | { envoye: true; messageId: string; destinataire: string };

/**
 * Envoie AU PLUS un message. Appelée toutes les dix minutes pendant la fenêtre :
 * c'est ce rythme, et non un envoi en rafale, qui fait ressembler la campagne à
 * un humain qui écrit ses mails l'un après l'autre.
 */
export async function envoyerProchain(
  maintenant = new Date(),
): Promise<ResultatTick> {
  const supabase = createAdminClient();
  const campagne = await campagneActive(supabase);
  if (!campagne) return { envoye: false, motif: "aucune campagne active" };
  if (campagne.en_pause) return { envoye: false, motif: "campagne en pause" };
  if (!dansLaFenetre(maintenant)) {
    return { envoye: false, motif: "hors fenêtre d'envoi" };
  }

  const jour = jourParis(maintenant);
  const plafond = plafondDuJour({
    debut: campagne.demarre_le,
    fin: campagne.termine_le,
    jour,
    capMax: campagne.daily_cap_max,
  });
  if (plafond === 0) return { envoye: false, motif: "jour non couvert" };

  const { count: envoyesAujourdhui } = await supabase
    .from("prospection_messages")
    .select("id", { count: "exact", head: true })
    .eq("campagne_id", campagne.id)
    .eq("scheduled_on", jour)
    .eq("statut", "envoye");

  if ((envoyesAujourdhui ?? 0) >= plafond) {
    return { envoye: false, motif: `plafond du jour atteint (${plafond})` };
  }

  // `scheduled_on <= jour` : un message validé hier et non parti (panne, fenêtre
  // fermée) rattrape aujourd'hui, sous le plafond du jour.
  const { data: candidat } = await supabase
    .from("prospection_messages")
    .select("*, prospects(email, unsubscribe_token, prenom, source)")
    .eq("campagne_id", campagne.id)
    .eq("statut", "valide")
    .lte("scheduled_on", jour)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!candidat) return { envoye: false, motif: "file vide" };

  const message = candidat as MessageProspection & {
    prospects: {
      email: string;
      unsubscribe_token: string;
      prenom: string | null;
      source: string;
    } | null;
  };
  const prospect = message.prospects;
  if (!prospect) return { envoye: false, motif: "prospect introuvable" };

  // Réservation optimiste : on ne repasse par ici que si personne n'a pris la ligne.
  const { data: reserve } = await supabase
    .from("prospection_messages")
    .update({ statut: "envoye", sent_at: new Date().toISOString() })
    .eq("id", message.id)
    .eq("statut", "valide")
    .select("id")
    .maybeSingle();

  if (!reserve) return { envoye: false, motif: "message déjà pris" };

  const resultat = await envoyerMessage({
    to: prospect.email,
    objet: message.objet,
    corps: message.corps,
    corpsHtml: corpsHtmlPourProspect(prospect),
    lienDesinscription: lienDesinscription(prospect.unsubscribe_token),
  });

  if (!resultat.ok) {
    // On ne remet PAS en file : un échec côté Gmail peut très bien être un envoi
    // parti. Le message reste visible en `echec` dans l'admin, qui tranche.
    await supabase
      .from("prospection_messages")
      .update({ statut: "echec", erreur: resultat.erreur })
      .eq("id", message.id);
    return { envoye: false, motif: `échec d'envoi : ${resultat.erreur}` };
  }

  await Promise.all([
    supabase
      .from("prospects")
      .update({ statut: "contacte" })
      .eq("id", message.prospect_id),
    supabase.from("prospection_evenements").insert({
      prospect_id: message.prospect_id,
      type: "envoi",
      payload: { message_id: message.id, campagne: campagne.nom },
    }),
  ]);

  return { envoye: true, messageId: message.id, destinataire: prospect.email };
}

/** Journalise un clic sur le lien du message, sans mouchard ni pixel. */
export async function enregistrerClic(token: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: prospect } = await supabase
    .from("prospects")
    .select("id")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  if (!prospect) return;

  await supabase.from("prospection_evenements").insert({
    prospect_id: prospect.id,
    type: "clic",
    payload: {},
  });
}

/** Désinscription : opposition inscrite, prospect marqué, file purgée. */
export async function desinscrire(
  token: string,
  motif = "lien de désinscription",
): Promise<{ ok: boolean; email?: string }> {
  const supabase = createAdminClient();
  const { data: prospect } = await supabase
    .from("prospects")
    .select("id, email")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  if (!prospect) return { ok: false };

  const { error } = await supabase.rpc("prospection_desinscrire", {
    p_email: prospect.email,
    p_motif: motif,
  });
  if (error) throw new Error(`Désinscription : ${error.message}`);

  await supabase.from("prospection_evenements").insert({
    prospect_id: prospect.id,
    type: "desinscription",
    payload: { motif },
  });

  return { ok: true, email: prospect.email };
}
