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
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className={`block h-10 w-full sm:h-16 ${fillClass}`}
        role="presentation"
      >
        {/* L'aplat déverse la couleur du haut sur celle du bas ; entre deux crèmes
            proches il reste discret, c'est le liseré filigrane sur la crête qui
            dessine la vague et la rend franchement lisible. */}
        <path
          fill="currentColor"
          d="M0 0 H1440 V42 C1150 72 1010 14 720 42 C430 70 290 12 0 42 Z"
        />
        <path
          fill="none"
          stroke="#d9d2c3"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
          d="M0 42 C290 12 430 70 720 42 C1010 14 1150 72 1440 42"
        />
      </svg>
    </div>
  );
}

/**
 * Illustration décorative servie depuis `public/illustrations/` (scènes en aplats
 * dans la palette, recolorées sur les tokens exacts). On passe par un `<img>` et
 * non `next/image` à dessein : ce sont des SVG statiques de même origine (aucun
 * CDN), l'`<img>` les garde hors du payload HTML du composant serveur et évite
 * d'activer `dangerouslyAllowSVG` dans la config Next pour un actif décoratif.
 *
 * `alt` vaut `""` par défaut : l'illustration ne fait que redoubler la copie
 * voisine, un lecteur d'écran doit la sauter (§7). Passer un `alt` non vide
 * seulement si l'image porte une information absente du texte.
 */
export function Illustration({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG décoratif statique, même origine (cf. bloc ci-dessus)
    <img src={src} alt={alt} loading="lazy" decoding="async" className={className} />
  );
}

/**
 * Petits pictogrammes des étapes, dessinés au trait dans la palette. Purement
 * décoratifs (le titre de l'étape porte le sens) : `aria-hidden`. Un `name` par
 * étape du parcours (devis → recopie → contrôle → pack).
 */
export function EtapePicto({
  name,
  className,
}: {
  name: "devis" | "recopie" | "controle" | "pack";
  className?: string;
}) {
  // Aplats en bleu pâle (info-bg) + détails accent : les pictos doivent LIRE
  // comme des dessins, pas se confondre avec de simples icônes au trait.
  const commun = {
    viewBox: "0 0 48 48",
    className,
    "aria-hidden": true,
    fill: "none" as const,
    stroke: "#16202b",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    xmlns: "http://www.w3.org/2000/svg",
  };

  if (name === "devis") {
    return (
      <svg {...commun}>
        {/* Feuille de devis, coin corné, avec flèche d'envoi */}
        <path d="M12 9 h15 l9 9 v21 a2 2 0 0 1-2 2 H12 a2 2 0 0 1-2-2 V11 a2 2 0 0 1 2-2 Z" fill="#e9edf4" />
        <path d="M27 9 v9 h9" fill="#9db0cf" />
        <path d="M17 26 h11 M17 31 h14 M17 36 h8" stroke="#35507f" />
      </svg>
    );
  }
  if (name === "recopie") {
    return (
      <svg {...commun}>
        {/* Deux feuilles : recopie d'une pièce vers le dossier */}
        <rect x="9" y="11" width="21" height="27" rx="2.5" fill="#9db0cf" />
        <rect x="18" y="17" width="21" height="27" rx="2.5" fill="#e9edf4" />
        <path d="M23 30 l4 4 8-9" stroke="#35507f" />
      </svg>
    );
  }
  if (name === "controle") {
    return (
      <svg {...commun}>
        {/* Loupe sur une feuille : le contrôle */}
        <path d="M12 8 h15 l7 7 v13 M32 40 H12 a2 2 0 0 1-2-2 V10 a2 2 0 0 1 2-2" fill="#e9edf4" />
        <path d="M27 8 v7 h7" fill="#9db0cf" />
        <circle cx="29" cy="31" r="8" fill="#fbf9f3" stroke="#35507f" />
        <path d="M35 37 l6 6" stroke="#35507f" strokeWidth="2.8" />
      </svg>
    );
  }
  // pack
  return (
    <svg {...commun}>
      {/* Chemise cartonnée cochée : le pack livré */}
      <path d="M7 16 a2 2 0 0 1 2-2 h9 l4 4 h18 a2 2 0 0 1 2 2 v18 a2 2 0 0 1-2 2 H9 a2 2 0 0 1-2-2 Z" fill="#e9edf4" />
      <path d="M8 22 h32" stroke="#9db0cf" />
      <path d="M19 32 l4 4 8-9" stroke="#2d6a4f" strokeWidth="2.8" />
    </svg>
  );
}
