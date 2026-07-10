"use client";

import { MotionConfig } from "motion/react";

/**
 * Réglage global des animations Motion. `reducedMotion="user"` fait sauter les
 * transforms et les animations de layout directement à leur valeur d'arrivée
 * quand le système demande de réduire les animations, en gardant les fondus
 * d'opacité. Prolonge la règle déjà posée dans `globals.css` pour les
 * animations CSS.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
