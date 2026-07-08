"use client";

import { useState } from "react";

import { creerSessionPaiementDossier } from "@/lib/stripe/actions";

/**
 * Bouton de déblocage : ouvre Stripe Checkout pour le dossier. Redirige vers la
 * page de paiement hébergée (aucune carte ne transite par Dossimo).
 */
export function PaywallCta({
  dossierId,
  prix,
}: {
  dossierId: string;
  prix: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function payer() {
    setBusy(true);
    setError(null);
    try {
      const res = await creerSessionPaiementDossier(dossierId);
      if (res.ok) {
        window.location.href = res.url;
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
        onClick={payer}
        disabled={busy}
        className="inline-flex h-11 items-center rounded bg-terre-cuite px-5 text-sm font-semibold text-blanc-casse transition-colors hover:bg-terre-cuite-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Ouverture du paiement…" : `Débloquer le pack — ${prix}`}
      </button>
      {error && (
        <p className="mt-2 text-xs text-erreur">{error}</p>
      )}
    </div>
  );
}
