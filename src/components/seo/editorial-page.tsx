import Link from "next/link";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export function EditorialPage({
  eyebrow,
  title,
  intro,
  breadcrumb,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  breadcrumb: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-papier">
      <a href="#contenu" className="skip-link">Aller au contenu principal</a>
      <SiteHeader />
      <main id="contenu" className="flex-1">
        <header className="border-b border-filigrane bg-blanc-casse">
          <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
            <nav aria-label="Fil d’Ariane" className="text-sm text-ardoise">
              <Link href="/" className="underline underline-offset-4 hover:text-encre">Accueil</Link>
              <span aria-hidden="true"> / </span>
              <span>{breadcrumb}</span>
            </nav>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-tampon">
              {eyebrow}
            </p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-encre sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-ardoise">
              {intro}
            </p>
          </div>
        </header>
        <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
