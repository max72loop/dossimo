import {
  EDITORIAL_ORGANIZATION_URL,
  ORGANIZATION_ID,
  PUBLISHING_PRINCIPLES_URL,
  SITE_URL,
} from "@/lib/seo/site";

/**
 * Balisage des pages du cluster « refus ».
 *
 * Même contrat que `guide-page.tsx` : `Article` + `BreadcrumbList` toujours,
 * `FAQPage` UNIQUEMENT si des questions sont réellement affichées. Un balisage
 * FAQ qui ne reflète pas le contenu visible est une faute vis-à-vis de Google
 * autant qu'une promesse fausse au lecteur.
 *
 * Le fil d'Ariane du cluster a un niveau de plus que celui des guides : les
 * pages motif vivent sous `/refus`, qui est lui-même une page réelle.
 */

export interface FilAriane {
  nom: string;
  path: string;
}

export function articleEtFilAriane({
  path,
  titre,
  description,
  updated,
  fil,
}: {
  path: string;
  titre: string;
  description: string;
  updated: string;
  /** Étapes intermédiaires, entre l'accueil et la page courante. */
  fil: readonly FilAriane[];
}): Array<Record<string, unknown>> {
  const pageUrl = `${SITE_URL}${path}`;
  const etapes = [
    { nom: "Accueil", path: "" },
    ...fil,
    { nom: titre, path },
  ];

  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: titre,
      description,
      mainEntityOfPage: pageUrl,
      datePublished: updated,
      dateModified: updated,
      inLanguage: "fr-FR",
      image: `${SITE_URL}/opengraph-image`,
      author: {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "Dossimo",
        url: EDITORIAL_ORGANIZATION_URL,
      },
      publisher: {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "Dossimo",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/icon2.png` },
      },
      publishingPrinciples: PUBLISHING_PRINCIPLES_URL,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: etapes.map((etape, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: etape.nom,
        item: `${SITE_URL}${etape.path}`,
      })),
    },
  ];
}

export function faqPage(faq: readonly { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
