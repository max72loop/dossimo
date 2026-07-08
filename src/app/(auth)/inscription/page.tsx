import { SignUpForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Créer un compte · Dossimo" };

export default function InscriptionPage() {
  return (
    <div className="rounded border border-filigrane bg-blanc-casse p-7 shadow-sm sm:p-8">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-encre">
        Créer votre compte
      </h1>
      <p className="mt-2 text-sm text-ardoise">
        Vous gardez la main sur vos dossiers et votre prime. Premier dossier
        offert.
      </p>
      <div className="mt-6">
        <SignUpForm />
      </div>
      <p className="mt-6 border-t border-filigrane pt-4 text-center text-xs text-encre-claire">
        Dossimo est un service indépendant d&rsquo;aide à la préparation de
        dossier, non affilié à l&rsquo;Anah ni à France Rénov&rsquo;.
      </p>
    </div>
  );
}
