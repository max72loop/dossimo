import type { ReactNode } from "react";

/**
 * Pastille sémantique partagée. Source unique pour les « pills » de statut qui
 * étaient jusqu'ici recopiées en ligne (landing, liste des dossiers, verdict).
 *
 * Le ton suit la sémantique de DESIGN.md §2 (toujours une paire texte + fond
 * clair) ; `neutre` couvre le brouillon / l'inactif. Le point coloré est
 * optionnel (`dot`), aligné sur le motif existant.
 *
 * Les statuts de PARCOURS (couleurs pilotées par la donnée `st.cls`/`st.dot`) ne
 * passent PAS par ici : ce ne sont pas des tons sémantiques mais un code couleur
 * d'étape, porté par sa propre source.
 */
type Ton = "succes" | "erreur" | "avertissement" | "info" | "neutre";

const FOND: Record<Ton, string> = {
  succes: "bg-succes-bg text-succes",
  erreur: "bg-erreur-bg text-erreur",
  avertissement: "bg-avertissement-bg text-avertissement",
  info: "bg-info-bg text-info",
  neutre: "bg-papier-fonce text-ardoise",
};

const POINT: Record<Ton, string> = {
  succes: "bg-succes",
  erreur: "bg-erreur",
  avertissement: "bg-avertissement",
  info: "bg-info",
  neutre: "bg-encre-claire",
};

export function Badge({
  ton,
  dot = false,
  children,
}: {
  ton: Ton;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${FOND[ton]}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${POINT[ton]}`} />}
      {children}
    </span>
  );
}
