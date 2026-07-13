"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, FileText, Loader2, Sparkles } from "lucide-react";

import { DossierCeeIsolationForm } from "@/components/dossier/DossierCeeIsolationForm";
import { analyserDevisInitial } from "@/lib/dossier/document-first-actions";
import { loadGuestDraft } from "@/lib/dossier/guest-draft";
import type { CeeIsolationInput, Famille } from "@/lib/dossier/cee-isolation";

const inputClass =
  "mt-1.5 h-11 w-full rounded border border-filigrane bg-blanc-casse px-3.5 text-sm text-encre outline-none transition focus:border-tampon focus:ring-2 focus:ring-tampon/15";

export function DemarrageAssiste({
  initialValues,
}: {
  initialValues: Partial<CeeIsolationInput>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [geste, setGeste] = useState<Famille>("isolation");
  const [dispositif, setDispositif] = useState<"cee" | "maprimerenov">("cee");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<CeeIsolationInput> | null>(null);
  const [sourceFile, setSourceFile] = useState<File | undefined>();
  const [found, setFound] = useState(0);

  useEffect(() => {
    let actif = true;
    loadGuestDraft().then((guest) => {
      if (!actif || !guest) return;
      setFound(guest.champsTrouves.length);
      setSourceFile(guest.file);
      setDraft({ ...initialValues, ...guest.valeurs });
    });
    return () => { actif = false; };
  }, [initialValues]);

  async function analyser() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Ajoutez votre devis en PDF ou prenez-le en photo.");
      return;
    }
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("geste", geste);
    fd.append("dispositif", dispositif);
    try {
      const result = await analyserDevisInitial(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setFound(result.champsTrouves.length);
      setSourceFile(file);
      setDraft({ ...initialValues, ...result.valeurs });
    } catch {
      setError("La lecture a échoué. Vous pouvez réessayer ou continuer sans analyse.");
    } finally {
      setLoading(false);
    }
  }

  if (draft) {
    return (
      <div>
        <div className="mb-7 rounded-md border border-succes/30 bg-succes-bg p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-succes" />
            <div>
              <p className="font-medium text-encre">
                Dossimo a prérempli {found} information{found > 1 ? "s" : ""}
              </p>
              <p className="mt-1 text-sm text-ardoise">
                Vérifiez uniquement les champs signalés. L’IA recopie le devis ; le contrôle réglementaire reste effectué par les règles Dossimo.
              </p>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="mt-2 text-xs font-medium text-tampon underline underline-offset-2"
              >
                Utiliser un autre document
              </button>
            </div>
          </div>
        </div>
        <DossierCeeIsolationForm initialValues={draft} initialStep={0} assisted initialDocument={sourceFile} />
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-tampon/25 bg-blanc-casse p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-bg text-tampon">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-tampon">Le plus simple</p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-encre">Commencez par votre devis</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ardoise">
            Dossimo lit le document, préremplit le client, les montants et les données techniques. Vous confirmez ensuite ce qui manque.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-ardoise">
          Aide visée
          <select value={dispositif} onChange={(e) => setDispositif(e.target.value as typeof dispositif)} className={inputClass}>
            <option value="cee">CEE</option>
            <option value="maprimerenov">MaPrimeRénov&apos;</option>
          </select>
        </label>
        <label className="text-sm font-medium text-ardoise">
          Type de travaux
          <select value={geste} onChange={(e) => setGeste(e.target.value as Famille)} className={inputClass}>
            <option value="isolation">Isolation</option>
            <option value="pac_air_eau">Pompe à chaleur air/eau</option>
            <option value="cet">Chauffe-eau thermodynamique</option>
            <option value="bois">Chauffage au bois</option>
          </select>
        </label>
      </div>

      <label className="mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-filigrane bg-papier/50 px-5 py-6 text-center transition hover:border-tampon hover:bg-info-bg/40">
        <span className="flex items-center gap-2 text-encre">
          <FileText className="h-5 w-5" />
          <span className="font-medium">Choisir le devis ou le prendre en photo</span>
        </span>
        <span className="mt-1 text-xs text-encre-claire">PDF, JPG, PNG ou WEBP · 15 Mo maximum</span>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          capture="environment"
          className="sr-only"
          onChange={() => setError(null)}
        />
      </label>

      {error && <p className="mt-3 rounded border-l-4 border-avertissement bg-avertissement-bg px-4 py-3 text-sm text-avertissement">{error}</p>}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={loading}
          onClick={analyser}
          className="inline-flex h-12 items-center justify-center gap-2 rounded bg-terre-cuite px-6 text-sm font-semibold text-blanc-casse transition hover:bg-terre-cuite-hover disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {loading ? "Lecture du devis…" : "Lire mon devis et préremplir"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setSourceFile(undefined);
            setDraft({ ...initialValues, dispositif, geste });
          }}
          className="text-sm font-medium text-ardoise underline underline-offset-4 hover:text-encre"
        >
          Je n’ai pas le devis · commencer manuellement
        </button>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-encre-claire">
        Lecture assistée par IA via OpenRouter. Le document sert uniquement à préremplir ce dossier ; chaque information reste à confirmer.
      </p>
    </section>
  );
}
