"use client";

import { useEffect, useRef } from "react";

import { marquerPiecesVues } from "@/lib/depot/actions";

/**
 * L'artisan ouvre le dossier : les pièces que son client y a déposées cessent d'être
 * « nouvelles » dans la liste. Rien à afficher, seulement un accusé de lecture.
 *
 * Monté seulement quand il y a réellement du neuf : sans quoi chaque ouverture d'un
 * dossier écrirait en base pour rien, et invaliderait le cache de la liste.
 */
export function MarquerVues({ dossierId }: { dossierId: string }) {
  const fait = useRef(false);

  useEffect(() => {
    if (fait.current) return; // React 18 monte deux fois en dev.
    fait.current = true;
    void marquerPiecesVues(dossierId);
  }, [dossierId]);

  return null;
}
