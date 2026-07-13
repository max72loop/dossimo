"use client";

import { useMemo, useState } from "react";
import { generateAndSaveQuote, savePersonalQuoteTemplate } from "@/lib/quotes/actions";

type Gesture = { id: string; label: string; category: string; mpr_eligible: boolean; cee_eligible: boolean; cee_fiche_reference: string | null };
type Field = { key: string; label: string; type: "text" | "number" | "boolean"; unit: string | null; required: boolean; help_text: string | null };

type PersonalTemplate = { id: string; gesture_id: string; name: string; field_values: unknown };
export function QuoteLibrary({ gestures, fields, templates }: { gestures: Gesture[]; fields: Field[]; templates: PersonalTemplate[] }) {
  const [gestureId, setGestureId] = useState(gestures[0]?.id ?? "");
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Awaited<ReturnType<typeof generateAndSaveQuote>> | null>(null);
  const [templateName, setTemplateName] = useState("");
  const selected = gestures.find((g) => g.id === gestureId);
  const visibleFields = useMemo(() => fields.filter((f) => (f as Field & { gesture_id?: string }).gesture_id === gestureId), [fields, gestureId]);
  async function generate() { setResult(await generateAndSaveQuote(gestureId, values)); }
  async function copy() { if (result?.ok) await navigator.clipboard.writeText(result.lines.map((l) => `• ${l.text}`).join("\n")); }
  async function saveTemplate() { if (templateName.trim()) { await savePersonalQuoteTemplate(gestureId, templateName, values); setTemplateName(""); } }
  const input = "mt-1 w-full rounded border border-filigrane bg-blanc-casse px-3 py-2 text-sm text-encre";
  return <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
    <section className="rounded border border-filigrane bg-blanc-casse p-5">
      <label className="text-sm font-medium text-encre">Geste de travaux</label>
      <select className={input} value={gestureId} onChange={(e) => { setGestureId(e.target.value); setValues({}); setResult(null); }}>
        {gestures.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
      </select>
      {selected && <p className="mt-2 text-xs text-ardoise">{selected.category} · {selected.mpr_eligible ? "MPR" : ""}{selected.mpr_eligible && selected.cee_eligible ? " + " : ""}{selected.cee_eligible ? "CEE" : ""} · {selected.cee_fiche_reference ?? "fiche à valider"}</p>}
      {templates.some((t) => t.gesture_id === gestureId) && <select className={input} defaultValue="" onChange={(e) => { const model = templates.find((t) => t.id === e.target.value); if (model && model.field_values && typeof model.field_values === "object" && !Array.isArray(model.field_values)) setValues(model.field_values as Record<string, string>); }}><option value="">Appliquer un modèle personnel…</option>{templates.filter((t) => t.gesture_id === gestureId).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}
      <div className="mt-5 space-y-4">{visibleFields.map((f) => <label key={f.key} className="block text-sm font-medium text-encre">{f.label}{f.required ? " *" : ""}<input className={input} type={f.type === "number" ? "number" : "text"} value={values[f.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />{f.help_text && <span className="mt-1 block text-xs font-normal text-ardoise">{f.help_text}</span>}</label>)}</div>
      <button type="button" onClick={generate} className="mt-6 rounded bg-terre-cuite px-4 py-2 text-sm font-medium text-blanc-casse">Générer les lignes</button>
      <div className="mt-3 flex gap-2"><input className={input} value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Nom du modèle personnel"/><button type="button" onClick={saveTemplate} className="rounded border border-filigrane px-3 text-sm">Enregistrer</button></div>
      {result && !result.ok && <div className="mt-4 rounded bg-erreur-bg p-3 text-sm text-erreur">{result.error}{"fieldErrors" in result && <ul className="mt-2 list-disc pl-4">{Object.values(result.fieldErrors ?? {}).map((e) => <li key={e}>{e}</li>)}</ul>}</div>}
    </section>
    <section className="rounded border border-filigrane bg-papier/40 p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-serif text-lg font-semibold text-encre">Bloc à copier dans le devis</h2>{result?.ok && <span className="flex gap-3"><button type="button" onClick={copy} className="text-sm font-medium text-tampon underline">Copier</button><a href={`/api/quotes/${result.quoteId}/export`} className="text-sm font-medium text-tampon underline">PDF</a><a href={`/api/quotes/${result.quoteId}/export?format=docx`} className="text-sm font-medium text-tampon underline">DOCX</a></span>}</div>
      {!result?.ok ? <p className="mt-5 text-sm text-ardoise">Complétez les variables puis générez votre bloc de devis.</p> : <><div className="mt-4 space-y-3 rounded bg-blanc-casse p-4 text-sm text-encre">{result.lines.map((l, i) => <p key={i}>• {l.text}</p>)}</div><div className="mt-5 rounded border border-avertissement/30 bg-avertissement-bg p-4"><p className="font-medium text-avertissement">Checklist de conformité</p><ul className="mt-2 space-y-1 text-sm text-encre">{result.mentions.map((m) => <li key={m}>✓ {m}</li>)}</ul></div>{result.placeholder && <p className="mt-4 text-xs text-ardoise">Formulations de démonstration à valider par le responsable conformité avant utilisation commerciale. L’artisan reste responsable de son devis.</p>}</>}</section>
  </div>;
}
