import { redirect } from "next/navigation";

import { SignUpForm } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/lib/auth/get-artisan";
import { destinationApresAuth } from "@/lib/auth/redirect";

export const metadata = { title: "Créer un compte" };

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Déjà connecté → inutile de recréer un compte : on suit `next` (reprise du
  // brouillon d'essai) plutôt que de retomber en dur sur /dossiers.
  if (await getCurrentUser()) redirect(destinationApresAuth(next));
  const reprendEssai = next?.includes("reprise=essai");
  return (
    <div className="rounded border border-filigrane bg-blanc-casse p-7 shadow-sm sm:p-8">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-encre">
        Créer votre compte
      </h1>
      <p className="mt-2 text-sm text-ardoise">
        {reprendEssai
          ? "Votre devis est prêt. Créez votre espace pour reprendre uniquement les informations qu'il reste à confirmer."
          : "Deux minutes pour créer votre espace, puis vous pourrez déposer votre devis. Code DOSSIMO50 : 50 % sur votre premier dossier jusqu’au 31 juillet 2026."}
      </p>
      <div className="mt-6">
        <SignUpForm next={next} />
      </div>
      <p className="mt-6 border-t border-filigrane pt-4 text-center text-xs text-encre-claire">
        Dossimo est un service indépendant d&rsquo;aide à la préparation de
        dossier, non affilié à l&rsquo;Anah ni à France Rénov&rsquo;.
      </p>
    </div>
  );
}
