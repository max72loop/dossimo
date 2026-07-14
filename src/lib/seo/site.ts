import type { Metadata } from "next";

export const SITE_URL = "https://dossimo.app";
export const SITE_NAME = "Dossimo";
export const SITE_TITLE = "Dossimo · dossiers MaPrimeRénov' & CEE conformes";
export const SITE_DESCRIPTION =
  "Dossimo aide les artisans RGE à produire des dossiers MaPrimeRénov' et CEE conformes et anti-refus, sans mandataire : vous gardez votre client et votre prime.";

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
