import type { Metadata } from "next";

export const SITE_URL = "https://dossimo.app";
export const SITE_NAME = "Dossimo";
/**
 * Le title porte les mots réellement tapés par les artisans, la marque en queue.
 * Personne ne cherche encore « Dossimo » : ouvrir sur le nom gaspillait la partie
 * du title que Google pondère le plus. Sert aussi à l'OpenGraph et à la carte
 * Twitter, donc toute retouche se propage aux partages LinkedIn et WhatsApp.
 */
export const SITE_TITLE =
  "Dossiers MaPrimeRénov' et CEE conformes pour artisans RGE · Dossimo";
export const SITE_DESCRIPTION =
  "Envoyez votre devis : Dossimo monte votre dossier MaPrimeRénov' ou CEE, le vérifie et vous rend le pack prêt à déposer. Sans mandataire, vous gardez client et prime.";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const EDITORIAL_ORGANIZATION_URL = `${SITE_URL}/a-propos`;
export const PUBLISHING_PRINCIPLES_URL = `${SITE_URL}/methode-editoriale`;

/**
 * Carte de partage (routes générées par `app/opengraph-image.tsx` et
 * `twitter-image.tsx`). La homepage en hérite via le fichier du même segment,
 * mais une sous-page qui redéfinit `openGraph` en écrase l'objet ENTIER
 * (fusion superficielle Next) et perdrait l'image : on la ré-injecte donc ici,
 * dans le helper commun à toutes les sous-pages.
 */
const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME };
const TWITTER_IMAGE = "/twitter-image";

/**
 * Next recommande d'échapper `<` dans les payloads JSON-LD afin qu'une valeur
 * éditoriale ne puisse jamais refermer la balise script.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function editorialOrganizationSchema() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/icon2.png`,
      width: 512,
      height: 512,
    },
    description:
      "Service indépendant d’aide à la préparation et au contrôle de conformité de dossiers MaPrimeRénov’ et CEE pour les artisans RGE.",
    /**
     * Rattachement de l'entité à son domaine. « Dossimo » est un nom disputé —
     * une variété de tomate, un cheval de course, une société britannique
     * homonyme — et rien n'indiquait à une machine de quel Dossimo il s'agit.
     * `sameAs` serait le rattachement le plus fort, mais il exige des profils
     * publics qui n'existent pas encore : y mettre des URL inventées serait pire
     * que de n'avoir rien. `legalName` est volontairement absent (décision
     * DESIGN.md du 2026-07-22 : aucune donnée nominative dans le JSON-LD).
     */
    knowsAbout: [
      "MaPrimeRénov’",
      "Certificats d’économies d’énergie (CEE)",
      "Conformité des dossiers d’aide à la rénovation énergétique",
      "Artisans RGE",
    ],
    areaServed: { "@type": "Country", name: "France" },
    publishingPrinciples: PUBLISHING_PRINCIPLES_URL,
  };
}

export function publicMetadata({
  path,
  title,
  description,
  type = "website",
  absoluteTitle = false,
}: {
  path: string;
  title: string;
  description: string;
  type?: "website" | "article";
  absoluteTitle?: boolean;
}): Metadata {
  const url = new URL(path, SITE_URL).toString();
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      locale: "fr_FR",
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description, images: [TWITTER_IMAGE] },
  };
}
