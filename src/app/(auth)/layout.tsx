import type { Metadata } from "next";

import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // La redirection d'un utilisateur déjà connecté vit dans chaque page (et non
  // ici) : un layout ne reçoit pas `searchParams`, il ne pourrait donc pas
  // honorer `?next=` et repartirait toujours en dur vers /dossiers, perdant la
  // reprise du brouillon d'essai.
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
