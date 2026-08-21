import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { actualites, formatGuideDate } from "@/lib/seo/guides";
import {
  EDITORIAL_ORGANIZATION_URL,
  ORGANIZATION_ID,
  publicMetadata,
  PUBLISHING_PRINCIPLES_URL,
  serializeJsonLd,
  SITE_URL,
} from "@/lib/seo/site";

const TITLE = "Évolutions MaPrimeRénov’ et CEE, suivi à jour";
const DESCRIPTION =
  "Chaque évolution réglementaire MaPrimeRénov’ et CEE qui concerne un artisan RGE, datée dans le texte plutôt que dans l’URL, au même endroit et toujours à jour.";
const PAGE_URL = `${SITE_URL}/actualites-maprimerenov-cee`;

export const metadata: Metadata = publicMetadata({
  path: "/actualites-maprimerenov-cee",
  title: `${TITLE} · Dossimo`,
  description: DESCRIPTION,
});

/**
 * Page pilier permanente du suivi réglementaire. Chaque actualité est une
 * section ancrée de CETTE page, jamais une URL à elle : une échéance passée
 * reste consultable sans laisser derrière elle une adresse datée que Google
 * finit par considérer périmée. Les anciennes URL par actualité redirigent en
 * 301 vers l'ancre correspondante (`next.config.ts`).
 */
export default function ActualitesPage() {
  const derniereVerification = actualites.map((item) => item.updated).sort().at(-1)!;

  const jsonLd: Array<Record<string, unknown>> = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: TITLE,
      description: DESCRIPTION,
      url: PAGE_URL,
      inLanguage: "fr-FR",
      isPartOf: { "@type": "WebSite", name: "Dossimo", url: SITE_URL },
      publisher: { "@id": ORGANIZATION_ID },
      dateModified: derniereVerification,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: actualites.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${PAGE_URL}#${item.slug}`,
          name: item.title,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides` },
        { "@type": "ListItem", position: 3, name: TITLE, item: PAGE_URL },
      ],
    },
    ...actualites.map((item) => ({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: item.title,
      description: item.description,
      mainEntityOfPage: `${PAGE_URL}#${item.slug}`,
      datePublished: item.updated,
      dateModified: item.updated,
      inLanguage: "fr-FR",
      author: { "@type": "Organization", "@id": ORGANIZATION_ID, name: "Dossimo", url: EDITORIAL_ORGANIZATION_URL },
      publisher: { "@id": ORGANIZATION_ID },
      publishingPrinciples: PUBLISHING_PRINCIPLES_URL,
    })),
    ...actualites
      .filter((item) => item.faq?.length)
      .map((item) => ({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: item.faq!.map((faqItem) => ({
          "@type": "Question",
          name: faqItem.question,
          acceptedAnswer: { "@type": "Answer", text: faqItem.answer },
        })),
      })),
  ];

  return (
    <div className="flex min-h-full flex-col bg-papier">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <SiteHeader />
      <main className="flex-1">
        <header className="border-b border-filigrane bg-blanc-casse">
          <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
            <nav aria-label="Fil d’Ariane" className="text-sm text-ardoise">
              <Link href="/" className="underline underline-offset-4 hover:text-encre">Accueil</Link>
              <span aria-hidden="true"> / </span>
              <Link href="/guides" className="underline underline-offset-4 hover:text-encre">Guides</Link>
            </nav>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-tampon">Page pilier permanente</p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-encre sm:text-5xl">{TITLE}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-ardoise">{DESCRIPTION}</p>
            <p className="mt-7 text-sm text-encre-claire">Dernière mise à jour le {formatGuideDate(derniereVerification)}</p>
            <nav aria-label="Sommaire des actualités" className="mt-8 flex flex-col gap-2">
              {actualites.map((item) => (
                <a key={item.slug} href={`#${item.slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-encre underline underline-offset-4 hover:text-tampon">
                  {item.eyebrow.replace(/^Actualité réglementaire\s*·\s*/, "")} — {item.title}
                </a>
              ))}
            </nav>
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
          {actualites.map((item, index) => (
            <article key={item.slug} id={item.slug} className={index > 0 ? "mt-20 scroll-mt-24 border-t border-filigrane pt-16" : "scroll-mt-24"}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tampon">{item.eyebrow}</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-encre sm:text-4xl">{item.title}</h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ardoise">{item.intro}</p>
              {item.accesRapide ? (
                <Link
                  href={item.accesRapide.href}
                  target={item.accesRapide.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.accesRapide.href.startsWith("http") ? "noreferrer" : undefined}
                  className="mt-6 inline-flex items-center gap-2 rounded border-2 border-encre bg-blanc-casse px-5 py-3 font-medium text-encre transition hover:bg-papier-fonce"
                >
                  {item.accesRapide.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}
              <p className="mt-6 text-sm text-encre-claire">Vérifié le {formatGuideDate(item.updated)}</p>

              {item.sections?.length ? (
                <div className="mt-10 space-y-10">
                  {item.sections.map((section) => (
                    <section key={section.heading} aria-label={section.heading}>
                      <h3 className="font-serif text-2xl font-semibold text-encre">{section.heading}</h3>
                      <div className="mt-4 space-y-4">
                        {section.paragraphs.map((paragraph, pIndex) => (
                          <p key={pIndex} className="text-lg leading-relaxed text-ardoise">{paragraph}</p>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : null}

              {item.checklist.length ? (
                <section className="mt-10">
                  <h3 className="font-serif text-2xl font-semibold text-encre">Ce qu’il faut retenir</h3>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {item.checklist.map((checklistItem, itemIndex) => (
                      <div key={checklistItem.title} className="rounded-2xl bg-blanc-casse p-5 shadow-md">
                        <div className="flex items-start gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-succes-bg font-mono text-xs font-semibold text-encre">{itemIndex + 1}</span>
                          <div>
                            <h4 className="font-semibold text-encre">{checklistItem.title}</h4>
                            <p className="mt-2 text-sm leading-relaxed text-ardoise">{checklistItem.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {item.errors.length ? (
                <section className="mt-10">
                  <h3 className="font-serif text-2xl font-semibold text-encre">Les erreurs les plus fréquentes</h3>
                  <ul className="mt-5 space-y-3">
                    {item.errors.map((error) => (
                      <li key={error} className="flex gap-3 text-ardoise">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-succes" aria-hidden="true" />
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {item.faq?.length ? (
                <section className="mt-10">
                  <h3 className="font-serif text-2xl font-semibold text-encre">Questions fréquentes</h3>
                  <dl className="mt-6 space-y-6">
                    {item.faq.map((faqItem) => (
                      <div key={faqItem.question}>
                        <dt className="font-serif text-lg font-semibold text-encre">{faqItem.question}</dt>
                        <dd className="mt-2 leading-relaxed text-ardoise">{faqItem.answer}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ) : null}

              <section className="mt-10">
                <h3 className="font-serif text-xl font-semibold text-encre">Sources officielles</h3>
                <ul className="mt-4 space-y-2">
                  {item.sources.map((source) => (
                    <li key={source.href}>
                      <a href={source.href} target="_blank" rel="noreferrer" className="inline-flex items-start gap-2 text-sm font-medium text-tampon underline underline-offset-4 hover:text-encre">
                        {source.label}<ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            </article>
          ))}

          <aside className="mt-20 rounded bg-encre p-7 text-papier sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-papier/70">Contrôle Dossimo</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold">Vérifiez votre propre devis gratuitement.</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-papier/80">Ajoutez le PDF ou une photo : Dossimo relève les informations lisibles et vous montre le premier point à confirmer avant le dépôt.</p>
            <Link href="/demo" className="mt-7 inline-flex items-center gap-2 rounded bg-accent px-5 py-3 font-medium text-blanc-casse transition hover:bg-accent-hover">
              Analyser mon devis <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
