"use client";

import { useEffect } from "react";

import { captureSource } from "@/lib/tracking/source";

/**
 * Capte `?utm_source=…` à l'arrivée sur le site et le mémorise pour la session
 * (voir `@/lib/tracking/source`). Monté une fois dans le layout racine : il
 * s'exécute au premier chargement, quand l'artisan arrive depuis un lien de
 * prospection. Ne rend rien.
 */
export function CaptureSource() {
  useEffect(() => {
    captureSource();
  }, []);
  return null;
}
