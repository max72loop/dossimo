import type { Metadata } from "next";

export const SITE_URL = "https://dossimo.app";
export const SITE_NAME = "Dossimo";
export const SITE_TITLE = "Dossimo · dossiers MaPrimeRénov' & CEE conformes";
export const SITE_DESCRIPTION =
  "Envoyez votre devis : Dossimo monte votre dossier MaPrimeRénov' ou CEE, le vérifie et vous rend le pack prêt à déposer. Sans mandataire, vous gardez client et prime.";

/**
 * Carte de partage (routes générées par `app/opengraph-image.tsx` et
 * `twitter-image.tsx`). La homepage en hérite via le fichier du même segment,
 * mais une sous-page qui redéfinit `openGraph` en écrase l'objet ENTIER
 * (fusion superficielle Next) et perdrait l'image : on la ré-injecte donc ici,
 * dans le helper commun à toutes les sous-pages.
 */
const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME };
const TWITTER_IMAGE = "/twitter-image";

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
