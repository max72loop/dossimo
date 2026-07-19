"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  configurerRelances,
  enregistrerRelanceEnvoyee,
  preparerRelanceManuelle,
  revoirPieceBeneficiaire,
} from "@/lib/reminders/actions";
import type { PieceAttendue } from "@/lib/depot/pieces-attendues";

type Upload = { id: string; type: string; nom_fichier: string | null; validation_status: "submitted" | "approved" | "rejected" | null; rejection_reason: string | null };
type EtatRelance = { active: boolean; desinscrit: boolean; envoyees: number; plafond: number; due: boolean };

export function RelancesBeneficiaire({ dossierId, attendues, uploads, etat }: { dossierId: string; attendues: PieceAttendue[]; uploads: Upload[]; etat: EtatRelance }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ subject: string; body: string } | null>(null);

  async function review(pieceId: string, status: "approved" | "rejected") {
    setBusy(true); setError(null);
    const result = await revoirPieceBeneficiaire({ dossierId, pieceId, status, reason });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setRejecting(null); setReason(""); router.refresh();
  }
  async function prepare() {
    setBusy(true); setError(null);
    const result = await preparerRelanceManuelle(dossierId);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setMessage({ subject: result.subject, body: result.body });
  }
  async function basculer(enabled: boolean) {
    setBusy(true); setError(null);
    const result = await configurerRelances(dossierId, enabled);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    router.refresh();
  }
  async function marquerEnvoyee() {
    setBusy(true); setError(null);
    const result = await enregistrerRelanceEnvoyee(dossierId);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setMessage(null); router.refresh();
  }

  if (!attendues.length) return null;

  // Statut de cadence, en clair. La désinscription prime : le client a dit non.
  const statut = etat.desinscrit
    ? { ton: "text-ardoise", texte: "Le client s'est désinscrit des relances." }
    : !etat.active
      ? { ton: "text-ardoise", texte: "Relances désactivées sur ce dossier." }
      : etat.due
        ? { ton: "text-avertissement", texte: `Une relance est due (${etat.envoyees + 1}/${etat.plafond}).` }
        : etat.envoyees >= etat.plafond
          ? { ton: "text-ardoise", texte: "Toutes les relances prévues ont été envoyées." }
          : { ton: "text-succes", texte: `À jour. ${etat.envoyees}/${etat.plafond} relance${etat.envoyees > 1 ? "s" : ""} envoyée${etat.envoyees > 1 ? "s" : ""}.` };

  return <section className="mb-6 rounded border border-filigrane bg-blanc-casse p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-serif text-base font-semibold text-encre">Relances de pièces</h2>
        <p className={`mt-1 text-sm ${statut.ton}`}>{statut.texte}</p>
      </div>
      {!etat.desinscrit && (etat.active
        ? <button type="button" disabled={busy} onClick={() => basculer(false)} className="rounded border border-filigrane px-3 py-1.5 text-xs text-ardoise">Désactiver</button>
        : <button type="button" disabled={busy} onClick={() => basculer(true)} className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-blanc-casse">Activer les relances</button>)}
    </div>

    <ul className="mt-4 divide-y divide-filigrane">{attendues.map((expected) => { const upload = uploads.find((item) => item.type === expected.type); const status = upload?.validation_status; return <li key={expected.type} className="py-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-encre">{expected.titre}</p><p className="text-xs text-ardoise">{upload ? upload.nom_fichier ?? "Document déposé" : "Document manquant"}{status === "rejected" && upload?.rejection_reason ? ` · Rejeté : ${upload.rejection_reason}` : ""}</p></div><div className="flex items-center gap-2 text-xs">{!upload ? <span className="text-avertissement">À demander</span> : status === "approved" ? <span className="text-succes">Validée</span> : <><button type="button" disabled={busy} onClick={() => review(upload.id, "approved")} className="rounded border border-succes/30 px-2 py-1 text-succes">Valider</button><button type="button" disabled={busy} onClick={() => { setRejecting(upload.id); setReason(""); }} className="rounded border border-erreur/30 px-2 py-1 text-erreur">Rejeter</button></>}</div></div>{rejecting === upload?.id && <div className="mt-3 flex gap-2"><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motif du rejet" className="min-w-0 flex-1 rounded border border-filigrane px-2 py-1 text-sm"/><button type="button" disabled={busy} onClick={() => review(upload.id, "rejected")} className="rounded bg-erreur px-2 py-1 text-sm text-blanc-casse">Confirmer</button></div>}</li>; })}</ul>

    {error && <p className="mt-3 text-sm text-erreur">{error}</p>}

    <div className="mt-4 border-t border-filigrane pt-4"><button type="button" disabled={busy} onClick={prepare} className="rounded border border-tampon/30 px-3 py-2 text-sm font-medium text-tampon">Préparer le message</button>{message && <div className="mt-3 rounded bg-papier/60 p-3"><p className="text-xs font-medium text-encre">Objet : {message.subject}</p><pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-ardoise">{message.body}</pre><div className="mt-3 flex flex-wrap items-center gap-3"><a href={`https://wa.me/?text=${encodeURIComponent(message.body)}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-tampon underline">Envoyer par WhatsApp</a><a href={`sms:?&body=${encodeURIComponent(message.body)}`} className="text-xs font-semibold text-tampon underline">Envoyer par SMS</a><button type="button" onClick={() => navigator.clipboard.writeText(`Objet : ${message.subject}\n\n${message.body}`)} className="text-xs font-medium text-tampon underline">Copier le message</button></div>{etat.active && etat.due && <button type="button" disabled={busy} onClick={marquerEnvoyee} className="mt-3 rounded bg-tampon px-3 py-1.5 text-xs font-medium text-blanc-casse">J'ai envoyé cette relance</button>}</div>}</div>
  </section>;
}
