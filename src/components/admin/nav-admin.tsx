"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { RUBRIQUES, SOMMAIRE, type Section } from "@/components/admin/sections";

/**
 * Barre de navigation des consoles admin.
 *
 * Client uniquement pour `usePathname` : c'est le seul besoin dynamique. La
 * liste des entrées vient de `sections.ts`, partagée avec le sommaire, pour
 * qu'une console ajoutée n'apparaisse jamais à un seul des deux endroits.
 *
 * Le segment courant est marqué par `aria-current`, pas seulement par la
 * couleur : la console se pilote parfois au clavier, et « la case foncée » ne
 * s'entend pas.
 *
 * Les rubriques sont séparées par un filet, et nommées seulement pour les
 * lecteurs d'écran : trois intertitres dans une barre d'une ligne, c'est trois
 * mots de plus à lire pour rien.
 */
export function NavAdmin() {
  const pathname = usePathname();

  return (
    <nav aria-label="Consoles d’administration" className="border-b border-filigrane bg-papier">
      <ul className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-1 gap-y-1 px-5 py-2 sm:px-8">
        <Entree section={SOMMAIRE} pathname={pathname} />
        {RUBRIQUES.flatMap((rubrique) => [
          <li key={rubrique.titre} className="mx-1.5 flex items-center">
            <span className="sr-only">{rubrique.titre} :</span>
            <span aria-hidden="true" className="block h-4 w-px bg-filigrane" />
          </li>,
          ...rubrique.consoles.map((section) => (
            <Entree key={section.href} section={section} pathname={pathname} />
          )),
        ])}
      </ul>
    </nav>
  );
}

function Entree({ section, pathname }: { section: Section; pathname: string }) {
  const { href, titre, court, icone: Icone } = section;
  // `/admin` ne s'allume que sur lui-même : préfixer l'aurait allumé partout.
  const courant = pathname === href;
  return (
    <li>
      <Link
        href={href}
        aria-current={courant ? "page" : undefined}
        className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
          courant ? "bg-encre text-blanc-casse" : "text-ardoise hover:bg-papier-fonce hover:text-encre"
        }`}
      >
        <Icone className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        {court ?? titre}
      </Link>
    </li>
  );
}
