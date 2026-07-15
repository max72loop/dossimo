"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

import { supprimerDossiers } from "@/lib/admin/donnees-actions";
import type { DossierInventaire } from "@/lib/admin/inventaire";

const MOT_CONFIRMATION = "SUPPRIMER";

function formatOctets(o: number): string {
  if (o <= 0) return "0 o";
  const u = ["o", "Ko", "Mo", "Go"];
  const i = Math.min(Math.floor(Math.log(o) / Math.log(1024)), u.length - 1);
  return `${(o / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function TableNettoyage({ dossiers }: { dossiers: DossierInventaire[] }) {
  const router = useRouter();
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const suspects = useMemo(() => dossiers.filter((d) => d.suspect).map((d) => d.id), [dossiers]);

  function basculer(id: string) {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectionnerSuspects() {
    setSelection(new Set(suspects));
  }

  function vider() {
    setSelection(new Set());
    setConfirmation("");
  }

  function supprimer() {
    const ids = [...selection];
    setMessage(null);
    startTransition(async () => {
      const res = await supprimerDossiers(ids);
      if (res.ok) {
        setMessage({
          ok: true,
          texte: `${res.dossiers} dossier(s) et ${res.fichiers} fichier(s) supprimés.`,
        });
        vider();
        router.refresh();
      } else {
        setMessage({ ok: false, texte: res.error });
      }
    });
  }

  const peutSupprimer = selection.size > 0 && confirmation === MOT_CONFIRMATION && !pending;

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={selectionnerSuspects}
          disabled={suspects.length === 0}
          className="rounded border border-filigrane bg-blanc-casse px-3 py-1.5 font-medium text-encre hover:bg-papier/60 disabled:opacity-40"
        >
          Sélectionner les {suspects.length} suspects
        </button>
        {selection.size > 0 && (
          <button
            type="button"
            onClick={vider}
            className="rounded px-3 py-1.5 font-medium text-ardoise underline underline-offset-4"
          >
            Tout désélectionner
          </button>
        )}
        <span className="text-ardoise">{selection.size} sélectionné(s)</span>
      </div>

      {message && (
        <p
          className={`mb-3 rounded border px-3 py-2 text-sm ${
            message.ok
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-avertissement/40 bg-avertissement-bg text-avertissement"
          }`}
        >
          {message.texte}
        </p>
      )}

      <div className="overflow-x-auto rounded border border-filigrane bg-blanc-casse">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-filigrane text-left text-xs uppercase tracking-wide text-ardoise">
              <th className="w-10 px-3 py-2"></th>
              <th className="px-3 py-2">Dossier</th>
              <th className="px-3 py-2">Artisan</th>
              <th className="px-3 py-2">Créé</th>
              <th className="px-3 py-2">Pièces</th>
              <th className="px-3 py-2">Signaux</th>
            </tr>
          </thead>
          <tbody>
            {dossiers.map((d) => {
              const coche = selection.has(d.id);
              return (
                <tr
                  key={d.id}
                  onClick={() => basculer(d.id)}
                  className={`cursor-pointer border-b border-filigrane/60 last:border-0 ${
                    coche ? "bg-avertissement-bg/60" : d.suspect ? "bg-papier/40" : ""
                  }`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={coche}
                      onChange={() => basculer(d.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 accent-avertissement"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-medium text-encre">{d.type_travaux}</span>
                    <span className="ml-2 rounded bg-papier px-1.5 py-0.5 text-xs text-ardoise">
                      {d.dispositif}
                    </span>
                    <div className="text-xs text-ardoise">
                      {d.commune ?? "commune ?"} · {d.statut}
                      {d.montant_estime != null && ` · ${d.montant_estime} €`}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {d.artisan ? (
                      <>
                        <div className="text-encre">{d.artisan.entreprise}</div>
                        <div className="text-xs text-ardoise">{d.artisan.email}</div>
                      </>
                    ) : (
                      <span className="text-xs text-ardoise">artisan supprimé</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-ardoise">
                    {formatDate(d.created_at)}
                  </td>
                  <td className="px-3 py-2 text-ardoise">
                    {d.nbPieces}
                    {d.tailleFichiers > 0 && (
                      <span className="text-xs"> · {formatOctets(d.tailleFichiers)}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {d.signaux.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {d.signaux.map((s) => (
                          <span
                            key={s}
                            className="rounded bg-avertissement-bg px-1.5 py-0.5 text-xs text-avertissement"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-ardoise">aucun</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {dossiers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-ardoise">
                  Aucun dossier dans la base.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selection.size > 0 && (
        <div className="sticky bottom-0 mt-4 rounded border-2 border-avertissement bg-blanc-casse p-4 shadow-lg">
          <p className="flex items-center gap-2 text-sm font-medium text-avertissement">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Suppression définitive de {selection.size} dossier(s) et de tous leurs fichiers. Sans
            retour arrière.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="text-sm text-ardoise">
              Tape <span className="font-mono font-semibold text-encre">{MOT_CONFIRMATION}</span>{" "}
              pour confirmer
            </label>
            <input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="rounded border border-filigrane px-3 py-1.5 text-sm"
              placeholder={MOT_CONFIRMATION}
            />
            <button
              type="button"
              onClick={supprimer}
              disabled={!peutSupprimer}
              className="inline-flex items-center gap-2 rounded bg-avertissement px-4 py-2 text-sm font-semibold text-blanc-casse hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Supprimer définitivement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
