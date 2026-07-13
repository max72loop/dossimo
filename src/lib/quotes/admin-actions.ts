"use server";

import { revalidatePath } from "next/cache";
import { getAdminEmail } from "@/lib/auth/is-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type Line = { type: "designation" | "mention" | "cee" | "performance"; template: string };
function parseLines(value: string): Line[] | null {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((l) => l && typeof l.template === "string" && ["designation", "mention", "cee", "performance"].includes(l.type)) ? parsed : null;
  } catch { return null; }
}
function parseMentions(value: string): string[] | null {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) && parsed.every((m) => typeof m === "string") ? parsed : null; } catch { return null; }
}
export async function publierModeleDevis(input: { gestureId: string; validFrom: string; validUntil: string; sourceUrl: string; notes: string; linesJson: string; mentionsJson: string; reviewed: boolean }) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return { ok: false as const, error: "Accès refusé." };
  const lines = parseLines(input.linesJson); const mentions = parseMentions(input.mentionsJson);
  if (!lines || !mentions) return { ok: false as const, error: "Le JSON des lignes ou des mentions est invalide." };
  if (!input.validFrom || !input.sourceUrl) return { ok: false as const, error: "Date d’effet et source officielle requises." };
  const supabase = createAdminClient();
  const { data: current } = await supabase.from("quote_templates").select("version").eq("gesture_id", input.gestureId).order("version", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("quote_templates").insert({ gesture_id: input.gestureId, version: (current?.version ?? 0) + 1, lines: lines as never, mandatory_mentions: mentions as never, valid_from: input.validFrom, valid_until: input.validUntil || null, active: true, placeholder: !input.reviewed, source_url: input.sourceUrl, reviewed_by: input.reviewed ? adminEmail : null, reviewed_at: input.reviewed ? new Date().toISOString() : null, notes: input.notes || null });
  if (error) return { ok: false as const, error: "Publication impossible." };
  revalidatePath("/admin/devis"); revalidatePath("/devis");
  return { ok: true as const };
}
