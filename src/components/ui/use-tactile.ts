"use client";

import { useSyncExternalStore } from "react";

/**
 * Écran tactile ou non.
 *
 * Deux usages, la même raison : l'attribut `capture` d'un `input[type=file]`
 * n'est honoré que sur mobile. Sur un ordinateur il est ignoré, donc un bouton
 * « Photographier » y rouvrirait le sélecteur de fichiers en promettant un
 * appareil photo qui n'existe pas. Et à l'inverse, un `capture` posé sans
 * condition sur l'UNIQUE bouton d'envoi force l'appareil photo sur mobile : le
 * PDF déjà rangé dans le téléphone devient alors inatteignable.
 *
 * `useSyncExternalStore` plutôt qu'un `useEffect` : le serveur rend `false`
 * (aucun `window`), le client lit la vraie valeur dès le premier rendu, sans
 * cascade de rendus ni divergence d'hydratation.
 *
 * Écrit d'abord pour la page de dépôt du bénéficiaire (`depot-client.tsx`), puis
 * remonté ici quand la zone de dépôt de l'artisan a eu le même besoin.
 */
const REQUETE_TACTILE = "(pointer: coarse)";

export function useTactile(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REQUETE_TACTILE);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REQUETE_TACTILE).matches,
    () => false,
  );
}
