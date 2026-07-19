"use client";

import { CircleHelp } from "lucide-react";
import { useState } from "react";

import { choisirOblige, enregistrerRetourDepot, type RetourStatut } from "@/lib/dossier/oblige-actions";
import { CARTE } from "@/components/ui/cartes";

export function ObligeSuivi({
  dossierId,
  obligeId,
  obliges,
  retour,
}: {
  dossierId: string;
  obligeId: string | null;
  obliges: { id: string; nom: string }[];
  retour: { statut: RetourStatut; motif: string | null; detail: string | null } | null;
}) {
  const [selected, setSelected] = useState(obligeId ?? "");
  const [statut, setStatut] = useState<RetourStatut>(retour?.statut ?? "en_cours");
  const [motif, setMotif] = useState(retour?.motif ?? "");
  const [detail, setDetail] = useState(retour?.detail ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveOblige() {
    setSaving(true);
    const res = await choisirOblige(dossierId, selected || null);
    setSaving(false);
    setMessage(res.ok ? "Organisme enregistré." : res.error ?? "Erreur.");
  }

  async function saveRetour() {
    setSaving(true);
    const res = await enregistrerRetourDepot({ dossierId, statut, motif, detail });
    setSaving(false);
    setMessage(res.ok ? "Résultat enregistré." : res.error ?? "Erreur.");
  }

  const input = "mt-1 w-full rounded border border-filigrane bg-blanc-casse px-3 py-2 text-sm text-encre";
  return (
    <section className={CARTE}>
      <h2 className="font-serif text-lg font-semibold text-encre">Après le dépôt du dossier</h2>
      <p className="mt-1 text-sm text-ardoise">Notez l’organisme choisi et le résultat reçu après l’envoi du dossier.</p>
      <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-encre">
        Obligé CEE visé
        <span className="group relative inline-flex">
          <button
            type="button"
            aria-describedby="aide-oblige-cee"
            className="rounded-full text-ardoise hover:text-encre focus:outline-none focus:ring-2 focus:ring-tampon/40"
          >
            <CircleHelp className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Qu’est-ce qu’un obligé CEE ?</span>
          </button>
          <span
            id="aide-oblige-cee"
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-64 -translate-x-1/2 rounded bg-encre px-3 py-2 text-xs font-normal text-blanc-casse shadow-lg group-hover:block group-focus-within:block"
          >
            L’organisme (EDF, Engie…) qui verse la prime.
          </span>
        </span>
      </div>
      <div className="flex gap-2">
        <select aria-label="Obligé CEE visé" className={input} value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Non choisi</option>
          {obliges.map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}
        </select>
        <button type="button" onClick={saveOblige} disabled={saving} className="mt-1 rounded bg-encre px-3 text-sm font-medium text-blanc-casse disabled:opacity-60">Enregistrer</button>
      </div>
      <div className="mt-5 border-t border-filigrane pt-4">
        <label className="block text-sm font-medium text-encre">Résultat du dépôt</label>
        <select className={input} value={statut} onChange={(e) => setStatut(e.target.value as RetourStatut)}>
          <option value="en_cours">En cours d’instruction</option>
          <option value="accepte">Accepté</option>
          <option value="refuse">Refusé</option>
          <option value="abandonne">Abandonné</option>
        </select>
        {statut === "refuse" && <input className={input} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif de refus (ex. mention manquante)" />}
        <textarea className={input} rows={2} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Commentaire facultatif ou retour de l’organisme" />
        <button type="button" onClick={saveRetour} disabled={saving} className="mt-3 rounded bg-accent px-4 py-2 text-sm font-medium text-blanc-casse disabled:opacity-60">Enregistrer le résultat</button>
      </div>
      {message && <p className="mt-3 text-sm text-ardoise" role="status">{message}</p>}
    </section>
  );
}
