import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MotifPage } from "@/components/refus/motif-page";
import { getMotifParSlug, getMotifsPublies } from "@/lib/refus/motifs-loader";
import { publicMetadata } from "@/lib/seo/site";

/**
 * Pages motif, une par ligne publiée de `refus_motifs`.
 *
 * `dynamicParams = false` : les slugs sont connus à la construction, tout autre
 * chemin répond 404. Sans cela, un slug inventé rendrait une page vide sous une
 * URL indexable, ce qui est exactement ce que le chantier refuse (« une page
 * motif sans contenu ne se classe pas, elle occupe une URL »).
 *
 * Conséquence assumée : publier un douzième motif suppose un redéploiement. Le
 * contenu est éditorial et relu à la main, il ne change pas à l'heure près.
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  const motifs = await getMotifsPublies();
  return motifs.map((motif) => ({ slug: motif.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const motif = await getMotifParSlug(slug);
  if (!motif) return {};
  return publicMetadata({
    path: `/refus/motifs/${motif.slug}`,
    title: motif.metaTitle,
    description: motif.metaDescription,
    type: "article",
  });
}

export default async function MotifRefusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const motifs = await getMotifsPublies();
  const motif = motifs.find((candidat) => candidat.slug === slug);
  if (!motif) notFound();

  // « Le même dispositif » inclut les motifs communs aux deux aides : depuis un
  // motif CEE, un motif transverse est pertinent, l'inverse aussi.
  const autres = motifs.filter(
    (candidat) =>
      candidat.slug !== motif.slug &&
      (candidat.aide === motif.aide ||
        candidat.aide === "les_deux" ||
        motif.aide === "les_deux"),
  );

  return <MotifPage motif={motif} autres={autres} />;
}
