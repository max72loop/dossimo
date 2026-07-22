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
