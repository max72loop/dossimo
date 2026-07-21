"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { LogOut, Menu, Plus, X } from "lucide-react";

import { FOCUS } from "@/components/ui/boutons";
import { signOut } from "@/lib/auth/actions";

type LienArtisan = { href: string; label: string };

const LIENS: readonly LienArtisan[] = [
  { href: "/dossiers", label: "Mes dossiers" },
  { href: "/dossiers/factures", label: "Factures" },
  { href: "/devis", label: "Devis" },
  { href: "/dossiers/profil", label: "Mon compte" },
];

/**
 * Navigation mobile de l'espace artisan. Sans elle, l'en-tête masquait
 * Dossiers / Factures / Devis / Compte sous `md:` : sur un téléphone (le contexte
 * terrain assumé du produit), l'artisan n'avait plus aucune de ces destinations.
 *
 * Même patron que `site-menu.tsx` de la vitrine (portail hors du header à cause du
 * `backdrop-blur`, Échap, verrou de scroll, retour du focus au burger) : un seul
 * comportement de menu dans tout le produit.
 */
export function EspaceArtisanMenu({ entreprise }: { entreprise: string }) {
  const [ouvert, setOuvert] = useState(false);
  const declencheur = useRef<HTMLButtonElement>(null);
  const fermeture = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const burger = declencheur.current;
    const surEchap = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    document.addEventListener("keydown", surEchap);
    document.body.style.overflow = "hidden";
    fermeture.current?.focus();
    return () => {
      document.removeEventListener("keydown", surEchap);
      document.body.style.overflow = "";
      burger?.focus();
    };
  }, [ouvert]);

  const fermer = () => setOuvert(false);

  // Monté dans `document.body` : le header porte `backdrop-blur-md`, qui ferait de
  // lui le bloc conteneur d'un enfant `fixed` (cf. la même note dans `site-menu`).
  const panneau = ouvert ? (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de l'espace artisan"
    >
      <button
        type="button"
        aria-label="Fermer le menu"
        onClick={fermer}
        className="absolute inset-0 h-full w-full cursor-default bg-encre/25 backdrop-blur-sm"
      />

      <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col overflow-y-auto border-l border-filigrane bg-papier shadow-2xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-filigrane px-6">
          <span className="truncate font-medium text-encre">{entreprise}</span>
          <button
            ref={fermeture}
            type="button"
            onClick={fermer}
            aria-label="Fermer le menu"
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded text-encre transition-colors hover:bg-papier-fonce ${FOCUS}`}
          >
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex-1 px-6 py-6">
          <Link
            href="/dossiers/nouveau"
            onClick={fermer}
            className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded bg-accent px-5 text-sm font-semibold text-blanc-casse transition-colors hover:bg-accent-hover ${FOCUS}`}
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Nouveau dossier
          </Link>

          <nav className="mt-6 flex flex-col border-t border-filigrane pt-4">
            {LIENS.map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                onClick={fermer}
                className={`-mx-2 rounded px-2 py-2.5 text-[15px] text-ardoise transition-colors hover:bg-papier-fonce hover:text-encre ${FOCUS}`}
              >
                {lien.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="shrink-0 border-t border-filigrane px-6 py-5">
          <form action={signOut}>
            <button
              type="submit"
              className={`inline-flex items-center gap-2 text-sm text-ardoise transition-colors hover:text-encre ${FOCUS}`}
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={declencheur}
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={ouvert}
        aria-haspopup="dialog"
        className={`inline-flex h-10 w-10 items-center justify-center rounded text-encre transition-colors hover:bg-papier-fonce md:hidden ${FOCUS}`}
      >
        <Menu className="h-5 w-5" strokeWidth={1.8} />
      </button>

      {panneau ? createPortal(panneau, document.body) : null}
    </>
  );
}