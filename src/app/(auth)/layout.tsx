import { redirect } from "next/navigation";

import { Logo } from "@/components/landing/site-header";
import { getCurrentUser } from "@/lib/auth/get-artisan";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Déjà connecté → pas de raison de rester sur connexion/inscription.
  const user = await getCurrentUser();
  if (user) redirect("/dossiers");

  return (
    <div className="flex min-h-screen flex-col bg-papier">
      <header className="border-b border-filigrane">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center px-8">
          <Logo />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
