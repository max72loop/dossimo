"use server";

import { revalidatePath } from "next/cache";

import { getAdminEmail } from "@/lib/auth/is-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CanalEchange,
  IssueEchange,
  NatureEchange,
  SensEchange,
} from "@/lib/database.types";

/**
 * Saisie des échanges de prospection (migrations 0057 / 0058).
 *
 * Remplace `src/lib/sprint/actions.ts`, qui posait une date dans une colonne
 * dédiée par type de contact et ne savait donc enregistrer ni un second appel,
 * ni le canal d'une réponse.
 *
 * DEUX RÈGLES QUI NE SE NÉGOCIENT PAS
 *  1. Rien de ce qui arrive du client ne sert à choisir une colonne ou une
 *     valeur : canal, sens, nature et issue sont validés contre des listes
 *     fermées côté serveur. Une valeur inconnue rendrait la ligne invisible dans
 *     tous les écrans, en silence (c'est l'argument de la migration 0052).
 *  2. On lève à la moindre erreur. Un STOP avalé sans bruit, c'est quelqu'un
 *     qu'on recontacte après qu'il a dit non (AGENTS.md, « les erreurs ne sont
 *     jamais ignorées en silence »).
 */

const CANAUX: readonly CanalEchange[] = ["email", "whatsapp", "telephone", "sms", "courrier"];
const SENS: readonly SensEchange[] = ["sortant", "entrant"];
const NATURES: readonly NatureEchange[] = [
  "premier", "relance", "nurturing", "appel",
  "ouverture", "clic", "reponse", "stop", "bounce", "rdv", "note",
];
const ISSUES: readonly IssueEchange[] = [
  "sans_reponse", "repondeur", "faux_numero", "mauvaise_adresse",
  "interesse", "refus", "client", "echec_technique",
];

async function exigerAdmin(): Promise<void> {
  if (!(await getAdminEmail())) throw new Error("Accès non autorisé.");
}

function lire<T extends string>(
  formData: FormData,
  champ: string,
  autorisees: readonly T[],
  defaut?: T,
): T {
  const brut = String(formData.get(champ) ?? "");
  const valeur = autorisees.find((v) => v === brut);
  if (valeur) return valeur;
  if (defaut !== undefined) return defaut;
  throw new Error(`Valeur « ${brut || "(vide)"} » refusée pour ${champ}.`);
}

function lireContactId(formData: FormData): string {
  const id = String(formData.get("contact_id") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Contact inconnu.");
  return id;
}

function rafraichir(): void {
  revalidatePath("/admin/contacts");
}

/**
 * Enregistre un échange, dans un sens ou dans l'autre.
 *
 * C'est le seul point d'écriture de l'historique : un appel, un e-mail parti à
 * la main, une réponse reçue et une note passent tous par ici. `contacts.etat`
 * n'est jamais écrit : le trigger de la 0057 le recalcule depuis ce que cette
 * fonction insère.
 */
export async function enregistrerEchange(formData: FormData): Promise<void> {
  await exigerAdmin();
  const contactId = lireContactId(formData);
  const canal = lire(formData, "canal", CANAUX);
  const sens = lire(formData, "sens", SENS, "sortant");
  const nature = lire(formData, "nature", NATURES);
  const issueBrute = String(formData.get("issue") ?? "");
  const issue = issueBrute ? lire(formData, "issue", ISSUES) : null;
  const commentaire = String(formData.get("commentaire") ?? "").trim() || null;

  const admin = createAdminClient();
  const { error } = await admin.from("contact_echanges").insert({
    contact_id: contactId,
    canal,
    sens,
    nature,
    issue,
    // Saisi par un humain qui déclare son geste, jamais par la machine qui l'a
    // fait : c'est la distinction que la 0050 avait dû porter en deux colonnes.
    automatique: false,
    commentaire,
  });
  if (error) throw new Error(`Enregistrement de l'échange impossible : ${error.message}`);
  rafraichir();
}

/**
 * Enregistre une réponse reçue, avec LE CANAL SUR LEQUEL ELLE EST ARRIVÉE.
 *
 * C'est la donnée qui manquait entièrement à l'ancien modèle : `reponse` y était
 * un booléen sans date ni canal, donc « lesquels répondent par WhatsApp plutôt
 * que par e-mail » n'avait aucune source. Le canal de réponse est distinct du
 * canal de sollicitation, et c'est justement ce croisement qui a de la valeur.
 */
export async function enregistrerReponse(formData: FormData): Promise<void> {
  await exigerAdmin();
  const contactId = lireContactId(formData);
  const canal = lire(formData, "canal", CANAUX);
  const interesse = String(formData.get("interesse") ?? "") === "1";
  const commentaire = String(formData.get("commentaire") ?? "").trim() || null;

  const admin = createAdminClient();
  const { error } = await admin.from("contact_echanges").insert({
    contact_id: contactId,
    canal,
    sens: "entrant",
    nature: "reponse",
    issue: interesse ? "interesse" : null,
    automatique: false,
    commentaire,
  });
  if (error) throw new Error(`Enregistrement de la réponse impossible : ${error.message}`);
  rafraichir();
}

/**
 * Enregistre un refus. Priorité RGPD : opposable le jour même, définitivement.
 *
 * TROIS ÉCRITURES, DANS CET ORDRE
 *  1. `oppositions` sur TOUTES les coordonnées connues (chaque adresse, le
 *     téléphone, le SIREN). C'est la preuve durable, exigible en cas de
 *     contrôle, et elle survit à la suppression puis au réimport du contact.
 *     Le SIREN compte particulièrement : une adresse change, pas lui.
 *  2. `prospection_suppressions`, tant que la campagne automatique de la 0032
 *     tourne encore : c'est elle que `filtrerExclus` consulte avant d'envoyer.
 *     L'oublier, c'est un STOP enregistré ici et un e-mail qui part demain.
 *  3. L'échange entrant, pour que le refus apparaisse dans l'historique.
 *
 * L'ordre n'est pas cosmétique : si l'écriture 3 échoue, il reste la preuve du
 * refus et les deux filtres qui l'appliquent. L'inverse laisserait une trace
 * d'historique sans opposition opposable.
 */
export async function enregistrerStop(formData: FormData): Promise<void> {
  await exigerAdmin();
  const contactId = lireContactId(formData);
  const canal = lire(formData, "canal", CANAUX);
  const motif = String(formData.get("motif") ?? "").trim() || "STOP déclaré en console";

  const admin = createAdminClient();

  const { data: contact, error: lectureError } = await admin
    .from("contacts")
    .select("siren, telephone, emails")
    .eq("id", contactId)
    .maybeSingle();
  if (lectureError) throw new Error(`Lecture du contact impossible : ${lectureError.message}`);
  if (!contact) throw new Error("Contact introuvable : refus non enregistré.");

  const emails = (contact.emails ?? [])
    .map((e) => (e ?? "").trim().toLowerCase())
    .filter((e) => e.includes("@"));

  // 1) La preuve durable, sur toutes les coordonnées à la fois.
  const lignes = [
    ...emails.map((valeur) => ({ type: "email" as const, valeur, motif })),
    ...(contact.telephone ? [{ type: "telephone" as const, valeur: contact.telephone, motif }] : []),
    ...(contact.siren ? [{ type: "siren" as const, valeur: contact.siren, motif }] : []),
  ];
  if (lignes.length) {
    const { error } = await admin
      .from("oppositions")
      .upsert(lignes, { onConflict: "type,valeur", ignoreDuplicates: true });
    if (error) throw new Error(`Enregistrement du refus impossible : ${error.message}`);
  }

  // 2) La liste que consulte encore la campagne automatique (0032).
  if (emails.length) {
    const { error } = await admin
      .from("prospection_suppressions")
      .upsert(
        emails.map((email) => ({ email, motif })),
        { onConflict: "email", ignoreDuplicates: true },
      );
    if (error) {
      throw new Error(
        `Refus enregistré, mais la liste de la campagne automatique n'a pas pu être mise à jour : ${error.message}`,
      );
    }
  }

  // 3) La trace dans l'historique. Le trigger bascule l'état en « refus ».
  const { error } = await admin.from("contact_echanges").insert({
    contact_id: contactId,
    canal,
    sens: "entrant",
    nature: "stop",
    issue: "refus",
    automatique: false,
    commentaire: motif,
  });
  if (error) throw new Error(`Trace du refus impossible : ${error.message}`);

  rafraichir();
}

/**
 * Supprime un échange saisi par erreur.
 *
 * Réservé à la saisie MANUELLE : un envoi effectué par la campagne automatique
 * décrit un message réellement parti, et l'effacer ferait réapparaître le
 * contact comme jamais démarché, donc partir un second message. Un refus n'est
 * pas effaçable non plus, l'opposition restant de toute façon en base.
 */
export async function supprimerEchange(formData: FormData): Promise<void> {
  await exigerAdmin();
  const id = String(formData.get("echange_id") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Échange inconnu.");

  const admin = createAdminClient();
  const { data, error: lectureError } = await admin
    .from("contact_echanges")
    .select("automatique, nature")
    .eq("id", id)
    .maybeSingle();
  if (lectureError) throw new Error(`Lecture de l'échange impossible : ${lectureError.message}`);
  if (!data) throw new Error("Échange introuvable.");
  if (data.automatique) {
    throw new Error("Un envoi de la campagne automatique n'est pas effaçable : le message est réellement parti.");
  }
  if (data.nature === "stop") {
    throw new Error("Un refus ne s'efface pas. L'opposition reste enregistrée de toute façon.");
  }

  const { error } = await admin.from("contact_echanges").delete().eq("id", id);
  if (error) throw new Error(`Suppression impossible : ${error.message}`);
  rafraichir();
}
