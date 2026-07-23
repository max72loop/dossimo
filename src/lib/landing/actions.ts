"use server";

import { z } from "zod";

import { consumeAuthRateLimit } from "@/lib/auth/rate-limit";
import { estimerAidePublique } from "@/lib/landing/estimation";
import {
  estimationSchema,
  type ResultatEstimation,
} from "@/lib/landing/estimation-refs";

/**
 * Capture de lead depuis le formulaire de la landing (CLAUDE.md §11, tâche 6).
 *
 * Flux : formulaire → Server Action → insert `leads` (client service-role, la
 * table `leads` n'a AUCUNE policy RLS : seul le service-role écrit) → e-mails
 * Google Apps Script (notification interne + confirmation au prospect).
 *
 * La capture (insert) est le cœur : si elle réussit, on renvoie `ok` même si
 * l'envoi d'e-mail échoue — on ne perd jamais un lead à cause du webhook.
 */

const leadSchema = z.object({
  email: z.email("Email invalide."),
  entreprise: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().max(200).optional().or(z.literal("")),
  ),
  telephone: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().max(40).optional().or(z.literal("")),
  ),
  message: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().max(2000).optional().or(z.literal("")),
  ),
  // Champ invisible : il ne constitue pas une protection suffisante à lui seul,
  // mais écarte les robots opportunistes avant toute écriture ou envoi d'e-mail.
  website: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().max(0).optional().or(z.literal("")),
  ),
});

export type SubmitLeadResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function submitLead(input: unknown): Promise<SubmitLeadResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Certains champs sont invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { email, entreprise, telephone, message } = parsed.data;

  // --- 1. Anti-flood, borné par IP ---
  // Le honeypot (`website`) écarte les robots opportunistes mais ne borne pas un
  // envoi répété depuis une même source : sans plafond, la route inonde `leads`
  // et bombarde une victime d'e-mails via la confirmation prospect. On plafonne
  // donc par IP — surtout PAS par email : l'adresse est saisie par l'appelant,
  // la faire entrer dans la clé laisserait un attaquant repartir à zéro à chaque
  // envoi. Identité vide → la clé se réduit à l'IP (cf. `consumeAuthRateLimit`).
  //
  // Différence assumée avec l'auth : on n'échoue PAS en mode fermé. Si le
  // limiteur est indisponible (secret absent, RPC en erreur), on laisse passer —
  // perdre un lead sur une panne du limiteur coûte plus que de laisser filer un
  // envoi (cf. « on ne perd jamais un lead » plus bas). Seul un vrai dépassement
  // de quota bloque.
  if ((await consumeAuthRateLimit("lead", "", 5)) === "quota") {
    return {
      ok: false,
      error: "Trop de demandes envoyées depuis votre connexion. Réessayez dans quelques minutes.",
    };
  }

  // --- 2. Capture en base (cœur de la tâche) ---
  try {
    await captureLead({
      email,
      entreprise: entreprise || null,
      telephone: telephone || null,
      message: message || null,
      source: "landing",
    });
  } catch (err) {
    // Ex. configuration Supabase absente : on ne fige jamais le formulaire.
    console.error("[leads] capture échouée:", err);
    return {
      ok: false,
      error: "Impossible d'enregistrer votre demande pour le moment. Réessayez dans un instant.",
    };
  }

  // --- 3. Notifications e-mail (best-effort, jamais bloquant) ---
  await notifyGoogleAppsScript({ email, entreprise, telephone, message });

  return { ok: true };
}

/**
 * Insertion REST avec la clé service-role, exclusivement côté serveur.
 * On évite ainsi l'initialisation inutile de Supabase Realtime sous Node 20.
 */
async function captureLead(lead: {
  email: string;
  entreprise: string | null;
  telephone: string | null;
  message: string | null;
  source: string;
}): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) {
    throw new Error("Configuration Supabase absente");
  }

  const endpoint = new URL("/rest/v1/leads", baseUrl);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(lead),
  });

  if (!response.ok) {
    throw new Error(`Insertion lead: ${response.status}`);
  }
}

/* ------------------------------------------------------------------ Emails */

/**
 * Le webhook Apps Script s'exécute sous le compte Google Workspace et envoie
 * l'alerte interne ainsi que la confirmation prospect via MailApp. Il n'expose
 * aucune fonction de relais générique : le script n'accepte que ce payload lead.
 */
async function notifyGoogleAppsScript(lead: {
  email: string;
  entreprise?: string;
  telephone?: string;
  message?: string;
}): Promise<void> {
  const webhookUrl = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL;
  const webhookSecret = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET;
  if (!webhookUrl || !webhookSecret) {
    console.warn("[leads] Webhook Google Apps Script non configuré — e-mails ignorés.");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        secret: webhookSecret,
        type: "landing_lead",
        ...lead,
      }),
      cache: "no-store",
    });
    const result = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !result.ok) {
      console.error(`[leads] Webhook Apps Script refusé: ${result.error || response.status}`);
    }
  } catch (err) {
    console.error("[leads] Webhook Google Apps Script échoué:", err);
  }
}

/**
 * Estimation publique du montant d'aide (simulateur de la vitrine).
 *
 * Server Action volontairement SANS effet de bord : aucune écriture, aucun
 * lead capté, aucune trace nominative. C'est une calculatrice, pas un
 * formulaire déguisé — demander un email pour rendre un chiffre casserait la
 * marche d'entrée que ce simulateur existe précisément pour abaisser.
 *
 * Les erreurs de saisie remontent en clair ; toute autre panne renvoie un
 * message neutre sans détail d'implémentation.
 */
export async function estimerAide(
  input: unknown,
): Promise<{ ok: true; resultat: ResultatEstimation } | { ok: false; error: string }> {
  const parsed = estimationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Saisie invalide." };
  }

  try {
    return { ok: true, resultat: await estimerAidePublique(parsed.data) };
  } catch (err) {
    console.error("[estimation] échec:", err);
    return {
      ok: false,
      error: "Estimation indisponible pour le moment. Réessayez dans un instant.",
    };
  }
}
