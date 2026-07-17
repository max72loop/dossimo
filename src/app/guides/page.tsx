import { ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { formatGuideDate, guideList, guidesByCategory } from "@/lib/seo/guides";
import { publicMetadata, SITE_URL } from "@/lib/seo/site";

const TITLE = "Guides MaPrimeRénov' & CEE pour artisans RGE";
const DESCRIPTION =
  "Les guides Dossimo pour monter des dossiers MaPrimeRénov' et CEE conformes : devis, mentions obligatoires, contrôles de cohérence et prévention des refus, sources officielles à l'appui.";

export const metadata = publicMetadata({
  path: "/guides",
  title: TITLE,
  description: DESCRIPTION,
});

/**
 * Page pilier des guides. Elle relie tous les guides entre eux (maillage interne)
 * et donne à Google une entrée thématique unique, là où chaque guide vivait jusqu'ici
 * en route plate isolée. Les guides restent à leur URL d'origine : ce hub les fédère,
 * il ne les déplace pas.
 */
export default function GuidesHubPage() {
  const groups = guidesByCategory();
  const hubUrl = `${SITE_URL}/guides`;
  // Dates ISO : le tri lexical suffit pour retrouver la vérification la plus récente.
  const derniereVerification = guideList
    .map((guide) => guide.updated)
    .sort()
    .at(-1)!;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: TITLE,
      description: DESCRIPTION,
      url: hubUrl,
      inLanguage: "fr-FR",
      isPartOf: { "@type": "WebSite", name: "Dossimo", url: SITE_URL },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: guideList.map((guide, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE_URL}/${guide.slug}`,
          name: guide.title,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Guides", item: hubUrl },
      ],
    },
  ];

  return (
    <div className="flex min-h-full flex-col bg-papier">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className="flex-1">
        <header className="border-b border-filigrane bg-blanc-casse">
          <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
            <nav aria-label="Fil d’Ariane" className="text-sm text-ardoise">
              <Link href="/" className="underline underline-offset-4 hover:text-encre">Accueil</Link>
              <span aria-hidden="true"> / </span>
              <span>Guides</span>
            </nav>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-tampon">
              Ressources Dossimo · artisans RGE
            </p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-encre sm:text-5xl">
              Monter des dossiers MaPrimeRénov’ et CEE qui passent
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-ardoise">
              Des guides pratiques et sourcés pour sécuriser chaque pièce avant le dépôt.
              Nous ne déposons jamais le dossier et ne touchons jamais la prime : ces guides
              vous aident à garder la main sur l’un comme sur l’autre.
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
          {groups.map((group) => (
            <section key={group.category} aria-labelledby={group.category} className="mt-14 first:mt-0">
              <h2
                id={group.category}
                className="font-serif text-3xl font-semibold text-encre"
              >
                {group.category}
              </h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {group.guides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/${guide.slug}`}
                    className="group flex flex-col rounded border border-filigrane bg-blanc-casse p-6 transition hover:border-encre"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tampon">
                      {guide.eyebrow}
                    </p>
                    <h3 className="mt-3 font-serif text-xl font-semibold text-encre group-hover:text-tampon">
                      {guide.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-ardoise">
                      {guide.description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-encre">
                      Lire le guide
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <p className="mt-14 flex items-center gap-2 border-t border-filigrane pt-8 text-sm text-ardoise">
            <ShieldCheck className="h-5 w-5 shrink-0 text-succes" aria-hidden="true" />
            Guides vérifiés le {formatGuideDate(derniereVerification)} et adossés aux sources
            officielles (France Rénov’, Anah, Service Public, catalogue CEE).
          </p>

          <aside className="mt-14 rounded bg-encre p-7 text-papier sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-papier/70">Contrôle Dossimo</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold">Vérifiez votre propre devis gratuitement.</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-papier/80">
              Ajoutez le PDF ou une photo : Dossimo relève les informations lisibles et vous
              montre le premier point à confirmer avant le dépôt.
            </p>
            <Link
              href="/demo"
              className="mt-7 inline-flex items-center gap-2 rounded bg-terre-cuite px-5 py-3 font-medium text-blanc-casse transition hover:bg-terre-cuite-hover"
            >
              Analyser mon devis <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
