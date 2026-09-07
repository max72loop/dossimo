/**
 * Ordre éditorial des familles de guides. Il pilote l'affichage du hub `/guides`
 * (page pilier) et le regroupement dans le menu. Ajouter une catégorie ici suffit
 * à la faire apparaître ; un guide qui pointe une catégorie absente de cette liste
 * ne serait jamais rendu, donc les deux doivent rester synchronisés.
 */
export const GUIDE_CATEGORIES = [
  // En tête du hub volontairement : ces pages sont datées et périssables, elles
  // ne valent que tant que l'échéance est proche. Une actualité reléguée en bas
  // de page arrive au lecteur après la date qu'elle annonce.
  "Actualités",
  // Pages dérivées de `regles_metier` (cf. `gestes.ts`) : elles répondent à
  // l'intention « mon geste » (« conditions BAR-TH-171 », « pièces PAC
  // air/eau »), pas « ma méthode ». Elles ne vivent pas dans `guides`, qui
  // reste l'éditorial écrit à la main.
  //
  // Remontées en deuxième position le 2026-09-07. Elles étaient en queue parce
  // qu'aucune n'était publiée ; la place qu'on leur donnait ne coûtait donc
  // rien. Dès qu'elles existent, l'ordre doit suivre ce que `gestes.ts` dit
  // déjà de l'intention de l'artisan : il cherche son geste avant la méthode.
  "Par geste",
  "Monter le dossier",
  "Devis & conformité",
  "Refus & prévention",
  "Déléguer votre dossier",
] as const;

export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

export interface SeoGuide {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  category: GuideCategory;
  /**
   * Date de dernière vérification éditoriale, au format ISO `AAAA-MM-JJ`. Source
   * unique pour l'affichage (« Vérifié le… »), le JSON-LD `dateModified` et le
   * `lastModified` du sitemap : la faire vivre ici évite les dates codées en dur
   * qui « périment » le contenu aux yeux de Google.
   */
  updated: string;
  intro: string;
  /**
   * Illustration d'en-tête optionnelle. Purement additive : un guide sans `hero`
   * garde exactement son en-tête d'origine (texte pleine largeur). Quand elle est
   * présente, l'en-tête passe en deux colonnes (texte + visuel) sur grand écran.
   * `src` pointe un actif statique de `public/` (SVG de marque de préférence),
   * `alt` décrit la scène pour l'accessibilité et n'est jamais vide.
   */
  hero?: { src: string; alt: string };
  /**
   * Prose longue optionnelle, rendue juste après l'introduction. Sert à donner de la
   * profondeur éditoriale (le « pourquoi ») là où la checklist ne donne que le « quoi ».
   * Un guide sans `sections` garde exactement son rendu d'origine : le champ est
   * additif, jamais requis. Chaque section porte un `heading` (h2 serif) et ses
   * paragraphes.
   */
  sections?: Array<{ heading: string; paragraphs: string[] }>;
  checklist: Array<{ title: string; text: string }>;
  errors: string[];
  example: { before: string; after: string };
  /**
   * Questions fréquentes optionnelles. Rendues visiblement ET exposées en JSON-LD
   * `FAQPage` (rich snippets Google). N'ajouter le champ que si les réponses sont
   * réellement affichées : le balisage FAQ doit refléter le contenu visible.
   */
  faq?: Array<{ question: string; answer: string }>;
  /**
   * Renvois sortants vers des pages du site qui ne sont PAS des guides, rendus
   * en fin d'article. Champ optionnel et additif : un guide sans `voirAussi`
   * garde exactement son rendu.
   *
   * Il existe pour le maillage croisé avec le cluster « refus » : un artisan qui
   * lit un guide de prévention vient souvent de se prendre un refus, et l'inverse
   * est vrai. Ce maillage passe par une donnée du guide, jamais par un bloc codé
   * en dur dans `guide-page.tsx`, qui coifferait alors les dix guides pour n'en
   * concerner que trois (docs/cluster-refus.md § 3.5).
   */
  voirAussi?: Array<{ label: string; href: string; description: string }>;
  /**
   * Second bloc de renvois sortants, distinct de `voirAussi` : celui-ci porte son
   * propre titre au lieu du titre fixe « Le refus est déjà tombé ? » du composant,
   * pour ne pas coiffer des liens qui n'ont rien à voir avec un refus (ex. renvoi
   * vers `/exemple` et `/tarifs` depuis une page « déléguer votre dossier »).
   * Champ additif : un guide sans `pourAllerPlusLoin` garde son rendu d'origine.
   */
  pourAllerPlusLoin?: {
    heading: string;
    liens: Array<{ label: string; href: string; description: string }>;
  };
  /**
   * Lien d'accès rapide affiché juste sous l'intro, en tête de page. Pensé pour
   * les pages « actualité » dont la requête est en réalité navigationnelle (ex.
   * « mon compte anah ») : additif, un guide sans ce champ garde son en-tête
   * d'origine.
   */
  accesRapide?: { label: string; href: string };
  sources: Array<{ label: string; href: string }>;
}
