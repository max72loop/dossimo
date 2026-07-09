"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { updateMontantPrime } from "@/lib/dossier/actions";

const euro = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

/**
 * Écart entre le montant de prime saisi et l'estimation Dossimo (barème). Au
 * lieu d'une simple alerte « vérifiez la saisie ou le barème », propose deux
 * actions directes : ajuster le montant en un geste (avec un raccourci vers la
 * valeur du barème) et voir le détail du barème appliqué pour trancher.
 */
export function EcartPrime({
  dossierId,
  saisi,
  estimation,
  base,
  precariteLabel,
}: {
  dossierId: string;
  saisi: number;
  estimation: number;
  base: string;
  precariteLabel: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [showBareme, setShowBareme] = useState(false);
  const [value, setValue] = useState(String(saisi));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ecart = saisi - estimation;
  const sens = ecart > 0 ? "au-dessus" : "en dessous";

  async function save(montant: number) {
    setSaving(true);
    setError(null);
    const res = await updateMontantPrime(dossierId, montant);
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "Enregistrement impossible.");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  function submitFromInput() {
    const n = Number(value.replace(",", ".").replace(/\s/g, ""));
    if (!Number.isFinite(n) || n < 0) {
      setError("Entrez un montant valide.");
      return;
    }
    void save(Math.round(n));
  }

  return (
    <div className="mt-3 rounded border border-avertissement-bg bg-avertissement-bg/40 p-3">
      <p className="text-xs text-encre">
        Montant saisi :{" "}
        <span className="font-medium">{euro(saisi)}</span>, soit{" "}
        <span className="font-medium">{euro(Math.abs(ecart))}</span> {sens} de
        l&apos;estimation Dossimo. Alignez la saisie si c&apos;est une erreur de
        frappe, sinon vérifiez le barème.
      </p>

      {!editing ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setValue(String(saisi));
              setError(null);
              setEditing(true);
            }}
            className="rounded bg-encre px-2.5 py-1 text-xs font-medium text-blanc-casse transition hover:bg-encre/90"
          >
            Ajuster le montant
          </button>
          <button
            type="button"
            onClick={() => setShowBareme((v) => !v)}
            className="rounded border border-filigrane px-2.5 py-1 text-xs font-medium text-encre transition hover:bg-blanc-casse"
          >
            {showBareme ? "Masquer le barème" : "Voir le barème appliqué"}
          </button>
        </div>
      ) : (
        <div className="mt-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="number"
                step="1"
                min="0"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitFromInput();
                  }
                }}
                autoFocus
                className="w-32 rounded border border-filigrane bg-blanc-casse px-2 py-1 pr-6 text-sm text-encre focus:border-encre focus:outline-none"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ardoise">
                €
              </span>
            </div>
            <button
              type="button"
              onClick={submitFromInput}
              disabled={saving}
              className="rounded bg-encre px-2.5 py-1 text-xs font-medium text-blanc-casse transition hover:bg-encre/90 disabled:opacity-60"
            >
              {saving ? "…" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              disabled={saving}
              className="text-xs text-ardoise underline-offset-2 hover:underline"
            >
              Annuler
            </button>
          </div>
          <button
            type="button"
            onClick={() => setValue(String(estimation))}
            className="mt-2 text-xs text-tampon underline-offset-2 hover:underline"
          >
            = estimation Dossimo ({euro(estimation)})
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-erreur">{error}</p>}

      {showBareme && (
        <p className="mt-2 border-t border-avertissement-bg pt-2 text-xs text-ardoise">
          <span className="font-medium text-encre">{euro(estimation)}</span> ={" "}
          {base}. Profil de revenus retenu : {precariteLabel}. Barème piloté par
          la règle métier (éditable dans l&apos;admin).
        </p>
      )}
    </div>
  );
}
