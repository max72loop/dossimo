"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { poserQuestion } from "@/lib/admin/donnees-actions";
import type { InterrogationResult } from "@/lib/admin/nl-query";

const EXEMPLES = [
  "Combien de dossiers par dispositif ?",
  "Combien de dossiers livrés ?",
  "Montant estimé total des dossiers CEE",
  "Nombre de leads par mois",
];

export function QuestionDonnees() {
  const [question, setQuestion] = useState("");
  const [res, setRes] = useState<InterrogationResult | null>(null);
  const [pending, startTransition] = useTransition();

  function demander(q: string) {
    const texte = q.trim();
    if (!texte) return;
    setQuestion(texte);
    setRes(null);
    startTransition(async () => setRes(await poserQuestion(texte)));
  }

  return (
    <section className="mt-8 rounded border border-filigrane bg-blanc-casse p-5">
      <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-encre">
        <Sparkles className="h-5 w-5 text-tampon" />
        Poser une question
      </h2>
      <p className="mt-1 text-sm text-ardoise">
        En français. L&apos;IA traduit la question en requête lecture seule (elle ne peut rien
        modifier ni supprimer).
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          demander(question);
        }}
        className="mt-3 flex flex-wrap gap-2"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ex : combien de dossiers CEE livrés en juillet ?"
          className="min-w-[16rem] flex-1 rounded border border-filigrane px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending || !question.trim()}
          className="inline-flex items-center gap-2 rounded bg-encre px-4 py-2 text-sm font-semibold text-blanc-casse hover:opacity-90 disabled:opacity-40"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Demander
        </button>
      </form>

      <div className="mt-2 flex flex-wrap gap-2">
        {EXEMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => demander(ex)}
            disabled={pending}
            className="rounded-full border border-filigrane px-3 py-1 text-xs text-ardoise hover:bg-papier/60 disabled:opacity-40"
          >
            {ex}
          </button>
        ))}
      </div>

      {res && (
        <div className="mt-4">
          {res.ok ? (
            <>
              <p className="rounded border border-tampon/30 bg-papier/40 px-3 py-2 text-sm text-encre">
                {res.reponse}
              </p>
              {res.resultat.lignes.length > 0 && (
                <div className="mt-3 overflow-x-auto rounded border border-filigrane">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-filigrane bg-papier/40 text-left text-xs uppercase tracking-wide text-ardoise">
                        {res.resultat.colonnes.map((c) => (
                          <th key={c} className="px-3 py-2">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {res.resultat.lignes.slice(0, 50).map((ligne, i) => (
                        <tr key={i} className="border-b border-filigrane/60 last:border-0">
                          {res.resultat.colonnes.map((c) => (
                            <td key={c} className="px-3 py-2 text-ardoise">
                              {formatCellule(ligne[c])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {res.resultat.tronque && (
                <p className="mt-1 text-xs text-avertissement">
                  Lecture partielle atteinte : le résultat peut être incomplet.
                </p>
              )}
              <details className="mt-2 text-xs text-ardoise">
                <summary className="cursor-pointer">Voir la requête générée</summary>
                <pre className="mt-1 overflow-x-auto rounded bg-papier/40 p-2">
                  {JSON.stringify(res.plan, null, 2)}
                </pre>
              </details>
            </>
          ) : (
            <p className="rounded border border-avertissement/40 bg-avertissement-bg px-3 py-2 text-sm text-avertissement">
              {res.error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function formatCellule(v: unknown): string {
  if (v === null || v === undefined) return "∅";
  if (typeof v === "boolean") return v ? "oui" : "non";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    return new Date(v).toLocaleDateString("fr-FR");
  }
  return String(v);
}
