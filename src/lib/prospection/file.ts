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
  FENETRE,
  dansLaFenetre,
  debutJourParis,
  estSousLivraison,
  jourParis,
  plafondDuJour,
} from "@/lib/prospection/cadence";
import {
  corpsHtmlPourProspect,
  corpsPourProspect,
  lienDesinscription,
  mentionPerimee,
} from "@/lib/prospection/message";
import { envoyerMessage } from "@/lib/prospection/envoi";
import { choisirAccroche } from "@/lib/prospection/accroches";

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

/** `place_id` collé dans les notes d'import (`… place_id=<id>`). Absent sur un CSV admin. */
export function placeIdDepuisNotes(notes: string | null | undefined): string | null {
  return /place_id=(\S+)$/.exec(notes ?? "")?.[1] ?? null;
}

/**
 * Accroche métier pour un lot de prospects, lue sur `prospects_dossimo.rge_domaines`
 * via le `place_id` des notes. Un CSV admin n'en a pas : il retombe sur le générique
 * (choisirAccroche([])). On ne devine jamais un métier.
 */
async function accrochesPourProspects(
  supabase: Client,
  prospects: { id: string; notes: string | null }[],
): Promise<Map<string, { objet: string; texte: string }>> {
  const parPlace = new Map<string, string>();
  for (const p of prospects) {
    const placeId = placeIdDepuisNotes(p.notes);
    if (placeId) parPlace.set(placeId, p.id);
  }

  const domainesParProspect = new Map<string, string[] | null>();
  if (parPlace.size > 0) {
    const { data, error } = await supabase
      .from("prospects_dossimo")
      .select("place_id, rge_domaines")
      .in("place_id", [...parPlace.keys()]);
    if (error) {
      throw new Error(`Lecture des domaines RGE : ${error.message}`);
    }
    for (const row of data ?? []) {
      const prospectId = parPlace.get(row.place_id);
      if (prospectId) domainesParProspect.set(prospectId, row.rge_domaines);
    }
  }

  const result = new Map<string, { objet: string; texte: string }>();
  for (const p of prospects) {
    const { accroche } = choisirAccroche(domainesParProspect.get(p.id) ?? null);
    result.set(p.id, { objet: accroche.objet, texte: accroche.texte });
  }
  return result;
}

export async function campagneActive(
  supabase: Client = createAdminClient(),
): Promise<CampagneProspection | null> {
  const { data, error } = await supabase
    .from("prospection_campagnes")
    .select("*")
    .eq("actif", true)
    .maybeSingle();
  // Une panne de lecture n'est PAS « aucune campagne active » : les confondre
  // fait afficher « Aucune campagne » sur la console et renvoyer un tick vert
  // qui n'envoie rien, exactement le silence qu'on cherche à supprimer.
  if (error) throw new Error(`Lecture de la campagne active : ${error.message}`);
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
  /**
   * Pourquoi la file ne s'écoule pas, en clair, ou `null` si rien ne bloque.
   *
   * Existe parce que `tick` répond 200 avec un motif que personne ne lit : le
   * 27/08/2026, 40 messages validés sont restés en file toute la journée sans
   * que la console n'en dise un mot. Calculé avec les mêmes prédicats que
   * `envoyerProchain`, jamais avec une seconde copie des seuils.
   */
  blocage: string | null;
}

/** Formate une borne de `FENETRE` (minutes depuis minuit) en « 9h30 ». */
function heureFenetre(minutes: number): string {
  return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, "0")}`;
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
      blocage: "Aucune campagne active.",
    };
  }

  /**
   * `borne: "dus"` compte comme le sélecteur d'envoi (`scheduled_on <= jour`),
   * donc backlog compris ; `"jour"` ne compte que la journée.
   *
   * `en_attente` et `valide` se comptent en « dus » depuis que `validerFile`
   * rattrape les jours précédents : sans cela, le bouton « Valider les N
   * messages » affichait 0 et se grisait pendant que 40 messages du 26/08
   * attendaient, invisibles et impossibles à débloquer autrement qu'en base.
   * Les échecs restent sur la journée : leur libellé dit « aujourd'hui ».
   */
  const compte = async (
    statut: StatutMessageProspection,
    borne: "jour" | "dus" = "jour",
  ) => {
    const requete = supabase
      .from("prospection_messages")
      .select("id", { count: "exact", head: true })
      .eq("campagne_id", campagne.id)
      .eq("statut", statut);
    const { count, error } =
      borne === "dus"
        ? await requete.lte("scheduled_on", jour)
        : await requete.eq("scheduled_on", jour);
    if (error)
      throw new Error(`Comptage des messages (${statut}) : ${error.message}`);
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
  const { count: partisAujourdhui, error: erreurPartis } = await supabase
    .from("prospection_messages")
    .select("id", { count: "exact", head: true })
    .eq("campagne_id", campagne.id)
    .gte("sent_at", debutJourParis(maintenant).toISOString())
    .eq("statut", "envoye");
  if (erreurPartis)
    throw new Error(`Comptage des envois du jour : ${erreurPartis.message}`);

  const { count: disponibles, error: erreurDisponibles } = await supabase
    .from("prospects")
    .select("id", { count: "exact", head: true })
    .eq("statut", "nouveau");
  if (erreurDisponibles)
    throw new Error(`Comptage des prospects : ${erreurDisponibles.message}`);

  const plafond = plafondDuJour({
    debut: campagne.demarre_le,
    fin: campagne.termine_le,
    jour,
    capMax: campagne.daily_cap_max,
  });
  const envoyes = partisAujourdhui ?? 0;
  const valides = await compte("valide", "dus");

  // Même ordre que les garde-fous de `envoyerProchain`, pour que l'écran nomme
  // exactement ce que le prochain envoi rencontrera.
  let blocage: string | null = null;
  if (campagne.en_pause) {
    blocage = "Campagne en pause : aucun message ne part, même à la main.";
  } else if (plafond === 0) {
    blocage = `Jour non couvert par la campagne (du ${campagne.demarre_le} au ${campagne.termine_le}).`;
  } else if (envoyes >= plafond) {
    blocage = `Plafond du jour atteint (${envoyes}/${plafond}).`;
  } else if (valides === 0) {
    blocage = "Aucun message validé : préparez la file, puis validez-la.";
  } else if (!dansLaFenetre(maintenant)) {
    blocage =
      `Hors fenêtre d'envoi (${heureFenetre(FENETRE.debut)}-${heureFenetre(FENETRE.fin)}) : ` +
      `l'envoi automatique est suspendu, l'envoi manuel passe outre.`;
  }

  return {
    campagne,
    jour,
    plafond,
    envoyes,
    enAttente: await compte("en_attente", "dus"),
    valides,
    echecs: await compte("echec"),
    prospectsDisponibles: disponibles ?? 0,
    blocage,
  };
}

export interface BilanJour {
  jour: string;
  /** Plafond que la rampe / le cap autorisaient aujourd'hui. */
  plafond: number;
  /** Messages réellement partis aujourd'hui (comptés sur `sent_at`, comme le plafond). */
  envoyes: number;
  /**
   * Messages VALIDÉS et dus (`scheduled_on <= jour`) encore en file : la matière que
   * le planificateur aurait dû écouler. `lte`, comme le sélecteur d'envoi, pour
   * inclure le backlog des jours précédents.
   */
  restantsDus: number;
  /** En attente de validation humaine : un manque d'appro, pas une panne d'envoi. */
  enAttente: number;
  fenetreOuverte: boolean;
  /** Vrai seulement si la journée a sous-livré par la faute du planificateur. */
  sousLivraison: boolean;
}

/**
 * Bilan de fin de journée, à lire après la fermeture de la fenêtre d'envoi. Il
 * existe pour un seul point aveugle : la route `tick` renvoie 200 même quand elle
 * n'envoie rien, et un run que GitHub ne planifie pas ne laisse aucune trace — une
 * journée à 4 envois sur 40 (2026-07-19) passait donc inaperçue. Ce bilan rend cette
 * sous-livraison bruyante (cf. `/api/prospection/bilan`), sans crier au loup sur une
 * file simplement vide.
 */
export async function bilanFinDeJournee(
  maintenant = new Date(),
): Promise<BilanJour> {
  const supabase = createAdminClient();
  const campagne = await campagneActive(supabase);
  const jour = jourParis(maintenant);
  const fenetreOuverte = dansLaFenetre(maintenant);

  const vide: BilanJour = {
    jour,
    plafond: 0,
    envoyes: 0,
    restantsDus: 0,
    enAttente: 0,
    fenetreOuverte,
    sousLivraison: false,
  };
  if (!campagne || campagne.en_pause) return vide;

  const plafond = plafondDuJour({
    debut: campagne.demarre_le,
    fin: campagne.termine_le,
    jour,
    capMax: campagne.daily_cap_max,
  });

  // Ce bilan décide de rougir ou non le run GitHub : un comptage faux vaut soit
  // une alerte fantôme, soit le silence qu'il existe pour rompre. On échoue.
  const { count: envoyes, error: erreurEnvoyes } = await supabase
    .from("prospection_messages")
    .select("id", { count: "exact", head: true })
    .eq("campagne_id", campagne.id)
    .gte("sent_at", debutJourParis(maintenant).toISOString())
    .eq("statut", "envoye");
  if (erreurEnvoyes)
    throw new Error(`Bilan, comptage des envois : ${erreurEnvoyes.message}`);

  const { count: restantsDus, error: erreurRestants } = await supabase
    .from("prospection_messages")
    .select("id", { count: "exact", head: true })
    .eq("campagne_id", campagne.id)
    .eq("statut", "valide")
    .lte("scheduled_on", jour);
  if (erreurRestants)
    throw new Error(`Bilan, comptage des restants : ${erreurRestants.message}`);

  const { count: enAttente, error: erreurAttente } = await supabase
    .from("prospection_messages")
    .select("id", { count: "exact", head: true })
    .eq("campagne_id", campagne.id)
    .eq("scheduled_on", jour)
    .eq("statut", "en_attente");
  if (erreurAttente)
    throw new Error(`Bilan, comptage des en attente : ${erreurAttente.message}`);

  return {
    jour,
    plafond,
    envoyes: envoyes ?? 0,
    restantsDus: restantsDus ?? 0,
    enAttente: enAttente ?? 0,
    fenetreOuverte,
    sousLivraison: estSousLivraison({
      fenetreOuverte,
      plafond,
      envoyes: envoyes ?? 0,
      restantsDus: restantsDus ?? 0,
    }),
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

  // La copie en base annonce encore une offre retirée : on ne remplit pas la file
  // avec. Corriger le corps de la campagne (script SQL) débloque la préparation.
  const perimee = mentionPerimee(campagne.corps);
  if (perimee) {
    console.error(
      `[prospection] copie périmée dans la campagne « ${campagne.nom} » : ${perimee}. ` +
        `Aucun message préparé. Corriger prospection_campagnes.corps.`,
    );
    return { crees: 0, motif: `Copie périmée en base (${perimee}).` };
  }

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

  // Un comptage muet ferait repartir `aCreer` du plafond entier et rejouerait
  // une file déjà préparée : l'idempotence de cette fonction tient à ce nombre.
  const { count: dejaPrevus, error: erreurPrevus } = await supabase
    .from("prospection_messages")
    .select("id", { count: "exact", head: true })
    .eq("campagne_id", campagne.id)
    .eq("scheduled_on", jour)
    .in("statut", ["en_attente", "valide", "envoye"]);
  if (erreurPrevus)
    throw new Error(`Comptage de la file du jour : ${erreurPrevus.message}`);

  const aCreer = plafond - (dejaPrevus ?? 0);
  if (aCreer <= 0) return { crees: 0, motif: "Plafond du jour déjà atteint." };

  // On tire large : une partie des candidats sera écartée par les exclusions.
  const { data: candidats, error: erreurCandidats } = await supabase
    .from("prospects")
    .select("*")
    .eq("statut", "nouveau")
    .order("created_at", { ascending: true })
    .limit(aCreer * 3 + 20);
  if (erreurCandidats)
    throw new Error(`Lecture des prospects : ${erreurCandidats.message}`);

  const retenus = await filtrerExclus(supabase, candidats ?? []);
  const lot = retenus.slice(0, aCreer);
  if (lot.length === 0) return { crees: 0, motif: "Aucun prospect disponible." };

  const accroches = await accrochesPourProspects(supabase, lot);
  const messages = lot.map((p) => {
    const accroche = accroches.get(p.id);
    return {
      campagne_id: campagne.id,
      prospect_id: p.id,
      objet: accroche?.objet ?? campagne.objet,
      corps: corpsPourProspect(campagne.corps, {
        ...p,
        accroche: accroche?.texte,
      }),
      scheduled_on: jour,
      statut: "en_attente" as const,
    };
  });

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

export interface OptionsEnvoi {
  /**
   * Lève la seule fenêtre horaire, et rien d'autre.
   *
   * Réservé à l'envoi déclenché à la main depuis la console : un humain qui
   * clique à 21h sait quelle heure il est, là où le planificateur, lui, ne le
   * sait pas. Tous les autres garde-fous restent en vigueur — campagne absente,
   * pause, dates de campagne, plafond du jour, copie périmée, réservation
   * optimiste. `/api/prospection/tick` ne passe JAMAIS cette option : l'envoi
   * automatique reste borné à la fenêtre.
   */
  forcerHorsFenetre?: boolean;
}

/**
 * Envoie AU PLUS un message. Appelée en boucle par le workflow, qui espace ses
 * appels de quelques minutes : c'est ce rythme, et non un envoi en rafale, qui
 * fait ressembler la campagne à un humain qui écrit ses mails l'un après l'autre.
 */
export async function envoyerProchain(
  maintenant = new Date(),
  options: OptionsEnvoi = {},
): Promise<ResultatTick> {
  const supabase = createAdminClient();
  const campagne = await campagneActive(supabase);
  if (!campagne) return { envoye: false, motif: "aucune campagne active" };
  if (campagne.en_pause) return { envoye: false, motif: "campagne en pause" };
  if (!options.forcerHorsFenetre && !dansLaFenetre(maintenant)) {
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
    .select("*, prospects(email, unsubscribe_token, prenom, source, notes)")
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
      notes: string | null;
    } | null;
  };
  const prospect = message.prospects;
  if (!prospect) return { envoye: false, motif: "prospect introuvable" };

  // Le corps est figé à la mise en file : un message préparé avant le retrait de
  // l'offre la porte encore, même si la campagne a été corrigée depuis. On
  // l'annule et on remet le prospect en jeu : `annule` est le seul statut que
  // l'index d'unicité ignore, donc le seul qui laisse la prochaine préparation
  // reprendre ce prospect avec la copie à jour. Pas de boucle possible : tant que
  // la campagne est périmée, `preparerFile` ne crée plus rien.
  const perimee = mentionPerimee(message.corps);
  if (perimee) {
    console.error(
      `[prospection] message ${message.id} écarté : copie périmée (${perimee}).`,
    );
    const { error } = await supabase
      .from("prospection_messages")
      .update({ statut: "annule", erreur: `Copie périmée (${perimee}), message annulé avant envoi.` })
      .eq("id", message.id);
    if (error) console.error("[prospection] annulation copie périmée:", error.message);
    const { error: errProspect } = await supabase
      .from("prospects")
      .update({ statut: "nouveau" })
      .eq("id", message.prospect_id)
      .eq("statut", "en_file");
    if (errProspect) console.error("[prospection] remise en file:", errProspect.message);
    return { envoye: false, motif: `copie périmée (${perimee})` };
  }

  // Accroche AVANT la réservation : un échec SQL ici ne doit pas marquer le
  // message `envoye` sans l'avoir envoyé.
  const accrocheHtml = (
    await accrochesPourProspects(supabase, [
      { id: message.prospect_id, notes: prospect.notes },
    ])
  ).get(message.prospect_id)?.texte;

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
    corpsHtml: corpsHtmlPourProspect({
      prenom: prospect.prenom,
      source: prospect.source,
      unsubscribe_token: prospect.unsubscribe_token,
      accroche: accrocheHtml,
    }),
    lienDesinscription: lienDesinscription(prospect.unsubscribe_token),
  });

  if (!resultat.ok) {
    // On ne remet PAS en file : un échec côté Gmail peut très bien être un envoi
    // parti. Le message reste visible en `echec` dans l'admin, qui tranche.
    await supabase
      .from("prospection_messages")
      .update({ statut: "echec", erreur: resultat.erreur })
      .eq("id", message.id);
    // Même raison : le fichier de prospection doit le compter comme démarché,
    // sinon la console « Contacts » le proposerait à relancer demain.
    await marquerContactDansFichier(supabase, prospect.notes, "echec", maintenant, message.id, campagne.id);
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
    marquerContactDansFichier(supabase, prospect.notes, "envoye", maintenant, message.id, campagne.id),
  ]);

  return { envoye: true, messageId: message.id, destinataire: prospect.email };
}

/** Taille par défaut d'une salve déclenchée à la main. */
export const TAILLE_SALVE = 5;

/**
 * Pause entre deux envois d'une même salve, en millisecondes.
 *
 * Le goutte-à-goutte du workflow espace ses appels de 2 à 6 MINUTES ; une salve
 * manuelle compresse à quelques secondes, puisqu'elle doit rendre la main à
 * l'admin dans la durée d'une requête. C'est précisément pour cela qu'une salve
 * est bornée à cinq messages et non à la file entière : cinq envois espacés de
 * quelques secondes restent un profil d'écriture plausible, quarante non.
 */
const PAUSE_SALVE_MS = { min: 2_000, max: 5_000 } as const;

/**
 * Budget de temps d'une salve. Au-delà, on rend la main plutôt que de se faire
 * couper par la limite d'exécution de la fonction — un message coupé en plein
 * envoi resterait réservé en `envoye` sans être parti.
 */
const BUDGET_SALVE_MS = 45_000;

export interface ResultatSalve {
  envoyes: number;
  /** Ce qui a arrêté la salve avant son terme, ou `null` si elle est allée au bout. */
  motifArret: string | null;
}

/**
 * Envoie une salve de messages, à la demande.
 *
 * Existe parce que valider la file n'envoyait rien : l'envoi dépendait
 * entièrement d'un cron GitHub que le workflow documente lui-même comme décalé
 * d'une à deux heures. Le 27/08/2026 son unique passage est tombé à 20h12, hors
 * fenêtre, et 40 messages validés sont restés en file. La console peut désormais
 * écouler la file elle-même ; le cron n'est plus qu'un filet.
 *
 * S'arrête au premier refus et le rapporte : plafond atteint, file vide, pause.
 */
export async function envoyerSalve(
  options: { taille?: number } & OptionsEnvoi = {},
): Promise<ResultatSalve> {
  const taille = options.taille ?? TAILLE_SALVE;
  const debut = Date.now();
  let envoyes = 0;

  for (let i = 0; i < taille; i++) {
    if (i > 0) {
      const { min, max } = PAUSE_SALVE_MS;
      await new Promise((r) =>
        setTimeout(r, min + Math.floor(Math.random() * (max - min + 1))),
      );
      if (Date.now() - debut > BUDGET_SALVE_MS) {
        return { envoyes, motifArret: "temps imparti écoulé, relancez la salve" };
      }
    }

    const resultat = await envoyerProchain(new Date(), {
      forcerHorsFenetre: options.forcerHorsFenetre,
    });
    if (!resultat.envoye) return { envoyes, motifArret: resultat.motif };
    envoyes += 1;
  }

  return { envoyes, motifArret: null };
}

/**
 * Reporte l'envoi dans les DEUX fichiers de prospection : l'ancien
 * (`prospects_dossimo`, migration 0050) et le nouveau (`contact_echanges`,
 * migration 0057).
 *
 * POURQUOI CETTE ÉCRITURE EXISTE
 * Sans elle, les systèmes s'ignorent : la campagne automatique démarche des
 * artisans que le fichier continue d'afficher comme jamais contactés. C'est ce
 * qui s'est produit du 19 au 27 juillet 2026, 215 envois invisibles dans le
 * fichier, et ce qui exposait un artisan à être redémarché à la main.
 *
 * POURQUOI LES DEUX, ET NON LE SEUL NOUVEAU
 * `prospects_dossimo` reste lu ici même (`accrochesPourProspects`, via `rge_domaines`),
 * par `src/lib/mesure/tunnel-charge.ts` (étape « contacts » du tunnel) et par
 * les scripts SQL de tirage, tant que la bascule n'est pas terminée. Les
 * consoles du sprint manuel, elles, ont été retirées le 2026-09-13 : « Contacts »
 * les remplace. Cesser d'y écrire maintenant recréerait exactement l'angle mort
 * que la 0050 a bouché, dans l'autre sens. Les deux écritures partent donc
 * ensemble, jusqu'au retrait des anciennes tables.
 *
 * Délibérément NON bloquantes : le message est déjà parti, échouer ici ne le
 * rattrape pas et masquerait un envoi réussi. Non silencieuses non plus
 * (AGENTS.md) : l'erreur part en console, et
 * `supabase/scripts/prospects_dossimo_rattrapage_contact_auto.sql` répare
 * l'écart à tout moment depuis `prospection_messages`, source de vérité.
 *
 * Le `place_id` vient des notes d'import (« … place_id=<id> »). Un prospect
 * importé autrement (CSV admin) n'en a pas : il n'y a rien à reporter, et ce
 * n'est pas une anomalie.
 */
async function marquerContactDansFichier(
  supabase: Client,
  notes: string | null,
  statut: "envoye" | "echec",
  maintenant: Date,
  messageId: string,
  campagneId: string,
): Promise<void> {
  const placeId = placeIdDepuisNotes(notes);
  if (!placeId) return;

  // L'update rend le SIREN, qui est la clé du nouveau modèle. Passer par lui
  // plutôt que par `contacts.place_id` : deux établissements d'une même
  // entreprise partagent un SIREN mais ont deux `place_id`, et la fusion de la
  // 0058 n'en a gardé qu'un. Chercher par `place_id` raterait le second.
  const { data, error } = await supabase
    .from("prospects_dossimo")
    .update({
      contact_auto_le: jourParis(maintenant),
      contact_auto_statut: statut,
    })
    .eq("place_id", placeId)
    .select("siren")
    .maybeSingle();
  if (error) {
    console.error(`[prospection] report dans prospects_dossimo (${placeId}):`, error.message);
  }

  const siren = (data?.siren ?? "").replace(/\D/g, "");
  if (!siren) return;

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id")
    .eq("siren", siren)
    .maybeSingle();
  if (contactError) {
    console.error(`[prospection] lecture du contact (siren ${siren}):`, contactError.message);
    return;
  }
  if (!contact) return;

  // Rejouable : `message_id` identifie l'envoi, donc un second passage sur le
  // même message n'ajoute pas un second échange, qui ferait croire à deux
  // sollicitations et fausserait le taux de réponse du canal.
  const { count, error: dejaError } = await supabase
    .from("contact_echanges")
    .select("id", { count: "exact", head: true })
    .eq("message_id", messageId);
  if (dejaError) {
    console.error(`[prospection] contrôle de doublon d'échange (${messageId}):`, dejaError.message);
    return;
  }
  if ((count ?? 0) > 0) return;

  const { error: echangeError } = await supabase.from("contact_echanges").insert({
    contact_id: contact.id,
    canal: "email",
    sens: "sortant",
    nature: "premier",
    // « echec » vaut contact : le message a pu partir malgré l'erreur (0050).
    issue: statut === "echec" ? "echec_technique" : null,
    survenu_le: maintenant.toISOString(),
    automatique: true,
    campagne_id: campagneId,
    message_id: messageId,
  });
  if (echangeError) {
    console.error(`[prospection] report dans contact_echanges (siren ${siren}):`, echangeError.message);
  }
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
