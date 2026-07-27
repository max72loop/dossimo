import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

import { EditorialPage } from "@/components/seo/editorial-page";
import {
  editorialOrganizationSchema,
  ORGANIZATION_ID,
  publicMetadata,
  serializeJsonLd,
  SITE_URL,
} from "@/lib/seo/site";

const TITLE = "À propos de Dossimo";
const DESCRIPTION =
  "Découvrez la mission de Dossimo : aider les artisans RGE à préparer et contrôler leurs dossiers MaPrimeRénov’ et CEE, sans déposer à leur place ni percevoir la prime.";

export const metadata: Metadata = publicMetadata({
  path: "/a-propos",
  title: TITLE,
  description: DESCRIPTION,
});

const PRINCIPES = [
  "L’artisan et son client restent maîtres du dépôt et de la prime.",
  "Les contrôles rapprochent les informations entre les pièces, au lieu de relire chaque document isolément.",
  "Les règles et versions applicables sont reliées à des sources officielles datées.",
] as const;

export default function AProposPage() {
  const pageUrl = `${SITE_URL}/a-propos`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: TITLE,
      description: DESCRIPTION,
      url: pageUrl,
      inLanguage: "fr-FR",
      mainEntity: { "@id": ORGANIZATION_ID },
      publisher: { "@id": ORGANIZATION_ID },
    },
    {
      "@context": "https://schema.org",
      ...editorialOrganizationSchema(),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "À propos", item: pageUrl },
      ],
    },
  ];

  return (
    <EditorialPage
      eyebrow="Dossimo · Service indépendant"
      title="Des dossiers plus contrôlables, sans perdre la main"
      intro="Dossimo aide les artisans RGE à préparer les pièces, repérer les incohérences et constituer un pack prêt à déposer pour MaPrimeRénov’ ou les CEE. Le dépôt reste réalisé par l’artisan et son client."
      breadcrumb="À propos"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <div className="max-w-3xl space-y-14">
        <section aria-labelledby="mission">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tampon">Notre mission</p>
          <h2 id="mission" className="mt-2 font-serif text-3xl font-semibold text-encre">
            Transformer les règles en contrôles concrets
          </h2>
          <div className="mt-5 space-y-4 text-lg leading-relaxed text-ardoise">
            <p>
              Un dossier peut être bloqué alors que les travaux sont éligibles : une adresse
              écrite différemment, une référence absente du devis ou une pièce établie avec la
              mauvaise version suffit parfois à interrompre l’instruction.
            </p>
            <p>
              Dossimo organise les informations une seule fois, rapproche les documents entre
              eux et montre ce qui doit encore être confirmé avant le dépôt.
            </p>
          </div>
        </section>

        <section aria-labelledby="principes" className="rounded-2xl bg-blanc-casse p-6 shadow-md sm:p-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-succes" aria-hidden="true" />
            <h2 id="principes" className="font-serif text-3xl font-semibold text-encre">
              Trois principes
            </h2>
          </div>
          <ul className="mt-7 space-y-4">
            {PRINCIPES.map((principe) => (
              <li key={principe} className="flex gap-3 text-ardoise">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-succes" aria-hidden="true" />
                <span className="leading-relaxed">{principe}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="limites">
          <h2 id="limites" className="font-serif text-3xl font-semibold text-encre">
            Ce que Dossimo ne fait pas
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ardoise">
            Dossimo n’est ni l’Anah, ni France Rénov’, ni un obligé CEE. Le service ne
            décide pas de l’éligibilité finale, ne dépose pas le dossier et ne perçoit
            aucune part de la prime. Les organismes instructeurs et leurs textes en vigueur
            restent toujours prioritaires.
          </p>
        </section>

        <section aria-labelledby="publication" className="border-t border-filigrane pt-12">
          <h2 id="publication" className="font-serif text-3xl font-semibold text-encre">
            Une publication vérifiable
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ardoise">
            Les guides Dossimo affichent leur date de vérification et renvoient aux textes
            officiels utilisés. La méthode décrit comment une règle est retenue, mise à jour
            et corrigée.
          </p>
          <Link
            href="/methode-editoriale"
            className="mt-6 inline-flex items-center gap-2 font-medium text-tampon underline underline-offset-4 hover:text-encre"
          >
            Lire la méthode éditoriale <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </EditorialPage>
  );
}
