import type { Metadata } from "next";

import { RefusPage } from "@/components/refus/refus-page";
import { getMotifsPublies, motifsPourAide } from "@/lib/refus/motifs-loader";
import { PAGE_CEE } from "@/lib/refus/pages";
import { publicMetadata } from "@/lib/seo/site";

export const metadata: Metadata = publicMetadata({
  path: PAGE_CEE.path,
  title: PAGE_CEE.metaTitle,
  description: PAGE_CEE.metaDescription,
  type: "article",
});

export default async function CeeRejetePage() {
  const motifs = await getMotifsPublies();
  return <RefusPage contenu={PAGE_CEE} motifs={motifsPourAide(motifs, "cee")} />;
}
