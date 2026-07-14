import type { Metadata } from "next";

export const SITE_URL = "https://dossimo.app";
export const SITE_NAME = "Dossimo";
export const SITE_TITLE = "Dossimo · dossiers MaPrimeRénov' & CEE conformes";
export const SITE_DESCRIPTION =
  "Envoyez votre devis : Dossimo monte votre dossier MaPrimeRénov' ou CEE, le vérifie et vous rend le pack prêt à déposer. Sans mandataire, vous gardez client et prime.";

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
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
