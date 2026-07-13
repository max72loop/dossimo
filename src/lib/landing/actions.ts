"use server";

import nodemailer from "nodemailer";
import { z } from "zod";

/**
 * Capture de lead depuis le formulaire de la landing (CLAUDE.md §11, tâche 6).
 *
 * Flux : formulaire → Server Action → insert `leads` (client service-role, la
 * table `leads` n'a AUCUNE policy RLS : seul le service-role écrit) → e-mails
 * Google Workspace (notification interne + confirmation au prospect).
 *
 * La capture (insert) est le cœur : si elle réussit, on renvoie `ok` même si
 * l'envoi d'e-mail échoue — on ne perd jamais un lead à cause du SMTP.
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

  // --- 1. Capture en base (cœur de la tâche) ---
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

  // --- 2. Notifications e-mail (best-effort, jamais bloquant) ---
  await Promise.allSettled([
    notifyTeam({ email, entreprise, telephone, message }),
    confirmToLead(email),
  ]);

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
 * Envoi via le SMTP Google Workspace. Le mot de passe attendu est un mot de
 * passe d'application Google dédié, jamais le mot de passe principal du compte.
 * Renvoie false et journalise en cas d'échec — ne jette jamais.
 */
async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<boolean> {
  const user = process.env.GOOGLE_WORKSPACE_SMTP_USER;
  const appPassword = process.env.GOOGLE_WORKSPACE_APP_PASSWORD;
  if (!user || !appPassword) {
    console.warn("[leads] SMTP Google Workspace non configuré — e-mail ignoré.");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass: appPassword },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });

    await transporter.sendMail({
      from: `Dossimo <${user}>`,
      to: params.to,
      subject: params.subject,
      text: params.text,
      replyTo: params.replyTo,
    });
    return true;
  } catch (err) {
    console.error("[leads] Envoi SMTP Google Workspace échoué:", err);
    return false;
  }
}

async function notifyTeam(lead: {
  email: string;
  entreprise?: string;
  telephone?: string;
  message?: string;
}): Promise<void> {
  const to = process.env.LEADS_NOTIFICATION_EMAIL;
  if (!to) {
    console.warn("[leads] LEADS_NOTIFICATION_EMAIL absent — notification ignorée.");
    return;
  }
  await sendEmail({
    to,
    replyTo: lead.email,
    subject: `Nouveau lead Dossimo — ${lead.entreprise || lead.email}`,
    text: [
      "Nouveau prospect depuis la landing.",
      "",
      `Email      : ${lead.email}`,
      `Entreprise : ${lead.entreprise || "—"}`,
      `Téléphone  : ${lead.telephone || "—"}`,
      lead.message ? `Message    : ${lead.message}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

async function confirmToLead(email: string): Promise<void> {
  await sendEmail({
    to: email,
    replyTo: process.env.LEADS_REPLY_TO_EMAIL || "contact@dossimo.app",
    subject: "On prépare votre premier dossier — Dossimo",
    text: [
      "Bonjour,",
      "",
      "Merci de votre intérêt pour Dossimo. On revient vers vous très vite pour",
      "préparer avec vous votre premier dossier MaPrimeRénov' ou CEE — offert —",
      "et vous montrer le contrôle anti-refus en conditions réelles.",
      "",
      "Rappel : vous déposez vous-même, nous vérifions avant. Vous gardez votre",
      "client et l'intégralité de votre prime.",
      "",
      "Une question ? Répondez directement à cet e-mail : contact@dossimo.app.",
      "",
      "— L'équipe Dossimo",
      "",
      "Dossimo est un service indépendant d'aide à la préparation de dossier,",
      "non affilié à l'Anah ni à France Rénov'.",
    ].join("\n"),
  });
}
