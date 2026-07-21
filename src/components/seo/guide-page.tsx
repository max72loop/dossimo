import { ArrowRight, CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { formatGuideDate, guideList, type SeoGuide } from "@/lib/seo/guides";
import { SITE_URL } from "@/lib/seo/site";

export function SeoGuidePage({ guide }: { guide: SeoGuide }) {
  const pageUrl = `${SITE_URL}/${guide.slug}`;
  const dateVerification = formatGuideDate(guide.updated);
  const jsonLd: Array<Record<string, unknown>> = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      mainEntityOfPage: pageUrl,
      datePublished: guide.updated,
      dateModified: guide.updated,
      inLanguage: "fr-FR",
      author: { "@type": "Organization", name: "Dossimo", url: SITE_URL },
      publisher: {
        "@type": "Organization",
        name: "Dossimo",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.png` },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides` },
        { "@type": "ListItem", position: 3, name: guide.title, item: pageUrl },
      ],
    },
  ];

  // FAQPage à part : ne l'émettre que si des questions sont réellement affichées,
  // sinon le balisage ne refléterait pas le contenu visible de la page.
  if (guide.faq?.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guide.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }

  return (
    <div className="flex min-h-full flex-col bg-papier">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className="flex-1">
        <article>
          <header className="border-b border-filigrane bg-blanc-casse">
            <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
              <nav aria-label="Fil d’Ariane" className="text-sm text-ardoise">
                <Link href="/" className="underline underline-offset-4 hover:text-encre">Accueil</Link>
                <span aria-hidden="true"> / </span>
                <Link href="/guides" className="underline underline-offset-4 hover:text-encre">Guides</Link>
                <span aria-hidden="true"> / </span>
                <span className="text-encre-claire">{guide.category}</span>
              </nav>
              <div className={guide.hero ? "mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_360px]" : "mt-8"}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tampon">{guide.eyebrow}</p>
                  <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-encre sm:text-5xl">{guide.title}</h1>
                  <p className="mt-5 max-w-3xl text-lg leading-relaxed text-ardoise">{guide.intro}</p>
                  <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-encre-claire">
                    <span>Vérifié le {dateVerification}</span>
                    <span>Relecture éditoriale : équipe Dossimo</span>
                  </div>
                </div>
                {guide.hero ? (
                  // eslint-disable-next-line @next/next/no-img-element -- SVG statique de marque, rien à optimiser (cf. depot-client.tsx)
                  <img src={guide.hero.src} alt={guide.hero.alt} width={460} height={380} className="mx-auto mt-4 h-auto w-full max-w-xs sm:max-w-sm lg:mx-0 lg:mt-0 lg:max-w-md" loading="eager" />
                ) : null}
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
            {guide.sections?.length ? (
              <div className="mb-16 max-w-3xl space-y-12 border-b border-filigrane pb-14">
                {guide.sections.map((section) => (
                  <section key={section.heading} aria-label={section.heading}>
                    <h2 className="font-serif text-3xl font-semibold text-encre">{section.heading}</h2>
                    <div className="mt-5 space-y-4">
                      {section.paragraphs.map((paragraph, index) => (
                        <p key={index} className="text-lg leading-relaxed text-ardoise">{paragraph}</p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : null}

            <section aria-labelledby="checklist">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tampon">Contrôle avant dépôt</p>
              <h2 id="checklist" className="mt-2 font-serif text-3xl font-semibold text-encre">La checklist de relecture</h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {guide.checklist.map((item, index) => (
                  <div key={item.title} className="rounded-2xl bg-blanc-casse p-5 shadow-md">
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-succes-bg font-mono text-xs font-semibold text-encre">{index + 1}</span>
                      <div>
                        <h3 className="font-semibold text-encre">{item.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-ardoise">{item.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby="erreurs" className="mt-16 border-t border-filigrane pt-14">
              <h2 id="erreurs" className="font-serif text-3xl font-semibold text-encre">Les erreurs à repérer en priorité</h2>
              <ul className="mt-7 space-y-3">
                {guide.errors.map((error) => (
                  <li key={error} className="flex gap-3 text-ardoise">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-succes" aria-hidden="true" />
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="exemple" className="mt-16 rounded border-2 border-encre bg-papier-fonce p-6 sm:p-8">
              <h2 id="exemple" className="font-serif text-3xl font-semibold text-encre">Exemple de reformulation</h2>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <div className="rounded bg-blanc-casse p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-avertissement">Trop vague</p>
                  <p className="mt-3 leading-relaxed text-ardoise">{guide.example.before}</p>
                </div>
                <div className="rounded bg-succes-bg p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-encre">Plus contrôlable</p>
                  <p className="mt-3 leading-relaxed text-encre">{guide.example.after}</p>
                </div>
              </div>
            </section>

            {guide.faq?.length ? (
              <section aria-labelledby="faq" className="mt-16 border-t border-filigrane pt-14">
                <h2 id="faq" className="font-serif text-3xl font-semibold text-encre">Questions fréquentes</h2>
                <dl className="mt-8 max-w-3xl space-y-8">
                  {guide.faq.map((item) => (
                    <div key={item.question}>
                      <dt className="font-serif text-xl font-semibold text-encre">{item.question}</dt>
                      <dd className="mt-3 text-lg leading-relaxed text-ardoise">{item.answer}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            <section aria-labelledby="sources" className="mt-16 border-t border-filigrane pt-14">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-7 w-7 text-succes" aria-hidden="true" />
                <h2 id="sources" className="font-serif text-3xl font-semibold text-encre">Sources officielles</h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ardoise">Les règles évoluent. Ces sources ont été vérifiées le {dateVerification} et restent prioritaires sur ce guide.</p>
              <ul className="mt-6 space-y-3">
                {guide.sources.map((source) => (
                  <li key={source.href}>
                    <a href={source.href} target="_blank" rel="noreferrer" className="inline-flex items-start gap-2 font-medium text-tampon underline underline-offset-4 hover:text-encre">
                      {source.label}<ExternalLink className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="autres-guides" className="mt-16 border-t border-filigrane pt-14">
              <h2 id="autres-guides" className="font-serif text-3xl font-semibold text-encre">Poursuivre la vérification</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {guideList.filter((item) => item.slug !== guide.slug).map((item) => (
                  <Link key={item.slug} href={`/${item.slug}`} className="group rounded-2xl bg-blanc-casse p-5 shadow-md transition hover:shadow-lg">
                    <span className="font-semibold text-encre group-hover:text-tampon">{item.title}</span>
                    <span className="mt-2 block text-sm leading-relaxed text-ardoise">{item.description}</span>
                  </Link>
                ))}
              </div>
            </section>

            <aside className="mt-16 rounded bg-encre p-7 text-papier sm:p-9">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-papier/70">Contrôle Dossimo</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold">Vérifiez votre propre devis gratuitement.</h2>
              <p className="mt-4 max-w-2xl leading-relaxed text-papier/80">Ajoutez le PDF ou une photo : Dossimo relève les informations lisibles et vous montre le premier point à confirmer avant le dépôt.</p>
              <Link href="/demo" className="mt-7 inline-flex items-center gap-2 rounded bg-accent px-5 py-3 font-medium text-blanc-casse transition hover:bg-accent-hover">
                Analyser mon devis <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </aside>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
