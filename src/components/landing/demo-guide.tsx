"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Camera, CheckCircle2, FileText, Loader2, PlayCircle } from "lucide-react";

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
  const photoRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ valeurs: Partial<CeeIsolationInput>; champsTrouves: string[] } | null>(null);
  const [loadingStep, setLoadingStep] = useState("Je lis le devis");

  async function analyser(file?: File) {
    if (!file) return setError("Ajoutez votre devis en PDF ou prenez-le en photo.");
    setLoading(true);
    setLoadingStep("Je lis le devis");
    setError(null);
    const rgeTimer = window.setTimeout(() => setLoadingStep("Je vérifie votre RGE"), 1200);
    const resultTimer = window.setTimeout(() => setLoadingStep("Je cherche ce qu’il faut corriger"), 2600);
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
      window.clearTimeout(rgeTimer);
      window.clearTimeout(resultTimer);
      setLoading(false);
    }
  }

  function selectionner(file?: File) {
    if (!file) return;
    setFileName(file.name);
    void analyser(file);
  }

  async function essayerExemple() {
    const draft = {
      valeurs: {
        dispositif: "cee" as const,
        geste: "isolation" as const,
        client_nom: "Dupont",
        client_adresse: "12 rue des Tilleuls, 37000 Tours",
        date_devis: "2026-07-10",
        montant_ht: 8400,
        montant_ttc: 8862,
      },
      champsTrouves: ["client_nom", "client_adresse", "date_devis", "montant_ht", "montant_ttc"],
    };
    const pixel = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="), (c) => c.charCodeAt(0));
    await saveGuestDraft(draft, new File([pixel], "devis-exemple.png", { type: "image/png" }));
    setFileName("devis-exemple.png");
    setResult(draft);
  }

  const manquants = result ? POINTS_A_VERIFIER.filter(({ key }) => {
    const value = result.valeurs[key];
    return value === undefined || value === null || value === "";
  }) : [];

  return (
    <div className="mt-8 rounded-xl border border-filigrane bg-blanc-casse p-5 shadow-sm sm:p-7">
      {!result ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" disabled={loading} onClick={() => photoRef.current?.click()} className="flex min-h-28 flex-col items-center justify-center rounded-lg bg-terre-cuite px-5 text-center font-semibold text-blanc-casse shadow-sm transition hover:bg-terre-cuite-hover disabled:opacity-60">
              <Camera className="mb-2 h-7 w-7" />Prendre une photo
            </button>
            <button type="button" disabled={loading} onClick={() => pdfRef.current?.click()} className="flex min-h-28 flex-col items-center justify-center rounded-lg border-2 border-filigrane bg-papier/50 px-5 text-center font-semibold text-encre transition hover:border-tampon disabled:opacity-60">
              <FileText className="mb-2 h-7 w-7 text-tampon" />Choisir un PDF
            </button>
          </div>
          <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(event) => selectionner(event.target.files?.[0])} />
          <input ref={pdfRef} type="file" accept="application/pdf" className="sr-only" onChange={(event) => selectionner(event.target.files?.[0])} />
          {loading && <div className="mt-5 flex items-center gap-3 rounded-lg bg-info-bg px-4 py-4 text-sm font-semibold text-tampon" role="status"><Loader2 className="h-5 w-5 animate-spin" />{loadingStep}…</div>}
          {!loading && fileName && <p className="mt-3 text-center text-xs text-encre-claire">{fileName}</p>}
          {error && <p className="mt-3 rounded border-l-4 border-erreur bg-erreur-bg px-4 py-3 text-sm text-erreur">{error}</p>}
          <button type="button" onClick={() => void essayerExemple()} disabled={loading} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded border border-filigrane px-5 text-sm font-semibold text-tampon transition hover:bg-info-bg disabled:opacity-60"><PlayCircle className="h-4 w-4" />Essayer avec un exemple</button>
          <Link
            href="/dossiers/nouveau?mode=manuel"
            className="mt-3 inline-flex h-11 w-full items-center justify-center text-sm font-semibold text-ardoise underline underline-offset-4 transition hover:text-encre"
          >
            Je n’ai pas de devis · commencer manuellement
          </Link>
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
