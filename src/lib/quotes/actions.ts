"use server";
import { createClient } from "@/lib/supabase/server";
import { generateQuote, type QuoteField, type QuoteLine } from "@/lib/quotes/generate";

export async function generateAndSaveQuote(gestureId: string, values: Record<string, string>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Connexion requise." };
  // Une version future ne doit jamais être choisie avant sa date d'effet.
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: gesture }, { data: fields }, { data: template }, { data: artisan }] = await Promise.all([
    supabase.from("quote_gestures").select("label, cee_fiche_reference").eq("id", gestureId).eq("active", true).maybeSingle(),
    supabase.from("quote_gesture_fields").select("key,label,type,unit,required,min_value,max_value").eq("gesture_id", gestureId).order("position"),
    supabase.from("quote_templates").select("version,lines,mandatory_mentions,placeholder").eq("gesture_id", gestureId).eq("active", true).lte("valid_from", today).or(`valid_until.is.null,valid_until.gte.${today}`).order("version", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("artisans").select("id").eq("user_id", user.id).maybeSingle(),
  ]);
  if (!gesture || !template || !artisan) return { ok: false as const, error: "Modèle indisponible." };
  const result = generateQuote({ fields: (fields ?? []) as QuoteField[], lines: template.lines as unknown as QuoteLine[], values, context: { label: gesture.label, cee_fiche_reference: gesture.cee_fiche_reference ?? "À VALIDER", performance_unit: (fields ?? []).find((f) => f.key === "performance")?.unit ?? "" } });
  if (!result.ok) return { ok: false as const, error: "Certains champs doivent être corrigés.", fieldErrors: result.errors };
  const { error } = await supabase.from("generated_quotes").insert({ artisan_id: artisan.id, gesture_id: gestureId, template_version: template.version, field_values: values, rendered_lines: result.lines });
  if (error) return { ok: false as const, error: "Enregistrement impossible." };
  return { ok: true as const, lines: result.lines, mentions: template.mandatory_mentions as unknown as string[], placeholder: template.placeholder };
}


export async function savePersonalQuoteTemplate(gestureId: string, name: string, fieldValues: Record<string, string>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !name.trim()) return { ok: false as const, error: "Nom du modèle requis." };
  const { data: artisan } = await supabase.from("artisans").select("id").eq("user_id", user.id).maybeSingle();
  if (!artisan) return { ok: false as const, error: "Profil artisan introuvable." };
  const { error } = await supabase.from("user_quote_templates").upsert({ artisan_id: artisan.id, gesture_id: gestureId, name: name.trim(), field_values: fieldValues }, { onConflict: "artisan_id,gesture_id,name" });
  return error ? { ok: false as const, error: "Enregistrement impossible." } : { ok: true as const };
}
