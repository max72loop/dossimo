"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { enregistrerAssistance } from "@/lib/mesure/assistance-actions";

/**
 * Saisie du temps humain passé sur un dossier.
 *
 * Le seul chiffre du tableau de bord que rien n'automatise, et le plus lourd :
 * quelques centimes de LLM contre une demi-heure au téléphone, ce n'est pas le
 * LLM qui décide de la marge. Tant que ce champ reste vide, la colonne
 * « assistance » affiche zéro et le coût d'un dossier est sous-estimé.
 */
export function SaisieAssistance({ dossiers }: { dossiers: { id: string; libelle: string }[] }) {
  const router = useRouter();
  const [dossierId, setDossierId] = useState("");
  const [minutes, setMinutes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState(false);
  const [pending, startTransition] = useTransition();

  function enregistrer() {
    setMessage(null);
    startTransition(async () => {
      const res = await enregistrerAssistance({ dossierId, minutes: Number(minutes) });
      setErreur(!res.ok);
      setMessage(res.ok ? "Temps enregistré." : res.error ?? "Erreur.");
      if (res.ok) {
        setMinutes("");
        router.refresh();
      }
    });
  }

  const champ = "rounded border border-filigrane bg-blanc-casse px-3 py-2 text-sm text-encre";

  return (
    <section className="mt-6 rounded-2xl bg-blanc-casse p-5 shadow-lg">
      <h2 className="font-serif text-lg font-semibold text-encre">Temps passé sur un dossier</h2>
      <p className="mt-1 text-sm text-ardoise">
        À saisir après chaque appel ou aller-retour. C&apos;est le poste de coût que rien ne mesure
        tout seul, et de loin le plus lourd.
      </p>

      {dossiers.length === 0 ? (
        <p className="mt-3 text-sm text-ardoise">Aucun dossier à renseigner pour l&apos;instant.</p>
      ) : (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-xs text-ardoise">Dossier</span>
            <select
              className={`mt-1 ${champ}`}
              value={dossierId}
              onChange={(e) => setDossierId(e.target.value)}
            >
              <option value="">Choisir…</option>
              {dossiers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.libelle}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-xs text-ardoise">Minutes</span>
            <input
              type="number"
              min={1}
              max={480}
              inputMode="numeric"
              className={`mt-1 w-24 tabular-nums ${champ}`}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={enregistrer}
            disabled={pending || !dossierId || !minutes}
            className="rounded bg-accent px-4 py-2 text-sm font-medium text-blanc-casse transition hover:bg-accent-hover disabled:opacity-60"
          >
            {pending ? "Enregistrement…" : "Ajouter"}
          </button>
        </div>
      )}

      {message && (
        <p
          className={`mt-3 text-sm ${erreur ? "text-erreur" : "text-succes"}`}
          role={erreur ? "alert" : "status"}
        >
          {message}
        </p>
      )}
    </section>
  );
}
