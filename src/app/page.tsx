import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck2,
  HandCoins,
  Lock,
  Mail,
  ScanSearch,
  Server,
  ShieldCheck,
  Stamp,
  TicketPercent,
  XCircle,
} from "lucide-react";

import { Estimateur } from "@/components/landing/estimateur";
import { EtapePicto, Illustration } from "@/components/landing/illustrations";
import { LeadForm } from "@/components/landing/lead-form";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { FOCUS } from "@/components/ui/boutons";
import { CTA_DEMO } from "@/lib/landing/copy";
import { grillePublique } from "@/lib/landing/grille-publique";
import { editeur } from "@/lib/legal/editeur";
import { labelEuros, type GrilleAffichee } from "@/lib/pricing";
import { publicMetadata, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/seo/site";

export const metadata: Metadata = publicMetadata({
  path: "/",
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  absoluteTitle: true,
});

const FOCUS_SOMBRE =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papier";

function prixLancement(grille: GrilleAffichee): string {
  return labelEuros(Math.round(grille.minCents / 2));
}

export default async function Home() {
  const grille = await grillePublique();

  return (
    <div className="flex min-h-full flex-col bg-papier pb-20 md:pb-0">
      <JsonLd grille={grille} />
      <a href="#contenu" className="skip-link">Aller au contenu principal</a>
      <SiteHeader />
      <main id="contenu" className="flex-1" tabIndex={-1}>
        <Hero />
        <TrustStrip />
        <Parcours />
        <Livrable />
        <Difference />
        <Gestes />
        <Estimation />
        <Confiance />
        <Pricing grille={grille} />
        <Faq />
        <Contact />
      </main>
      <MobileConversionBar />
      <SiteFooter />
    </div>
  );
}

function Shell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={"mx-auto max-w-7xl px-5 sm:px-8 " + className}>{children}</div>;
}

function SectionLabel({ children, sombre = false }: { children: React.ReactNode; sombre?: boolean }) {
  return (
    <p className={"flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.14em] " + (sombre ? "text-accent-clair" : "text-tampon")}>
      <span className={"h-2 w-2 rounded-full " + (sombre ? "bg-accent-clair" : "bg-tampon")} />
      {children}
    </p>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-encre">
      <div aria-hidden="true" className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-accent-clair/15" />
      <div aria-hidden="true" className="absolute -right-12 top-16 h-64 w-64 rounded-full border border-accent-clair/10" />
      <Shell className="relative grid min-h-[620px] items-center gap-10 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:py-16">
        <div className="relative z-10 max-w-3xl">
          <SectionLabel sombre>MaPrimeRénov&rsquo; & CEE · artisans RGE</SectionLabel>
          <h1 className="mt-5 max-w-3xl font-serif text-4xl font-semibold leading-[1.04] tracking-tight text-blanc-casse sm:text-5xl lg:text-6xl">
            Vos dossiers de prime,{" "}
            <span className="text-accent-clair">montés sans vos soirées.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-papier/75">
            Envoyez le devis. Dossimo recopie les informations, contrôle les mentions,
            compare la facture et prépare le pack complet. Vous relisez, vous déposez.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/demo" className={"group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-papier px-6 text-sm font-semibold text-encre transition-colors hover:bg-blanc-casse " + FOCUS_SOMBRE}>
              {CTA_DEMO}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link href="/exemple" className={"inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-papier/30 px-6 text-sm font-medium text-papier transition-colors hover:bg-papier/10 " + FOCUS_SOMBRE}>
              Voir un pack réel
            </Link>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-papier/65">
            {["2 minutes pour commencer", "Aucun paiement aujourd’hui", "Sans engagement"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent-clair" strokeWidth={1.5} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
          <div className="overflow-hidden rounded-2xl bg-papier shadow-lg">
            <Illustration src="/illustrations/artisan-protecteur.svg" className="aspect-square w-full object-cover" />
          </div>
          <div className="absolute -bottom-5 left-4 rounded-xl bg-blanc-casse p-4 shadow-lg sm:left-8">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-tampon">Votre rôle</p>
            <p className="mt-1 font-serif text-xl font-semibold text-encre">Relire. Puis déposer.</p>
          </div>
          <div className="absolute -right-2 top-6 rounded-xl bg-accent px-4 py-3 text-blanc-casse shadow-lg sm:-right-5">
            <p className="text-xs text-papier/75">Commission sur la prime</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">0 %</p>
          </div>
        </div>
      </Shell>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { icon: Clock, stat: null, text: "Monté en minutes" },
    { icon: HandCoins, stat: "100 %", text: "de la prime conservée" },
    { icon: Ban, stat: "0 %", text: "de commission" },
    { icon: TicketPercent, stat: "−50 %", text: "sur le premier dossier" },
  ];
  return (
    <div className="border-b border-papier/10 bg-encre">
      <Shell>
        <ul className="grid grid-cols-2 divide-x divide-y divide-papier/10 lg:grid-cols-4 lg:divide-y-0">
          {items.map((item) => (
            <li key={item.text} className="flex min-h-24 items-center gap-3 px-3 py-4 sm:px-6">
              <item.icon className="h-5 w-5 shrink-0 text-accent-clair" strokeWidth={1.5} aria-hidden="true" />
              <p className="text-sm leading-snug text-papier/75">
                {item.stat && <span className="block font-serif text-xl font-semibold text-blanc-casse">{item.stat}</span>}
                {item.text}
              </p>
            </li>
          ))}
        </ul>
      </Shell>
    </div>
  );
}

function Parcours() {
  const steps = [
    { picto: "devis" as const, number: "01", title: "Envoyez le devis", body: "Un PDF ou une photo depuis le chantier. Rien d’autre à préparer." },
    { picto: "recopie" as const, number: "02", title: "Dossimo monte le dossier", body: "Client, montants et données techniques sont recopiés dans une saisie unique." },
    { picto: "controle" as const, number: "03", title: "Les risques remontent", body: "Mentions, dates, RGE, cohérence devis-facture : vous voyez quoi corriger et pourquoi." },
    { picto: "pack" as const, number: "04", title: "Le pack est prêt", body: "Récapitulatif, checklist et rapport de contrôle sont réunis pour le dépôt." },
  ];
  return (
    <section id="etapes" className="bg-papier py-20 sm:py-24">
      <Shell>
        <div className="grid items-end gap-6 lg:grid-cols-[1fr_0.75fr]">
          <div>
            <SectionLabel>Comment ça marche</SectionLabel>
            <h2 className="mt-5 max-w-3xl font-serif text-3xl font-semibold leading-tight tracking-tight text-encre sm:text-4xl">
              Un document entre. Un dossier complet en sort.
            </h2>
          </div>
          <p className="max-w-xl text-lg leading-relaxed text-ardoise lg:justify-self-end">
            Le parcours part de ce que vous avez déjà, sans long formulaire avant de voir la valeur du service.
          </p>
        </div>
        <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <li key={step.number} className="group relative overflow-hidden rounded-2xl bg-blanc-casse p-6 shadow-md transition-transform hover:-translate-y-1 motion-reduce:transform-none">
              <div className="flex items-start justify-between gap-4">
                <EtapePicto name={step.picto} className="h-14 w-14" />
                <span className="font-mono text-xs text-encre-claire">{step.number}</span>
              </div>
              <h3 className="mt-8 font-serif text-xl font-semibold text-encre">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ardoise">{step.body}</p>
            </li>
          ))}
        </ol>
      </Shell>
    </section>
  );
}

function Livrable() {
  const contents = [
    "Les informations client préremplies",
    "La checklist des pièces à réunir",
    "Les écarts devis-facture expliqués",
    "Les points bloquants avant le dépôt",
  ];
  return (
    <section className="bg-blanc-casse py-20 sm:py-24">
      <Shell className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative mx-auto w-full max-w-xl">
          <div className="overflow-hidden rounded-2xl bg-papier shadow-lg">
            <Illustration src="/illustrations/pack.svg" className="aspect-square w-full object-cover" />
          </div>
          <div className="absolute -bottom-5 right-4 max-w-xs rounded-xl bg-encre p-5 text-papier shadow-lg sm:right-8">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-accent-clair">Avant dépôt</p>
            <p className="mt-2 text-sm leading-relaxed">Chaque alerte indique la pièce, l’écart et la correction attendue.</p>
          </div>
        </div>
        <div>
          <SectionLabel>Ce que vous recevez</SectionLabel>
          <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight tracking-tight text-encre sm:text-4xl">
            Pas un tableau de bord de plus.{" "}
            <span className="text-tampon">Un pack à utiliser.</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ardoise">
            Dossimo transforme le devis et la facture en documents concrets. Vous savez ce qui est prêt, ce qui manque et ce qui doit être corrigé.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {contents.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-xl bg-papier p-4 text-sm font-medium text-encre">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-succes" strokeWidth={1.5} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/exemple" className={"mt-8 inline-flex items-center gap-2 text-sm font-semibold text-tampon underline underline-offset-4 " + FOCUS}>
            Ouvrir le pack d&rsquo;exemple <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </Shell>
    </section>
  );
}

function Difference() {
  const mandataire = ["Prend la main sur le dossier", "S’intercale avec votre client", "Peut capter une part de la prime"];
  const dossimo = ["Vous restez l’interlocuteur", "Vous déposez vous-même", "La prime reste intégralement au client"];
  return (
    <section id="difference" className="bg-encre py-20 sm:py-24">
      <Shell>
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center"><SectionLabel sombre>La différence Dossimo</SectionLabel></div>
          <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight tracking-tight text-blanc-casse sm:text-4xl">
            La paperasse disparaît. Pas votre relation client.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-papier/70">
            Dossimo vous aide à préparer et contrôler. Il ne devient jamais mandataire et ne dépose rien à votre place.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-papier/15 bg-papier/[0.05] p-7">
            <p className="text-sm font-medium text-papier/60">Avec un mandataire</p>
            <ul className="mt-6 space-y-4">
              {mandataire.map((item) => (
                <li key={item} className="flex items-start gap-3 text-papier/70">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-encre-claire" strokeWidth={1.5} aria-hidden="true" />{item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative rounded-2xl bg-papier p-7 shadow-lg">
            <span className="absolute -top-3 right-6 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-blanc-casse">Votre maîtrise conservée</span>
            <p className="flex items-center gap-2 text-sm font-semibold text-tampon"><Stamp className="h-4 w-4" aria-hidden="true" /> Avec Dossimo</p>
            <ul className="mt-6 space-y-4">
              {dossimo.map((item) => (
                <li key={item} className="flex items-start gap-3 font-medium text-encre">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-succes" strokeWidth={1.5} aria-hidden="true" />{item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Shell>
    </section>
  );
}

function Gestes() {
  const cards = [
    { title: "Isolation", body: "Combles, rampants, murs", href: "/devis-cee-conforme" },
    { title: "Pompe à chaleur", body: "Air/eau, eau/eau", href: "/qualification-rge-valide-geste" },
    { title: "Chauffe-eau", body: "Thermodynamique et solaire", href: "/cumul-maprimerenov-cee" },
    { title: "Chauffage bois", body: "Poêle, chaudière, insert", href: "/devis-maprimerenov-conforme" },
  ];
  return (
    <section className="bg-papier py-20 sm:py-24">
      <Shell>
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionLabel>Chaque geste a ses règles</SectionLabel>
            <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight tracking-tight text-encre sm:text-4xl">Le bon contrôle pour le bon chantier.</h2>
            <p className="mt-5 text-lg leading-relaxed text-ardoise">Mentions techniques, qualification RGE et fiches d’opération changent selon les travaux. Dossimo applique le parcours correspondant.</p>
            <Link href="/guides" className={"mt-7 inline-flex items-center gap-2 text-sm font-semibold text-tampon underline underline-offset-4 " + FOCUS}>
              Parcourir tous les guides <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((card) => (
              <Link key={card.title} href={card.href} className={"group rounded-2xl bg-blanc-casse p-5 shadow-md transition-transform hover:-translate-y-1 motion-reduce:transform-none " + FOCUS}>
                <div className="flex items-start justify-between gap-4">
                  <FileCheck2 className="h-6 w-6 text-tampon" strokeWidth={1.5} aria-hidden="true" />
                  <ChevronRight className="h-5 w-5 text-encre-claire transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
                <h3 className="mt-8 font-serif text-xl font-semibold text-encre">{card.title}</h3>
                <p className="mt-1 text-sm text-ardoise">{card.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </Shell>
    </section>
  );
}

function Estimation() {
  return (
    <section id="estimation" className="bg-blanc-casse py-20 sm:py-24">
      <Shell className="grid items-start gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
        <div>
          <SectionLabel>Combien est en jeu</SectionLabel>
          <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight tracking-tight text-encre sm:text-4xl">Estimez d’abord l’aide. Jugez ensuite le prix.</h2>
          <p className="mt-5 text-lg leading-relaxed text-ardoise">Un dossier refusé peut faire perdre l’aide entière. Le simulateur utilise les mêmes règles métier que le moteur Dossimo, sans montant de communication inventé.</p>
          <div className="mt-8 overflow-hidden rounded-2xl bg-papier shadow-md">
            <Illustration src="/illustrations/maison-renovee.svg" className="aspect-[16/9] w-full object-cover" />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-ardoise">Dossimo est un service indépendant d&rsquo;aide à la préparation de dossier, non affilié à l&rsquo;Anah ni à France Rénov&rsquo;. L’estimation ne vaut pas décision d’attribution.</p>
        </div>
        <Estimateur />
      </Shell>
    </section>
  );
}

function Confiance() {
  const proofs = [
    { icon: ScanSearch, title: "Analyse limitée", body: "Le modèle extrait les informations utiles du devis et de la facture, rien d’autre." },
    { icon: Server, title: "Stockage identifié", body: "Documents chez " + editeur.baseDeDonnees.nom.split(" (")[0] + ", site hébergé par " + editeur.hebergeur.nom.replace(" Inc.", "") + "." },
    { icon: Lock, title: "Aucune revente", body: "Vos données ne sont jamais vendues et Dossimo ne perçoit rien sur la prime." },
  ];
  return (
    <section id="confiance" className="bg-papier py-20 sm:py-24">
      <Shell>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <SectionLabel>Une entreprise identifiable</SectionLabel>
            <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight tracking-tight text-encre sm:text-4xl">Vous savez à qui vous confiez le devis.</h2>
            <p className="mt-5 text-lg leading-relaxed text-ardoise">Dossimo est édité par {editeur.directeurPublication}. Le nom, l’adresse, le SIREN et le contact restent visibles avant le premier envoi.</p>
            <dl className="mt-8 grid gap-4 rounded-2xl bg-blanc-casse p-6 shadow-md sm:grid-cols-2">
              <div><dt className="text-xs uppercase tracking-wide text-tampon">Éditeur</dt><dd className="mt-1 text-sm font-medium text-encre">{editeur.raisonSociale}</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-tampon">SIREN</dt><dd className="mt-1 font-mono text-sm tabular-nums text-encre">{editeur.siren}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs uppercase tracking-wide text-tampon">Adresse</dt><dd className="mt-1 text-sm text-encre">{editeur.adresse}</dd></div>
            </dl>
            <a href={"mailto:" + editeur.emailContact + "?subject=Question%20avant%20mon%20premier%20dossier"} className={"mt-6 inline-flex items-center gap-2 text-sm font-semibold text-tampon underline underline-offset-4 " + FOCUS}>
              <Mail className="h-4 w-4" aria-hidden="true" /> {editeur.emailContact}
            </a>
          </div>
          <div>
            <SectionLabel>Vos documents</SectionLabel>
            <ul className="mt-5 grid gap-4">
              {proofs.map((proof) => (
                <li key={proof.title} className="flex items-start gap-4 rounded-2xl bg-blanc-casse p-5 shadow-md">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-info-bg text-tampon">
                    <proof.icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-encre">{proof.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ardoise">{proof.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-ardoise">Tous les détails sont dans la{" "}
              <Link href="/confidentialite" className={"font-semibold text-tampon underline underline-offset-4 " + FOCUS}>politique de confidentialité</Link>.
            </p>
          </div>
        </div>
      </Shell>
    </section>
  );
}

function Pricing({ grille }: { grille: GrilleAffichee | null }) {
  return (
    <section id="tarifs" className="bg-blanc-casse py-20 sm:py-24">
      <Shell>
        <div className="overflow-hidden rounded-2xl bg-encre p-7 shadow-lg sm:p-12 lg:p-14">
          <div className="max-w-3xl">
            <SectionLabel sombre>Tarification transparente</SectionLabel>
            <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight tracking-tight text-blanc-casse sm:text-4xl">Un forfait connu avant paiement. Jamais un pourcentage.</h2>
            <p className="mt-5 text-lg leading-relaxed text-papier/70">Le prix dépend du montant d’aide estimé. Il est affiché avant tout paiement, sans abonnement et sans frais caché.</p>
            <p className="mt-6 inline-flex flex-wrap gap-2 rounded-lg border border-papier/20 bg-papier/10 px-4 py-3 text-sm font-semibold text-papier">
              Code <span className="font-mono text-blanc-casse">DOSSIMO50</span> · 50 % sur le premier dossier
              {grille ? " · dès " + prixLancement(grille) + " au lieu de " + grille.minLabel : ""}
            </p>
          </div>
          {grille && grille.lignes.length > 0 && (
            <ul className="mt-10 grid gap-4 lg:grid-cols-3">
              {grille.lignes.map((line) => (
                <li key={line.name + "-" + line.priceLabel} className="rounded-xl border border-papier/20 bg-papier/[0.06] p-5">
                  <p className="text-sm text-papier/65">{line.name}</p>
                  <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-blanc-casse">{line.priceLabel}</p>
                  <p className="mt-1 text-xs text-papier/55">par dossier · paiement unique</p>
                  <p className="mt-5 border-t border-papier/15 pt-4 text-sm font-medium text-papier">{line.aidLabel}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-10 flex flex-col gap-3 border-t border-papier/15 pt-8 sm:flex-row">
            <Link href="/demo" className={"group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-papier px-6 text-sm font-semibold text-encre hover:bg-blanc-casse " + FOCUS_SOMBRE}>
              {CTA_DEMO}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <a href="#contact" className={"inline-flex min-h-12 items-center justify-center rounded-lg border border-papier/25 px-6 text-sm font-medium text-papier hover:bg-papier/10 " + FOCUS_SOMBRE}>Poser une question</a>
          </div>
        </div>
      </Shell>
    </section>
  );
}

const FAQ_ITEMS = [
  { q: "Combien de temps ça me prend ?", a: "Le temps d’envoyer votre devis et de relire les informations recopiées, soit quelques minutes. Dossimo se charge de vérifier les mentions, de comparer les pièces et d’assembler le pack." },
  { q: "Qu’est-ce que je reçois exactement ?", a: "Un récapitulatif client prérempli, la checklist des pièces à fournir et un rapport de contrôle qui liste les points à corriger avant le dépôt." },
  { q: "Dossimo dépose-t-il le dossier à ma place ?", a: "Non. Dossimo prépare et contrôle le pack. Vous et votre client effectuez le dépôt et conservez la maîtrise de la relation comme de la prime." },
  { q: "En quoi est-ce différent d’un mandataire ?", a: "Dossimo facture un montant fixe par dossier, ne s’intercale pas avec votre client et ne touche jamais un pourcentage de la prime." },
  { q: "Quels dispositifs sont couverts ?", a: "MaPrimeRénov’ et les CEE, avec leurs fiches d’opération et leurs mentions obligatoires." },
  { q: "Que deviennent mon devis et ma facture ?", a: "Ils sont analysés pour extraire les informations utiles et contrôler la conformité. Dossimo ne les vend pas, ne les utilise pas pour entraîner un modèle et ne modifie jamais vos documents." },
] as const;

function Faq() {
  return (
    <section id="faq" className="bg-papier py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <SectionLabel>Questions fréquentes</SectionLabel>
        <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-4xl">Ce qu’il faut savoir avant d’envoyer un devis.</h2>
        <div className="mt-10 divide-y divide-filigrane border-y border-filigrane">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg font-semibold text-encre">
                {item.q}<span className="text-tampon transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ardoise">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="bg-blanc-casse py-20 sm:py-24">
      <Shell className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <SectionLabel>Votre prochain dossier</SectionLabel>
          <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight tracking-tight text-encre sm:text-4xl">Pas de devis sous la main aujourd’hui ?</h2>
          <p className="mt-5 text-lg leading-relaxed text-ardoise">Laissez votre email. Nous vous recontacterons pour monter votre prochain dossier avec vous.</p>
          <div className="mt-8 flex items-center gap-3 rounded-xl bg-info-bg p-4 text-sm text-encre">
            <ShieldCheck className="h-5 w-5 shrink-0 text-tampon" strokeWidth={1.5} aria-hidden="true" />
            Pas de liste revendue, pas de relance automatique interminable.
          </div>
        </div>
        <div className="rounded-2xl bg-papier p-6 shadow-lg sm:p-8"><LeadForm /></div>
      </Shell>
    </section>
  );
}

function MobileConversionBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-encre/15 bg-blanc-casse/95 p-3 shadow-[0_-8px_24px_rgba(22,32,43,0.12)] backdrop-blur md:hidden">
      <Link href="/demo" className={"flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-center text-sm font-semibold text-blanc-casse " + FOCUS}>
        {CTA_DEMO}<ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

function JsonLd({ grille }: { grille: GrilleAffichee | null }) {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Dossimo",
      url: SITE_URL,
      logo: SITE_URL + "/icon.png",
      email: editeur.emailContact,
      description: "Service indépendant d’aide à la préparation et au contrôle de conformité de dossiers MaPrimeRénov’ et CEE, destiné aux artisans RGE.",
    },
    { "@context": "https://schema.org", "@type": "WebSite", name: "Dossimo", url: SITE_URL, inLanguage: "fr-FR" },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
    },
    ...(grille ? [{
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Préparation et contrôle de dossier MaPrimeRénov’ / CEE",
      provider: { "@type": "Organization", name: "Dossimo" },
      areaServed: "FR",
      offers: grille.lignes.map((line) => ({
        "@type": "Offer",
        name: line.name,
        description: line.aidLabel,
        priceCurrency: "EUR",
        price: line.priceLabel.replace(/[^\d,]/g, "").replace(",", "."),
        url: SITE_URL + "/#tarifs",
        availability: "https://schema.org/InStock",
      })),
    }] : []),
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
