"use client";

import { useState } from "react";
import { configurerRelances, revoirPieceBeneficiaire } from "@/lib/reminders/actions";
import type { PieceAttendue } from "@/lib/depot/pieces-attendues";

type Upload = { id: string; type: string; nom_fichier: string | null; validation_status: "submitted" | "approved" | "rejected" | null; rejection_reason: string | null };

export function RelancesBeneficiaire({ dossierId, attendues, uploads, enabled }: { dossierId: string; attendues: PieceAttendue[]; uploads: Upload[]; enabled: boolean }) {
  const [active, setActive] = useState(enabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  async function toggle() {
    setBusy(true); setError(null);
    const next = !active;
    const result = await configurerRelances(dossierId, next);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setActive(next);
  }
  async function review(pieceId: string, status: "approved" | "rejected") {
    setBusy(true); setError(null);
    const result = await revoirPieceBeneficiaire({ dossierId, pieceId, status, reason });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setRejecting(null); setReason("");
  }

  if (!attendues.length) return null;
  return <section className="mb-6 rounded border border-filigrane bg-blanc-casse p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-serif text-base font-semibold text-encre">Relances de pièces</h2><p className="mt-1 max-w-2xl text-sm text-ardoise">La cadence est prête (J+0, J+3, J+7, J+14). Les envois restent en attente tant qu’aucun provider e-mail n’est configuré.</p></div><button type="button" onClick={toggle} disabled={busy} className={`rounded px-3 py-2 text-sm font-medium ${active ? "bg-succes-bg text-succes" : "bg-papier-fonce text-ardoise"}`}>{active ? "Relances activées" : "Activer les relances"}</button></div>
    <ul className="mt-4 divide-y divide-filigrane">{attendues.map((expected) => { const upload = uploads.find((item) => item.type === expected.type); const status = upload?.validation_status; return <li key={expected.type} className="py-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-encre">{expected.titre}</p><p className="text-xs text-ardoise">{upload ? upload.nom_fichier ?? "Document déposé" : "Document manquant"}{status === "rejected" && upload?.rejection_reason ? ` · Rejeté : ${upload.rejection_reason}` : ""}</p></div><div className="flex items-center gap-2 text-xs">{!upload ? <span className="text-avertissement">À demander</span> : status === "approved" ? <span className="text-succes">Validée</span> : <><button type="button" disabled={busy} onClick={() => review(upload.id, "approved")} className="rounded border border-succes/30 px-2 py-1 text-succes">Valider</button><button type="button" disabled={busy} onClick={() => { setRejecting(upload.id); setReason(""); }} className="rounded border border-erreur/30 px-2 py-1 text-erreur">Rejeter</button></>}</div></div>{rejecting === upload?.id && <div className="mt-3 flex gap-2"><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motif du rejet" className="min-w-0 flex-1 rounded border border-filigrane px-2 py-1 text-sm"/><button type="button" disabled={busy} onClick={() => review(upload.id, "rejected")} className="rounded bg-erreur px-2 py-1 text-sm text-blanc-casse">Confirmer</button></div>}</li>; })}</ul>
    {error && <p className="mt-3 text-sm text-erreur">{error}</p>}
  </section>;
}
