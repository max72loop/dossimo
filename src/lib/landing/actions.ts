"use server";

import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Capture de lead depuis le formulaire de la landing (CLAUDE.md §11, tâche 6).
 *
 * Flux : formulaire → Server Action → insert `leads` (client service-role, la
 * table `leads` n'a AUCUNE policy RLS : seul le service-role écrit) → e-mails
 * Resend (notification interne + confirmation au prospect).
 *
 * La capture (insert) est le cœur : si elle réussit, on renvoie `ok` même si
 * l'envoi d'e-mail échoue — on ne perd jamais un lead à cause de Resend.
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
    const supabase = createAdminClient();
    const { error } = await supabase.from("leads").insert({
      email,
      entreprise: entreprise || null,
      telephone: telephone || null,
      message: message || null,
      source: "landing",
    });
    if (error) {
      console.error("[leads] insert:", error.message);
      return {
        ok: false,
        error: "Impossible d'enregistrer votre demande pour le moment. Réessayez dans un instant.",
      };
    }
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

/* ------------------------------------------------------------------ Emails */

/**
 * Envoi via l'API HTTP Resend (pas de dépendance). Renvoie false et journalise
 * en cas d'échec ou de configuration absente — ne jette jamais.
 */
async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    console.warn("[leads] Resend non configuré — e-mail ignoré.");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        text: params.text,
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error(`[leads] Resend ${res.status}: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[leads] Resend fetch échoué:", err);
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
      "— L'équipe Dossimo",
      "",
      "Dossimo est un service indépendant d'aide à la préparation de dossier,",
      "non affilié à l'Anah ni à France Rénov'.",
    ].join("\n"),
  });
}
