import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { EMAIL_REPLI } from "@/lib/refus/contact";

/**
 * Confirmation de dépôt d'une demande de diagnostic.
 *
 * `noindex` : cette page n'a de sens qu'après une soumission. Indexée, elle
 * capterait des visiteurs à qui elle annonce une réponse qui ne viendra pas,
 * faute de demande. Elle est volontairement absente du sitemap.
 *
 * Aucune promesse de délai de réponse : le traitement est manuel, et un délai
 * affiché qu'on ne tient pas abîme davantage la relation que pas de délai du tout.
 */
export const metadata: Metadata = {
  title: "Demande envoyée",
  robots: { index: false, follow: true },
};

export default function RefusMerciPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="rounded-2xl bg-blanc-casse p-8 shadow-md sm:p-10">
        <CheckCircle2 className="h-10 w-10 text-succes" strokeWidth={1.5} aria-hidden="true" />
        <h1 className="mt-5 font-serif text-3xl font-semibold text-encre">
          Votre demande est arrivée.
        </h1>
        <p className="mt-4 leading-relaxed text-ardoise">
          Nous lisons ce que vous avez décrit et nous vous répondons par écrit, à l’adresse que vous
          avez indiquée. La réponse est rédigée à la main : elle vous dira sur quoi votre dossier a
          été jugé, et si la décision peut être reprise.
        </p>
        <p className="mt-4 leading-relaxed text-ardoise">
          Un élément à ajouter, la notification sous les yeux par exemple ? Répondez simplement à{" "}
          <a
            href={`mailto:${EMAIL_REPLI}`}
            className="font-medium underline underline-offset-4 hover:text-encre"
          >
            {EMAIL_REPLI}
          </a>
          .
        </p>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-filigrane pt-6">
          <Link
            href="/refus"
            className="inline-flex items-center rounded border border-encre/25 bg-blanc-casse px-4 py-2.5 text-sm font-medium text-encre transition hover:bg-papier-fonce"
          >
            Revenir aux motifs de refus
          </Link>
          <Link
            href="/exemple"
            className="inline-flex items-center rounded border border-encre/25 bg-blanc-casse px-4 py-2.5 text-sm font-medium text-encre transition hover:bg-papier-fonce"
          >
            Voir le pack en exemple
          </Link>
        </div>
      </div>
    </div>
  );
}
