"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { changerStatutDossier } from "@/lib/dossier/parcours-actions";
import { PARCOURS, indexEtape } from "@/lib/dossier/parcours";
import { CARTE } from "@/components/ui/cartes";
import type { StatutDossier } from "@/lib/database.types";

/**
 * Barre d'étapes du parcours : chaque étape est cliquable pour passer le dossier
 * dans cet état. L'étape courante et les précédentes sont marquées « faites ».
 */
export function ParcoursSelector({
  dossierId,
  statut,
}: {
  dossierId: string;
  statut: StatutDossier;
}) {
  const router = useRouter();
  const [courant, setCourant] = useState<StatutDossier>(statut);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const idxCourant = indexEtape(courant);

  function choisir(cible: StatutDossier) {
    if (cible === courant || pending) return;
    const avant = courant;
    setCourant(cible);
    setError(null);
    startTransition(async () => {
      const res = await changerStatutDossier(dossierId, cible);
      if (res.ok) {
        router.refresh();
      } else {
        setCourant(avant);
        setError(res.error);
      }
    });
  }

  return (
    <section className={`mb-6 ${CARTE}`}>
      <h2 className="font-serif text-base font-semibold text-encre">Parcours du dossier</h2>
      <p className="mt-1 text-xs text-ardoise">
        Suivez où en est le dossier. Cliquez une étape pour l&apos;y placer.
      </p>

      <ol className="mt-4 flex flex-wrap items-center gap-1.5">
        {PARCOURS.map((etape, i) => {
          const fait = i <= idxCourant;
          const actif = etape.statut === courant;
          return (
            <li key={etape.statut} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => choisir(etape.statut)}
                disabled={pending}
                aria-current={actif ? "step" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                  actif
                    ? "bg-encre text-papier"
                    : fait
                      ? "bg-papier-fonce text-encre hover:bg-filigrane"
                      : "border border-filigrane bg-blanc-casse text-ardoise hover:bg-papier"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${fait ? (actif ? "bg-papier" : "bg-succes") : "bg-encre-claire"}`}
                />
                {etape.label}
              </button>
              {i < PARCOURS.length - 1 && (
                <span className="text-encre-claire" aria-hidden>
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {error && <p className="mt-3 text-xs text-erreur">{error}</p>}
    </section>
  );
}
