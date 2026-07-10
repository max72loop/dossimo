"use client";

import { useState } from "react";

import { creerSessionPaiementDossier } from "@/lib/stripe/actions";
import { updateAdresseFacturation } from "@/lib/artisan/facturation-actions";
import { Spinner } from "@/components/ui/spinner";

const CHAMP =
  "h-10 w-full rounded border border-filigrane bg-blanc-casse px-3 text-sm text-encre placeholder:text-encre-claire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-encre";

/**
 * Adresse de facturation, réclamée une seule fois, au moment où elle devient
 * nécessaire : juste avant le premier encaissement. La demander à l'inscription
 * ferait payer sa saisie à des artisans qui n'achèteront jamais.
 */
function AdresseFacturation({ onEnregistre }: { onEnregistre: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await updateAdresseFacturation({
      adresse: String(fd.get("adresse") ?? ""),
      code_postal: String(fd.get("code_postal") ?? ""),
      ville: String(fd.get("ville") ?? ""),
    });
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    onEnregistre();
  }

  return (
    <form
      onSubmit={submit}
      className="mt-3 max-w-md rounded border border-filigrane bg-blanc-casse p-4"
    >
      <p className="text-sm font-medium text-encre">Adresse de facturation</p>
      <p className="mt-1 text-xs text-ardoise">
        Obligatoire sur la facture. Enregistrée une fois, réutilisée ensuite.
      </p>

      <div className="mt-3 space-y-2">
        <input name="adresse" required placeholder="Adresse" className={CHAMP} autoComplete="street-address" />
        <div className="flex gap-2">
          <input
            name="code_postal"
            required
            inputMode="numeric"
            placeholder="Code postal"
            autoComplete="postal-code"
            className={`${CHAMP} w-32`}
          />
          <input name="ville" required placeholder="Ville" autoComplete="address-level2" className={CHAMP} />
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-erreur">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="mt-3 inline-flex h-10 items-center gap-2 rounded bg-terre-cuite px-4 text-sm font-semibold text-blanc-casse transition-colors hover:bg-terre-cuite-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy && <Spinner />}
        {busy ? "Enregistrement…" : "Enregistrer et continuer"}
      </button>
    </form>
  );
}

/**
 * Bouton de déblocage : ouvre Stripe Checkout pour le dossier. Redirige vers la
 * page de paiement hébergée (aucune carte ne transite par Dossimo).
 *
 * Si l'adresse de facturation manque, le serveur refuse d'ouvrir le paiement
 * (`code: "adresse_manquante"`) et on la réclame sur place, sans quitter la
 * page ni perdre l'intention d'achat.
 */
export function PaywallCta({
  dossierId,
  prix,
  compact = false,
}: {
  dossierId: string;
  prix: string;
  /** Variante réduite pour la liste des dossiers. */
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adresseRequise, setAdresseRequise] = useState(false);

  async function payer() {
    setBusy(true);
    setError(null);
    try {
      const res = await creerSessionPaiementDossier(dossierId);
      if (res.ok) {
        // Pas de setBusy(false) : la redirection est en cours, le bouton doit
        // rester inerte jusqu'au départ de la page.
        window.location.href = res.url;
        return;
      }
      if (res.code === "adresse_manquante") {
        setAdresseRequise(true);
      } else {
        setError(res.error);
      }
      setBusy(false);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
      setBusy(false);
    }
  }

  const cls = compact
    ? "inline-flex h-8 items-center gap-1.5 rounded bg-terre-cuite px-3 text-xs font-semibold text-blanc-casse transition-colors hover:bg-terre-cuite-hover disabled:cursor-not-allowed disabled:opacity-60"
    : "inline-flex h-11 items-center gap-2 rounded bg-terre-cuite px-5 text-sm font-semibold text-blanc-casse transition-colors hover:bg-terre-cuite-hover disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div>
      <button onClick={payer} disabled={busy} className={cls}>
        {busy && <Spinner className={compact ? "h-3 w-3" : "h-4 w-4"} />}
        {busy
          ? "Ouverture…"
          : compact
            ? `Débloquer · ${prix}`
            : `Débloquer le pack · ${prix}`}
      </button>

      {adresseRequise && (
        <AdresseFacturation
          onEnregistre={() => {
            setAdresseRequise(false);
            void payer(); // Reprend l'achat là où il s'était arrêté.
          }}
        />
      )}

      {error && <p className="mt-1.5 text-xs text-erreur">{error}</p>}
    </div>
  );
}
