"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { BTN_SECONDAIRE_SM } from "@/components/ui/boutons";
import { formatEuros } from "@/lib/format/montant";
import { updateMontantPrime } from "@/lib/dossier/actions";

/**
 * Note secondaire sous le montant retenu : le barème Dossimo n'arrive pas au
 * même chiffre que la saisie. Ce n'est ni une alerte ni un motif de refus, donc
 * ton neutre et actions directes — aligner la saisie en un geste, ou consulter
 * le barème appliqué pour trancher. Le montant retenu reste celui de la saisie.
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
  const sens = ecart > 0 ? "en dessous du montant retenu" : "au-dessus du montant retenu";

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
    <div className="mt-4 rounded border border-filigrane bg-papier/60 p-3">
      <p className="text-xs text-ardoise">
        Le barème Dossimo estime cette prime à{" "}
        <span className="font-medium text-encre">{formatEuros(estimation)}</span>, soit{" "}
        <span className="font-medium text-encre">{formatEuros(Math.abs(ecart))}</span>{" "}
        {sens}. Alignez la saisie si c&apos;est une erreur de frappe, sinon conservez
        votre montant : c&apos;est lui qui est repris dans le pack.
      </p>

      {!editing ? (
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setValue(String(saisi));
              setError(null);
              setEditing(true);
            }}
            className={BTN_SECONDAIRE_SM}
          >
            Ajuster le montant
          </button>
          <button
            type="button"
            onClick={() => setShowBareme((v) => !v)}
            aria-expanded={showBareme}
            className={BTN_SECONDAIRE_SM}
          >
            {showBareme ? "Masquer le barème" : "Voir le barème appliqué"}
          </button>
        </div>
      ) : (
        <div className="mt-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <label htmlFor="montant-prime" className="sr-only">
                Montant de prime retenu, en euros
              </label>
              <input
                id="montant-prime"
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
                className="h-9 w-32 rounded border border-filigrane bg-blanc-casse px-2 pr-6 text-sm text-encre focus:border-encre focus:outline-none"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ardoise">
                €
              </span>
            </div>
            <button
              type="button"
              onClick={submitFromInput}
              disabled={saving}
              className={BTN_SECONDAIRE_SM}
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
              className="text-xs text-ardoise underline-offset-2 hover:underline disabled:opacity-60"
            >
              Annuler
            </button>
          </div>
          <button
            type="button"
            onClick={() => setValue(String(estimation))}
            className="mt-2 text-xs text-tampon underline-offset-2 hover:underline"
          >
            Reprendre l&apos;estimation Dossimo ({formatEuros(estimation)})
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-erreur">{error}</p>}

      {showBareme && (
        <p className="mt-2.5 border-t border-filigrane pt-2.5 text-xs text-ardoise">
          <span className="font-medium text-encre">{formatEuros(estimation)}</span> ={" "}
          {base}. Profil de revenus retenu : {precariteLabel}. Barème de référence
          tenu à jour par Dossimo.
        </p>
      )}
    </div>
  );
}
