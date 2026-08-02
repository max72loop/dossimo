"use client";

import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";

import { FOCUS, FOCUS_SOMBRE } from "@/components/ui/boutons";
import { VISITE } from "@/lib/landing/visite";

/**
 * Visite guidée embarquée — le seul contenu TIERS de la vitrine.
 *
 * Deux décisions structurent ce composant (DESIGN.md §5, « Contenu tiers
 * embarqué ») :
 *
 * 1. **Rien n'est chargé avant le clic.** L'`iframe` Supademo n'est montée qu'après
 *    une action explicite. Avant, on affiche une affiche locale : un faux cadre de
 *    navigateur dessiné avec les tokens, et une capture de l'app servie depuis
 *    `public/` (33 ko, chargée en différé), jamais la vignette de l'hébergeur.
 *    Deux raisons : la vitrine ne paie pas le poids d'un lecteur tiers pour les
 *    visiteurs qui ne la regardent pas, et aucune requête ne part vers un tiers
 *    avant que le visiteur l'ait demandé. Le second point n'est pas cosmétique :
 *    Dossimo promet aux artisans un traitement sobre de leurs documents, une
 *    vitrine qui appelle un tiers dès le premier octet dirait le contraire.
 *
 * 2. **L'`iframe` n'est jamais le seul chemin.** Un lien direct reste offert : dans
 *    un navigateur qui bloque les cadres tiers, ou si Supademo tombe, la visite
 *    reste atteignable. Le rendu serveur ne contient donc jamais d'`iframe` — c'est
 *    ce que vérifie `visite-guidee.test.tsx`.
 */
export function VisiteGuidee({ className = "" }: { className?: string }) {
  const [chargee, setChargee] = useState(false);

  return (
    <div className={className}>
      <div
        className="overflow-hidden rounded-2xl bg-encre shadow-lg"
        style={{ aspectRatio: VISITE.ratio }}
      >
        {chargee ? (
          <iframe
            src={VISITE.embed}
            title={`Visite guidée Dossimo : ${VISITE.titre}`}
            allow="clipboard-write"
            allowFullScreen
            className="h-full w-full border-0"
          />
        ) : (
          <Affiche onLancer={() => setChargee(true)} />
        )}
      </div>

      <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-relaxed text-ardoise">
        <span>
          Visite hébergée par {VISITE.hebergeur}, chargée seulement à votre clic.
        </span>
        <a
          href={VISITE.lien}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-1 underline underline-offset-4 transition-colors hover:text-encre ${FOCUS}`}
        >
          Ouvrir dans un nouvel onglet
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </p>
    </div>
  );
}

/**
 * Affiche locale : un faux cadre de navigateur dessiné avec les tokens, dans lequel
 * est posée une vraie capture de l'app : l'écran des contrôles, celui qui porte la
 * valeur du produit. Le visiteur voit donc ce qu'il va ouvrir avant de cliquer, ce
 * qu'un aplat encre ne disait pas.
 *
 * La capture est servie depuis `public/` et dérivée par `scripts/visite-affiche.mjs`
 * ([`lib/landing/visite.ts`](../../lib/landing/visite.ts) porte l'étape et le
 * chemin) : c'est ce qui permet de montrer l'app sans appeler l'hébergeur avant le
 * clic. Elle est **décorative** (`alt=""`) : le titre du bouton porte le sens, un
 * lecteur d'écran n'a rien à gagner à se faire décrire une copie d'écran.
 */
function Affiche({ onLancer }: { onLancer: () => void }) {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-papier/10 px-4">
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-papier/25" />
          <span className="h-2 w-2 rounded-full bg-papier/25" />
          <span className="h-2 w-2 rounded-full bg-papier/25" />
        </span>
        <span className="truncate font-mono text-[11px] text-papier/45">
          dossimo.app
        </span>
      </div>

      <button
        type="button"
        onClick={onLancer}
        className={`group relative flex flex-1 flex-col justify-end overflow-hidden text-left ${FOCUS_SOMBRE}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- capture statique de même origine, gardée hors du payload HTML (même parti que `Illustration`) */}
        <img
          src={VISITE.affiche.src}
          alt=""
          width={VISITE.affiche.largeur}
          height={VISITE.affiche.hauteur}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transform-none"
        />
        {/* Voile encre : il rend le titre lisible sur une capture crème, et garde la
            capture reconnaissable en haut. Sans lui, le texte blanc disparaît. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-encre via-encre/60 to-encre/15"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-papier text-encre shadow-lg transition-transform group-hover:scale-105 motion-reduce:transform-none sm:h-16 sm:w-16">
            <Play className="ml-0.5 h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" />
          </span>
        </span>
        <span className="relative max-w-xl px-5 pb-5 sm:px-8 sm:pb-7">
          <span className="block font-serif text-lg font-semibold text-blanc-casse sm:text-2xl">
            {VISITE.titre}
          </span>
          <span className="mt-1 block text-xs text-papier/70 sm:mt-2 sm:text-sm">
            Lancer la visite guidée, sans compte et sans inscription.
          </span>
        </span>
      </button>
    </div>
  );
}
