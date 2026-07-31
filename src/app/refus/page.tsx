import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileWarning, Lock, UserRound } from "lucide-react";

import { DiagnosticForm } from "@/components/refus/diagnostic-form";
import { GuidesPrevention } from "@/components/refus/guides-prevention";
import { articleEtFilAriane } from "@/lib/refus/jsonld";
import { LIBELLE_AIDE, getMotifsPublies } from "@/lib/refus/motifs-loader";
import { HUB, PAGES_CIBLEES } from "@/lib/refus/pages";
import { formatGuideDate } from "@/lib/seo/guides";
import { publicMetadata, serializeJsonLd } from "@/lib/seo/site";

export const metadata: Metadata = publicMetadata({
  path: HUB.path,
  title: HUB.metaTitle,
  description: HUB.metaDescription,
  type: "article",
});

/** Les UTM arrivent par la query : c'est la prospection sortante qui amène ici. */
type Params = Promise<Record<string, string | string[] | undefined>>;

function premier(valeur: string | string[] | undefined): string | undefined {
  return Array.isArray(valeur) ? valeur[0] : valeur;
}

export default async function RefusHubPage({ searchParams }: { searchParams: Params }) {
  const [motifs, query] = await Promise.all([getMotifsPublies(), searchParams]);

  const jsonLd = articleEtFilAriane({
    path: HUB.path,
    titre: HUB.title,
    description: HUB.metaDescription,
    updated: HUB.updated,
    fil: [],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <header className="border-b border-filigrane bg-blanc-casse">
        <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tampon">
            {HUB.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-encre sm:text-5xl">
            {HUB.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-ardoise">{HUB.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="#diagnostic"
              className="inline-flex items-center gap-2 rounded bg-accent px-5 py-3 text-sm font-semibold text-blanc-casse transition hover:bg-accent-hover"
            >
              Faire diagnostiquer mon refus <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/refus/particulier"
              className="inline-flex items-center gap-2 rounded border border-encre/25 bg-blanc-casse px-5 py-3 text-sm font-medium text-encre transition hover:bg-papier-fonce"
            >
              <UserRound className="h-4 w-4" aria-hidden="true" /> Je suis un particulier
            </Link>
          </div>
          <p className="mt-7 text-sm text-encre-claire">
            Vérifié le {formatGuideDate(HUB.updated)}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
        <section aria-labelledby="par-dispositif">
          <h2 id="par-dispositif" className="font-serif text-3xl font-semibold text-encre">
            Commencer par votre dispositif
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PAGES_CIBLEES.map((page) => (
              <Link
                key={page.path}
                href={page.path}
                className="group rounded-2xl bg-blanc-casse p-6 shadow-md transition hover:shadow-lg"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-tampon">
                  {page.eyebrow}
                </span>
                <span className="mt-3 block font-serif text-xl font-semibold text-encre group-hover:text-tampon">
                  {page.title}
                </span>
                <span className="mt-3 block text-sm leading-relaxed text-ardoise">
                  {page.metaDescription}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {motifs.length > 0 ? (
          <section aria-labelledby="motifs" className="mt-16 border-t border-filigrane pt-14">
            <h2 id="motifs" className="font-serif text-3xl font-semibold text-encre">
              Les motifs de refus, un par un
            </h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-ardoise">
              Chacun est écrit à partir du texte qui le fonde : la fiche d’opération standardisée, le
              code de l’énergie ou le décret MaPrimeRénov’. Aucun ne promet d’issue.
            </p>
            <ul className="mt-8 divide-y divide-filigrane border-y border-filigrane">
              {motifs.map((motif) => (
                <li key={motif.slug}>
                  <Link
                    href={`/refus/motifs/${motif.slug}`}
                    className="group flex flex-col gap-1 py-5 transition hover:bg-blanc-casse/60"
                  >
                    <span className="flex flex-wrap items-baseline gap-x-3">
                      <span className="font-semibold text-encre group-hover:text-tampon">
                        {motif.libelle}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-tampon">
                        {LIBELLE_AIDE[motif.aide]}
                      </span>
                    </span>
                    <span className="text-sm leading-relaxed text-ardoise">{motif.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          // Dégradation gracieuse du chargeur : la page reste utile et le
          // formulaire reste accessible, plutôt qu'une liste vide sans explication.
          <section aria-labelledby="motifs" className="mt-16 border-t border-filigrane pt-14">
            <h2 id="motifs" className="font-serif text-3xl font-semibold text-encre">
              Les motifs de refus
            </h2>
            <p className="mt-4 flex items-start gap-3 leading-relaxed text-ardoise">
              <FileWarning className="mt-1 h-5 w-5 shrink-0 text-avertissement" aria-hidden="true" />
              La liste détaillée est momentanément indisponible. Décrivez votre refus ci-dessous,
              nous vous répondons de la même façon.
            </p>
          </section>
        )}

        <section
          id="diagnostic"
          aria-labelledby="diagnostic-titre"
          className="mt-16 scroll-mt-24 border-t border-filigrane pt-14"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tampon">
            Diagnostic gratuit
          </p>
          <h2 id="diagnostic-titre" className="mt-2 font-serif text-3xl font-semibold text-encre">
            Décrivez votre refus, nous le lisons
          </h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-ardoise">
            Recopiez le motif tel qu’il est écrit sur la décision, même s’il vous paraît obscur :
            c’est sa formulation exacte qui indique sur quoi le dossier a été jugé. La réponse est
            rédigée à la main, et n’engage à rien.
          </p>
          <div className="mt-8 rounded-2xl bg-blanc-casse p-6 shadow-md sm:p-8">
            <DiagnosticForm
              utm={{
                utm_source: premier(query.utm_source),
                utm_medium: premier(query.utm_medium),
                utm_campaign: premier(query.utm_campaign),
              }}
            />
          </div>
        </section>

        <GuidesPrevention />

        {/*
          Encart RGPD : renvoi vers /confidentialite, qui reste la source unique.
          Recopier ici finalité, base légale et durée créerait deux textes
          juridiques à maintenir (docs/cluster-refus.md § 3.7).
        */}
        <section
          aria-labelledby="donnees"
          className="mt-14 rounded border border-filigrane bg-papier/40 p-6"
        >
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-tampon" aria-hidden="true" />
            <div>
              <h2 id="donnees" className="font-semibold text-encre">
                Ce que deviennent vos informations
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ardoise">
                Elles servent uniquement à vous répondre, sont conservées trois ans après notre
                dernier contact, et ne sont ni vendues ni louées. Finalité, base légale, durée et
                droits sont détaillés dans la{" "}
                <Link
                  href="/confidentialite"
                  className="font-medium underline underline-offset-4 hover:text-encre"
                >
                  politique de confidentialité
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
