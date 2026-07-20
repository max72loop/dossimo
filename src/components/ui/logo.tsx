import Link from "next/link";

/**
 * Logo Dossimo : mot-signe « dossimo » (Unbounded). Rendu typographique, net et
 * responsive, fidèle au kit de marque.
 *
 * Source UNIQUE du mot-signe. La page de dépôt en avait recopié une version à plat :
 * deux logos pour une marque, c'est la garantie qu'ils divergent (DESIGN.md §1).
 *
 * Ce module existe séparément de `site-header.tsx` pour une raison de runtime, pas
 * de rangement : le header importe `getCurrentUser`, donc du code `server-only`.
 * Tant que le logo vivait dans le même fichier, un composant client qui affichait
 * simplement le logo faisait entrer tout cela dans son bundle et la page tombait en
 * 500 (« 'server-only' cannot be imported from a Client Component »). Ni `tsc` ni
 * ESLint ne le voient : seul le bundler le refuse, à l'exécution.
 *
 * `taille` est un paramètre plutôt qu'une classe passée dans `className` : deux
 * classes Tailwind de même propriété se départagent par l'ordre de la feuille de
 * style, pas par l'ordre de l'attribut, donc surcharger la taille depuis l'extérieur
 * ne marcherait qu'au hasard.
 *
 * `href={null}` rend un mot-signe non cliquable : sur la page de dépôt, le lien
 * emmènerait le bénéficiaire sur la vitrine, en plein milieu de son envoi.
 */
export function Logo({
  className = "",
  variant = "encre",
  taille = "text-[1.4rem]",
  href = "/",
}: {
  className?: string;
  /** `encre-mono` : mot-signe d'un seul tenant, sans les « o » gris. */
  variant?: "encre" | "nuit" | "encre-mono";
  taille?: string;
  href?: string | null;
}) {
  const ink = variant === "nuit" ? "text-blanc-casse" : "text-encre";
  const grey =
    variant === "nuit"
      ? "text-[#79828d]"
      : variant === "encre-mono"
        ? ink
        : "text-encre-claire";

  const motSigne = (
    <span
      className={`font-display font-bold lowercase leading-none tracking-[-0.02em] ${taille} ${ink}`}
    >
      d<span className={grey}>o</span>ssim<span className={grey}>o</span>
    </span>
  );

  if (href === null) {
    return (
      <span className={`inline-flex items-center ${className}`} aria-label="Dossimo">
        {motSigne}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={`inline-flex items-center ${className}`}
      aria-label="Dossimo"
    >
      {motSigne}
    </Link>
  );
}
