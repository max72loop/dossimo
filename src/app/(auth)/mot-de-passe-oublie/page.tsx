import { PasswordResetRequestForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Mot de passe oublié · Dossimo" };

export default function ForgotPasswordPage() {
  return <div className="rounded border border-filigrane bg-blanc-casse p-7 shadow-sm sm:p-8"><h1 className="font-serif text-2xl font-semibold text-encre">Réinitialiser le mot de passe</h1><p className="mt-2 text-sm text-ardoise">Nous vous enverrons un lien sécurisé si un compte correspond à cette adresse.</p><div className="mt-6"><PasswordResetRequestForm /></div></div>;
}
