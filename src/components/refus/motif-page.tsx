import { ArrowRight, RefreshCw, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { articleEtFilAriane, faqPage } from "@/lib/refus/jsonld";
import { LIBELLE_AIDE, type RefusMotif } from "@/lib/refus/motifs-loader";
import { formatGuideDate } from "@/lib/seo/guides";
import { serializeJsonLd } from "@/lib/seo/site";

/**
 * Page d'un motif de refus. Tout le contenu vient de `refus_motifs` : ce
 * composant ne décide de rien d'éditorial, il met en forme.
 *
 * `contestable` est rendu avec sa nuance, jamais en verdict. `false` ne veut pas
 * dire « dossier perdu » mais « ce défaut-là ne se répare pas sur CE dossier »,
 * et le texte du motif porte le détail. Afficher un pouce baissé sur un booléen
 * ferait abandonner des dossiers récupérables.
 */
export function MotifPage({
  motif,
  autres,
}: {
  motif: RefusMotif;
  autres: readonly RefusMotif[];
}) {
  const path = `/refus/motifs/${motif.slug}`;
  const jsonLd = articleEtFilAriane({
    path,
    titre: motif.libelle,
    description: motif.metaDescription,
    updated: motif.updated,
    fil: [{ nom: "Refus", path: "/refus" }],
  });
  if (motif.faq.length > 0) jsonLd.push(faqPage(motif.faq));

  const Icone = motif.contestable ? RefreshCw : ShieldAlert;

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
            <span aria-hidden="true"> / </span>
            <span className="text-encre-claire">{LIBELLE_AIDE[motif.aide]}</span>
          </nav>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-tampon">
            Motif de refus · {LIBELLE_AIDE[motif.aide]}
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-encre sm:text-5xl">
            {motif.libelle}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-ardoise">{motif.description}</p>
          <p className="mt-7 text-sm text-encre-claire">
            Vérifié le {formatGuideDate(motif.updated)}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
        <div
          className={`flex items-start gap-4 rounded border-l-4 p-5 ${
            motif.contestable
              ? "border-succes bg-succes-bg"
              : "border-avertissement bg-papier-fonce"
          }`}
        >
          <Icone className="mt-0.5 h-6 w-6 shrink-0 text-encre" strokeWidth={1.5} aria-hidden="true" />
          <div>
            <p className="font-semibold text-encre">
              {motif.contestable
                ? "La décision peut être reprise sur ce motif."
                : "Ce défaut ne se répare pas sur ce dossier."}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ardoise">
              {motif.contestable
                ? "Soit en corrigeant la pièce en cause puis en redéposant, soit en contestant si la décision repose sur une lecture inexacte de votre dossier. Les sections ci-dessous précisent laquelle des deux voies s’applique."
                : "Il porte sur un fait déjà accompli, qu’aucune pièce produite après coup ne modifie. Cela ne dit rien de vos prochains dossiers, et les sections ci-dessous décrivent ce qui l’évite à l’avenir."}
            </p>
          </div>
        </div>

        <div className="mt-14 max-w-3xl space-y-12">
          {motif.sections.map((section) => (
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

        {motif.faq.length > 0 && (
          <section aria-labelledby="faq" className="mt-16 border-t border-filigrane pt-14">
            <h2 id="faq" className="font-serif text-3xl font-semibold text-encre">
              Questions fréquentes
            </h2>
            <dl className="mt-8 max-w-3xl space-y-8">
              {motif.faq.map((item) => (
                <div key={item.question}>
                  <dt className="font-serif text-xl font-semibold text-encre">{item.question}</dt>
                  <dd className="mt-3 text-lg leading-relaxed text-ardoise">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {autres.length > 0 && (
          <section aria-labelledby="autres-motifs" className="mt-16 border-t border-filigrane pt-14">
            <h2 id="autres-motifs" className="font-serif text-3xl font-semibold text-encre">
              Les autres motifs du même dispositif
            </h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {autres.map((autre) => (
                <Link
                  key={autre.slug}
                  href={`/refus/motifs/${autre.slug}`}
                  className="group rounded-2xl bg-blanc-casse p-5 shadow-md transition hover:shadow-lg"
                >
                  <span className="font-semibold text-encre group-hover:text-tampon">
                    {autre.libelle}
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-ardoise">
                    {autre.description}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <aside className="mt-16 rounded bg-encre p-7 text-papier sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-papier/70">
            Diagnostic gratuit
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold">
            Ce motif ressemble au vôtre, sans en être tout à fait ?
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-papier/80">
            Recopiez ce que dit votre décision. Nous vous répondons par écrit, sans engagement.
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
