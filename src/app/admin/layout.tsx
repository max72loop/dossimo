import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { getAdminEmail } from "@/lib/auth/is-admin";
import { NavAdmin } from "@/components/admin/nav-admin";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Garde du segment `/admin` : tout ce qui vit ici est réservé au rôle admin.
 *
 * Le contrôle est refait par chaque page et chaque Server Action, car un layout
 * ne protège pas une action (elle s'exécute hors de l'arbre de rendu). Cette
 * garde existe pour qu'une future page admin ajoutée sans son propre appel à
 * `getAdminEmail` ne soit pas exposée par oubli.
 *
 * `notFound()` plutôt qu'un 403 : l'existence même de la console d'édition des
 * règles n'a pas à être révélée à un artisan.
 *
 * Le bandeau sous la barre ne porte plus l'avertissement « modifie la
 * production » : affiché sur toutes les consoles, y compris celles qui ne
 * font que lire, il ne se lisait plus. Il vit désormais sur les deux pages qui
 * écrivent ce que le produit lit (`AvertissementProduction`).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminEmail();
  if (!admin) notFound();

  return (
    <div className="min-h-screen bg-[#eef0f3]">
      <header className="bg-encre text-blanc-casse">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/admin" className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-avertissement-bg" aria-hidden="true" />
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-papier/70">
                Zone séparée
              </span>
              <span className="block font-serif text-xl font-semibold">Administration Dossimo</span>
            </span>
          </Link>
          <p className="hidden text-xs text-papier/70 sm:block">Compte : {admin}</p>
          <Link href="/dossiers" className="text-sm font-medium text-papier underline underline-offset-4">
            Retour à l’espace artisan
          </Link>
        </div>
      </header>
      <NavAdmin />
      {children}
    </div>
  );
}
