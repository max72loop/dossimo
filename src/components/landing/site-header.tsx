import Link from "next/link";

import { getCurrentUser } from "@/lib/auth/get-artisan";

const NAV = [
  { href: "#probleme", label: "Le problème" },
  { href: "#difference", label: "Vs mandataire" },
  { href: "#etapes", label: "Méthode" },
  { href: "#faq", label: "FAQ" },
];

/* Logo — une fiche dossier (rectangle vertical, pile de documents) frappée
   d'un petit tampon rond terre cuite. Géométrique, statique. */
export function Logo({
  className = "",
  mono = false,
}: {
  className?: string;
  mono?: boolean;
}) {
  const stamp = mono ? "currentColor" : "var(--color-terre-cuite)";
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width="30"
        height="32"
        viewBox="0 0 30 32"
        fill="none"
        aria-hidden
        className="text-encre"
      >
        <rect
          x="4.5"
          y="3"
          width="16"
          height="24"
          rx="1.5"
          fill="var(--color-blanc-casse)"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M8.5 9.5h8M8.5 13.5h8M8.5 17.5h5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="21.5" cy="24.5" r="5.5" fill={stamp} />
        <path
          d="m19.2 24.6 1.6 1.6 3-3.2"
          stroke="var(--color-blanc-casse)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-serif text-lg font-semibold tracking-tight text-encre">
        Dossimo
      </span>
    </Link>
  );
}

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-filigrane bg-papier/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-8">
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
        <div className="flex items-center gap-5">
          <Link
            href={user ? "/dossiers" : "/connexion"}
            className="hidden text-sm text-tampon underline-offset-4 transition hover:underline sm:block"
          >
            {user ? "Mon espace" : "Connexion"}
          </Link>
          <Link
            href={user ? "/dossiers/nouveau" : "/inscription"}
            className="inline-flex h-10 items-center rounded bg-terre-cuite px-5 text-sm font-medium text-blanc-casse transition-colors hover:bg-terre-cuite-hover"
          >
            Créer un dossier
          </Link>
        </div>
      </div>
    </header>
  );
}
