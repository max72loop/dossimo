"use client"; // Les error boundaries doivent être des Client Components.

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

import { BTN_PRINCIPAL, BTN_SECONDAIRE } from "@/components/ui/boutons";
import { CARTE } from "@/components/ui/cartes";

/**
 * Filet d'erreur DE L'ESPACE ARTISAN. Rendu à l'intérieur de `dossiers/layout`,
 * donc DANS `EspaceArtisanShell` : l'artisan garde son en-tête et sa navigation
 * pendant l'incident, au lieu d'être éjecté sur l'écran d'erreur global. C'est ici
 * que se concentrent les appels Supabase, donc le plus de risques d'exception.
 *
 * Next 16 : la récupération passe par `unstable_retry` (ex-`reset`).
 */
export default function DossiersError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[dossiers] erreur non gérée:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-8 py-16">
      <div className={`${CARTE} text-center`}>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          Une erreur est survenue
        </p>
        <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-encre">
          Cet écran n&rsquo;a pas pu s&rsquo;afficher
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ardoise">
          Le problème vient de chez nous, pas de votre dossier : il est enregistré
          et intact. Réessayez, ou revenez à la liste de vos dossiers.
        </p>

        {error.digest && (
          <p className="mt-4 font-mono text-xs text-encre-claire">
            Référence : {error.digest}
          </p>
        )}

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className={`${BTN_PRINCIPAL} gap-1.5`}
          >
            <RotateCcw className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            Réessayer
          </button>
          <Link href="/dossiers" className={BTN_SECONDAIRE}>
            Mes dossiers
          </Link>
        </div>
      </div>
    </div>
  );
}