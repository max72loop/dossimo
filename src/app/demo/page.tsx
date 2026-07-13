import Link from "next/link";

import { DemoGuide } from "@/components/landing/demo-guide";
import { Logo } from "@/components/landing/site-header";

export const metadata = { title: "Démonstration sans compte · Dossimo" };

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-papier">
      <header className="border-b border-filigrane bg-blanc-casse">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-8">
          <Logo />
          <Link href="/" className="text-sm font-medium text-tampon underline underline-offset-4">Retour à l’accueil</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tampon">Démonstration sans compte</p>
        <h1 className="mt-3 max-w-2xl font-serif text-4xl font-semibold tracking-tight text-encre sm:text-5xl">Voyez le résultat avant de nous confier votre devis</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ardoise">Ce document fictif montre exactement comment Dossimo préremplit un dossier et transforme une erreur réglementaire en action concrète.</p>
        <DemoGuide />
        <p className="mt-6 text-xs leading-relaxed text-encre-claire">Cette démonstration utilise des données fictives. Le contrôle réel dépend des informations et documents de votre chantier.</p>
      </main>
    </div>
  );
}
