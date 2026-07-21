"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

import { ouvrirPaiementDossier, type PaiementFormState } from "@/lib/stripe/actions";
import { updateAdresseFacturation } from "@/lib/artisan/facturation-actions";
import { editeur } from "@/lib/legal/editeur";
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
        className="mt-3 inline-flex h-10 items-center gap-2 rounded bg-accent px-4 text-sm font-semibold text-blanc-casse transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
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
  reference,
}: {
  dossierId: string;
  /**
   * Référence lisible du dossier (ex. « DOS-2026-0148 »), reprise dans l'e-mail
   * de demande de déblocage manuel. À défaut, on retombe sur l'identifiant.
   */
  reference?: string;
  /**
   * Prix à annoncer, déjà formaté (`prixPack().label`). `null` quand la grille
   * ne permet pas de le déterminer : le bouton tait alors le montant au lieu
   * d'en afficher un faux. Voir la doc de `prixPack` : annoncer un tarif faux
   * est pire que ne pas l'annoncer, et l'artisan découvrira le vrai prix à
   * l'écran de paiement.
   */
  prix: string | null;
  /** Variante réduite pour la liste des dossiers. */
  compact?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const initialState: PaiementFormState = { error: null, code: null };
  const [state, action, busy] = useActionState(
    ouvrirPaiementDossier.bind(null, dossierId),
    initialState,
  );

  const cls = compact
    ? "inline-flex h-8 items-center gap-1.5 rounded bg-accent px-3 text-xs font-semibold text-blanc-casse transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
    : "inline-flex h-11 items-center gap-2 rounded bg-accent px-5 text-sm font-semibold text-blanc-casse transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div>
      <form ref={formRef} action={action}>
        <button type="submit" disabled={busy} className={cls}>
          {busy && <Spinner className={compact ? "h-3 w-3" : "h-4 w-4"} />}
          {busy
            ? "Ouverture…"
            : compact
              ? prix
                ? `Débloquer · ${prix}`
                : "Débloquer"
              : prix
                ? `Débloquer le pack · ${prix}`
                : "Débloquer le pack"}
        </button>
        <p
          className={
            compact
              ? "mt-1 text-[0.65rem] text-encre-claire"
              : "mt-2 text-xs text-encre-claire"
          }
        >
          Jusqu’au 31 juillet : saisissez <strong>DOSSIMO50</strong> dans Stripe pour obtenir 50 % sur votre premier dossier.{" "}
          En poursuivant, vous acceptez les{" "}
          <Link
            href="/cgv"
            target="_blank"
            className="underline underline-offset-2 hover:text-encre"
          >
            CGV
          </Link>
          .
        </p>
      </form>

      {state.code === "adresse_manquante" && (
        <AdresseFacturation
          onEnregistre={() => {
            formRef.current?.requestSubmit();
          }}
        />
      )}

      {/* Aide non estimable (profil sans barème, ou surface non renseignée à la
          création) : plutôt qu'un cul-de-sac technique, on explique et on ouvre
          une voie de déblocage manuel. Aucun prix n'est inventé (AGENTS.md). En
          liste (compact), un simple renvoi vers le dossier suffit. */}
      {state.code === "aide_non_estimable" &&
        (compact ? (
          <p className="mt-1 text-[0.65rem] leading-snug text-ardoise">
            Prix non calculable. Ouvrez le dossier pour demander le déblocage.
          </p>
        ) : (
          <DeblocageManuel message={state.error} reference={reference ?? dossierId} />
        ))}

      {state.error &&
        state.code !== "adresse_manquante" &&
        state.code !== "aide_non_estimable" && (
          <p className="mt-1.5 text-xs text-erreur">{state.error}</p>
        )}
    </div>
  );
}

/**
 * Voie de sortie quand l'aide n'est pas estimable : on dit pourquoi, et on
 * propose un déblocage manuel par e-mail (la messagerie s'ouvre pré-remplie,
 * rien n'est envoyé sans action — même principe que le panneau « Je suis
 * bloqué »). C'est la traduction de « une erreur se dit et propose une reprise »
 * (DESIGN.md §5).
 */
function DeblocageManuel({
  message,
  reference,
}: {
  message: string;
  reference: string;
}) {
  const sujet = `Déblocage manuel du dossier ${reference}`;
  const corps = `Bonjour,\n\nMerci de débloquer manuellement le dossier ${reference} : l'aide n'a pas pu être estimée automatiquement.\n\n`;
  const mailto = `mailto:${editeur.emailContact}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;

  return (
    <div className="mt-3 max-w-md rounded border border-filigrane bg-papier/50 p-4">
      <p className="text-sm font-medium text-encre">Déblocage à faire à la main</p>
      <p className="mt-1 text-xs leading-relaxed text-ardoise">
        {message} Rien n&rsquo;est perdu : écrivez-nous et on débloque ce dossier
        manuellement, en général sous 24&nbsp;h ouvrées.
      </p>
      <a
        href={mailto}
        className="mt-3 inline-flex h-10 items-center gap-2 rounded bg-accent px-4 text-sm font-semibold text-blanc-casse transition-colors hover:bg-accent-hover"
      >
        <Mail className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
        Demander le déblocage
      </a>
    </div>
  );
}
