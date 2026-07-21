"use client"; // Les error boundaries doivent être des Client Components.

import { useEffect } from "react";
import Link from "next/link";

import { Logo } from "@/components/ui/logo";
import { BTN_PRINCIPAL, BTN_SECONDAIRE } from "@/components/ui/boutons";

/**
 * Filet d'erreur de l'application (rendu DANS le layout racine : polices, tokens
 * et charte s'appliquent). Il attrape toute exception non gérée d'un segment et
 * remplace l'écran par défaut de Next — hors marque, sans issue — par une page
 * qui dit ce qui s'est passé et propose une reprise (DESIGN.md §5 : « une erreur
 * se dit et propose une reprise »).
 *
 * Next 16 : la fonction de récupération est `unstable_retry` (et non l'ancien
 * `reset`). Elle re-rend le segment fautif sans recharger toute la page.
 */
export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Journalisé côté client faute de service d'erreurs branché : au moins la
    // trace n'est pas avalée en silence (AGENTS.md).
    console.error("[app] erreur non gérée:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-papier">
      <header className="border-b border-filigrane">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center px-5 sm:px-8">
          <Logo />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg text-center">
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Une erreur est survenue
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-4xl">
            Quelque chose n&rsquo;a pas fonctionné
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ardoise">
            Le problème vient de chez nous, pas de vous. Rien n&rsquo;est perdu :
            votre dossier est enregistré. Réessayez, et si l&rsquo;écran revient,
            écrivez-nous, on regarde tout de suite.
          </p>

          {error.digest && (
            <p className="mt-4 font-mono text-xs text-encre-claire">
              Référence : {error.digest}
            </p>
          )}

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button type="button" onClick={() => unstable_retry()} className={BTN_PRINCIPAL}>
              Réessayer
            </button>
            <Link href="/dossiers" className={BTN_SECONDAIRE}>
              Retour à mes dossiers
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-filigrane">
        <div className="mx-auto max-w-[1280px] px-5 py-6 sm:px-8">
          <p className="text-center text-xs text-encre-claire">
            Dossimo &middot; service indépendant d&rsquo;aide à la préparation de
            dossier, non affilié à l&rsquo;Anah ni à France Rénov&rsquo;.
          </p>
        </div>
      </footer>
    </div>
  );
}