import Link from "next/link";

import { getCurrentUser } from "@/lib/auth/get-artisan";
import { SiteMenu } from "@/components/landing/site-menu";
import { Logo } from "@/components/ui/logo";
import { FOCUS } from "@/components/ui/boutons";
import { CTA_DEMO } from "@/lib/landing/copy";
import { guideList } from "@/lib/seo/guides";

/**
 * Sommaire de la vitrine. Ancres ABSOLUES (`/#etapes`) : ce header coiffe aussi les
 * pages légales et les guides SEO, où une ancre nue ne renverrait vers rien.
 */
const NAV = [
  { href: "/#etapes", label: "Comment ça marche" },
  { href: "/exemple", label: "Le pack en exemple" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/guides", label: "Guides" },
  { href: "/#faq", label: "Questions" },
] as const;

// Le mot-signe vit dans `@/components/ui/logo` : ce fichier importe `getCurrentUser`
// (server-only), et tout composant client qui voulait juste afficher le logo faisait
// entrer ce code dans son bundle, ce qui mettait la page en 500.

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-encre bg-papier/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8">
        <Logo />

        <nav aria-label="Sections du site" className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm text-ardoise underline-offset-4 transition hover:text-encre hover:underline ${FOCUS}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href={user ? "/dossiers" : "/connexion"}
            className={`text-sm text-tampon underline-offset-4 transition hover:underline ${FOCUS}`}
          >
            {user ? "Mon espace" : "Connexion"}
          </Link>
          <Link
            href={user ? "/dossiers/nouveau" : "/demo"}
            className={`hidden h-10 items-center rounded bg-accent px-5 text-sm font-medium text-blanc-casse transition-colors hover:bg-accent-hover md:inline-flex ${FOCUS}`}
          >
            {user ? "Nouveau dossier" : CTA_DEMO}
          </Link>
          <SiteMenu nav={NAV} guides={guideList} connecte={Boolean(user)} />
        </div>
      </div>
    </header>
  );
}
