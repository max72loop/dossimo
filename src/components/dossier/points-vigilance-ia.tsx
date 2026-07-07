"use client";

import { useState } from "react";

import { genererPointsVigilance } from "@/lib/llm/actions";
import type { PointVigilance, VigilanceResult } from "@/lib/llm/vigilance";

type Etat =
  | { statut: "idle" }
  | { statut: "loading" }
  | { statut: "done"; points: PointVigilance[] }
  | { statut: "non-configure" }
  | { statut: "erreur"; message: string };

const SEVERITE_STYLE: Record<PointVigilance["severite"], string> = {
  important: "border-erreur/30 bg-erreur-bg text-erreur",
  vigilance: "border-avertissement/30 bg-avertissement-bg text-avertissement",
  info: "border-tampon/30 bg-info-bg text-tampon",
};

const SEVERITE_LABEL: Record<PointVigilance["severite"], string> = {
  important: "Important",
  vigilance: "Vigilance",
  info: "Info",
};

export function PointsVigilanceIA({ dossierId }: { dossierId: string }) {
  const [etat, setEtat] = useState<Etat>({ statut: "idle" });

  async function lancer() {
    setEtat({ statut: "loading" });
    let res: VigilanceResult;
    try {
      res = await genererPointsVigilance(dossierId);
    } catch {
      setEtat({ statut: "erreur", message: "Une erreur est survenue. Réessayez." });
      return;
    }
    if (res.ok) setEtat({ statut: "done", points: res.points });
    else if (res.reason === "non-configure") setEtat({ statut: "non-configure" });
    else setEtat({ statut: "erreur", message: res.message ?? "Analyse indisponible." });
  }

  return (
    <section className="mt-6 rounded border border-filigrane bg-blanc-casse p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg font-semibold text-encre">
            Points de vigilance — analyse assistée
          </h2>
          <p className="mt-1 text-xs text-ardoise">
            Complète le contrôle automatique par des points contextuels rédigés.
            Conseil de préparation, non affilié à l&apos;Anah.
          </p>
        </div>
        <button
          onClick={lancer}
          disabled={etat.statut === "loading"}
          className="inline-flex h-10 shrink-0 items-center rounded bg-terre-cuite px-4 text-sm font-medium text-blanc-casse transition-colors hover:bg-terre-cuite-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {etat.statut === "loading"
            ? "Analyse…"
            : etat.statut === "done"
              ? "Relancer l'analyse"
              : "Générer les points"}
        </button>
      </div>

      {etat.statut === "loading" && (
        <p className="mt-4 text-sm text-ardoise">Analyse du dossier en cours…</p>
      )}

      {etat.statut === "non-configure" && (
        <p className="mt-4 rounded border border-filigrane bg-papier-fonce px-4 py-3 text-sm text-ardoise">
          L&apos;analyse assistée n&apos;est pas activée (clé OpenRouter absente).
          Le contrôle déterministe reste, lui, pleinement opérationnel.
        </p>
      )}

      {etat.statut === "erreur" && (
        <p className="mt-4 rounded border-l-4 border-erreur bg-erreur-bg px-4 py-3 text-sm text-erreur">
          {etat.message}
        </p>
      )}

      {etat.statut === "done" && (
        <>
          {etat.points.length === 0 ? (
            <p className="mt-4 text-sm text-ardoise">
              Aucun point de vigilance supplémentaire identifié.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {etat.points.map((p, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className={`mt-0.5 h-fit shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${SEVERITE_STYLE[p.severite]}`}
                  >
                    {SEVERITE_LABEL[p.severite]}
                  </span>
                  <span>
                    <span className="text-sm font-medium text-encre">
                      {p.titre}
                      {p.poste ? (
                        <span className="ml-2 text-xs font-normal text-encre-claire">
                          {p.poste}
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-xs leading-relaxed text-ardoise">
                      {p.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-[11px] text-encre-claire">
            Généré automatiquement — à relire. Ne remplace pas le contrôle de
            conformité ni la décision de l&apos;instructeur.
          </p>
        </>
      )}
    </section>
  );
}
