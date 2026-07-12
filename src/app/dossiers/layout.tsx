import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Plus } from "lucide-react";

import { Logo } from "@/components/landing/site-header";
import { getCurrentArtisan } from "@/lib/auth/get-artisan";
import { signOut } from "@/lib/auth/actions";

export default async function DossiersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const artisan = await getCurrentArtisan();
  if (!artisan) redirect("/connexion");

  return (
    <div className="flex min-h-screen flex-col bg-papier">
      <header className="sticky top-0 z-40 border-b border-filigrane bg-papier/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-8">
          <Logo />
          <div className="flex items-center gap-5">
            <Link
              href="/dossiers/nouveau"
              className="inline-flex h-10 items-center gap-1.5 rounded bg-terre-cuite px-4 text-sm font-medium text-blanc-casse transition-colors hover:bg-terre-cuite-hover"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nouveau dossier
            </Link>
            <Link
              href="/dossiers/factures"
              className="hidden text-sm text-ardoise transition-colors hover:text-encre sm:inline"
            >
              Factures
            </Link>
            <span className="hidden text-sm text-ardoise sm:inline">
              {artisan.entreprise}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-sm text-ardoise transition-colors hover:text-encre"
                title="Se déconnecter"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
