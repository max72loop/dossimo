"use client";

import { useRef, useState } from "react";

import { remplirAhOblige } from "@/lib/cerfa/oblige-actions";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; applied: number; total: number; vides: string[] };

function base64ToBlob(b64: string): Blob {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: "application/pdf" });
}

/**
 * Upload de l'AH que l'obligé a remise à l'artisan : si c'est un PDF à champs,
 * Dossimo la pré-remplit depuis la saisie et la renvoie prête à télécharger.
 */
export function AhObligeFill({ dossierId }: { dossierId: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setState({ kind: "loading" });
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await remplirAhOblige(dossierId, fd);
      if (!res.ok) {
        setState({ kind: "error", message: res.reason });
      } else {
        // Téléchargement immédiat du PDF pré-rempli.
        const url = URL.createObjectURL(base64ToBlob(res.filledBase64));
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setState({
          kind: "done",
          applied: res.appliedCount,
          total: res.totalFields,
          vides: res.laissesVides,
        });
      }
    } catch {
      setState({ kind: "error", message: "Une erreur est survenue. Réessayez." });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-4 rounded border border-dashed border-filigrane bg-papier/40 p-4">
      <p className="text-sm font-medium text-encre">
        Vous avez l&apos;AH de votre obligé&nbsp;?
      </p>
      <p className="mt-1 text-xs text-ardoise">
        Téléversez le PDF que votre financeur (obligé) vous a remis. S&apos;il est
        remplissable, Dossimo y reporte les valeurs de votre saisie et vous le rend
        pré-rempli · vous n&apos;avez plus qu&apos;à vérifier, dater et signer.
      </p>

      <label className="mt-3 inline-flex h-9 cursor-pointer items-center rounded bg-tampon px-4 text-sm font-medium text-blanc-casse transition-colors hover:bg-tampon/90">
        {state.kind === "loading" ? "Appariement…" : "Téléverser l'AH de l'obligé"}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          disabled={state.kind === "loading"}
          onChange={onFile}
        />
      </label>

      {state.kind === "error" && (
        <p className="mt-3 rounded border-l-4 border-avertissement bg-avertissement-bg px-3 py-2 text-xs text-avertissement">
          {state.message}
        </p>
      )}

      {state.kind === "done" && (
        <div className="mt-3 rounded border-l-4 border-succes bg-succes-bg px-3 py-2 text-xs text-ardoise">
          <p className="font-medium text-succes">
            PDF pré-rempli téléchargé · {state.applied} / {state.total} champ
            {state.total > 1 ? "s" : ""} renseigné{state.applied > 1 ? "s" : ""}.
          </p>
          {state.vides.length > 0 && (
            <p className="mt-1">
              À compléter/vérifier à la main&nbsp;:{" "}
              <span className="text-encre">
                {state.vides.slice(0, 8).join(" · ")}
                {state.vides.length > 8 ? ` … (+${state.vides.length - 8})` : ""}
              </span>
            </p>
          )}
          <p className="mt-1 text-encre-claire">
            Vérifiez toujours le document avant signature&nbsp;: Dossimo ne remplit
            que les champs qu&apos;il reconnaît avec certitude.
          </p>
        </div>
      )}
    </div>
  );
}
