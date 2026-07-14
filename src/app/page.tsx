import Link from "next/link";
import type { Metadata } from "next";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  FolderCheck,
  Lock,
  ScanSearch,
  ShieldCheck,
  Stamp,
  XCircle,
} from "lucide-react";

import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { LeadForm } from "@/components/landing/lead-form";
import { FOCUS } from "@/components/ui/boutons";
import { CTA_DEMO } from "@/lib/landing/copy";
import { grillePublique } from "@/lib/landing/grille-publique";
import { editeur } from "@/lib/legal/editeur";
import type { GrilleAffichee } from "@/lib/pricing";
import { publicMetadata, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/seo/site";

export const metadata: Metadata = publicMetadata({
  path: "/",
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  absoluteTitle: true,
});

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
    <div className="flex min-h-full flex-col bg-papier pb-20 md:pb-0">
      <JsonLd grille={grille} />
      <a href="#contenu" className="skip-link">Aller au contenu principal</a>
      <SiteHeader />

      <main id="contenu" className="flex-1" tabIndex={-1}>
        <Hero />
        <TrustStrip grille={grille} />
        <Pricing grille={grille} />
        <Reassurance />
      </main>

      <MobileConversionBar />
      <SiteFooter />
    </div>
  );
}

/* ------------------------------------------------------------- Primitives */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="label flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-tampon">
      <span className="h-2 w-2 border border-tampon bg-papier" />
      {children}
    </p>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-[1280px] px-5 sm:px-8">{children}</div>;
}

/* ------------------------------------------------------------------ Hero */
function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-filigrane bg-blanc-casse">
      <div className="pointer-events-none absolute inset-0 opacity-[0.55] [background-image:linear-gradient(to_right,rgba(226,221,209,0.9)_1px,transparent_1px),linear-gradient(to_bottom,rgba(226,221,209,0.9)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="relative mx-auto grid max-w-[1280px] items-center gap-9 px-5 py-10 sm:px-8 sm:py-12 lg:grid-cols-[1fr_0.9fr] lg:py-14">
        <div>
          <p className="inline-flex items-center gap-2 border-y border-encre py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-encre">
            <span className="h-2 w-2 rounded-full bg-terre-cuite" />
            Le contrôle avant dépôt des artisans RGE
          </p>

          <h1 className="mt-6 max-w-3xl font-serif text-[2.65rem] font-semibold leading-[1.02] tracking-tight text-encre sm:text-[3.65rem] lg:text-[4.1rem]">
            Prenez votre devis en photo.{" "}
            <span className="relative text-tampon">
              Dossimo vous dit quoi corriger.
              <span className="absolute -bottom-2 left-0 h-1 w-full bg-terre-cuite" />
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ardoise">
            Une photo suffit. Dossimo lit le devis, vérifie les points essentiels et
            vous donne une correction prête à appliquer.
          </p>

          <ul className="mt-6 grid max-w-xl gap-2 sm:grid-cols-2" aria-label="Ce que Dossimo contrôle">
            {["Mentions obligatoires", "Chronologie du chantier", "Qualification RGE", "Cohérence devis / facture"].map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm font-medium text-encre">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-succes" strokeWidth={1.5} />
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-7">
            <Link
              href="/demo"
              className={`group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-terre-cuite px-6 py-3 text-sm font-semibold text-blanc-casse shadow-md transition-colors hover:bg-terre-cuite-hover sm:w-auto ${FOCUS}`}
            >
              {CTA_DEMO}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ardoise">
            <CheckCircle2 className="h-4 w-4 text-succes" strokeWidth={1.5} />
            Aucun paiement aujourd&rsquo;hui
            <span className="text-filigrane">·</span>
            sans carte bancaire
            <span className="text-filigrane">·</span>
            sans engagement
          </p>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative border border-encre bg-encre p-3 shadow-[10px_10px_0_#35507f] lg:mr-3">
      <div className="border border-papier/25 p-5 sm:p-7">
        <div className="mb-6 flex items-center justify-between border-b border-papier/25 pb-4 font-mono text-[11px] uppercase tracking-[0.13em] text-papier/65">
          <span>Contrôle avant dépôt</span><span>DOS-2026-0148</span>
        </div>
        <ReportCard />
      </div>
      <div className="absolute -bottom-7 -left-4 hidden border border-encre bg-terre-cuite px-5 py-3 text-blanc-casse shadow-sm sm:block">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-blanc-casse/70">Statut du dossier</p>
        <p className="mt-1 font-serif text-lg font-semibold">Corrections ciblées</p>
      </div>
      <div className="absolute -right-3 top-8 hidden border border-filigrane bg-blanc-casse px-3 py-2 shadow-sm xl:block">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ardoise">Avant envoi</p>
        <p className="mt-0.5 text-xs font-medium text-erreur">2 alertes lisibles</p>
      </div>
    </div>
  );
}

function ReportCard() {
  const checks = [
    { label: "Chronologie : devis avant travaux", ok: true },
    { label: "Qualification RGE valide à la date du devis", ok: true },
    { label: "Ajoutez : « Résistance thermique R = 7 m².K/W »", ok: false },
    { label: "Montant différent entre devis et facture", ok: false },
  ];
  return (
    <div className="border border-papier/40 bg-blanc-casse p-5 shadow-md">
      <div className="flex items-center justify-between border-b border-filigrane pb-3">
        <div>
          <p className="font-serif text-base font-semibold text-encre">
            Rapport de contrôle
          </p>
          <p className="mt-0.5 font-mono text-xs text-encre-claire">
            DOS-2026-0148
          </p>
        </div>
        <StatusBadge tone="erreur">2 points trouvés</StatusBadge>
      </div>
      <ul className="mt-4 space-y-2.5">
        {checks.map((c) => (
          <li key={c.label} className={`flex items-start gap-2.5 rounded-sm px-2 py-1.5 text-[0.813rem] leading-snug ${c.ok ? "text-encre" : "bg-erreur-bg text-erreur"}`}>
            {c.ok ? (
              <CheckCircle2 className="mt-px h-4 w-4 shrink-0 text-succes" strokeWidth={1.5} />
            ) : (
              <AlertTriangle className="mt-px h-4 w-4 shrink-0 text-erreur" strokeWidth={1.5} />
            )}
            {c.label}
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-sm bg-info-bg px-3 py-2 text-xs font-medium text-tampon">
        Pourquoi : sans cette valeur, le dossier d’isolation risque d’être refusé.
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
  const site = SITE_URL;

  const donnees = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Dossimo",
      url: site,
      logo: `${site}/icon.png`,
      email: "max@dossimo.pro",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "max@dossimo.pro",
        availableLanguage: "French",
      },
      description:
        "Service indépendant d'aide à la préparation et au contrôle de conformité de dossiers MaPrimeRénov' et CEE, destiné aux artisans RGE indépendants.",
      slogan: "Des dossiers de prime qui passent. Du premier coup.",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Dossimo",
      url: site,
      inLanguage: "fr-FR",
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
            offers: grille.lignes.map((ligne) => ({
              "@type": "Offer",
              name: ligne.name,
              description: ligne.aidLabel,
              priceCurrency: "EUR",
              price: ligne.priceLabel.replace(/[^\d,]/g, "").replace(",", "."),
              url: `${site}/#tarifs`,
              availability: "https://schema.org/InStock",
            })),
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
    grille
      ? `Puis de ${grille.minLabel} à ${grille.maxLabel} selon l’aide`
      : "Puis un forfait fixe selon l’aide",
    "Sans carte bancaire",
    "Vous gardez client et prime",
  ];
  return (
    <div className="border-b border-encre bg-papier-fonce">
      <Shell>
        <div className="grid divide-y divide-encre/15 py-1 text-sm font-medium text-encre sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {items.map((i) => (
            <span key={i} className="flex items-center gap-2 px-4 py-4 lg:px-5">
              <CheckCircle2 className="h-4 w-4 text-succes" strokeWidth={1.5} />
              {i}
            </span>
          ))}
        </div>
      </Shell>
    </div>
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
          <div className="border border-filigrane bg-blanc-casse p-7">
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
          <div className="border border-filigrane border-l-4 border-l-terre-cuite bg-blanc-casse p-7 shadow-sm">
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

/* ---------------------------------------------------------------- Etapes */
function Etapes() {
  const steps = [
    {
      icon: ClipboardCheck,
      title: "Votre devis d’abord",
      body: "Ajoutez le PDF ou prenez-le en photo depuis le chantier. Aucun formulaire à préparer.",
    },
    {
      icon: ShieldCheck,
      title: "Dossimo préremplit",
      body: "L’assistant recopie le client, les montants et les données techniques. Vous confirmez ce qu’il a lu.",
    },
    {
      icon: ScanSearch,
      title: "Une action à la fois",
      body: "Dossimo vérifie les règles et vous montre d’abord ce qui bloque, avec une explication concrète.",
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
            Du devis au dépôt, sans vous perdre
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ardoise">
            Vous fournissez les documents que vous avez déjà. Dossimo organise le reste,
            vous indique ce qui manque et garde les contrôles réglementaires vérifiables.
          </p>
        </div>

        <div className="mt-12 grid divide-y divide-encre border-y border-encre sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative border-encre px-0 py-7 sm:px-6 sm:[&:nth-child(odd)]:border-r lg:border-r lg:last:border-r-0">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-tampon">ÉTAPE 0{i + 1}</span>
                <s.icon className="h-5 w-5 text-encre" strokeWidth={1.5} />
              </div>
              <h3 className="mt-8 font-serif text-xl font-semibold text-encre">
                {s.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ardoise">
                {s.body}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-l-4 border-l-tampon bg-info-bg px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm leading-relaxed text-encre">
            <span className="font-semibold">Votre rôle reste simple :</span> vous relisez le rapport, puis vous déposez vous-même le dossier.
          </p>
          <Link href="/demo" className={`shrink-0 text-sm font-semibold text-tampon underline underline-offset-4 ${FOCUS}`}>
            Essayer sur un dossier <span aria-hidden="true">→</span>
          </Link>
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
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_0.9fr]">
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
      <div className="border border-encre bg-blanc-casse p-5 shadow-md">
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

/* --------------------------------------------------------- Réassurance */
function Reassurance() {
  const garanties = [
    { icon: Lock, title: "Aucune mainmise", body: "Dossimo ne dépose pas à votre place et ne s'intercale pas dans votre relation client." },
    { icon: FileCheck2, title: "Un contrôle lisible", body: "Chaque alerte indique la pièce à vérifier : pas de note opaque à interpréter." },
    { icon: CheckCircle2, title: "Sans engagement", body: "Le premier contrôle est offert, sans carte bancaire ni abonnement imposé." },
  ];

  return (
    <section className="border-y border-filigrane bg-info-bg/45 py-12 sm:py-16">
      <Shell>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_2fr] lg:items-center">
          <div>
            <SectionLabel>Vos garanties</SectionLabel>
            <h2 className="mt-4 font-serif text-2xl font-semibold tracking-tight text-encre sm:text-3xl">Clair avant de commencer</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {garanties.map((garantie) => (
              <div key={garantie.title} className="border border-filigrane bg-blanc-casse p-5">
                <garantie.icon className="h-5 w-5 text-tampon" strokeWidth={1.5} />
                <h3 className="mt-3 font-serif text-lg font-semibold text-encre">{garantie.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ardoise">{garantie.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Shell>
    </section>
  );
}

/* ---------------------------------------------------------- Préparation */
function Preparation() {
  const pieces = [
    { icon: FileText, title: "Le devis", body: "Pour vérifier les mentions et la chronologie." },
    { icon: FileCheck2, title: "La facture", body: "Quand les travaux sont terminés, pour comparer les données." },
    { icon: ShieldCheck, title: "Votre qualification RGE", body: "Pour contrôler sa validité à la date du dossier." },
  ];

  return (
    <aside className="border-b border-filigrane bg-blanc-casse py-8" aria-labelledby="preparation-title">
      <Shell>
        <div className="grid gap-6 lg:grid-cols-[0.72fr_2fr] lg:items-center">
          <div>
            <p className="label text-tampon">Pour commencer</p>
            <h2 id="preparation-title" className="mt-2 font-serif text-xl font-semibold text-encre">Vous avez déjà tout ce qu&rsquo;il faut</h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3">
            {pieces.map((piece) => (
              <li key={piece.title} className="flex items-start gap-3">
                <piece.icon className="mt-0.5 h-5 w-5 shrink-0 text-tampon" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-semibold text-encre">{piece.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ardoise">{piece.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Shell>
    </aside>
  );
}

/* --------------------------------------------------------------- Pricing */
function Pricing({ grille }: { grille: GrilleAffichee | null }) {
  return (
    <section id="tarifs" className="py-20 sm:py-24">
      <Shell>
        <div className="border border-encre bg-encre px-6 py-12 sm:px-14 sm:py-14">
          <div>
            <div className="max-w-3xl">
              <p className="label text-papier/70">Tarification transparente</p>
              <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-papier sm:text-[2.25rem] sm:leading-tight">
                {grille ? (
                  <>
                    Votre premier dossier est offert. Ensuite, le prix est{" "}
                    <span className="text-blanc-casse">fixé à l&rsquo;avance</span>.
                  </>
                ) : (
                  <>
                    Essayez gratuitement. Ensuite, un{" "}
                    <span className="font-mono text-blanc-casse">forfait fixe</span>{" "}
                    selon le montant de l&apos;aide.
                  </>
                )}
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-papier/75">
                Un paiement unique par dossier, selon le montant d&apos;aide estimé.
                Aucun pourcentage sur la prime, aucun abonnement et aucun frais caché.
              </p>
            </div>

            {grille && grille.lignes.length > 0 && (
              <div className="mt-9">
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-papier/65">
                  Grille appliquée au paiement
                </p>
                <ul className="mt-3 grid gap-3 lg:grid-cols-3">
                  {grille.lignes.map((ligne) => (
                    <li
                      key={`${ligne.name}-${ligne.priceLabel}`}
                      className="border border-papier/25 bg-papier/[0.06] p-5"
                    >
                      <p className="text-sm font-medium text-papier/70">{ligne.name}</p>
                      <p className="mt-3 font-mono text-3xl font-semibold text-blanc-casse">
                        {ligne.priceLabel}
                      </p>
                      <p className="mt-1 text-xs text-papier/60">
                        par dossier · paiement unique
                      </p>
                      <p className="mt-5 border-t border-papier/20 pt-4 text-sm font-medium text-papier">
                        {ligne.aidLabel}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs leading-relaxed text-papier/60">
                  Le montant d&rsquo;aide est estimé par Dossimo à partir des informations
                  du dossier. Le palier et le prix exact sont affichés avant tout paiement.
                </p>
              </div>
            )}

            <div className="mt-9 border-t border-papier/20 pt-7">
              <p className="text-sm font-semibold text-papier">Inclus dans chaque tarif</p>
              <ul className="mt-4 grid gap-2 text-sm text-papier/85 sm:grid-cols-2 lg:max-w-3xl">
                {["Contrôle des informations du dossier", "Relecture devis et facture", "Rapport de contrôle téléchargeable", "Aucun abonnement mensuel"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-succes" strokeWidth={1.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/demo"
                className={`group inline-flex h-12 items-center gap-2 rounded-lg bg-papier px-6 text-sm font-semibold text-encre transition-colors hover:bg-blanc-casse ${FOCUS_SOMBRE}`}
              >
                {CTA_DEMO}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#contact"
                className={`inline-flex h-12 items-center gap-2 rounded-lg border border-papier/30 px-6 text-sm font-medium text-papier transition-colors hover:bg-papier/10 ${FOCUS_SOMBRE}`}
              >
                J’ai une question
              </a>
            </div>
            <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-papier/70">
              <CheckCircle2 className="h-4 w-4 text-succes" strokeWidth={1.5} />
              Premier contrôle offert
              <span className="text-papier/30">·</span>
              vous voyez le contrôle avant de payer
            </p>
          </div>
        </div>
      </Shell>
    </section>
  );
}

/* CTA persistant sur mobile : l'action reste accessible après la lecture d'une preuve. */
function MobileConversionBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-encre/15 bg-blanc-casse/95 p-3 shadow-[0_-8px_24px_rgba(22,32,43,0.12)] backdrop-blur md:hidden">
      <Link
        href="/demo"
        className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-terre-cuite px-5 py-3 text-center text-sm font-semibold text-blanc-casse ${FOCUS}`}
      >
        {CTA_DEMO}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

/* --------------------------------------------------------------- Contact */
function Contact() {
  return (
    <section id="contact" className="border-t border-filigrane bg-papier-fonce/60 py-20 sm:py-24">
      <div className="mx-auto grid max-w-[1080px] items-start gap-14 px-5 sm:px-8 lg:grid-cols-2">
        <div>
          <SectionLabel>Rester en contact</SectionLabel>
          <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
            Pas encore de dossier à contrôler ?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ardoise">
            Laissez vos coordonnées et nous vous expliquons comment préparer votre
            prochain dossier. Le contrôle gratuit reste le moyen le plus simple de
            découvrir Dossimo si votre chantier est déjà prêt.
          </p>
          <p className="mt-5 text-sm text-ardoise">
            Vous préférez écrire directement ?{" "}
            <a
              href={`mailto:${editeur.emailContact}?subject=Question%20avant%20mon%20premier%20dossier`}
              className={`font-semibold text-tampon underline underline-offset-4 ${FOCUS}`}
            >
              {editeur.emailContact}
            </a>
          </p>
        </div>
        <div className="border border-filigrane border-t-2 border-t-encre bg-blanc-casse p-6 shadow-sm sm:p-7">
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
      <div className="mx-auto max-w-[760px] px-5 sm:px-8">
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
        <div className="mt-8 border-l-4 border-l-tampon bg-info-bg px-5 py-4 text-sm text-encre">
          Une question qui n&rsquo;est pas dans cette liste ? <a href="#contact" className={`font-semibold text-tampon underline underline-offset-4 ${FOCUS}`}>Écrivez-nous</a> : nous vous répondons avant votre premier dossier.
        </div>
      </div>
    </section>
  );
}
