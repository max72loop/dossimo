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

/**
 * Scène « maison + artisan » en aplats, pour habiller la section des garanties.
 * Elle porte un `role="img"` et un `aria-label` : c'est une vraie illustration,
 * pas un simple filet, mais tout ce qu'elle raconte est déjà dans le texte
 * voisin. Le seul vert est le badge de conformité (usage réservé de la charte).
 */
export function MaisonArtisan({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 260"
      className={className}
      role="img"
      aria-label="Une maison rénovée marquée conforme, à côté d’un artisan avec sa fiche de contrôle."
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Panneau de fond crème */}
      <rect x="0" y="0" width="360" height="260" rx="20" fill="#f3f0e9" />
      {/* Sol : ombre douce sous la maison */}
      <ellipse cx="150" cy="224" rx="120" ry="12" fill="#16202b" opacity="0.06" />

      {/* Maison */}
      <g>
        {/* Corps */}
        <rect x="64" y="120" width="150" height="100" rx="4" fill="#fbf9f3" stroke="#16202b" strokeWidth="3" />
        {/* Toit */}
        <path d="M52 122 L139 66 L226 122 Z" fill="#35507f" stroke="#16202b" strokeWidth="3" strokeLinejoin="round" />
        {/* Cheminée */}
        <rect x="188" y="78" width="16" height="26" fill="#2a3f65" stroke="#16202b" strokeWidth="3" strokeLinejoin="round" />
        {/* Porte */}
        <rect x="96" y="166" width="36" height="54" rx="3" fill="#35507f" stroke="#16202b" strokeWidth="3" />
        <circle cx="124" cy="194" r="2.5" fill="#f3f0e9" />
        {/* Fenêtre */}
        <rect x="150" y="142" width="44" height="38" rx="3" fill="#9db0cf" stroke="#16202b" strokeWidth="3" />
        <path d="M172 142 V180 M150 161 H194" stroke="#16202b" strokeWidth="2.5" />
        {/* Badge conformité */}
        <circle cx="210" cy="118" r="18" fill="#e7f1ea" stroke="#2d6a4f" strokeWidth="3" />
        <path d="M202 118 l5 5 9-10" fill="none" stroke="#2d6a4f" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Artisan */}
      <g>
        {/* Buste */}
        <path d="M258 220 v-30 a24 24 0 0 1 48 0 v30 Z" fill="#16202b" />
        {/* Tête */}
        <circle cx="282" cy="150" r="17" fill="#9db0cf" stroke="#16202b" strokeWidth="3" />
        {/* Casque de chantier */}
        <path d="M263 150 a19 19 0 0 1 38 0 Z" fill="#35507f" stroke="#16202b" strokeWidth="3" strokeLinejoin="round" />
        <rect x="261" y="149" width="42" height="5" rx="2.5" fill="#35507f" stroke="#16202b" strokeWidth="3" />
        {/* Fiche de contrôle tenue en main */}
        <rect x="240" y="188" width="34" height="42" rx="3" fill="#fbf9f3" stroke="#16202b" strokeWidth="3" />
        <path d="M247 200 h20 M247 209 h20 M247 218 h14" stroke="#9db0cf" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
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
  const commun = {
    viewBox: "0 0 48 48",
    className,
    "aria-hidden": true,
    fill: "none" as const,
    stroke: "#16202b",
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    xmlns: "http://www.w3.org/2000/svg",
  };

  if (name === "devis") {
    return (
      <svg {...commun}>
        {/* Feuille de devis, coin corné */}
        <path d="M14 8 h14 l8 8 v24 a2 2 0 0 1-2 2 H14 a2 2 0 0 1-2-2 V10 a2 2 0 0 1 2-2 Z" fill="#fbf9f3" />
        <path d="M28 8 v8 h8" />
        <path d="M18 24 h12 M18 30 h12 M18 36 h8" stroke="#9db0cf" />
      </svg>
    );
  }
  if (name === "recopie") {
    return (
      <svg {...commun}>
        {/* Deux feuilles : recopie d'une pièce vers le dossier */}
        <rect x="10" y="12" width="20" height="26" rx="2" fill="#e9edf4" />
        <rect x="18" y="18" width="20" height="26" rx="2" fill="#fbf9f3" />
        <path d="M23 30 l4 4 7-8" stroke="#35507f" />
      </svg>
    );
  }
  if (name === "controle") {
    return (
      <svg {...commun}>
        {/* Loupe sur une feuille : le contrôle */}
        <path d="M12 8 h16 l6 6 v14" fill="#fbf9f3" />
        <path d="M12 8 a2 2 0 0 0-2 2 v28 a2 2 0 0 0 2 2 h9" fill="#fbf9f3" />
        <path d="M28 8 v6 h6" />
        <circle cx="30" cy="32" r="7" fill="#e9edf4" stroke="#35507f" />
        <path d="M35 37 l5 5" stroke="#35507f" />
      </svg>
    );
  }
  // pack
  return (
    <svg {...commun}>
      {/* Chemise cartonnée cochée : le pack livré */}
      <path d="M8 16 a2 2 0 0 1 2-2 h9 l4 4 h17 a2 2 0 0 1 2 2 v18 a2 2 0 0 1-2 2 H10 a2 2 0 0 1-2-2 Z" fill="#fbf9f3" />
      <path d="M20 30 l4 4 8-9" stroke="#2d6a4f" />
    </svg>
  );
}
