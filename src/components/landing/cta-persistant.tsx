"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { ArrowRight } from "lucide-react";

import { CTA_VITRINE } from "@/components/ui/boutons";
import { CTA_DEMO } from "@/lib/landing/copy";

/**
 * Le CTA persistant de la vitrine — bouton de l'en-tête sur ordinateur, barre
 * collante en bas sur téléphone — s'efface tant que le CTA du hero est à
 * l'écran.
 *
 * Raison : DESIGN.md §5 veut « un seul bouton plein par écran », et la landing
 * en montrait DEUX en permanence, portant le MÊME libellé (`CTA_DEMO`) vers la
 * MÊME page. Sur ordinateur, le bouton d'en-tête doublait celui du hero ; sur
 * téléphone, la barre collante le doublait, à trois centimètres de distance. Le
 * second exemplaire n'ajoute rien tant que le premier est lisible, et redevient
 * utile dès qu'il a défilé : c'est exactement ce que l'observateur mesure.
 *
 * Défaut = VISIBLE, et c'est la PAGE qui déclare sa sentinelle. Le même en-tête
 * coiffe les guides, les pages légales, `/exemple` et `/tarifs`, qui n'ont aucun
 * CTA de hero à doubler : sans `sentinelle`, aucun observateur ne se monte et le
 * bouton ne bouge jamais. Deviner la page depuis le composant aurait produit
 * l'inverse du but recherché — un CTA qui s'efface là où il est le seul.
 */
export const SENTINELLE_CTA_HERO = "cta-hero";

function useCtaEfface(sentinelle?: string): boolean {
  const cible = useCallback(
    () => (sentinelle ? document.getElementById(sentinelle) : null),
    [sentinelle],
  );

  const souscrire = useCallback(
    (onChange: () => void) => {
      const element = cible();
      // Sentinelle absente (page sans hero, ancre renommée, section retirée) :
      // personne n'observe rien et `lire` répond « pas effacé ». Une action
      // principale ne disparaît pas sur une faute de frappe.
      if (!element) return () => {};

      const observateur = new IntersectionObserver(onChange, { threshold: 0 });
      observateur.observe(element);
      return () => observateur.disconnect();
    },
    [cible],
  );

  const lire = useCallback(() => {
    const element = cible();
    if (!element) return false;
    const cadre = element.getBoundingClientRect();
    return cadre.bottom > 0 && cadre.top < window.innerHeight;
  }, [cible]);

  // `useSyncExternalStore` plutôt qu'un `useEffect`, comme `use-tactile.ts` : le
  // serveur répond depuis la seule chose qu'il sait (une sentinelle est
  // annoncée, donc le CTA persistant part effacé), le client lit la vraie
  // position dès le premier rendu. Un effet aurait affiché le doublon le temps
  // d'une image, exactement ce que ce composant existe pour supprimer.
  return useSyncExternalStore(souscrire, lire, () => Boolean(sentinelle));
}

/**
 * Enveloppe du CTA d'en-tête. L'élément reste monté et garde sa place (pas de
 * `hidden`) : le voir revenir ne doit pas décaler la navigation autour de lui.
 * `inert` accompagne l'opacité, sinon le bouton effacé resterait tabulable et
 * annoncé par un lecteur d'écran — invisible à l'œil n'est pas absent de la page.
 */
export function CtaPersistant({
  sentinelle,
  className = "",
  children,
}: {
  sentinelle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const efface = useCtaEfface(sentinelle);

  return (
    <div
      inert={efface}
      className={
        "transition-opacity duration-200 motion-reduce:transition-none " +
        (efface ? "opacity-0" : "opacity-100") +
        (className ? " " + className : "")
      }
    >
      {children}
    </div>
  );
}

/**
 * Barre d'action collante du téléphone. L'opacité et `inert` sont posés sur
 * l'élément `fixed` lui-même, pas sur une enveloppe : un parent en `opacity`
 * crée un contexte d'empilement, et empiler une surface flottante derrière un
 * parent translucide est le genre de détail qui ne se voit qu'en production.
 */
export function BarreCtaMobile({ sentinelle }: { sentinelle?: string }) {
  const efface = useCtaEfface(sentinelle);

  return (
    <div
      inert={efface}
      className={
        "fixed inset-x-0 bottom-0 z-40 border-t border-encre/15 bg-blanc-casse/95 p-3 shadow-[0_-8px_24px_rgba(22,32,43,0.12)] backdrop-blur transition-opacity duration-200 motion-reduce:transition-none md:hidden " +
        (efface ? "opacity-0" : "opacity-100")
      }
    >
      <Link href="/demo" className={CTA_VITRINE + " w-full"}>
        {CTA_DEMO}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
