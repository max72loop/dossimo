/**
 * Illustrations SVG inline de la vitrine.
 *
 * Tout est dessiné à la main dans la palette Dossimo (encre, tampon, accent
 * clair, crème) : aucune image externe, aucune bibliothèque d'icônes lourde, rien
 * qui parte sur le réseau. Les couleurs sont écrites en toutes lettres plutôt
 * qu'en tokens CSS parce qu'un `fill` SVG ne lit pas les variables `@theme` de
 * Tailwind ; elles restent alignées à la main sur `src/design/tokens.ts`
 * (encre #16202b, tampon/accent #35507f, accent-clair #9db0cf, papier #f3f0e9,
 * blanc-cassé #fbf9f3, filigrane #e2ddd1, succès #2d6a4f).
 *
 * Chaque illustration est purement décorative : `aria-hidden` par défaut, aucune
 * information n'y est portée qui ne soit déjà dans le texte voisin.
 */

/**
 * Transition en vague très douce entre deux sections. `fillClass` porte la
 * couleur de la section du dessus (via `currentColor`, donc un `text-*`),
 * `bandClass` le fond de la section du dessous : la vague « déverse » la couleur
 * du haut sur celle du bas. Les deux props sont des classes Tailwind complètes
 * (pas d'interpolation) pour rester analysables au build.
 */
export function WaveDivider({
  bandClass,
  fillClass,
}: {
  bandClass: string;
  fillClass: string;
}) {
  return (
    <div aria-hidden="true" className={`${bandClass} leading-[0]`}>
      <svg
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        className={`block h-6 w-full sm:h-10 ${fillClass}`}
        role="presentation"
      >
        <path
          fill="currentColor"
          d="M0 0 H1440 V26 C1140 44 1020 12 720 26 C420 40 300 8 0 26 Z"
        />
      </svg>
    </div>
  );
}
