import { createClient } from "@/lib/supabase/server";
import { renderQuotePdf } from "@/lib/quotes/render";
import { renderQuoteDocx } from "@/lib/quotes/render-docx";
export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient();
  const { data: quote } = await supabase.from("generated_quotes").select("gesture_id,rendered_lines").eq("id", id).maybeSingle();
  if (!quote) return new Response("Introuvable", { status: 404 });
  const [{ data: gesture }, { data: template }] = await Promise.all([supabase.from("quote_gestures").select("label").eq("id", quote.gesture_id).maybeSingle(), supabase.from("quote_templates").select("mandatory_mentions").eq("gesture_id", quote.gesture_id).order("version", { ascending: false }).limit(1).maybeSingle()]);
  const lines = Array.isArray(quote.rendered_lines) ? quote.rendered_lines.map((line) => typeof line === "object" && line && "text" in line && typeof line.text === "string" ? line.text : "") .filter(Boolean) : [];
  const mentions = Array.isArray(template?.mandatory_mentions) ? template.mandatory_mentions.filter((item): item is string => typeof item === "string") : [];
  const data = { label: gesture?.label ?? "Devis", lines, mentions };
  if (new URL(request.url).searchParams.get("format") === "docx") {
    const docx = await renderQuoteDocx(data);
    return new Response(new Uint8Array(docx), { headers: { "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "content-disposition": `attachment; filename="devis-dossimo-${id}.docx"` } });
  }
  const pdf = await renderQuotePdf(data);
  return new Response(new Uint8Array(pdf), { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="devis-dossimo-${id}.pdf"` } });
}
