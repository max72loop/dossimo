import Link from "next/link";

import { DECLINAISONS, LOCKUP_VIEWBOX, MOT_SIGNE_D, SYMBOLE_D, type Declinaison } from "@/lib/brand/mark";

/**
 * Logo Dossimo : signature horizontale (symbole + mot-signe), en SVG inline.
 *
 * Source UNIQUE du logo à l'écran. La page de dépôt en avait recopié une version
 * à plat : deux logos pour une marque, c'est la garantie qu'ils divergent
 * (DESIGN.md §1). La géométrie vient de `@/lib/brand/mark`, les couleurs de sa
 * table `DECLINAISONS` : rien n'est décidé ici.
 *
 * Pourquoi du SVG inline et non une `<img src="/brand/dossimo-logo.svg">` : le
 * logo est dans l'en-tête de chaque page, donc dans le premier écran. Une image
 * externe ajoute une requête et un clignotement au chargement, à l'endroit le
 * plus visible du site.
 *
 * Ce module existe séparément de `site-header.tsx` pour une raison de runtime, pas
 * de rangement : le header importe `getCurrentUser`, donc du code `server-only`.
 * Tant que le logo vivait dans le même fichier, un composant client qui affichait
 * simplement le logo faisait entrer tout cela dans son bundle et la page tombait en
 * 500 (« 'server-only' cannot be imported from a Client Component »). Ni `tsc` ni
 * ESLint ne le voient : seul le bundler le refuse, à l'exécution.
 *
 * `hauteur` est un paramètre plutôt qu'une classe passée dans `className` : deux
 * classes Tailwind de même propriété se départagent par l'ordre de la feuille de
 * style, pas par l'ordre de l'attribut, donc surcharger la taille depuis l'extérieur
 * ne marcherait qu'au hasard. Ne jamais descendre sous `h-5` (20 px) : c'est la
 * taille où le mot-signe se referme (`MIN_PX` dans `mark.ts`).
 *
 * `href={null}` rend une signature non cliquable : sur la page de dépôt, le lien
 * emmènerait le bénéficiaire sur la vitrine, en plein milieu de son envoi.
 */
export function Logo({
  className = "",
  variant = "encre",
  hauteur = "h-7",
  href = "/",
}: {
  className?: string;
  /** Une déclinaison par fond. `nuit` pour tout fond encre : le bleu de marque n'y est pas lisible. */
  variant?: Declinaison;
  /** Classe de hauteur Tailwind. La largeur suit le rapport d'aspect. */
  hauteur?: string;
  href?: string | null;
}) {
  const { symbole, motSigne } = DECLINAISONS[variant];

  const signature = (
    <svg
      viewBox={LOCKUP_VIEWBOX}
      className={`${hauteur} w-auto`}
      // Le nom accessible est porté par le lien quand il y en a un ; le doubler
      // ici ferait annoncer « Dossimo Dossimo ».
      {...(href === null ? { role: "img", "aria-label": "Dossimo" } : { "aria-hidden": true })}
    >
      <path fill={symbole} d={SYMBOLE_D} />
      <path fill={motSigne} d={MOT_SIGNE_D} />
    </svg>
  );

  if (href === null) {
    return <span className={`inline-flex items-center ${className}`}>{signature}</span>;
  }
  return (
    <Link href={href} className={`inline-flex items-center ${className}`} aria-label="Dossimo">
      {signature}
    </Link>
  );
}
