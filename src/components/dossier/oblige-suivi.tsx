"use client";

import { useState } from "react";

import { choisirOblige, enregistrerRetourDepot, type RetourStatut } from "@/lib/dossier/oblige-actions";

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
    setMessage(res.ok ? "Obligé enregistré." : res.error ?? "Erreur.");
  }

  async function saveRetour() {
    setSaving(true);
    const res = await enregistrerRetourDepot({ dossierId, statut, motif, detail });
    setSaving(false);
    setMessage(res.ok ? "Retour terrain enregistré." : res.error ?? "Erreur.");
  }

  const input = "mt-1 w-full rounded border border-filigrane bg-blanc-casse px-3 py-2 text-sm text-encre";
  return (
    <section className="rounded border border-filigrane bg-papier/40 p-5">
      <h2 className="font-serif text-lg font-semibold text-encre">Dépôt et retour terrain</h2>
      <p className="mt-1 text-sm text-ardoise">Ces données servent à améliorer les contrôles, pas à modifier une règle sans validation.</p>
      <label className="mt-4 block text-sm font-medium text-encre">Obligé CEE visé</label>
      <div className="flex gap-2">
        <select className={input} value={selected} onChange={(e) => setSelected(e.target.value)}>
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
        <textarea className={input} rows={2} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Commentaire facultatif ou retour de l’obligé" />
        <button type="button" onClick={saveRetour} disabled={saving} className="mt-3 rounded bg-terre-cuite px-4 py-2 text-sm font-medium text-blanc-casse disabled:opacity-60">Enregistrer le résultat</button>
      </div>
      {message && <p className="mt-3 text-sm text-ardoise" role="status">{message}</p>}
    </section>
  );
}
