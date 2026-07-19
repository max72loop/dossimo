"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { appliquerCreditsAuDossier } from "@/lib/dossier/credits-actions";

/**
 * Bouton « utiliser mes crédits » : applique le solde de crédits parrain sur le
 * dossier avant paiement, puis rafraîchit la page pour que le prix affiché (et
 * le montant du checkout) reflètent le net réduit.
 */
export function CreditsCta({
  dossierId,
  soldeLabel,
}: {
  dossierId: string;
  /** Solde de crédits disponible, formaté (ex. "50 €"). */
  soldeLabel: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function appliquer() {
    setBusy(true);
    setError(null);
    try {
      const res = await appliquerCreditsAuDossier(dossierId);
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error);
        setBusy(false);
      }
    } catch {
      setError("Une erreur est survenue. Réessayez.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={appliquer}
        disabled={busy}
        className="inline-flex h-11 items-center rounded border border-accent px-5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-blanc-casse disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Application…" : `Utiliser mes crédits · solde ${soldeLabel}`}
      </button>
      {error && <p className="mt-1.5 text-xs text-erreur">{error}</p>}
    </div>
  );
}
