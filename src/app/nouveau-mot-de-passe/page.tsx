import { NewPasswordForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Nouveau mot de passe", robots: { index: false, follow: false } };

export default function NewPasswordPage() {
  return <main className="flex min-h-screen items-center justify-center bg-papier px-6 py-12"><div className="w-full max-w-md rounded border border-filigrane bg-blanc-casse p-7 shadow-sm sm:p-8"><h1 className="font-serif text-2xl font-semibold text-encre">Choisir un nouveau mot de passe</h1><p className="mt-2 text-sm text-ardoise">Utilisez au moins 12 caractères, une majuscule, une minuscule et un chiffre.</p><div className="mt-6"><NewPasswordForm /></div></div></main>;
}
