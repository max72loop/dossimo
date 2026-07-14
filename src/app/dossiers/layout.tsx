import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentArtisan } from "@/lib/auth/get-artisan";
import { EspaceArtisanShell } from "@/components/dossier/espace-artisan-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function DossiersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const artisan = await getCurrentArtisan();
  if (!artisan) redirect("/connexion");

  return <EspaceArtisanShell artisan={artisan}>{children}</EspaceArtisanShell>;
}
