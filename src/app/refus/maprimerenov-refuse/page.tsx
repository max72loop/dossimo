import type { Metadata } from "next";

import { RefusPage } from "@/components/refus/refus-page";
import { getMotifsPublies, motifsPourAide } from "@/lib/refus/motifs-loader";
import { PAGE_MPR } from "@/lib/refus/pages";
import { publicMetadata } from "@/lib/seo/site";

export const metadata: Metadata = publicMetadata({
  path: PAGE_MPR.path,
  title: PAGE_MPR.metaTitle,
  description: PAGE_MPR.metaDescription,
  type: "article",
});

export default async function MaPrimeRenovRefusePage() {
  const motifs = await getMotifsPublies();
  return <RefusPage contenu={PAGE_MPR} motifs={motifsPourAide(motifs, "maprimerenov")} />;
}
