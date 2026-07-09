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
  ShieldCheck,
  Stamp,
  XCircle,
} from "lucide-react";

import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { LeadForm } from "@/components/landing/lead-form";
import { fourchettePrix } from "@/lib/stripe/pricing";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-papier">
      <SiteHeader />

      <main className="flex-1">
        <Hero />
        <TrustStrip />
        <Probleme />
        <Difference />
        <PourQui />
        <Etapes />
        <Features />
        <CasConcrets />
        <Pricing />
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
          <SectionLabel>Pour les artisans RGE indépendants d&rsquo;Île-de-France</SectionLabel>

          <h1 className="mt-6 font-serif text-[2.75rem] font-semibold leading-[1.08] tracking-tight text-encre sm:text-[3.25rem]">
            Des dossiers de prime qui passent.{" "}
            <span className="text-tampon">Du premier coup.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ardoise">
            Dossimo prépare et vérifie vos dossiers MaPrimeRénov&rsquo; et CEE,
            conformes et anti-refus. Sans mandataire :{" "}
            <span className="text-encre">
              vous gardez votre client et l&rsquo;intégralité de votre prime.
            </span>
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/dossiers/nouveau"
              className="group inline-flex h-12 items-center gap-2 rounded-lg bg-terre-cuite px-6 text-sm font-semibold text-blanc-casse transition-colors hover:bg-terre-cuite-hover"
            >
              Créer mon dossier gratuit
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#etapes"
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-encre px-6 text-sm font-medium text-encre transition-colors hover:bg-papier-fonce"
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

/* ------------------------------------------------------------ TrustStrip */
function TrustStrip() {
  const items = [
    "Premier dossier offert",
    "À partir de 49 € par dossier",
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
                className="group inline-flex h-12 items-center gap-2 rounded-lg bg-terre-cuite px-6 text-sm font-semibold text-blanc-casse transition-colors hover:bg-terre-cuite-hover"
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
            De la saisie au dépôt, en trois temps
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ardoise">
            Comme toutes les pièces viennent de la même saisie,
            l&rsquo;incohérence entre elles devient structurellement impossible.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
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

/* -------------------------------------------------------------- Features */
function Features() {
  const feats = [
    { icon: RefreshCw, title: "Cohérence garantie", body: "Une saisie unique alimente toutes les pièces : plus d'écart entre devis et facture." },
    { icon: ShieldCheck, title: "Contrôle anti-refus", body: "Chronologie, RGE, seuils de performance, montants : les motifs de refus détectés avant dépôt." },
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
function Pricing() {
  const { minLabel: minPrix, maxLabel: maxPrix } = fourchettePrix();
  return (
    <section className="py-20 sm:py-24">
      <Shell>
        <div className="rounded border border-encre bg-encre px-8 py-14 sm:px-14">
          <div className="max-w-2xl">
            <p className="label text-papier/70">Tarification</p>
            <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-papier sm:text-[2.25rem] sm:leading-tight">
              Le premier dossier est offert. Ensuite,{" "}
              <span className="font-mono text-blanc-casse">
                de {minPrix} à {maxPrix}
              </span>{" "}
              selon la taille du dossier.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-papier/75">
              Un forfait fixe, adapté à la taille du dossier : un petit chantier
              paie moins. Jamais un pourcentage de votre prime, qui reste
              entièrement à vous. Sans abonnement imposé.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/dossiers/nouveau"
                className="group inline-flex h-12 items-center gap-2 rounded-lg bg-papier px-6 text-sm font-semibold text-encre transition-colors hover:bg-blanc-casse"
              >
                Créer mon premier dossier
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#contact"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-papier/30 px-6 text-sm font-medium text-papier transition-colors hover:bg-papier/10"
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
function Faq() {
  const items = [
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
      q: "Est-ce que c'est légal ?",
      a: "Oui. Dossimo est un service indépendant d'aide à la préparation de dossier, non affilié à l'Anah ni à France Rénov'. Il n'effectue aucune démarche à votre place.",
    },
  ];
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
