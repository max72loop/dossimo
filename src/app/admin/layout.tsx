import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ShieldCheck } from "lucide-react";

import { getAdminEmail } from "@/lib/auth/is-admin";

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
      <header className="border-b-4 border-avertissement bg-encre text-blanc-casse">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-avertissement-bg" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-papier/70">Zone séparée</p>
              <p className="font-serif text-xl font-semibold">Administration Dossimo</p>
            </div>
          </div>
          <Link href="/dossiers" className="text-sm font-medium text-papier underline underline-offset-4">
            Retour à l’espace artisan
          </Link>
        </div>
      </header>
      <div className="border-b border-avertissement/30 bg-avertissement-bg">
        <p className="mx-auto flex max-w-[1280px] items-center gap-2 px-5 py-3 text-sm font-medium text-avertissement sm:px-8">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Les changements effectués ici modifient les contrôles métier en production. Compte : {admin}
        </p>
      </div>
      {children}
    </div>
  );
}
