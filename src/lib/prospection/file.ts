import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CampagneProspection,
  MessageProspection,
  Prospect,
  StatutMessageProspection,
  TypeEvenementProspection,
} from "@/lib/database.types";
import {
  dansLaFenetre,
  debutJourParis,
  jourParis,
  plafondDuJour,
} from "@/lib/prospection/cadence";
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

  // Les envois se comptent sur `sent_at`, comme le plafond dans `envoyerProchain`
  // — et NON sur `scheduled_on` comme les trois autres compteurs. Un message
  // validé hier et parti aujourd'hui en rattrapage (`lte("scheduled_on", jour)`)
  // consomme le plafond du jour sans porter la date du jour : indexé sur le jour
  // prévu, l'écran affichait « 0 / 35 » pendant que la file en passait dix.
  // L'admin voyait de la marge là où il n'y en avait plus. Les compteurs de file
  // ci-dessous restent sur `scheduled_on` à dessein : eux décrivent la file du
  // jour, pas ce qui sort de la boîte.
  const { count: partisAujourdhui } = await supabase
    .from("prospection_messages")
    .select("id", { count: "exact", head: true })
    .eq("campagne_id", campagne.id)
    .gte("sent_at", debutJourParis(maintenant).toISOString())
    .eq("statut", "envoye");

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
    envoyes: partisAujourdhui ?? 0,
    enAttente: await compte("en_attente"),
    valides: await compte("valide"),
    echecs: await compte("echec"),
    prospectsDisponibles: disponibles ?? 0,
  };
}

export interface StatsEngagement {
  envois: number;
  /** Prospects distincts ayant ouvert (pixel). Surévalué par le préchargement d'images. */
  ouvreurs: number;
  /** Lignes `ouverture` brutes, rechargements d'image compris. Toujours >= `ouvreurs`. */
  ouverturesBrutes: number;
  /** Prospects distincts ayant cliqué. C'est CE chiffre qui veut dire quelque chose. */
  cliqueurs: number;
  /** Lignes `clic` brutes, rechargements compris. Toujours >= `cliqueurs`. */
  clicsBruts: number;
  desinscriptions: number;
  /** ISO du clic le plus récent, `null` si personne n'a jamais cliqué. */
  dernierClic: string | null;
}

/**
 * Engagement cumulé de la prospection, depuis le premier envoi.
 *
 * Volontairement hors du jour courant, contrairement aux compteurs de file : un
 * clic arrive rarement le jour de l'envoi, et une lecture quotidienne afficherait
 * zéro en permanence pour une campagne qui marche.
 *
 * `enregistrerClic` insère une ligne à CHAQUE passage sur `/demo?p=…`, sans
 * déduplication : un prospect qui recharge la page en produit trois. Le taux de
 * clic se calcule donc sur `cliqueurs` (prospects distincts), jamais sur
 * `clicsBruts` — les deux sont exposés pour que l'écart reste lisible plutôt
 * qu'invisible.
 */
export async function statsEngagement(): Promise<StatsEngagement> {
  const supabase = createAdminClient();

  const compte = async (type: NonNullable<TypeEvenementProspection>) => {
    const { count, error } = await supabase
      .from("prospection_evenements")
      .select("id", { count: "exact", head: true })
      .eq("type", type);
    if (error) throw new Error(`Lecture des événements (${type}) : ${error.message}`);
    return count ?? 0;
  };

  const [envois, desinscriptions] = await Promise.all([
    compte("envoi"),
    compte("desinscription"),
  ]);

  const { data: clics, error } = await supabase
    .from("prospection_evenements")
    .select("prospect_id, created_at")
    .eq("type", "clic")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Lecture des clics : ${error.message}`);

  // Les ouvertures se comptent en prospects distincts, comme les clics : un même
  // message rouvert (ou dont l'image se recharge) produit plusieurs lignes.
  const { data: ouvertures, error: erreurOuvertures } = await supabase
    .from("prospection_evenements")
    .select("prospect_id")
    .eq("type", "ouverture");
  if (erreurOuvertures)
    throw new Error(`Lecture des ouvertures : ${erreurOuvertures.message}`);

  const lignes = clics ?? [];
  const lignesOuvertures = ouvertures ?? [];
  return {
    envois,
    ouvreurs: new Set(lignesOuvertures.map((o) => o.prospect_id)).size,
    ouverturesBrutes: lignesOuvertures.length,
    cliqueurs: new Set(lignes.map((c) => c.prospect_id)).size,
    clicsBruts: lignes.length,
    desinscriptions,
    dernierClic: lignes[0]?.created_at ?? null,
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

  // Compté sur `sent_at`, pas sur `scheduled_on` : le sélecteur ci-dessous
  // rattrape les jours précédents (`lte`) sans réécrire `scheduled_on`, si bien
  // qu'un compteur indexé sur le jour prévu ne voyait AUCUN message de
  // rattrapage. Le 2026-07-20, 10 messages étaient sortis pendant que le
  // compteur affichait 0 : la rampe autorisait 35, la file en aurait passé 56.
  // Le plafond doit borner ce qui sort de la boîte aujourd'hui, pas ce qui était
  // prévu pour aujourd'hui.
  const { count: envoyesAujourdhui } = await supabase
    .from("prospection_messages")
    .select("id", { count: "exact", head: true })
    .eq("campagne_id", campagne.id)
    .gte("sent_at", debutJourParis(maintenant).toISOString())
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

/** Journalise un clic sur le lien de démo du message, attribué par le jeton. */
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

/**
 * Journalise l'ouverture d'un message, déclenchée par le pixel de suivi. Comme le
 * clic, une ouverture peut se répéter : on stocke chaque ligne, le décompte des
 * prospects distincts se fait à la lecture (`statsEngagement`). Le jeton inconnu
 * (lien recopié, image relayée) est simplement ignoré.
 */
export async function enregistrerOuverture(token: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: prospect } = await supabase
    .from("prospects")
    .select("id")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  if (!prospect) return;

  await supabase.from("prospection_evenements").insert({
    prospect_id: prospect.id,
    type: "ouverture",
    payload: {},
  });
}

/** Désinscription : opposition inscrite, prospect marqué, file purgée. */
export async function desinscrire(
  token: string,
  motif = "lien de désinscription",
): Promise<{ ok: boolean; email?: string }> {
  const supabase = createAdminClient();
  const { data: prospect, error: errLecture } = await supabase
    .from("prospects")
    .select("id, email")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  // Une panne de lecture n'est PAS un « jeton inconnu » : les confondre ferait
  // afficher un désabonnement réussi sans l'avoir inscrit, donc recontacter
  // quelqu'un qui a cliqué stop. On échoue fort et distinctement (AGENTS.md).
  if (errLecture) {
    throw new Error(`Désinscription (lecture) : ${errLecture.message}`);
  }
  if (!prospect) return { ok: false };

  const { error } = await supabase.rpc("prospection_desinscrire", {
    p_email: prospect.email,
    p_motif: motif,
  });
  if (error) throw new Error(`Désinscription : ${error.message}`);

  // L'opposition est désormais inscrite (RPC ci-dessus). L'événement n'est qu'une
  // trace de preuve : son échec ne doit pas invalider une désinscription réussie,
  // mais il ne doit pas non plus passer sous silence (il documente l'opposition).
  const { error: errEvent } = await supabase.from("prospection_evenements").insert({
    prospect_id: prospect.id,
    type: "desinscription",
    payload: { motif },
  });
  if (errEvent) {
    console.error("[desinscription] trace événement:", errEvent.message);
  }

  return { ok: true, email: prospect.email };
}
