import Link from "next/link";
import { LogOut, Plus } from "lucide-react";

import { Logo } from "@/components/landing/site-header";
import { AideDossimo } from "@/components/dossier/aide-dossimo";
import { signOut } from "@/lib/auth/actions";
import type { Artisan } from "@/lib/database.types";

export function EspaceArtisanShell({
  artisan,
  children,
}: {
  artisan: Artisan;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-papier">
      <header className="sticky top-0 z-40 border-b border-filigrane bg-papier/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 sm:px-8">
          <Logo />
          <nav className="flex items-center gap-3 sm:gap-5" aria-label="Espace artisan">
            <Link
              href="/dossiers/nouveau"
              className="inline-flex h-10 items-center gap-1.5 rounded bg-terre-cuite px-3 text-sm font-medium text-blanc-casse transition-colors hover:bg-terre-cuite-hover sm:px-4"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">Nouveau dossier</span>
              <span className="sm:hidden">Nouveau</span>
            </Link>
            <Link href="/dossiers" className="hidden text-sm text-ardoise transition-colors hover:text-encre md:inline">
              Dossiers
            </Link>
            <Link href="/dossiers/factures" className="hidden text-sm text-ardoise transition-colors hover:text-encre md:inline">
              Factures
            </Link>
            <Link href="/devis" className="hidden text-sm text-ardoise transition-colors hover:text-encre md:inline">
              Devis
            </Link>
            <Link
              href="/dossiers/profil"
              className="hidden rounded px-2 py-1 text-sm font-medium text-ardoise transition-colors hover:bg-papier-fonce hover:text-encre sm:inline"
              title="Voir le profil de l’entreprise"
            >
              {artisan.entreprise}
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-sm text-ardoise transition-colors hover:text-encre"
                title="Se déconnecter"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
                <span className="hidden lg:inline">Déconnexion</span>
              </button>
            </form>
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>
      <AideDossimo />
    </div>
  );
}
