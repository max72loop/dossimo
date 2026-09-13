import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Gabarit commun des consoles admin.
 *
 * Avant lui, chaque page avait sa largeur (`max-w-4xl`, `5xl`, `1280px`), sa
 * taille de titre (`text-2xl` ou `3xl`) et son propre lien de retour. La barre
 * de navigation du layout (`nav-admin.tsx`) rend ces liens inutiles ; ce
 * composant fixe le reste, pour que passer d'une console à l'autre ne donne
 * pas l'impression de changer d'outil.
 *
 * `CONSOLE_MAIN` est la classe du `<main>` : une seule exception assumée,
 * `/admin/donnees`, dont le tableau d'inventaire a besoin de `max-w-[1280px]`.
 */
export const CONSOLE_MAIN = "mx-auto max-w-5xl px-5 py-10 sm:px-8";

export function EnTeteConsole({
  titre,
  aide,
  children,
}: {
  titre: string;
  aide: ReactNode;
  /** Sous l'aide : avertissement de production, compte connecté, filtres. */
  children?: ReactNode;
}) {
  return (
    <header>
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-encre">{titre}</h1>
      <p className="mt-1 max-w-2xl text-sm text-ardoise">{aide}</p>
      {children}
    </header>
  );
}

/**
 * L'avertissement « ce que vous changez ici est en production ».
 *
 * Il vivait dans le layout, donc sur toutes les consoles, y compris Contacts ou
 * le Tunnel, qui ne modifient rien. Répété partout, un avertissement ne se lit
 * plus. Il n'apparaît que sur les deux consoles qui écrivent ce que le produit
 * lit en direct : les règles métier et les modèles de devis.
 */
export function AvertissementProduction({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 flex items-start gap-2 border-l-4 border-avertissement bg-avertissement-bg px-4 py-3 text-sm font-medium text-avertissement">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
