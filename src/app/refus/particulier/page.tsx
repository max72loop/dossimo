import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { articleEtFilAriane } from "@/lib/refus/jsonld";
import { publicMetadata, serializeJsonLd } from "@/lib/seo/site";

/**
 * Aiguillage « je suis un particulier ».
 *
 * Page STATIQUE, sans aucune collecte : ni formulaire, ni adresse à écrire, ni
 * champ de contact. C'est un choix de périmètre, pas un oubli : le lot 1 ne
 * traite pas de demande émanant d'un particulier, et ne pas collecter supprime
 * entièrement la branche B2C du cadre CNIL tout en gardant le trafic
 * (docs/cluster-refus.md § 3.4). Le formulaire du hub, lui, ne connaît que les
 * profils `artisan_rge` et `autre`, garde doublée par un `check` en base.
 *
 * Aucun délai chiffré n'est annoncé ici non plus : l'article 9 du décret
 * n° 2020-26 n'en fixe pas pour le recours préalable, et les deux mois souvent
 * cités sont ceux du recours contentieux (assertions A1b et A2b).
 */

const PATH = "/refus/particulier";
const UPDATED = "2026-07-31";

const TITRE = "Ma prime a été refusée et je suis le particulier";

export const metadata: Metadata = publicMetadata({
  path: PATH,
  title: "Refus MaPrimeRénov’ côté particulier : par où commencer",
  description:
    "Le recours devant le directeur général de l’Anah est un préalable obligatoire, les délais sont ceux que porte votre notification, et l’accompagnement France Rénov’ est gratuit.",
  type: "article",
});

export default function RefusParticulierPage() {
  const jsonLd = articleEtFilAriane({
    path: PATH,
    titre: TITRE,
    description:
      "Ce qu’il faut savoir quand on est le particulier dont la demande de prime a été refusée.",
    updated: UPDATED,
    fil: [{ nom: "Refus", path: "/refus" }],
  });

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <header className="border-b border-filigrane bg-blanc-casse">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
          <nav aria-label="Fil d’Ariane" className="text-sm text-ardoise">
            <Link href="/" className="underline underline-offset-4 hover:text-encre">
              Accueil
            </Link>
            <span aria-hidden="true"> / </span>
            <Link href="/refus" className="underline underline-offset-4 hover:text-encre">
              Refus
            </Link>
          </nav>
          <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight text-encre sm:text-5xl">
            {TITRE}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ardoise">
            Dossimo travaille avec les artisans RGE et ne suit pas les dossiers des particuliers.
            Plutôt que de vous laisser sans réponse, voici ce que dit le texte et vers qui vous
            tourner, gratuitement.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-12 px-5 py-14 sm:px-8 sm:py-20">
        <section aria-labelledby="recours">
          <h2 id="recours" className="font-serif text-3xl font-semibold text-encre">
            Un recours devant le juge suppose d’avoir d’abord écrit à l’Anah
          </h2>
          <div className="mt-5 space-y-4 text-lg leading-relaxed text-ardoise">
            <p>
              L’introduction d’un recours contre une décision relative à la prime est subordonnée à
              l’exercice préalable d’un recours administratif auprès du directeur général de l’Anah.
              Ce n’est pas une étape de politesse : sans elle, une requête portée directement devant
              le tribunal administratif est écartée sans examen du fond.
            </p>
            <p>
              Ce recours s’adresse donc au directeur général de l’Anah, et expose en quoi la décision
              vous paraît reposer sur une erreur. Le silence gardé plus de quatre mois sur cette
              demande vaut décision de rejet.
            </p>
          </div>
        </section>

        <section aria-labelledby="delais">
          <h2 id="delais" className="font-serif text-3xl font-semibold text-encre">
            Les délais qui comptent sont ceux écrits sur votre notification
          </h2>
          <div className="mt-5 space-y-4 text-lg leading-relaxed text-ardoise">
            <p>
              Les délais de recours contre une décision administrative ne vous sont opposables qu’à
              la condition d’avoir été mentionnés, avec les voies de recours, dans la notification de
              cette décision. Autrement dit : le calendrier applicable est celui que porte le
              courrier que vous avez reçu.
            </p>
            <p>
              Le réflexe utile est donc de relire cette notification, d’y chercher la mention des
              voies et délais de recours, et de noter la date à laquelle vous l’avez reçue. C’est
              cette date, et ce document, qui font foi — pas un délai général lu ailleurs, y compris
              sur cette page.
            </p>
          </div>
        </section>

        <section aria-labelledby="france-renov">
          <h2 id="france-renov" className="font-serif text-3xl font-semibold text-encre">
            L’accompagnement France Rénov’ est gratuit
          </h2>
          <div className="mt-5 space-y-4 text-lg leading-relaxed text-ardoise">
            <p>
              Le service public France Rénov’ conseille gratuitement les particuliers sur leurs
              travaux de rénovation et sur les aides, y compris quand un dossier a été refusé. Les
              conseillers des Espaces conseil France Rénov’ sont indépendants des entreprises, et
              leur accompagnement ne vous coûte rien.
            </p>
            <p>
              C’est le bon interlocuteur pour faire relire une décision, comprendre ce qui a manqué
              au dossier, et savoir si une nouvelle demande a du sens.
            </p>
          </div>
          <a
            href="https://france-renov.gouv.fr/"
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-flex items-center gap-2 rounded border border-encre/25 bg-blanc-casse px-5 py-3 text-sm font-medium text-encre transition hover:bg-papier-fonce"
          >
            Aller sur france-renov.gouv.fr
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </section>

        <section
          aria-labelledby="artisan"
          className="rounded border border-filigrane bg-papier/40 p-6"
        >
          <h2 id="artisan" className="font-semibold text-encre">
            Vous êtes l’artisan qui a posé les travaux ?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ardoise">
            Les motifs de refus sont détaillés un par un, avec ce qui les déclenche et ce qui les
            évite, sur{" "}
            <Link
              href="/refus"
              className="font-medium underline underline-offset-4 hover:text-encre"
            >
              la page des refus
            </Link>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
