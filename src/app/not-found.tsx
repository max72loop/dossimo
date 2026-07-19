import Link from "next/link";
import type { Metadata } from "next";

import { Logo } from "@/components/landing/site-header";
import { BTN_PRINCIPAL, BTN_SECONDAIRE } from "@/components/ui/boutons";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: false },
};

/**
 * 404 global : rendu pour toute URL qui ne correspond à aucune route (§
 * app/not-found). Même charte que le reste du site — papier / encre / terre
 * cuite — pour qu'une erreur d'URL n'ait jamais l'air d'une page cassée.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-papier">
      <header className="border-b-2 border-encre">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center px-5 sm:px-8">
          <Logo />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg text-center">
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Erreur 404
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-4xl">
            Cette page n&rsquo;existe pas
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ardoise">
            Le lien est peut-être erroné ou la page a été déplacée. Revenez à
            l&rsquo;accueil, ou reprenez votre dossier depuis votre espace.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/" className={BTN_PRINCIPAL}>
              Retour à l&rsquo;accueil
            </Link>
            <Link href="/dossiers" className={BTN_SECONDAIRE}>
              Mes dossiers
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
