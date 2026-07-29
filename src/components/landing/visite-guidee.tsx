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
 *    une action explicite. Avant, on affiche une affiche locale — un faux cadre de
 *    navigateur dessiné avec les tokens, aucun actif à télécharger. Deux raisons :
 *    la vitrine ne paie pas le poids d'un lecteur tiers pour les visiteurs qui ne
 *    la regardent pas, et aucune requête ne part vers un tiers avant que le
 *    visiteur l'ait demandé. Le second point n'est pas cosmétique : Dossimo promet
 *    aux artisans un traitement sobre de leurs documents, une vitrine qui appelle
 *    un tiers dès le premier octet dirait le contraire.
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
 * Affiche locale : un faux cadre de navigateur qui reprend celui de la démo, pour
 * que le visiteur reconnaisse l'écran qu'il va voir. Dessinée avec les tokens, sans
 * capture à servir — une image de plus sur la vitrine coûterait ce que ce composant
 * cherche justement à éviter.
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
        className={`group flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center transition-colors hover:bg-papier/[0.04] ${FOCUS_SOMBRE}`}
      >
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-papier text-encre transition-transform group-hover:scale-105 motion-reduce:transform-none">
          <Play className="ml-0.5 h-6 w-6" fill="currentColor" aria-hidden="true" />
        </span>
        <span className="max-w-md">
          <span className="block font-serif text-xl font-semibold text-blanc-casse sm:text-2xl">
            {VISITE.titre}
          </span>
          <span className="mt-2 block text-sm text-papier/70">
            Lancer la visite guidée, sans compte et sans inscription.
          </span>
        </span>
      </button>
    </div>
  );
}
