import Link from "next/link";
import type { Metadata } from "next";

import { DemoGuide } from "@/components/landing/demo-guide";
import { Logo } from "@/components/landing/site-header";
import { publicMetadata } from "@/lib/seo/site";

export const metadata: Metadata = publicMetadata({
  path: "/demo",
  title: "Analyser un devis MaPrimeRénov’ ou CEE gratuitement",
  description: "Ajoutez une photo ou un PDF de votre devis : Dossimo relève les informations lisibles et vous montre le premier point à confirmer.",
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
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tampon">Essai gratuit · sans compte</p>
        <h1 className="mt-3 max-w-2xl font-serif text-4xl font-semibold tracking-tight text-encre sm:text-5xl">Vérifiez votre devis avant de demander l’aide.</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ardoise">Dossimo repère ce qui pourrait bloquer un dossier MaPrimeRénov’ ou CEE. Utilisez votre document, essayez avec l’exemple, ou commencez sans devis.</p>
        <DemoGuide />
        <p className="mt-6 text-xs leading-relaxed text-encre-claire">La lecture assistée sert au préremplissage. Le contrôle réglementaire complet est lancé après votre confirmation.</p>
      </main>
    </div>
  );
}
