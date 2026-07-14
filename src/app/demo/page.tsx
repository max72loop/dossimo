import Link from "next/link";
import type { Metadata } from "next";

import { DemoGuide } from "@/components/landing/demo-guide";
import { Logo } from "@/components/landing/site-header";
import { publicMetadata } from "@/lib/seo/site";

export const metadata: Metadata = publicMetadata({
  path: "/demo",
  title: "Analyser un devis MaPrimeRénov’ ou CEE gratuitement",
  description: "Envoyez une photo ou un PDF de votre devis : Dossimo recopie les informations à votre place et vous montre le premier point à confirmer. Deux minutes suffisent.",
});

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-papier">
      <header className="border-b border-filigrane bg-blanc-casse">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-8">
          <Logo />
          <Link href="/" className="text-sm font-medium text-tampon underline underline-offset-4">Retour à l'accueil</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tampon">Essai gratuit · sans compte · deux minutes</p>
        <h1 className="mt-3 max-w-2xl font-serif text-4xl font-semibold tracking-tight text-encre sm:text-5xl">Envoyez votre devis. Dossimo fait la paperasse.</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ardoise">Photo ou PDF : Dossimo recopie le client, les montants et les données techniques à votre place, puis vous montre le premier point à confirmer. Utilisez votre document, essayez avec l’exemple, ou commencez sans devis.</p>
        <DemoGuide />
        <p className="mt-6 text-xs leading-relaxed text-encre-claire">La lecture assistée sert au préremplissage. Le contrôle réglementaire complet est lancé après votre confirmation.</p>
      </main>
    </div>
  );
}
