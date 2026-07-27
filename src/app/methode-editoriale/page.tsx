import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, RefreshCw, SearchCheck } from "lucide-react";

import { EditorialPage } from "@/components/seo/editorial-page";
import {
  ORGANIZATION_ID,
  publicMetadata,
  serializeJsonLd,
  SITE_URL,
} from "@/lib/seo/site";

const TITLE = "Méthode éditoriale et mise à jour des guides";
const DESCRIPTION =
  "Sources, vérification, dates et corrections : la méthode suivie par Dossimo pour publier ses guides MaPrimeRénov’ et CEE destinés aux artisans RGE.";
const UPDATED = "2026-07-27";

export const metadata: Metadata = publicMetadata({
  path: "/methode-editoriale",
  title: TITLE,
  description: DESCRIPTION,
  type: "article",
});

const ETAPES = [
  {
    icon: BookOpenCheck,
    title: "Partir de la source qui fait foi",
    text: "Les textes de l’Anah, de France Rénov’, de Service-Public.fr et du ministère chargé de l’énergie sont prioritaires. Une source commerciale ne remplace jamais le texte officiel.",
  },
  {
    icon: SearchCheck,
    title: "Traduire la règle en point vérifiable",
    text: "Une condition est reliée à la pièce qui permet de la prouver : devis, facture, qualification RGE, fiche technique, attestation ou justificatif du bénéficiaire.",
  },
  {
    icon: RefreshCw,
    title: "Dater chaque vérification",
    text: "La date visible sur un guide indique la dernière relecture de ses règles et de ses liens. Une modification réglementaire entraîne une nouvelle vérification, pas une date changée automatiquement.",
  },
] as const;

export default function MethodeEditorialePage() {
  const pageUrl = `${SITE_URL}/methode-editoriale`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: TITLE,
      description: DESCRIPTION,
      url: pageUrl,
      inLanguage: "fr-FR",
      datePublished: UPDATED,
      dateModified: UPDATED,
      author: { "@id": ORGANIZATION_ID },
      publisher: { "@id": ORGANIZATION_ID },
      about: [
        { "@type": "Thing", name: "MaPrimeRénov’" },
        { "@type": "Thing", name: "Certificats d’économies d’énergie" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Méthode éditoriale", item: pageUrl },
      ],
    },
  ];

  return (
    <EditorialPage
      eyebrow="Transparence éditoriale"
      title="Comment les guides Dossimo sont vérifiés"
      intro="Une information réglementaire n’est utile que si l’on peut retrouver sa source, sa date et la pièce qui permet de la contrôler dans un dossier."
      breadcrumb="Méthode éditoriale"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <p className="font-mono text-sm text-encre-claire">Méthode vérifiée le 27 juillet 2026</p>

      <div className="mt-10 grid gap-5">
        {ETAPES.map(({ icon: Icon, title, text }, index) => (
          <section key={title} className="rounded-2xl bg-blanc-casse p-6 shadow-md sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-bg text-info">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-mono text-xs text-encre-claire">0{index + 1}</p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-encre">{title}</h2>
                <p className="mt-3 leading-relaxed text-ardoise">{text}</p>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16 max-w-3xl space-y-14">
        <section aria-labelledby="separation">
          <h2 id="separation" className="font-serif text-3xl font-semibold text-encre">
            Séparer la règle de sa présentation
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ardoise">
            Les seuils, montants, versions et conditions utilisés par le produit sont
            conservés dans un référentiel unique. Les pages publiques les présentent sans
            créer une seconde valeur « pour l’affichage ». Si une donnée n’est pas connue,
            elle n’est pas remplacée par une estimation inventée.
          </p>
        </section>

        <section aria-labelledby="corrections">
          <h2 id="corrections" className="font-serif text-3xl font-semibold text-encre">
            Corrections et limites
          </h2>
          <div className="mt-5 space-y-4 text-lg leading-relaxed text-ardoise">
            <p>
              Lorsqu’une information devient inexacte ou qu’une source officielle change,
              le guide concerné doit être corrigé et sa date de vérification mise à jour.
            </p>
            <p>
              Les guides expliquent une méthode de préparation. Ils ne remplacent ni la
              décision de l’organisme instructeur, ni un conseil juridique adapté à une
              situation particulière.
            </p>
          </div>
        </section>

        <aside className="rounded bg-encre p-7 text-papier sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-papier/70">
            Vérifier par vous-même
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold">Consultez les guides et leurs sources.</h2>
          <Link
            href="/guides"
            className="mt-7 inline-flex items-center gap-2 rounded bg-accent px-5 py-3 font-medium text-blanc-casse transition hover:bg-accent-hover"
          >
            Voir tous les guides <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </EditorialPage>
  );
}
