"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { submitLead } from "@/lib/landing/actions";

export function LeadForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [email, setEmail] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [telephone, setTelephone] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const result = await submitLead({ email, entreprise, telephone });
      if (result.ok) {
        setStatus("done");
      } else {
        setError(result.error);
        setStatus("idle");
      }
    } catch {
      setError("Une erreur est survenue. Réessayez dans un instant.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="flex flex-col items-center gap-3 rounded border-l-4 border-succes bg-succes-bg px-6 py-10 text-center">
        <CheckCircle2 className="h-9 w-9 text-succes" strokeWidth={1.5} />
        <p className="font-serif text-lg font-semibold text-encre">Merci !</p>
        <p className="max-w-sm text-sm text-ardoise">
          On vous recontacte très vite pour préparer votre premier dossier —
          offert.
        </p>
      </div>
    );
  }

  const labelClass = "block text-sm font-medium text-ardoise";
  const inputClass =
    "mt-1.5 h-11 w-full rounded border border-filigrane bg-blanc-casse px-3.5 text-sm text-encre placeholder:text-encre-claire outline-none transition focus:border-tampon focus:ring-2 focus:ring-tampon/15";

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-busy={status === "loading"}>
      <div className="sm:col-span-2">
        <label htmlFor="lead-email" className={labelClass}>
          Email professionnel
        </label>
        <input
          id="lead-email"
          type="email"
          required
          autoComplete="email"
          placeholder="vous@entreprise.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="lead-entreprise" className={labelClass}>
          Entreprise
        </label>
        <input
          id="lead-entreprise"
          type="text"
          autoComplete="organization"
          placeholder="Nom de l'entreprise"
          value={entreprise}
          onChange={(e) => setEntreprise(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="lead-tel" className={labelClass}>
          Téléphone
        </label>
        <input
          id="lead-tel"
          type="tel"
          autoComplete="tel"
          placeholder="06 12 34 56 78"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          className={inputClass}
        />
      </div>
      {error && (
        <p role="alert" className="flex items-start gap-2 text-[0.813rem] text-erreur sm:col-span-2">
          <AlertCircle className="mt-px h-4 w-4 shrink-0" strokeWidth={1.5} />
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded bg-terre-cuite px-5 text-sm font-medium text-blanc-casse transition-colors hover:bg-terre-cuite-hover disabled:opacity-60 sm:col-span-2"
      >
        {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        Être recontacté
      </button>
      <p className="text-center text-xs text-encre-claire sm:col-span-2">
        Sans engagement. Vos données ne sont jamais partagées.
      </p>
    </form>
  );
}
