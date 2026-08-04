import Link from "next/link";
import type { Metadata } from "next";
import { FolderSearch } from "lucide-react";

import { Logo } from "@/components/ui/logo";
import { BTN_PRINCIPAL, BTN_SECONDAIRE } from "@/components/ui/boutons";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: false },
};

/**
 * 404 global : rendu pour toute URL qui ne correspond à aucune route (§
 * app/not-found). Même charte que le reste du site — papier / encre / bleu de
 * marque — pour qu'une erreur d'URL n'ait jamais l'air d'une page cassée.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-papier">
      <header className="border-b-2 border-encre">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center px-5 sm:px-8">
          <Logo />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 sm:py-16">
        <section className="grid w-full max-w-4xl overflow-hidden rounded-2xl bg-blanc-casse shadow-lg md:grid-cols-2">
          <div className="relative flex min-h-64 items-center justify-center overflow-hidden bg-encre p-8 sm:min-h-72">
            <p
              aria-hidden="true"
              className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-display text-8xl font-bold tracking-tight text-blanc-casse/5 sm:text-9xl"
            >
              404
            </p>

            <div className="relative flex flex-col items-center">
              <div className="flex h-28 w-28 rotate-3 items-center justify-center rounded-2xl border border-blanc-casse/15 bg-blanc-casse/10 shadow-md">
                <FolderSearch
                  aria-hidden="true"
                  className="h-14 w-14 -rotate-3 text-accent-clair"
                  strokeWidth={1.5}
                />
              </div>
              <p className="mt-6 rounded-full border border-accent-clair/50 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-accent-clair">
                Page introuvable
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">
              Erreur 404
            </p>
            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-4xl">
              Cette page est introuvable
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ardoise sm:text-base">
              L&rsquo;adresse est peut-être incorrecte, ou la page a été déplacée.
              Vous pouvez revenir à l&rsquo;accueil ou retrouver vos dossiers dans
              votre espace.
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link href="/" className={BTN_PRINCIPAL}>
                Retour à l&rsquo;accueil
              </Link>
              <Link href="/dossiers" className={BTN_SECONDAIRE}>
                Mes dossiers
              </Link>
            </div>
          </div>
        </section>
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
