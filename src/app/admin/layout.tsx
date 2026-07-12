import { notFound } from "next/navigation";

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
  if (!(await getAdminEmail())) notFound();
  return <>{children}</>;
}
