"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileText, Loader2, Sparkles } from "lucide-react";

export function DemoGuide() {
  const [state, setState] = useState<"ready" | "loading" | "done">("ready");

  function lancer() {
    setState("loading");
    window.setTimeout(() => setState("done"), 900);
  }

  return (
    <div className="mt-8">
      <div className="rounded-xl border border-filigrane bg-blanc-casse p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded bg-papier-fonce text-tampon"><FileText className="h-5 w-5" /></span>
          <div>
            <p className="font-medium text-encre">devis-combles-exemple.pdf</p>
            <p className="mt-0.5 text-xs text-ardoise">Client fictif · isolation de 95 m² · aucune donnée personnelle</p>
          </div>
        </div>

        {state === "ready" && (
          <button type="button" onClick={lancer} className="mt-6 inline-flex h-12 items-center gap-2 rounded bg-terre-cuite px-6 text-sm font-semibold text-blanc-casse hover:bg-terre-cuite-hover">
            <Sparkles className="h-4 w-4" />Voir ce que Dossimo trouve
          </button>
        )}
        {state === "loading" && <p className="mt-6 flex items-center gap-2 text-sm font-medium text-ardoise"><Loader2 className="h-4 w-4 animate-spin" />Lecture des montants, du RGE et des mentions…</p>}
        {state === "done" && (
          <div className="mt-6 space-y-3">
            <div className="rounded border border-succes/25 bg-succes-bg p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-succes"><CheckCircle2 className="h-4 w-4" />12 informations préremplies</p>
              <p className="mt-1 text-xs text-ardoise">Jean Martin · 95 m² · 8 450 € TTC · devis du 04/06/2026 · R = 6,5 m²·K/W</p>
            </div>
            <div className="rounded border border-erreur/25 bg-erreur-bg p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-erreur"><AlertTriangle className="h-4 w-4" />À corriger avant le dépôt</p>
              <p className="mt-1 text-sm font-medium text-encre">La certification de l’isolant est absente du devis.</p>
              <p className="mt-1 text-xs text-ardoise">Demandez un devis corrigé comportant la marque, la référence et la certification ACERMI du produit.</p>
              <code className="mt-3 block rounded bg-blanc-casse px-3 py-2 text-xs text-encre">Isolant certifié ACERMI n° [numéro du certificat].</code>
            </div>
            <Link href="/inscription?next=%2Fdossiers%2Fnouveau" className="inline-flex h-12 items-center rounded bg-encre px-6 text-sm font-semibold text-papier hover:bg-encre/90">Faire la même chose avec mon devis →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
