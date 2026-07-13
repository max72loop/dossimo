"use client";
import { useState } from "react";
import { publierModeleDevis } from "@/lib/quotes/admin-actions";

type Gesture = { id: string; label: string };
const sampleLines = JSON.stringify([
  { type: "designation", template: "Fourniture et pose de {{label}} {{marque}}, référence {{reference}}." },
  { type: "performance", template: "Performance déclarée : {{performance}} {{performance_unit}}." },
  { type: "cee", template: "Référence CEE : {{cee_fiche_reference}}." },
  { type: "mention", template: "Qualification RGE : [à compléter]." },
], null, 2);
export function QuoteTemplateEditor({ gestures }: { gestures: Gesture[] }) {
  const [message, setMessage] = useState<string | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd = new FormData(e.currentTarget); setMessage("Publication…");
    const res = await publierModeleDevis({ gestureId: String(fd.get("gestureId")), validFrom: String(fd.get("validFrom")), validUntil: String(fd.get("validUntil")), sourceUrl: String(fd.get("sourceUrl")), notes: String(fd.get("notes")), linesJson: String(fd.get("linesJson")), mentionsJson: String(fd.get("mentionsJson")), reviewed: fd.get("reviewed") === "on" });
    setMessage(res.ok ? "Nouvelle version publiée." : res.error);
    if (res.ok) e.currentTarget.reset();
  }
  const input = "mt-1 w-full rounded border border-filigrane bg-blanc-casse px-3 py-2 text-sm text-encre";
  return <form onSubmit={submit} className="rounded border border-filigrane bg-blanc-casse p-5"><h2 className="font-serif text-lg font-semibold text-encre">Publier une version de modèle</h2><p className="mt-1 text-sm text-ardoise">Chaque publication crée une nouvelle version ; les devis existants restent inchangés.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-encre">Geste<select required name="gestureId" className={input}>{gestures.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select></label><label className="text-sm font-medium text-encre">Date d’effet<input required name="validFrom" type="date" className={input} /></label><label className="text-sm font-medium text-encre">Fin de validité (optionnelle)<input name="validUntil" type="date" className={input} /></label><label className="text-sm font-medium text-encre">Source officielle<input required name="sourceUrl" type="url" className={input} placeholder="https://…" /></label></div>
    <label className="mt-4 block text-sm font-medium text-encre">Lignes (JSON)<textarea required name="linesJson" rows={10} defaultValue={sampleLines} className={`${input} font-mono text-xs`} /></label>
    <label className="mt-4 block text-sm font-medium text-encre">Checklist des mentions (JSON)<textarea required name="mentionsJson" rows={4} defaultValue={'["Désignation complète", "Marque et référence", "Performance", "Qualification RGE"]'} className={`${input} font-mono text-xs`} /></label>
    <label className="mt-4 block text-sm font-medium text-encre">Notes de revue<textarea name="notes" rows={2} className={input} /></label>
    <label className="mt-4 flex items-start gap-2 text-sm text-encre"><input name="reviewed" type="checkbox" className="mt-1" /> <span>Je confirme avoir comparé ce contenu à la source officielle et validé sa publication.</span></label>
    <button className="mt-5 rounded bg-terre-cuite px-4 py-2 text-sm font-medium text-blanc-casse">Publier la nouvelle version</button>{message && <p className="mt-3 text-sm text-ardoise" role="status">{message}</p>}
  </form>;
}
