"use client";

import { motion } from "motion/react";

/**
 * Jauge de complétude du dossier. La largeur reste posée en style inline, donc
 * le rendu serveur porte déjà la bonne valeur : c'est `scaleX` qui est animé,
 * pas la largeur. La barre est ainsi juste avant même l'hydratation, et
 * `reducedMotion` la fait apparaître pleine sans transition.
 */
export function BarreCompletude({
  pourcentage,
  conforme,
}: {
  pourcentage: number;
  conforme: boolean;
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={pourcentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Complétude du dossier"
      className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blanc-casse"
    >
      <motion.div
        data-barre-completude
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ type: "spring", stiffness: 90, damping: 20 }}
        style={{ width: `${pourcentage}%`, transformOrigin: "left" }}
        className={`h-full rounded-full ${conforme ? "bg-succes" : "bg-avertissement"}`}
      />
    </div>
  );
}
