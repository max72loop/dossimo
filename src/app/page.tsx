import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  FolderCheck,
  Lock,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Stamp,
  XCircle,
} from "lucide-react";

import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { LeadForm } from "@/components/landing/lead-form";
import { FOCUS } from "@/components/ui/boutons";
import { grillePublique } from "@/lib/landing/grille-publique";
import type { GrilleAffichee } from "@/lib/pricing";

/**
 * Anneau de focus pour les CTA posés sur le bloc encre (section Tarification) :
 * l'anneau `encre` de `FOCUS` y serait invisible, fond contre fond.
 */
const FOCUS_SOMBRE =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papier";

export default async function Home() {
  // Grille lue en base (`pricing_tiers`), la MÊME que celle du checkout : le prix
  // annoncé ici est celui qui sera facturé. `null` si la base est injoignable — on
  // tait alors le tarif plutôt que d'en afficher un faux (§10).
  const grille = await grillePublique();

  return (
    <div className="flex min-h-full flex-col bg-papier">
      <JsonLd grille={grille} />
      <SiteHeader />

      <main className="flex-1">
        <Hero />
        <TrustStrip grille={grille} />
        <Probleme />
        <Difference />
        <PourQui />
        <Etapes />
        <Relecture />
        <Features />
        <CasConcrets />
        <Pricing grille={grille} />
        <Contact />
        <Faq />
      </main>

      <SiteFooter />
    </div>
  );
}

/* ------------------------------------------------------------- Primitives */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="label flex items-center gap-2.5 text-tampon">
      <span className="h-px w-6 bg-tampon" />
      {children}
    </p>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-[1280px] px-8">{children}</div>;
}

/* ------------------------------------------------------------------ Hero */
function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-filigrane">
      {/* Halo bleu doux, signature de marque */}
      <div className="pointer-events-none absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-tampon/10 blur-3xl" />
      <div className="mx-auto grid max-w-[1280px] items-center gap-16 px-8 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div>
          <SectionLabel>Pour les artisans RGE indépendants</SectionLabel>

          <h1 className="mt-6 font-serif text-[2.75rem] font-semibold leading-[1.08] tracking-tight text-encre sm:text-[3.25rem]">
            Des dossiers de prime qui passent.{" "}
            <span className="text-tampon">Du premier coup.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ardoise">
            Dossimo prépare vos dossiers MaPrimeRénov&rsquo; et CEE,{" "}
            <span className="text-encre">relit vos devis et vos factures</span>, et
            signale ce qui ferait refuser le dossier — avant le dépôt. Sans
            mandataire :{" "}
            <span className="text-encre">
              vous gardez votre client et l&rsquo;intégralité de votre prime.
            </span>
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/dossiers/nouveau"
              className={`group inline-flex h-12 items-center gap-2 rounded-lg bg-terre-cuite px-6 text-sm font-semibold text-blanc-casse transition-colors hover:bg-terre-cuite-hover ${FOCUS}`}
            >
              Créer mon dossier gratuit
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#etapes"
              className={`inline-flex h-12 items-center gap-2 rounded-lg border border-encre px-6 text-sm font-medium text-encre transition-colors hover:bg-papier-fonce ${FOCUS}`}
            >
              Comment ça marche
            </a>
          </div>

          <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ardoise">
            <CheckCircle2 className="h-4 w-4 text-succes" strokeWidth={1.5} />
            Premier dossier offert
            <span className="text-filigrane">·</span>
            sans carte bancaire
            <span className="text-filigrane">·</span>
            prêt en quelques minutes
          </p>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative lg:pr-8">
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-tampon/5 blur-2xl" />
      <ReportCard />
      <div className="mt-4 lg:absolute lg:-bottom-8 lg:-right-2 lg:mt-0 lg:w-56">
        <PrimeCard />
      </div>
    </div>
  );
}

/* Petite carte « prime estimée », encre, en signature du produit. */
function PrimeCard() {
  return (
    <div className="rounded-xl border border-encre bg-encre p-4 text-papier shadow-md">
      <p className="text-xs text-papier/70">Prime estimée</p>
      <p className="mt-1 font-serif text-2xl font-semibold">≈ 1 900 €</p>
      <p className="mt-0.5 text-[11px] text-papier/60">
        MaPrimeRénov&rsquo; · ménage modeste
      </p>
    </div>
  );
}

function ReportCard() {
  const checks = [
    "Chronologie : devis avant travaux",
    "Qualification RGE valide à la date du devis",
    "Résistance thermique conforme au poste",
    "Cohérence devis / facture garantie",
  ];
  return (
    <div className="rounded border border-filigrane bg-blanc-casse p-5 shadow-md">
      <div className="flex items-center justify-between border-b border-filigrane pb-3">
        <div>
          <p className="font-serif text-base font-semibold text-encre">
            Rapport de contrôle
          </p>
          <p className="mt-0.5 font-mono text-xs text-encre-claire">
            DOS-2026-0148
          </p>
        </div>
        <StatusBadge tone="succes">Conforme</StatusBadge>
      </div>
      <ul className="mt-4 space-y-2.5">
        {checks.map((c) => (
          <li key={c} className="flex items-start gap-2.5 text-[0.813rem] leading-snug text-encre">
            <CheckCircle2 className="mt-px h-4 w-4 shrink-0 text-succes" strokeWidth={1.5} />
            {c}
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-sm bg-succes-bg px-3 py-2 text-xs text-succes">
        Aucun point bloquant · Pack prêt à déposer
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Status UI */
function StatusBadge({
  tone,
  children,
}: {
  tone: "succes" | "avertissement" | "erreur" | "brouillon";
  children: React.ReactNode;
}) {
  const map = {
    succes: "bg-succes-bg text-succes",
    avertissement: "bg-avertissement-bg text-avertissement",
    erreur: "bg-erreur-bg text-erreur",
    brouillon: "bg-papier-fonce text-ardoise",
  } as const;
  const dot = {
    succes: "bg-succes",
    avertissement: "bg-avertissement",
    erreur: "bg-erreur",
    brouillon: "bg-encre-claire",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${map[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot[tone]}`} />
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- JSON-LD */
/**
 * Données structurées : `Organization` (identité de marque) et `FAQPage` (Google
 * peut afficher les questions directement dans ses résultats). Les questions sont
 * lues depuis `FAQ_ITEMS`, la même source que le rendu : un balisage qui
 * annoncerait autre chose que la page serait trompeur, et sanctionné comme tel.
 *
 * Aucun prix n'est balisé si la grille est illisible : plutôt rien qu'un tarif faux.
 */
function JsonLd({ grille }: { grille: GrilleAffichee | null }) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://dossimo.app";

  const donnees = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Dossimo",
      url: site,
      description:
        "Service indépendant d'aide à la préparation et au contrôle de conformité de dossiers MaPrimeRénov' et CEE, destiné aux artisans RGE indépendants.",
      slogan: "Des dossiers de prime qui passent. Du premier coup.",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((it) => ({
        "@type": "Question",
        name: it.q,
        acceptedAnswer: { "@type": "Answer", text: it.a },
      })),
    },
    ...(grille
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Préparation et contrôle de dossier MaPrimeRénov' / CEE",
            provider: { "@type": "Organization", name: "Dossimo" },
            areaServed: "FR",
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "EUR",
              lowPrice: grille.paliers[0].replace(/[^\d]/g, ""),
              highPrice: grille.paliers.at(-1)!.replace(/[^\d]/g, ""),
              offerCount: grille.paliers.length,
            },
          },
        ]
      : []),
  ];

  return (
    <script
      type="application/ld+json"
      // Contenu entièrement statique et maîtrisé (aucune saisie utilisateur).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(donnees) }}
    />
  );
}

/* ------------------------------------------------------------ TrustStrip */
function TrustStrip({ grille }: { grille: GrilleAffichee | null }) {
  const items = [
    "Premier dossier offert",
    // Prix dérivé de la grille en base, jamais écrit en dur : sans elle, on annonce
    // la gratuité du premier dossier sans avancer de chiffre.
    grille ? `À partir de ${grille.minLabel} par dossier` : "Forfait fixe par dossier",
    "MaPrimeRénov' + CEE",
    "Vous gardez votre prime",
  ];
  return (
    <div className="border-b border-filigrane bg-papier-fonce">
      <Shell>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5 text-sm font-medium text-encre">
          {items.map((i) => (
            <span key={i} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-succes" strokeWidth={1.5} />
              {i}
            </span>
          ))}
        </div>
      </Shell>
    </div>
  );
}

/* -------------------------------------------------------------- Probleme */
function Probleme() {
  const pains = [
    {
      icon: RefreshCw,
      title: "Incohérence devis / facture",
      body: "Un montant, une surface ou une référence qui diffère entre les pièces : premier motif de refus, et le plus évitable.",
    },
    {
      icon: AlertTriangle,
      title: "Chronologie invalide",
      body: "Travaux commencés avant le devis, offre CEE proposée trop tard, RGE expiré : des dates dans le mauvais ordre et tout tombe.",
    },
    {
      icon: FileText,
      title: "Mentions manquantes",
      body: "Marque, référence, résistance thermique, certification : une seule mention obligatoire oubliée suffit à bloquer le dossier.",
    },
  ];
  return (
    <section id="probleme" className="py-20 sm:py-24">
      <Shell>
        <div className="max-w-2xl">
          <SectionLabel>Le problème</SectionLabel>
          <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
            Un dossier refusé, c&rsquo;est du temps perdu et un client déçu
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ardoise">
            Les refus MaPrimeRénov&rsquo; et CEE viennent presque toujours des
            mêmes erreurs, des erreurs qu&rsquo;on peut détecter avant le dépôt.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {pains.map((p) => (
            <div
              key={p.title}
              className="rounded border border-filigrane bg-blanc-casse p-6 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-papier-fonce text-encre">
                <p.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 font-serif text-lg font-semibold text-encre">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ardoise">
                {p.body}
              </p>
            </div>
          ))}
        </div>

        {/* Point de vigilance illustré · bandeau à bordure gauche épaisse. */}
        <div className="mt-6 flex items-start gap-3 rounded border-l-4 border-avertissement bg-avertissement-bg px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-avertissement" strokeWidth={1.5} />
          <p className="text-sm text-encre">
            <span className="font-medium">Point de vigilance :</span> la mention
            de résistance thermique <span className="font-mono text-avertissement">R ≥ 3,7 m²·K/W</span>{" "}
            manque sur le devis. Dossimo la signale avant le dépôt.
          </p>
        </div>
      </Shell>
    </section>
  );
}

/* ------------------------------------------------------------ Difference */
function Difference() {
  const mandataire = [
    "Prend la main sur votre dossier",
    "S'intercale dans la relation avec votre client",
    "Capte tout ou partie de la prime",
    "Vous dépendez de son rythme et de ses règles",
  ];
  const dossimo = [
    "Vous gardez la main sur votre dossier",
    "La relation client reste 100 % la vôtre",
    "Vous et votre client percevez l'intégralité de la prime",
    "Dossimo sécurise juste la conformité avant dépôt",
  ];
  return (
    <section id="difference" className="border-y border-filigrane bg-papier-fonce/60 py-20 sm:py-24">
      <Shell>
        <div className="max-w-2xl">
          <SectionLabel>La différence</SectionLabel>
          <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
            Un mandataire prend le contrôle. Dossimo vous le laisse.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ardoise">
            Dossimo ne dépose jamais le dossier et ne touche jamais la prime.
            C&rsquo;est un choix : celui de vous laisser maître de votre affaire.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <div className="rounded border border-filigrane bg-blanc-casse p-7">
            <h3 className="label text-ardoise">Avec un mandataire</h3>
            <ul className="mt-5 space-y-3">
              {mandataire.map((m) => (
                <li key={m} className="flex items-start gap-3 text-sm text-ardoise">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-encre-claire" strokeWidth={1.5} />
                  {m}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded border border-filigrane border-l-4 border-l-terre-cuite bg-blanc-casse p-7 shadow-sm">
            <h3 className="label flex items-center gap-2 text-terre-cuite">
              <Stamp className="h-4 w-4" strokeWidth={1.5} />
              Avec Dossimo
            </h3>
            <ul className="mt-5 space-y-3">
              {dossimo.map((d) => (
                <li key={d} className="flex items-start gap-3 text-sm font-medium text-encre">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-succes" strokeWidth={1.5} />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Shell>
    </section>
  );
}

/* --------------------------------------------------------------- Pour qui */
function PourQui() {
  const points = [
    "Vous restez maître de votre client et de votre prime, toujours.",
    "Pas de jargon : une saisie, un pack prêt à déposer.",
    "Vous voyez le contrôle anti-refus avant même de payer.",
    "Le premier dossier est offert, sans engagement ni carte bancaire.",
  ];
  return (
    <section className="py-20 sm:py-24">
      <Shell>
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionLabel>Pensé pour vous</SectionLabel>
            <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
              Fait pour l&rsquo;artisan indépendant, pas pour les intermédiaires
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ardoise">
              Vous connaissez votre métier. Dossimo s&rsquo;occupe de la paperasse
              et de la conformité, sans jamais s&rsquo;intercaler entre vous et
              votre client.
            </p>
            <div className="mt-8">
              <Link
                href="/dossiers/nouveau"
                className={`group inline-flex h-12 items-center gap-2 rounded-lg bg-terre-cuite px-6 text-sm font-semibold text-blanc-casse transition-colors hover:bg-terre-cuite-hover ${FOCUS}`}
              >
                Essayer, c&rsquo;est gratuit
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-filigrane bg-blanc-casse p-8 shadow-sm">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/dossimo-icon.png" alt="Dossimo" className="h-10 w-10 rounded-lg" />
              <p className="font-serif text-lg font-semibold text-encre">
                Ce que ça change pour vous
              </p>
            </div>
            <ul className="mt-6 space-y-4">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[0.95rem] text-encre">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-succes" strokeWidth={1.5} />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Shell>
    </section>
  );
}

/* ---------------------------------------------------------------- Etapes */
function Etapes() {
  const steps = [
    {
      icon: ClipboardCheck,
      title: "Une seule saisie",
      body: "Vous renseignez le chantier une fois : bénéficiaire, logement, travaux, dates, montants. C'est tout.",
    },
    {
      icon: ShieldCheck,
      title: "Contrôle anti-refus",
      body: "Dossimo vérifie la chronologie, la qualification RGE, l'éligibilité, la performance et la cohérence des montants.",
    },
    {
      icon: ScanSearch,
      title: "Vos pièces relues",
      body: "Vous déposez le devis et la facture : Dossimo les relit et signale les mentions manquantes et les écarts.",
    },
    {
      icon: FolderCheck,
      title: "Pack prêt à déposer",
      body: "Récapitulatif client, checklist des pièces et rapport de contrôle. Vous et votre client déposez, sereins.",
    },
  ];
  return (
    <section id="etapes" className="py-20 sm:py-24">
      <Shell>
        <div className="max-w-2xl">
          <SectionLabel>La méthode</SectionLabel>
          <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
            De la saisie au dépôt, en quatre temps
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ardoise">
            Comme toutes les pièces viennent de la même saisie,
            l&rsquo;incohérence entre elles devient structurellement impossible.
            Restent vos documents réels — Dossimo les relit aussi.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="border-t border-encre pt-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-ardoise">
                  0{i + 1}
                </span>
                <s.icon className="h-5 w-5 text-tampon" strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 font-serif text-xl font-semibold text-encre">
                {s.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ardoise">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </Shell>
    </section>
  );
}

/* ------------------------------------------------------------- Relecture */
/**
 * La relecture des pièces réelles : le seul contrôle que l'artisan ne peut pas
 * faire seul, et ce qui distingue Dossimo d'un simple générateur de documents.
 *
 * Le texte décrit la MÉCANIQUE (Dossimo relit, compare, signale ; l'artisan tranche)
 * sans promettre de taux de détection : aucun chiffre de performance n'est avancé,
 * faute d'en avoir un qui soit mesuré.
 */
function Relecture() {
  return (
    <section id="relecture" className="border-y border-filigrane bg-papier-fonce/60 py-20 sm:py-24">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 px-8 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <SectionLabel>La relecture</SectionLabel>
          <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
            Envoyez votre devis.{" "}
            <span className="text-tampon">Dossimo le relit.</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ardoise">
            Un dossier peut être refusé alors que tous les chiffres sont justes :
            il suffit qu&rsquo;une <span className="text-encre">mention obligatoire</span>{" "}
            manque au devis — la certification de l&rsquo;isolant, la résistance
            thermique, le numéro RGE. C&rsquo;est la vérification que personne ne
            fait, parce qu&rsquo;elle demande de relire chaque document ligne à ligne.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-ardoise">
            Déposez le devis et la facture : Dossimo les relit, les compare à votre
            dossier <span className="text-encre">et entre eux</span>, et signale ce
            qui manque ou diverge. Il ne corrige rien tout seul :{" "}
            <span className="text-encre">vous restez juge</span>.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              "Les mentions exigées par la fiche, cherchées une par une dans le document.",
              "Surface, résistance, montants, dates : la pièce confrontée à votre saisie.",
              "Le devis confronté à la facture — la première cause de refus à l'instruction.",
            ].map((p) => (
              <li key={p} className="flex items-start gap-3 text-[0.95rem] leading-relaxed text-encre">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-succes" strokeWidth={1.5} />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <RelectureCard />
      </div>
    </section>
  );
}

/* Reproduction de ce que le produit affiche réellement après lecture d'un devis. */
function RelectureCard() {
  const lignes = [
    { statut: "ok", texte: "Fiche CEE : BAR-EN-101" },
    { statut: "ok", texte: "Surface isolée : 95 m²" },
    { statut: "ok", texte: "Marque et référence de l'isolant posé" },
    {
      statut: "ecart",
      texte: "Résistance thermique R = 7,5 m²·K/W",
      releve: "R = 6,5 m²·K/W",
    },
    {
      statut: "absent",
      texte: "Certification de l'isolant (ACERMI ou équivalent)",
    },
  ] as const;

  return (
    <div>
      <div className="rounded border border-filigrane bg-blanc-casse p-5 shadow-md">
        <div className="flex items-center justify-between border-b border-filigrane pb-3">
          <div>
            <p className="font-serif text-base font-semibold text-encre">
              Mentions obligatoires
            </p>
            <p className="mt-0.5 font-mono text-xs text-ardoise">
              devis-combles.pdf
            </p>
          </div>
          <StatusBadge tone="erreur">2 à corriger</StatusBadge>
        </div>

        <ul className="mt-4 space-y-2">
          {lignes.map((l) => (
            <li
              key={l.texte}
              className={`rounded-sm px-2.5 py-2 text-[0.813rem] leading-snug ${
                l.statut === "ok"
                  ? "bg-papier/70"
                  : l.statut === "ecart"
                    ? "bg-erreur-bg/70"
                    : "bg-erreur-bg/70"
              }`}
            >
              <div className="flex items-start gap-2">
                {l.statut === "ok" ? (
                  <CheckCircle2 className="mt-px h-4 w-4 shrink-0 text-succes" strokeWidth={1.5} />
                ) : (
                  <XCircle className="mt-px h-4 w-4 shrink-0 text-erreur" strokeWidth={1.5} />
                )}
                <div className="min-w-0">
                  <span className="text-encre">{l.texte}</span>
                  {l.statut === "absent" && (
                    <span className="ml-1.5 font-medium text-erreur">
                      — absente du document
                    </span>
                  )}
                  {l.statut === "ecart" && (
                    <p className="mt-0.5 font-mono text-[11px] text-ardoise">
                      Relevé : «&nbsp;{l.releve}&nbsp;»
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ardoise">
        Exemple d&rsquo;affichage du contrôle. Dossimo cite ce qui est écrit sur le
        document et vous laisse trancher.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------- Features */
function Features() {
  const feats = [
    { icon: RefreshCw, title: "Cohérence garantie", body: "Une saisie unique alimente toutes les pièces : plus d'écart entre devis et facture." },
    { icon: ShieldCheck, title: "Contrôle anti-refus", body: "Chronologie, RGE, seuils de performance, montants : les motifs de refus détectés avant dépôt." },
    { icon: ScanSearch, title: "Pièces relues", body: "Devis et facture relus, comparés à votre dossier et entre eux : mentions manquantes et écarts signalés." },
    { icon: FolderCheck, title: "Pack complet", body: "Récapitulatif, checklist des pièces et rapport de contrôle, prêts à télécharger." },
    { icon: FileText, title: "MaPrimeRénov' + CEE", body: "Les deux dispositifs, dont les fiches BAR et leurs mentions obligatoires." },
    { icon: Lock, title: "Vous gardez la prime", body: "Dossimo ne s'intercale jamais : la prime revient à votre client, la relation reste la vôtre." },
    { icon: FileCheck2, title: "Cerfa à jour", body: "Les modèles suivent les versions officielles : jamais de dossier sur un formulaire périmé." },
  ];
  return (
    <section className="border-y border-filigrane bg-papier-fonce/60 py-20 sm:py-24">
      <Shell>
        <div className="max-w-2xl">
          <SectionLabel>Ce que fait Dossimo</SectionLabel>
          <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
            La conformité, sans y penser
          </h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {feats.map((f) => (
            <div key={f.title} className="rounded border border-filigrane bg-blanc-casse p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-info-bg text-tampon">
                <f.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 font-serif text-lg font-semibold text-encre">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ardoise">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </Shell>
    </section>
  );
}

/* ----------------------------------------------------------- Cas concrets */
/* Exemples illustratifs, explicitement présentés comme représentatifs et non
   comme des témoignages nominatifs (pas de fausse preuve sociale). À remplacer
   par de vrais retours d'artisans dès qu'ils seront disponibles. */
function CasConcrets() {
  const cas = [
    {
      chantier: "Isolation des combles perdus",
      dispositif: "CEE · BAR-EN-101",
      detecte:
        "La résistance thermique n'était pas mentionnée sur le devis. Signalée avant dépôt, ajoutée en une ligne.",
      issue: "Dossier déposé sans point bloquant.",
    },
    {
      chantier: "Chauffe-eau thermodynamique",
      dispositif: "CEE · BAR-TH-148",
      detecte:
        "Le devis était daté après le début des travaux déclaré. Incohérence de chronologie remontée immédiatement.",
      issue: "Dates corrigées, motif de refus évité.",
    },
    {
      chantier: "Appareil de chauffage au bois",
      dispositif: "CEE · BAR-TH-112",
      detecte:
        "Un montant différait entre devis et facture. La saisie unique a rendu l'écart impossible à reproduire.",
      issue: "Cohérence des pièces garantie.",
    },
  ];
  return (
    <section className="py-20 sm:py-24">
      <Shell>
        <div className="max-w-2xl">
          <SectionLabel>Cas concrets</SectionLabel>
          <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
            Ce que le contrôle anti-refus repère, concrètement
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ardoise">
            Exemples représentatifs des points bloquants les plus courants,
            détectés avant le dépôt.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {cas.map((c) => (
            <div
              key={c.chantier}
              className="flex flex-col rounded border border-filigrane bg-blanc-casse p-6 shadow-sm"
            >
              <p className="font-mono text-xs text-tampon">{c.dispositif}</p>
              <h3 className="mt-2 font-serif text-lg font-semibold text-encre">
                {c.chantier}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ardoise">
                {c.detecte}
              </p>
              <p className="mt-4 flex items-start gap-2 border-t border-filigrane pt-4 text-sm font-medium text-encre">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-succes"
                  strokeWidth={1.5}
                />
                {c.issue}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-encre-claire">
          Exemples illustratifs des contrôles effectués, à des fins de
          démonstration. Ils ne constituent pas des témoignages de clients
          identifiés.
        </p>
      </Shell>
    </section>
  );
}

/* --------------------------------------------------------------- Pricing */
function Pricing({ grille }: { grille: GrilleAffichee | null }) {
  return (
    <section className="py-20 sm:py-24">
      <Shell>
        <div className="rounded border border-encre bg-encre px-8 py-14 sm:px-14">
          <div className="max-w-2xl">
            <p className="label text-papier/70">Tarification</p>
            <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-papier sm:text-[2.25rem] sm:leading-tight">
              {grille ? (
                <>
                  Le premier dossier est offert. Ensuite,{" "}
                  <span className="font-mono text-blanc-casse">
                    de {grille.minLabel} à {grille.maxLabel}
                  </span>{" "}
                  selon le montant de l&apos;aide.
                </>
              ) : (
                <>
                  Le premier dossier est offert. Ensuite, un{" "}
                  <span className="font-mono text-blanc-casse">forfait fixe</span>{" "}
                  selon le montant de l&apos;aide.
                </>
              )}
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-papier/75">
              Un forfait fixe, indexé sur l&apos;aide que le dossier va chercher :
              un petit chantier paie moins. Jamais un pourcentage de votre prime,
              qui reste entièrement à vous. Sans abonnement imposé.
            </p>

            {grille && grille.paliers.length > 1 && (
              <ul className="mt-8 flex flex-wrap gap-2">
                {grille.paliers.map((prix) => (
                  <li
                    key={prix}
                    className="rounded border border-papier/25 px-3 py-1.5 font-mono text-sm text-blanc-casse"
                  >
                    {prix}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/dossiers/nouveau"
                className={`group inline-flex h-12 items-center gap-2 rounded-lg bg-papier px-6 text-sm font-semibold text-encre transition-colors hover:bg-blanc-casse ${FOCUS_SOMBRE}`}
              >
                Créer mon premier dossier
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#contact"
                className={`inline-flex h-12 items-center gap-2 rounded-lg border border-papier/30 px-6 text-sm font-medium text-papier transition-colors hover:bg-papier/10 ${FOCUS_SOMBRE}`}
              >
                Être recontacté
              </a>
            </div>
            <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-papier/70">
              <CheckCircle2 className="h-4 w-4 text-succes" strokeWidth={1.5} />
              Aucune carte requise pour commencer
              <span className="text-papier/30">·</span>
              vous voyez le contrôle avant de payer
            </p>
          </div>
        </div>
      </Shell>
    </section>
  );
}

/* --------------------------------------------------------------- Contact */
function Contact() {
  return (
    <section id="contact" className="border-t border-filigrane bg-papier-fonce/60 py-20 sm:py-24">
      <div className="mx-auto grid max-w-[1080px] items-start gap-14 px-8 lg:grid-cols-2">
        <div>
          <SectionLabel>Rester en contact</SectionLabel>
          <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
            Sécurisez votre prochain dossier
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ardoise">
            Laissez-nous vos coordonnées : on prépare avec vous votre premier
            dossier, offert, et on vous montre le contrôle anti-refus en
            conditions réelles.
          </p>
        </div>
        <div className="rounded border border-filigrane bg-blanc-casse p-6 shadow-sm sm:p-7">
          <LeadForm />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- Faq */
/**
 * Source unique de la FAQ : elle alimente à la fois le rendu et le balisage
 * JSON-LD (`FAQPage`). Google peut afficher ces questions directement dans ses
 * résultats — encore faut-il que le texte affiché et le texte balisé soient le
 * même, sous peine de balisage trompeur.
 */
const FAQ_ITEMS = [
  {
    q: "Dossimo dépose-t-il le dossier à ma place ?",
    a: "Non, jamais. Le dépôt est réservé aux mandataires habilités par l'Anah. Dossimo produit le pack complet et vérifié ; vous et votre client déposez vous-mêmes et conservez la prime.",
  },
  {
    q: "En quoi est-ce différent d'un mandataire ?",
    a: "Un mandataire prend la main sur votre dossier et capte tout ou partie de la prime. Dossimo ne s'intercale jamais : il sécurise seulement la conformité avant dépôt. Vous restez maître de votre client et de votre prime.",
  },
  {
    q: "Quels dispositifs sont couverts ?",
    a: "MaPrimeRénov' et les CEE (Certificats d'Économies d'Énergie), avec leurs fiches BAR et leurs mentions obligatoires.",
  },
  {
    q: "Comment Dossimo évite-t-il les refus ?",
    a: "Toutes les pièces sont générées depuis une saisie unique : l'incohérence entre elles devient impossible, et un moteur de contrôle vérifie chronologie, RGE, éligibilité, performance et cohérence des montants avant le dépôt.",
  },
  {
    q: "Que fait Dossimo de mon devis et de ma facture ?",
    a: "Il les relit. Dossimo y cherche une par une les mentions obligatoires exigées par la fiche, compare les valeurs relevées à votre dossier, et confronte le devis à la facture. Ce qui manque ou diverge vous est signalé, avec le passage du document concerné. Dossimo ne modifie jamais vos documents : il constate, vous tranchez.",
  },
  {
    q: "Est-ce que c'est légal ?",
    a: "Oui. Dossimo est un service indépendant d'aide à la préparation de dossier, non affilié à l'Anah ni à France Rénov'. Il n'effectue aucune démarche à votre place.",
  },
] as const;

function Faq() {
  const items = FAQ_ITEMS;
  return (
    <section id="faq" className="py-20 sm:py-24">
      <div className="mx-auto max-w-[760px] px-8">
        <SectionLabel>Questions fréquentes</SectionLabel>
        <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
          Les questions qu&rsquo;on nous pose
        </h2>

        <div className="mt-10 divide-y divide-filigrane border-t border-filigrane">
          {items.map((it) => (
            <details key={it.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg font-semibold text-encre">
                {it.q}
                <span className="text-tampon transition-transform group-open:rotate-45">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </span>
              </summary>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ardoise">
                {it.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
