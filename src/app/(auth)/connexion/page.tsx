import { SignInForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Connexion · Dossimo" };

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
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
