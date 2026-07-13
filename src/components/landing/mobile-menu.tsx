"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { FOCUS } from "@/components/ui/boutons";

/**
 * Navigation mobile de la vitrine.
 *
 * Sous 768 px, le header n'affichait AUCUNE navigation et masquait « Connexion »
 * dès 640 px : un artisan sur son téléphone — le terminal par lequel il consultera
 * la page, sur un chantier — ne pouvait ni parcourir la page ni accéder à son espace.
 *
 * Le header reste un Server Component (il lit la session) : seule l'ouverture du
 * panneau est cliente. L'état d'authentification descend en props.
 */
export function MobileMenu({
  nav,
  connecte,
}: {
  nav: readonly { href: string; label: string }[];
  connecte: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);

  // Panneau ouvert = page figée derrière, et Échap pour refermer (au clavier, on
  // doit pouvoir sortir sans chercher la croix).
  useEffect(() => {
    if (!ouvert) return;
    const surEchap = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    document.addEventListener("keydown", surEchap);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", surEchap);
      document.body.style.overflow = "";
    };
  }, [ouvert]);

  /**
   * Le panneau est monté dans `document.body`, PAS dans le header — et ce n'est pas
   * un détail de style.
   *
   * Le header porte `backdrop-blur-md`. Or un `backdrop-filter` fait de l'élément un
   * BLOC CONTENEUR pour ses descendants `position: fixed` : un panneau `fixed` rendu
   * à l'intérieur se positionnerait par rapport au header (64 px de haut) et non par
   * rapport à la fenêtre. Il se réduisait à une bande de 65 px laissant la page
   * transparaître dessous. Le portail l'affranchit de ce conteneur.
   */
  const panneau = ouvert ? (
    <div
      id="menu-mobile"
      className="fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto border-t border-filigrane bg-papier px-8 py-8 md:hidden"
    >
      <nav className="flex flex-col">
        {nav.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={() => setOuvert(false)}
            className={`border-b border-filigrane py-4 font-serif text-lg text-encre ${FOCUS}`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href={connecte ? "/dossiers/nouveau" : "/demo"}
          onClick={() => setOuvert(false)}
          className={`inline-flex h-12 items-center justify-center rounded bg-terre-cuite px-5 text-sm font-semibold text-blanc-casse transition-colors hover:bg-terre-cuite-hover ${FOCUS}`}
        >
          {connecte ? "Créer un dossier" : "Tester mon devis"}
        </Link>
        <Link
          href={connecte ? "/dossiers" : "/connexion"}
          onClick={() => setOuvert(false)}
          className={`inline-flex h-12 items-center justify-center rounded border border-encre/25 px-5 text-sm font-medium text-encre transition-colors hover:bg-papier-fonce ${FOCUS}`}
        >
          {connecte ? "Mon espace" : "Connexion"}
        </Link>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-ardoise">
        Premier dossier offert · sans carte bancaire
      </p>
    </div>
  ) : null;

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={ouvert}
        aria-controls="menu-mobile"
        className={`inline-flex h-10 w-10 items-center justify-center rounded text-encre transition-colors hover:bg-papier-fonce ${FOCUS}`}
      >
        {ouvert ? (
          <X className="h-5 w-5" strokeWidth={1.8} />
        ) : (
          <Menu className="h-5 w-5" strokeWidth={1.8} />
        )}
      </button>

      {/* `ouvert` part à false et ne passe à true que sur un clic : le portail n'est
          donc jamais évalué au rendu serveur, où `document` n'existe pas. Le premier
          rendu client (panneau absent) correspond au rendu serveur — pas d'écart
          d'hydratation, et pas besoin d'un état « monté » qui coûterait un rendu. */}
      {panneau ? createPortal(panneau, document.body) : null}
    </div>
  );
}
