"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

import { FOCUS } from "@/components/ui/boutons";
import { CTA_DEMO } from "@/lib/landing/copy";

type NavItem = { href: string; label: string };
type GuideLink = { slug: string; title: string };

/**
 * Menu principal du site, désormais PERSISTANT à toutes les largeurs (et plus
 * seulement sous 768 px). Le bouton burger reste visible sur desktop à côté de la
 * navigation en ligne : il devient le point d'entrée unique et extensible vers tout
 * ce qui déborde du header — guides, et demain d'autres rubriques — sans encombrer
 * la barre. Ajouter une section ici suffit à enrichir le menu partout.
 *
 * Le header reste un Server Component (il lit la session) : seule l'ouverture du
 * panneau est cliente. L'état d'authentification et les liens descendent en props.
 */
export function SiteMenu({
  nav,
  guides,
  connecte,
}: {
  nav: readonly NavItem[];
  guides: readonly GuideLink[];
  connecte: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const declencheur = useRef<HTMLButtonElement>(null);
  const fermeture = useRef<HTMLButtonElement>(null);

  // Panneau ouvert : page figée derrière, Échap pour refermer, et le focus part sur
  // la croix (au clavier, on entre dans le panneau au lieu de rester sur le burger).
  // À la fermeture, le focus revient sur le déclencheur.
  useEffect(() => {
    if (!ouvert) return;
    // Le burger est monté en permanence, mais on capture quand même le nœud pour le
    // rendre au focus à la fermeture sans lire la ref (potentiellement périmée) en cleanup.
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

  /**
   * Le panneau est monté dans `document.body`, PAS dans le header — et ce n'est pas
   * un détail de style. Le header porte `backdrop-blur-md` : un `backdrop-filter`
   * fait de l'élément un BLOC CONTENEUR pour ses descendants `position: fixed`, si
   * bien qu'un panneau `fixed` rendu à l'intérieur se positionnerait par rapport au
   * header et non à la fenêtre. Le portail l'affranchit de ce conteneur.
   */
  const panneau = ouvert ? (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu du site">
      {/* Voile : ferme au clic, et matérialise la mise à l'écart de la page sur desktop. */}
      <button
        type="button"
        aria-label="Fermer le menu"
        onClick={fermer}
        className="absolute inset-0 h-full w-full cursor-default bg-encre/25 backdrop-blur-sm"
      />

      <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col overflow-y-auto border-l-2 border-encre bg-papier shadow-2xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-filigrane px-6">
          <span className="label text-encre-claire">Menu</span>
          <button
            ref={fermeture}
            type="button"
            onClick={fermer}
            aria-label="Fermer le menu"
            className={`inline-flex h-10 w-10 items-center justify-center rounded text-encre transition-colors hover:bg-papier-fonce ${FOCUS}`}
          >
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex-1 px-6 py-6">
          <MenuSection titre="Le produit">
            {nav.map((item) => (
              <MenuLien key={item.href} href={item.href} onClick={fermer}>
                {item.label}
              </MenuLien>
            ))}
            <MenuLien href="/demo" onClick={fermer}>
              Analyser un devis
            </MenuLien>
          </MenuSection>

          <MenuSection titre="Guides & ressources">
            <MenuLien href="/guides" onClick={fermer} accent>
              Tous les guides
            </MenuLien>
            {guides.map((guide) => (
              <MenuLien key={guide.slug} href={`/${guide.slug}`} onClick={fermer}>
                {guide.title}
              </MenuLien>
            ))}
          </MenuSection>

          <MenuSection titre="Mon compte">
            <MenuLien href={connecte ? "/dossiers" : "/connexion"} onClick={fermer}>
              {connecte ? "Mon espace" : "Connexion"}
            </MenuLien>
          </MenuSection>
        </div>

        <div className="shrink-0 border-t border-filigrane px-6 py-6">
          <Link
            href={connecte ? "/dossiers/nouveau" : "/demo"}
            onClick={fermer}
            className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded bg-terre-cuite px-5 text-sm font-semibold text-blanc-casse transition-colors hover:bg-terre-cuite-hover ${FOCUS}`}
          >
            {connecte ? "Créer un dossier" : CTA_DEMO}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="mt-4 text-xs leading-relaxed text-ardoise">
            Code DOSSIMO50 · 50 % sur le premier dossier
          </p>
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
        className={`inline-flex h-10 w-10 items-center justify-center rounded text-encre transition-colors hover:bg-papier-fonce ${FOCUS}`}
      >
        <Menu className="h-5 w-5" strokeWidth={1.8} />
      </button>

      {/* `ouvert` part à false et ne passe à true que sur un clic : le portail n'est
          donc jamais évalué au rendu serveur, où `document` n'existe pas. Le premier
          rendu client (panneau absent) correspond au rendu serveur — pas d'écart
          d'hydratation. */}
      {panneau ? createPortal(panneau, document.body) : null}
    </>
  );
}

function MenuSection({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-filigrane py-5 first:border-t-0 first:pt-0">
      <h2 className="label text-encre-claire">{titre}</h2>
      <nav className="mt-3 flex flex-col">{children}</nav>
    </section>
  );
}

function MenuLien({
  href,
  onClick,
  accent = false,
  children,
}: {
  href: string;
  onClick: () => void;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`-mx-2 rounded px-2 py-2.5 text-[15px] transition-colors hover:bg-papier-fonce ${
        accent ? "font-semibold text-encre" : "text-ardoise hover:text-encre"
      } ${FOCUS}`}
    >
      {children}
    </Link>
  );
}
