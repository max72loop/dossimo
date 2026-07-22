import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  FileCheck2,
  HandCoins,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { CTA_DEMO } from "@/lib/landing/copy";
import { grillePublique } from "@/lib/landing/grille-publique";
import type { GrilleAffichee } from "@/lib/pricing";
import { publicMetadata, SITE_URL } from "@/lib/seo/site";

export const metadata: Metadata = publicMetadata({
  path: "/tarifs",
  title: "Tarifs Dossimo · un prix fixe par dossier",
  description:
    "Consultez les tarifs Dossimo pour la préparation et le contrôle de vos dossiers MaPrimeRénov’ et CEE. Paiement unique, sans abonnement ni commission.",
});

const FOCUS_SOMBRE =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papier";

function Shell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={"mx-auto max-w-7xl px-5 sm:px-8 " + className}>{children}</div>;
}

function Label({
  children,
  sombre = false,
}: {
  children: React.ReactNode;
  sombre?: boolean;
}) {
  return (
    <p
      className={
        "flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.14em] " +
        (sombre ? "text-accent-clair" : "text-tampon")
      }
    >
      <span
        className={
          "h-2 w-2 rounded-full " +
          (sombre ? "bg-accent-clair" : "bg-tampon")
        }
      />
      {children}
    </p>
  );
}

export default async function TarifsPage() {
  const grille = await grillePublique();

  return (
    <div className="flex min-h-full flex-col bg-papier pb-20 md:pb-0">
      <PricingJsonLd grille={grille} />
      <a href="#contenu" className="skip-link">
        Aller au contenu principal
      </a>
      <SiteHeader />
      <main id="contenu" className="flex-1" tabIndex={-1}>
        <Hero grille={grille} />
        <Grille grille={grille} />
        <Inclus />
        <Explication />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero({ grille }: { grille: GrilleAffichee | null }) {
  return (
    <section className="relative isolate overflow-hidden bg-encre py-16 sm:py-20">
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-32 h-96 w-96 rounded-full border border-accent-clair/15"
      />
      <Shell className="relative grid items-center gap-12 lg:grid-cols-[1fr_0.65fr]">
        <div className="max-w-3xl">
          <Label sombre>Tarifs Dossimo</Label>
          <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight tracking-tight text-blanc-casse sm:text-5xl">
            Un prix par dossier.{" "}
            <span className="text-accent-clair">Jamais une part de la prime.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-papier/75">
            Vous payez une seule fois, selon le montant d&rsquo;aide estimé. Aucun
            abonnement, aucun engagement et aucune commission sur la prime de
            votre client.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/demo"
              className={
                "group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-papier px-6 text-sm font-semibold text-encre hover:bg-blanc-casse " +
                FOCUS_SOMBRE
              }
            >
              {CTA_DEMO}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/exemple"
              className={
                "inline-flex min-h-12 items-center justify-center rounded-lg border border-papier/25 px-6 text-sm font-medium text-papier hover:bg-papier/10 " +
                FOCUS_SOMBRE
              }
            >
              Voir ce qui est inclus
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-papier p-7 shadow-lg sm:p-8">
          <p className="text-sm font-medium text-ardoise">Fourchette actuelle</p>
          {grille ? (
            <>
              <p className="mt-3 font-mono text-4xl font-semibold tabular-nums text-encre">
                {grille.minLabel}{" "}
                <span className="text-2xl text-encre-claire">à</span>{" "}
                {grille.maxLabel}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ardoise">
                par dossier · paiement unique · prix exact affiché avant paiement
              </p>
            </>
          ) : (
            <p className="mt-3 text-lg leading-relaxed text-encre">
              La grille est momentanément indisponible. Aucun prix ne sera estimé
              à votre place.
            </p>
          )}
          <div className="mt-6 border-t border-filigrane pt-5">
            <p className="flex items-center gap-2 text-sm font-medium text-encre">
              <HandCoins
                className="h-5 w-5 text-tampon"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              100 % de la prime reste à votre client
            </p>
          </div>
        </div>
      </Shell>
    </section>
  );
}

function Grille({ grille }: { grille: GrilleAffichee | null }) {
  return (
    <section
      className="bg-blanc-casse py-20 sm:py-24"
      aria-labelledby="grille-title"
    >
      <Shell>
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <Label>La grille appliquée au paiement</Label>
          </div>
          <h2
            id="grille-title"
            className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-4xl"
          >
            Le forfait suit le montant d&rsquo;aide estimé.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ardoise">
            Une aide plus importante implique davantage de contrôles et de pièces.
            Le palier est calculé à partir des informations du dossier.
          </p>
        </div>

        {grille && grille.lignes.length > 0 ? (
          <ul className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-3">
            {grille.lignes.map((ligne) => (
              <li
                key={ligne.name + "-" + ligne.priceLabel}
                className="flex flex-col rounded-2xl bg-papier p-7 shadow-lg"
              >
                <p className="text-sm font-medium text-tampon">{ligne.name}</p>
                <p className="mt-4 font-mono text-4xl font-semibold tabular-nums text-encre">
                  {ligne.priceLabel}
                </p>
                <p className="mt-2 text-sm text-ardoise">
                  par dossier · paiement unique
                </p>
                <div className="mt-7 border-t border-filigrane pt-5">
                  <p className="text-sm font-semibold text-encre">
                    {ligne.aidLabel}
                  </p>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-ardoise">
                  {[
                    "Sans abonnement",
                    "Sans pourcentage",
                    "Prix connu avant paiement",
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-succes"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-auto mt-12 max-w-2xl rounded-2xl bg-papier p-7 text-center shadow-md">
            <CircleHelp
              className="mx-auto h-7 w-7 text-tampon"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <p className="mt-4 font-serif text-xl font-semibold text-encre">
              Grille temporairement indisponible
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ardoise">
              Le prix exact reste toujours présenté avant paiement. Dossimo
              n&rsquo;affiche aucun montant de remplacement.
            </p>
          </div>
        )}

        <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-relaxed text-ardoise">
          Le montant d&rsquo;aide est estimé à partir des données du dossier. Le
          tarif retenu est affiché avant tout paiement.
        </p>
      </Shell>
    </section>
  );
}

function Inclus() {
  const items = [
    {
      icon: ReceiptText,
      title: "Dossier prérempli",
      body: "Les informations utiles sont reprises depuis votre devis.",
    },
    {
      icon: FileCheck2,
      title: "Contrôle des documents",
      body: "Mentions obligatoires, dates, RGE et cohérence devis-facture.",
    },
    {
      icon: ShieldCheck,
      title: "Rapport avant dépôt",
      body: "Chaque écart est localisé et expliqué avant qu’il ne devienne un refus.",
    },
    {
      icon: LockKeyhole,
      title: "Pack complet",
      body: "Récapitulatif client, checklist des pièces et documents de contrôle.",
    },
  ];

  return (
    <section className="bg-papier py-20 sm:py-24">
      <Shell>
        <div className="max-w-3xl">
          <Label>Inclus dans chaque tarif</Label>
          <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-4xl">
            Le même niveau de contrôle, quel que soit le palier.
          </h2>
        </div>
        <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl bg-blanc-casse p-6 shadow-md"
            >
              <item.icon
                className="h-7 w-7 text-tampon"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <h3 className="mt-7 font-serif text-xl font-semibold text-encre">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ardoise">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </Shell>
    </section>
  );
}

function Explication() {
  const points = [
    "Vous restez l’interlocuteur de votre client",
    "Vous effectuez vous-même le dépôt",
    "Votre client conserve l’intégralité de la prime",
    "Vous ne payez ni abonnement ni commission",
  ];

  return (
    <section className="bg-encre py-20 sm:py-24">
      <Shell className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <Label sombre>Pourquoi un forfait</Label>
          <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-blanc-casse sm:text-4xl">
            Dossimo vous fait gagner du temps sans prendre votre dossier.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-papier/70">
            Un mandataire peut s&rsquo;intercaler dans la relation et se rémunérer
            sur la prime. Dossimo facture uniquement la préparation et le contrôle.
          </p>
        </div>
        <div className="rounded-2xl bg-papier p-7 shadow-lg">
          <ul className="space-y-5">
            {points.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 font-medium text-encre"
              >
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-succes"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Shell>
    </section>
  );
}

const FAQ = [
  {
    q: "Quand le prix exact est-il connu ?",
    a: "Dès que le montant d’aide du dossier peut être estimé. Le palier et le prix exact sont affichés avant le paiement.",
  },
  {
    q: "Y a-t-il un abonnement ?",
    a: "Non. Chaque paiement concerne un seul dossier, sans engagement récurrent.",
  },
  {
    q: "Dossimo prélève-t-il une part de la prime ?",
    a: "Non. Le tarif est un forfait fixe. Dossimo ne reçoit jamais la prime et ne facture aucun pourcentage.",
  },
  {
    q: "Pourquoi plusieurs paliers ?",
    a: "Le palier dépend du montant d’aide estimé, qui reflète généralement le niveau de contrôle et le nombre de pièces du dossier.",
  },
] as const;

function Faq() {
  return (
    <section className="bg-blanc-casse py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <Label>Questions sur les tarifs</Label>
        <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-4xl">
          Avant de commencer.
        </h2>
        <div className="mt-10 divide-y divide-filigrane border-y border-filigrane">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg font-semibold text-encre">
                {item.q}
                <span
                  className="text-tampon transition-transform group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ardoise">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-papier py-20 sm:py-24">
      <Shell>
        <div className="rounded-2xl bg-accent px-6 py-12 text-center shadow-lg sm:px-12">
          <h2 className="font-serif text-3xl font-semibold text-blanc-casse sm:text-4xl">
            Voyez d&rsquo;abord ce que Dossimo lit dans votre devis.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-papier/80">
            L&rsquo;essai commence sans paiement. Le tarif n&rsquo;apparaît qu&rsquo;une
            fois le dossier estimable.
          </p>
          <Link
            href="/demo"
            className={
              "group mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-papier px-6 text-sm font-semibold text-encre hover:bg-blanc-casse " +
              FOCUS_SOMBRE
            }
          >
            {CTA_DEMO}
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </Shell>
    </section>
  );
}

function PricingJsonLd({ grille }: { grille: GrilleAffichee | null }) {
  if (!grille) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Préparation et contrôle de dossier MaPrimeRénov’ / CEE",
    provider: { "@type": "Organization", name: "Dossimo", url: SITE_URL },
    areaServed: "FR",
    url: SITE_URL + "/tarifs",
    offers: grille.lignes.map((ligne) => ({
      "@type": "Offer",
      name: ligne.name,
      description: ligne.aidLabel,
      priceCurrency: "EUR",
      price: ligne.priceLabel.replace(/[^\d,]/g, "").replace(",", "."),
      availability: "https://schema.org/InStock",
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
