"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Camera, CheckCircle2, FileText, Loader2 } from "lucide-react";

import { analyserDevisInitial } from "@/lib/dossier/document-first-actions";
import { saveGuestDraft } from "@/lib/dossier/guest-draft";
import type { CeeIsolationInput } from "@/lib/dossier/cee-isolation";

const POINTS_A_VERIFIER: Array<{ key: keyof CeeIsolationInput; label: string }> = [
  { key: "client_nom", label: "le nom complet du client" },
  { key: "client_adresse", label: "l'adresse du chantier" },
  { key: "date_devis", label: "la date du devis" },
  { key: "rge_numero", label: "le numéro RGE" },
  { key: "montant_ht", label: "le montant HT" },
  { key: "montant_ttc", label: "le montant TTC" },
];

export function DemoGuide() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ valeurs: Partial<CeeIsolationInput>; champsTrouves: string[] } | null>(null);

  async function analyser() {
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Ajoutez votre devis en PDF ou prenez-le en photo.");
    setLoading(true);
    setError(null);
    const data = new FormData();
    data.append("file", file);
    data.append("geste", "auto");
    data.append("dispositif", "auto");
    try {
      const analyse = await analyserDevisInitial(data);
      if (!analyse.ok) return setError(analyse.error);
      const draft = { valeurs: analyse.valeurs, champsTrouves: analyse.champsTrouves };
      await saveGuestDraft(draft, file);
      setResult(draft);
    } catch {
      setError("La lecture a échoué. Réessayez avec une photo plus nette.");
    } finally {
      setLoading(false);
    }
  }

  const manquants = result ? POINTS_A_VERIFIER.filter(({ key }) => {
    const value = result.valeurs[key];
    return value === undefined || value === null || value === "";
  }) : [];

  return (
    <div className="mt-8 rounded-xl border border-filigrane bg-blanc-casse p-5 shadow-sm sm:p-7">
      {!result ? (
        <>
          <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-filigrane bg-papier/50 px-5 py-7 text-center transition hover:border-tampon hover:bg-info-bg/40">
            <FileText className="h-8 w-8 text-tampon" />
            <span className="mt-3 font-medium text-encre">{fileName ?? "Choisir mon devis ou le prendre en photo"}</span>
            <span className="mt-1 text-xs text-encre-claire">PDF, JPG, PNG ou WEBP · 15 Mo maximum</span>
            <input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(event) => { setFileName(event.target.files?.[0]?.name ?? null); setError(null); }} />
          </label>
          {error && <p className="mt-3 rounded border-l-4 border-erreur bg-erreur-bg px-4 py-3 text-sm text-erreur">{error}</p>}
          <button type="button" onClick={analyser} disabled={loading} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded bg-terre-cuite px-6 text-sm font-semibold text-blanc-casse hover:bg-terre-cuite-hover disabled:opacity-60 sm:w-auto">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {loading ? "Lecture de votre devis…" : "Voir gratuitement ce qui manque"}
          </button>
          <p className="mt-3 text-xs text-encre-claire">Aucun compte et aucune carte bancaire. Un essai gratuit par navigateur.</p>
        </>
      ) : (
        <div>
          <div className="rounded border border-succes/25 bg-succes-bg p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-succes"><CheckCircle2 className="h-4 w-4" />{result.champsTrouves.length} informations lues sur votre devis</p>
            <p className="mt-1 text-xs text-ardoise">Le brouillon est conservé dans ce navigateur pour reprendre après l'inscription.</p>
          </div>
          <div className="mt-3 rounded border border-avertissement/25 bg-avertissement-bg p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-avertissement"><AlertTriangle className="h-4 w-4" />À confirmer pour terminer le dossier</p>
            {manquants.length ? <ul className="mt-2 space-y-1 text-sm text-encre">{manquants.slice(0, 3).map((item) => <li key={item.key}>· {item.label}</li>)}</ul> : <p className="mt-2 text-sm text-encre">Les informations essentielles sont lisibles. Dossimo vous demandera seulement les compléments réglementaires.</p>}
          </div>
          <Link href="/inscription?next=%2Fdossiers%2Fnouveau%3Freprise%3Dessai" className="mt-5 inline-flex h-12 items-center rounded bg-encre px-6 text-sm font-semibold text-papier hover:bg-encre/90">Enregistrer et terminer mon dossier →</Link>
        </div>
      )}
    </div>
  );
}
