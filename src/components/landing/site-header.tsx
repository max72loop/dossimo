import Link from "next/link";

import { getCurrentUser } from "@/lib/auth/get-artisan";
import { MobileMenu } from "@/components/landing/mobile-menu";
import { FOCUS } from "@/components/ui/boutons";

const NAV = [
  { href: "/demo", label: "Démo sans compte" },
  { href: "#etapes", label: "Comment ça marche" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
];

/* Logo Dossimo : mot-signe « dossimo » (Unbounded), deux « o » en gris.
   Rendu typographique (net et responsive), fidèle au kit de marque. */
export function Logo({
  className = "",
  variant = "encre",
}: {
  className?: string;
  variant?: "encre" | "nuit";
}) {
  const ink = variant === "nuit" ? "text-blanc-casse" : "text-encre";
  const grey = variant === "nuit" ? "text-[#79828d]" : "text-encre-claire";
  return (
    <Link href="/" className={`inline-flex items-center ${className}`} aria-label="Dossimo">
      <span
        className={`font-display text-[1.4rem] font-bold lowercase leading-none tracking-[-0.02em] ${ink}`}
      >
        d<span className={grey}>o</span>ssim<span className={grey}>o</span>
      </span>
    </Link>
  );
}

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-encre bg-papier/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-ardoise transition-colors hover:text-encre"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Sur téléphone, ces deux liens cèdent la place au menu : le CTA seul
              tiendrait, mais « Connexion » disparaissait sous 640 px — un artisan
              déjà inscrit n'avait aucun accès à son espace depuis l'accueil. */}
          <Link
            href={user ? "/dossiers" : "/connexion"}
            className={`hidden text-sm text-tampon underline-offset-4 transition hover:underline md:block ${FOCUS}`}
          >
            {user ? "Mon espace" : "Connexion"}
          </Link>
          <Link
            href={user ? "/dossiers/nouveau" : "/inscription?next=%2Fdossiers%2Fnouveau"}
            className={`hidden h-10 items-center rounded bg-terre-cuite px-5 text-sm font-medium text-blanc-casse transition-colors hover:bg-terre-cuite-hover md:inline-flex ${FOCUS}`}
          >
            {user ? "Nouveau dossier" : "Déposer mon devis"}
          </Link>
          <MobileMenu nav={NAV} connecte={!!user} />
        </div>
      </div>
    </header>
  );
}
