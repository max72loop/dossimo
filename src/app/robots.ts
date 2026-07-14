import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Espace artisan et back-office : rien à indexer, et les URLs de dossiers
      // portent des identifiants qui n'ont pas à circuler.
      disallow: ["/dossiers", "/admin", "/api", "/depot", "/factures"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
