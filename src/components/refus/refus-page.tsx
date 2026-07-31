import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { GuidesPrevention } from "@/components/refus/guides-prevention";
import { LIBELLE_AIDE, type RefusMotif } from "@/lib/refus/motifs-loader";
import { articleEtFilAriane } from "@/lib/refus/jsonld";
import type { RefusPageContenu } from "@/lib/refus/pages";
import { serializeJsonLd } from "@/lib/seo/site";
import { formatGuideDate } from "@/lib/seo/guides";

/**
 * Rendu commun des deux pages ciblées du cluster (`maprimerenov-refuse`,
 * `cee-rejete`). Le contenu vient de `pages.ts`, la liste des motifs liés de la
 * base : une page ciblée n'énumère jamais les motifs en dur, sinon publier un
 * douzième motif demanderait de penser à trois endroits.
 */
export function RefusPage({
  contenu,
  motifs,
}: {
  contenu: RefusPageContenu;
  motifs: readonly RefusMotif[];
}) {
  const jsonLd = articleEtFilAriane({
    path: contenu.path,
    titre: contenu.title,
    description: contenu.metaDescription,
    updated: contenu.updated,
    fil: [{ nom: "Refus", path: "/refus" }],
  });

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <header className="border-b border-filigrane bg-blanc-casse">
        <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
          <nav aria-label="Fil d’Ariane" className="text-sm text-ardoise">
            <Link href="/" className="underline underline-offset-4 hover:text-encre">
              Accueil
            </Link>
            <span aria-hidden="true"> / </span>
            <Link href="/refus" className="underline underline-offset-4 hover:text-encre">
              Refus
            </Link>
          </nav>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-tampon">
            {contenu.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-encre sm:text-5xl">
            {contenu.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-ardoise">{contenu.intro}</p>
          <p className="mt-7 text-sm text-encre-claire">
            Vérifié le {formatGuideDate(contenu.updated)}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="max-w-3xl space-y-12">
          {contenu.sections.map((section) => (
            <section key={section.heading} aria-label={section.heading}>
              <h2 className="font-serif text-3xl font-semibold text-encre">{section.heading}</h2>
              <div className="mt-5 space-y-4">
                {section.paragraphs.map((paragraphe, index) => (
                  <p key={index} className="text-lg leading-relaxed text-ardoise">
                    {paragraphe}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section
          aria-labelledby="a-retenir"
          className="mt-16 rounded border-2 border-encre bg-papier-fonce p-6 sm:p-8"
        >
          <h2 id="a-retenir" className="font-serif text-3xl font-semibold text-encre">
            À retenir
          </h2>
          <ul className="mt-6 space-y-3">
            {contenu.aRetenir.map((point) => (
              <li key={point} className="flex gap-3 text-ardoise">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-succes" aria-hidden="true" />
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {motifs.length > 0 && (
          <section aria-labelledby="motifs-lies" className="mt-16 border-t border-filigrane pt-14">
            <h2 id="motifs-lies" className="font-serif text-3xl font-semibold text-encre">
              Les motifs, un par un
            </h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {motifs.map((motif) => (
                <Link
                  key={motif.slug}
                  href={`/refus/motifs/${motif.slug}`}
                  className="group rounded-2xl bg-blanc-casse p-5 shadow-md transition hover:shadow-lg"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-tampon">
                    {LIBELLE_AIDE[motif.aide]}
                  </span>
                  <span className="mt-2 block font-semibold text-encre group-hover:text-tampon">
                    {motif.libelle}
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-ardoise">
                    {motif.description}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <GuidesPrevention />

        <aside className="mt-16 rounded bg-encre p-7 text-papier sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-papier/70">
            Diagnostic gratuit
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold">
            Vous ne savez pas dans quelle case tombe votre dossier ?
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-papier/80">
            Recopiez le motif tel qu’il est écrit sur la décision. Nous le lisons et nous vous
            répondons par écrit, sans engagement.
          </p>
          <Link
            href="/refus#diagnostic"
            className="mt-7 inline-flex items-center gap-2 rounded bg-accent px-5 py-3 font-medium text-blanc-casse transition hover:bg-accent-hover"
          >
            Décrire mon refus <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </article>
  );
}
