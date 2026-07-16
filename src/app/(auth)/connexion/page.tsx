import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/lib/auth/get-artisan";
import { destinationApresAuth } from "@/lib/auth/redirect";

export const metadata = { title: "Connexion" };

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Déjà connecté → on l'emmène directement là où il allait (reprise du
  // brouillon d'essai comprise), au lieu de le bloquer sur la connexion.
  if (await getCurrentUser()) redirect(destinationApresAuth(next));
  return (
    <div className="rounded border border-filigrane bg-blanc-casse p-7 shadow-sm sm:p-8">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-encre">
        Connexion
      </h1>
      <p className="mt-2 text-sm text-ardoise">
        Connectez-vous pour reprendre votre dossier là où vous l’avez laissé.
      </p>
      <div className="mt-6">
        <SignInForm next={next} />
      </div>
    </div>
  );
}
