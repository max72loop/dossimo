import Link from "next/link";
import type { Metadata } from "next";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock,
  Droplets,
  FileCheck2,
  FileText,
  Flame,
  HandCoins,
  Layers,
  Lock,
  Mail,
  Quote,
  ScanSearch,
  Server,
  ShieldCheck,
  Stamp,
  TicketPercent,
  Wind,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { LeadForm } from "@/components/landing/lead-form";
import { Estimateur } from "@/components/landing/estimateur";
import { EtapePicto, MaisonArtisan, WaveDivider } from "@/components/landing/illustrations";
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

/**
 * Anneau de focus pour les CTA posés sur le bloc encre (section Tarification) :
 * l'anneau `encre` de `FOCUS` y serait invisible, fond contre fond.
 */
const FOCUS_SOMBRE =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papier";

/**
 * Prix d'appel affiché avec le code de lancement (« dès 24,50 € au lieu de 49 € ») :
 * dérivé du palier le plus bas de la grille facturée, jamais écrit en dur — la grille
 * peut encore bouger (§10) et un prix barré faux est un prix mensonger.
 */
function prixLancement(grille: GrilleAffichee): string {
  return labelEuros(Math.round(grille.minCents / 2));
}

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

      {/* Ordre de lecture : la promesse, puis « je n'ai rien à préparer », puis le
          déroulé, puis les preuves (relecture, comparaison mandataire), et seulement
          ensuite le prix. Chaque section porte une ancre : le sommaire du header
          permet d'atterrir directement sur celle qu'on cherche. */}
      <main id="contenu" className="flex-1" tabIndex={-1}>
        <Hero />
        <TrustStrip />
        <Preparation />
        <Etapes />
        <WaveDivider bandClass="bg-blanc-casse" fillClass="text-papier" />
        <Gestes />
        <Relecture />
        <Difference />
        <Confiance />
        <Estimation />
        <WaveDivider bandClass="bg-papier" fillClass="text-blanc-casse" />
        <Temoignages />
        <Pricing grille={grille} />
        <Reassurance />
        <Faq />
        <Contact />
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
    <section className="relative bg-encre">
      <div className="relative mx-auto grid max-w-[1280px] items-center gap-9 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-accent-clair">
            <span className="h-2 w-2 rounded-full bg-accent-clair" />
            MaPrimeRénov&rsquo; & CEE · pour les artisans RGE
          </p>

          <h1 className="mt-6 max-w-3xl font-serif text-[2.65rem] font-semibold leading-[1.02] tracking-tight text-blanc-casse sm:text-[3.65rem] lg:text-[4.1rem]">
            Un dossier de prime, c&rsquo;est des heures de paperasse.{" "}
            <span className="text-accent-clair">Dossimo le monte à votre place.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-papier/70">
            Envoyez votre devis, ou prenez-le en photo depuis le chantier. Dossimo
            recopie le client, les montants et les données techniques, contrôle les
            mentions obligatoires, la chronologie et la validité RGE, puis vous sort
            le pack complet prêt à déposer.
          </p>

          <p className="mt-4 max-w-xl text-lg font-medium leading-relaxed text-blanc-casse">
            Votre seul effort : relire et déposer.
          </p>

          <ul className="mt-6 grid max-w-xl gap-2 sm:grid-cols-2" aria-label="Ce que Dossimo vous remet">
            {["Récapitulatif client prérempli", "Checklist des pièces", "Rapport de contrôle avant dépôt", "Monté en minutes, pas en heures"].map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm font-medium text-papier">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-clair" strokeWidth={1.5} />
                {point}
              </li>
            ))}
          </ul>

          {/* Deux marches, pas une. Le CTA principal demande le devis d'un client
              réel : c'est beaucoup pour un visiteur arrivé d'un guide il y a
              trente secondes. Le lien secondaire lui laisse voir le livrable
              avant de confier quoi que ce soit. */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/demo"
              className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-blanc-casse shadow-md transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-clair sm:w-auto"
            >
              {CTA_DEMO}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/exemple"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-papier/30 px-6 py-3 text-sm font-medium text-papier transition-colors hover:bg-papier/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papier sm:w-auto"
            >
              Voir un pack d&rsquo;exemple
            </Link>
          </div>

          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-papier/60">
            <CheckCircle2 className="h-4 w-4 text-accent-clair" strokeWidth={1.5} />
            Deux minutes suffisent
            <span className="text-papier/25">·</span>
            aucun paiement aujourd&rsquo;hui
            <span className="text-papier/25">·</span>
            sans engagement
          </p>
        </div>

        <HeroVisual />
      </div>
      <div className="h-1 bg-accent" />
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative lg:mr-3">
      <ReportCard />
      <div className="absolute -bottom-6 -left-4 hidden rounded-xl bg-accent px-5 py-3 text-blanc-casse shadow-lg sm:block">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-blanc-casse/70">Statut du dossier</p>
        <p className="mt-1 font-serif text-lg font-semibold">Corrections ciblées</p>
      </div>
      <div className="absolute -right-3 top-8 hidden rounded-xl bg-blanc-casse px-3 py-2 shadow-lg xl:block">
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
    <div className="rounded-2xl bg-blanc-casse p-6 shadow-[0_24px_60px_-16px_rgba(22,32,43,0.55)]">
      <div className="flex items-center justify-between border-b border-filigrane pb-3">
        <div>
          <p className="font-serif text-base font-semibold text-encre">
            Rapport de contrôle
          </p>
          <p className="mt-0.5 font-mono text-xs text-encre-claire">
            DOS-2026-0148
          </p>
        </div>
        <Badge ton="erreur" dot>2 points trouvés</Badge>
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
      slogan: "Le dossier de prime monté à votre place. Vous relisez, vous déposez.",
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
/**
 * Bandeau de réassurance posé juste sous le hero. Il prolonge la zone encre du
 * hero en barre de « stats » : quatre arguments déjà tenus ailleurs sur la page
 * (rapidité, prime intégrale, pas de commission, offre de lancement), condensés
 * en repères lisibles d'un coup d'œil avant d'entrer dans le déroulé.
 *
 * Aucun chiffre inventé : « 100 % », « 0 % » et « −50 % » sont des faits du
 * positionnement (Dossimo ne touche pas la prime, facture un forfait, applique
 * DOSSIMO50), pas un montant estimé — ils n'ont donc pas à passer par la grille.
 */
function TrustStrip() {
  const items = [
    { icon: Clock, stat: null, texte: "Monté en minutes, pas en heures" },
    { icon: HandCoins, stat: "100 %", texte: "de la prime conservée" },
    { icon: Ban, stat: "0 %", texte: "de commission" },
    { icon: TicketPercent, stat: "−50 %", texte: "sur le 1ᵉʳ dossier · code DOSSIMO50" },
  ];
  return (
    <div className="border-b border-accent/40 bg-encre">
      <Shell>
        <ul className="grid divide-y divide-papier/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {items.map((i) => (
            <li key={i.texte} className="flex items-center gap-3 px-1 py-5 sm:px-5 lg:px-6">
              <i.icon className="h-5 w-5 shrink-0 text-accent-clair" strokeWidth={1.5} aria-hidden="true" />
              <p className="text-sm leading-snug text-papier/85">
                {i.stat && (
                  <span className="mr-1 font-serif text-lg font-semibold text-blanc-casse">{i.stat}</span>
                )}
                <span className={i.stat ? "" : "font-medium text-papier"}>{i.texte}</span>
              </p>
            </li>
          ))}
        </ul>
      </Shell>
    </div>
  );
}

/* ------------------------------------------------------------ Difference */
function Difference() {
  const mandataire = [
    "Il monte le dossier, mais il devient l'interlocuteur",
    "Il s'intercale dans la relation avec votre client",
    "Il capte tout ou partie de la prime",
    "Vous dépendez de son rythme et de ses règles",
  ];
  const dossimo = [
    "Dossimo monte le dossier, vous le déposez vous-même",
    "La relation client reste 100 % la vôtre",
    "Vous et votre client percevez l'intégralité de la prime",
    "Un paiement fixe par dossier, jamais un pourcentage",
  ];
  return (
    <section id="difference" className="bg-blanc-casse py-16 sm:py-20">
      <Shell>
        <div className="max-w-2xl">
          <SectionLabel>La différence</SectionLabel>
          <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
            Un mandataire s&rsquo;intercale. Dossimo vous laisse la main.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ardoise">
            Le mandataire vous décharge de la paperasse, mais il prend votre client et
            une part de sa prime au passage. Dossimo vous décharge de la même paperasse,
            sans jamais déposer à votre place ni toucher à la prime.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl bg-blanc-casse p-7 shadow-lg">
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
          <div className="relative rounded-2xl border-2 border-accent bg-blanc-casse p-7 shadow-lg ring-4 ring-accent/10">
            <span className="absolute -top-3 right-6 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-blanc-casse shadow-md">
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              Recommandé
            </span>
            <h3 className="label flex items-center gap-2 text-accent">
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

/* -------------------------------------------------------------- Confiance */
/**
 * La preuve, posée juste avant le prix.
 *
 * Dossimo n'a pas encore de clients, donc pas de preuve sociale : un témoignage
 * inventé serait une faute, pas un raccourci. La parade est la **preuve de
 * personne** — un éditeur identifiable, immatriculé, joignable — doublée de la
 * **preuve de traitement** : où vont les documents, qui les lit, ce qui ne leur
 * arrive jamais.
 *
 * Toutes les valeurs viennent d'`editeur` (source unique des mentions légales) :
 * le SIREN affiché ici est celui des factures et des mentions, jamais une
 * recopie. Aucune affirmation de ce bloc n'est décorative — chacune est tenue
 * quelque part dans le code ou dans la politique de confidentialité :
 *
 * - « écarte les fournisseurs qui conservent » → `POLITIQUE_DONNEES`
 *   (`src/lib/llm/openrouter.ts`), `data_collection: "deny"` sur tout appel.
 * - « hors UE, encadré par les clauses types » → l'hébergeur est américain
 *   (`editeur.hebergeur`). On ne prétend PAS héberger en France : ce serait faux.
 * - « ne dépose jamais, ne touche jamais la prime » → CLAUDE.md §2.
 */
function Confiance() {
  const traitement = [
    {
      icon: ScanSearch,
      titre: "Qui lit vos documents",
      corps:
        "Un modèle d'analyse en extrait les informations du devis et de la facture, rien d'autre. Dossimo écarte les fournisseurs qui conservent les documents ou s'en servent pour entraîner leurs modèles.",
    },
    {
      icon: Server,
      titre: "Où ils sont stockés",
      corps: `Base et documents chez ${editeur.baseDeDonnees.nom.split(" (")[0]}, site hébergé par ${editeur.hebergeur.nom.replace(" Inc.", "")}. Certains traitements ont lieu hors Union européenne, encadrés par les clauses contractuelles types.`,
    },
    {
      icon: Lock,
      titre: "Ce qui n'arrive jamais",
      corps:
        "Vos données ne sont jamais vendues. Dossimo ne dépose aucun dossier à votre place et ne perçoit rien sur la prime de votre client.",
    },
  ];

  return (
    <section id="confiance" className="border-y border-filigrane bg-papier py-16 sm:py-20">
      <Shell>
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div>
            <SectionLabel>Qui est derrière Dossimo</SectionLabel>
            <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
              Un éditeur, un nom, une adresse.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ardoise">
              Vous allez confier le devis d&rsquo;un client réel à un outil que vous
              découvrez. Vous avez le droit de savoir à qui.
            </p>

            <div className="mt-8 rounded-2xl bg-blanc-casse p-6 shadow-lg">
              <div className="flex items-center gap-4">
                {/* Pas de portrait dans `public/brand/` aujourd'hui : on affiche les
                    initiales plutôt qu'un visage d'illustration acheté, qui ruinerait
                    exactement la confiance que ce bloc cherche à établir. Déposer le
                    portrait en `public/brand/max-landry.jpg` et remplacer ce bloc par
                    un `next/image` le jour où la photo existe. */}
                <span
                  aria-hidden="true"
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-encre font-serif text-xl font-semibold text-blanc-casse"
                >
                  ML
                </span>
                <div>
                  <p className="font-serif text-lg font-semibold text-encre">
                    {editeur.directeurPublication}
                  </p>
                  <p className="text-sm text-ardoise">
                    Fondateur, et la personne qui vous répondra
                  </p>
                </div>
              </div>

              <p className="mt-5 text-[0.95rem] leading-relaxed text-ardoise">
                J&rsquo;ai construit Dossimo après avoir vu des artisans perdre une
                prime entière sur une mention manquante, et d&rsquo;autres céder leur
                dossier à un mandataire faute de temps pour le monter. Ces deux
                situations ont la même cause : personne n&rsquo;a le temps de relire un
                dossier ligne à ligne le soir.
              </p>

              <dl className="mt-6 grid gap-x-6 gap-y-3 border-t border-filigrane pt-5 text-sm sm:grid-cols-2">
                <div>
                  <dt className="label text-tampon">Éditeur</dt>
                  <dd className="mt-1 text-encre">{editeur.raisonSociale}</dd>
                </div>
                <div>
                  <dt className="label text-tampon">SIREN</dt>
                  <dd className="mt-1 font-mono tabular-nums text-encre">{editeur.siren}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="label text-tampon">Adresse</dt>
                  <dd className="mt-1 text-encre">{editeur.adresse}</dd>
                </div>
              </dl>

              <a
                href={`mailto:${editeur.emailContact}?subject=Question%20avant%20mon%20premier%20dossier`}
                className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold text-tampon underline underline-offset-4 ${FOCUS}`}
              >
                <Mail className="h-4 w-4" strokeWidth={1.5} />
                {editeur.emailContact}
              </a>
              <p className="mt-2 text-xs leading-relaxed text-ardoise">
                Écrivez avant votre premier dossier si quoi que ce soit vous retient.
                C&rsquo;est moi qui lis, et je réponds.
              </p>
            </div>
          </div>

          <div>
            <SectionLabel>Vos documents</SectionLabel>
            <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
              Ce qu&rsquo;ils deviennent, sans détour.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ardoise">
              Un devis porte le nom, l&rsquo;adresse et le chantier de votre client.
              Voici précisément ce qui lui arrive.
            </p>

            <ul className="mt-8 space-y-4">
              {traitement.map((t) => (
                <li key={t.titre} className="flex items-start gap-4 rounded-2xl bg-blanc-casse p-5 shadow-md">
                  <t.icon className="mt-0.5 h-5 w-5 shrink-0 text-tampon" strokeWidth={1.5} />
                  <div>
                    <p className="font-serif text-lg font-semibold text-encre">{t.titre}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ardoise">{t.corps}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-sm leading-relaxed text-ardoise">
              Le détail complet, y compris vos droits d&rsquo;accès et
              d&rsquo;effacement, est dans la{" "}
              <Link href="/confidentialite" className={`font-semibold text-tampon underline underline-offset-4 ${FOCUS}`}>
                politique de confidentialité
              </Link>
              .
            </p>
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
      picto: "devis" as const,
      title: "Vous envoyez le devis",
      body: "Le PDF, ou une photo prise depuis le chantier. Aucun formulaire à remplir avant.",
    },
    {
      picto: "recopie" as const,
      title: "Dossimo recopie tout",
      body: "Le client, les montants, les données techniques. Vous relisez ce qu’il a lu, vous corrigez si besoin.",
    },
    {
      picto: "controle" as const,
      title: "Dossimo contrôle",
      body: "Mentions obligatoires, chronologie, validité RGE, cohérence devis et facture. Ce qui bloque remonte avant le dépôt.",
    },
    {
      picto: "pack" as const,
      title: "Vous recevez le pack",
      body: "Récapitulatif client, checklist des pièces, rapport de contrôle. Il ne vous reste qu’à relire et déposer.",
    },
  ];
  return (
    <section id="etapes" className="bg-papier py-16 sm:py-20">
      <Shell>
        <div className="max-w-2xl">
          <SectionLabel>Comment ça marche</SectionLabel>
          <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
            Du devis au pack complet, en quelques minutes
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ardoise">
            Vous fournissez le document que vous avez déjà. Dossimo fait la paperasse :
            recopier, vérifier, assembler. Quelques minutes, là où un dossier monté à la
            main vous prend une soirée.
          </p>
        </div>

        <div className="mt-12 grid divide-y divide-encre border-y border-encre sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative border-encre px-0 py-7 sm:px-6 sm:[&:nth-child(odd)]:border-r lg:border-r lg:last:border-r-0">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-tampon">ÉTAPE 0{i + 1}</span>
                <EtapePicto name={s.picto} className="h-9 w-9" />
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
        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-xl border-l-4 border-l-accent bg-info-bg px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm leading-relaxed text-encre">
            <span className="font-semibold">Votre seul effort :</span> relire le rapport, puis déposer vous-même le dossier avec votre client.
          </p>
          <Link href="/demo" className={`shrink-0 text-sm font-semibold text-tampon underline underline-offset-4 ${FOCUS}`}>
            Envoyer un premier devis <span aria-hidden="true">→</span>
          </Link>
        </div>
      </Shell>
    </section>
  );
}

/* ---------------------------------------------------------------- Gestes */
/**
 * Une entrée par grande famille de gestes, chacune menant au guide existant qui
 * couvre le mieux son point de conformité.
 *
 * Les guides ne sont pas encore déclinés geste par geste : le lien pointe donc le
 * guide dont le sujet recoupe le plus la famille (l'isolation vers le devis CEE,
 * la PAC vers la qualification RGE qui la bloque le plus souvent, le solaire vers
 * le non-cumul, le bois vers le devis MaPrimeRénov'). Toutes ces routes existent
 * (`src/app/<slug>/page.tsx`) ; le jour où un guide dédié à un geste arrive, il
 * suffit de mettre à jour `href` ici.
 */
function Gestes() {
  const gestes = [
    {
      icon: Layers,
      titre: "Isolation",
      detail: "Combles, rampants, murs",
      href: "/devis-cee-conforme",
    },
    {
      icon: Wind,
      titre: "Pompe à chaleur",
      detail: "Air/eau, eau/eau",
      href: "/qualification-rge-valide-geste",
    },
    {
      icon: Droplets,
      titre: "Chauffe-eau",
      detail: "Thermodynamique et solaire",
      href: "/cumul-maprimerenov-cee",
    },
    {
      icon: Flame,
      titre: "Chauffage bois",
      detail: "Poêle, chaudière, insert",
      href: "/devis-maprimerenov-conforme",
    },
  ];

  return (
    <section id="gestes" className="bg-blanc-casse py-16 sm:py-20">
      <Shell>
        <div className="max-w-2xl">
          <SectionLabel>Pour chaque chantier</SectionLabel>
          <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
            Un dossier conforme pour chaque geste
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ardoise">
            Chaque geste a ses mentions obligatoires, sa fiche et son motif de refus.
            Choisissez le vôtre : le guide correspondant liste ce qu&rsquo;il faut
            vérifier avant le dépôt.
          </p>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {gestes.map((g) => (
            <li key={g.titre}>
              <Link
                href={g.href}
                className={`group flex h-full flex-col rounded-2xl bg-papier p-6 shadow-md transition hover:shadow-lg ${FOCUS}`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-info-bg text-tampon transition-colors group-hover:bg-tampon group-hover:text-blanc-casse"
                >
                  <g.icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <h3 className="mt-5 font-serif text-xl font-semibold text-encre group-hover:text-tampon">
                  {g.titre}
                </h3>
                <p className="mt-1 text-sm text-ardoise">{g.detail}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-tampon">
                  Voir le guide
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm text-ardoise">
          Vous ne trouvez pas votre geste ?{" "}
          <Link href="/guides" className={`font-semibold text-tampon underline underline-offset-4 ${FOCUS}`}>
            Parcourir tous les guides
          </Link>
        </p>
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
    <section id="relecture" className="border-y border-filigrane bg-papier py-16 sm:py-20">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <SectionLabel>La garantie</SectionLabel>
          <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
            La relecture que{" "}
            <span className="text-tampon">personne n&rsquo;a le temps de faire</span>.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ardoise">
            Un dossier peut être refusé alors que tous les chiffres sont justes :
            il suffit qu&rsquo;une <span className="text-encre">mention obligatoire</span>{" "}
            manque au devis, la certification de l&rsquo;isolant, la résistance
            thermique, le numéro RGE. Les débusquer demande de relire chaque document
            ligne à ligne, le soir, après le chantier.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-ardoise">
            Dossimo le fait à votre place. Il relit le devis et la facture, les compare
            à votre dossier <span className="text-encre">et entre eux</span>, et signale
            ce qui manque ou diverge. Il ne corrige rien tout seul :{" "}
            <span className="text-encre">vous restez juge</span>.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              "Les mentions exigées par la fiche, cherchées une par une dans le document.",
              "Surface, résistance, montants, dates : la pièce confrontée à votre saisie.",
              "Le devis confronté à la facture, première cause de refus à l'instruction.",
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
          <Badge ton="erreur" dot>2 à corriger</Badge>
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
                      · absente du document
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
    { icon: Lock, title: "Le client reste le vôtre", body: "Dossimo ne dépose jamais à votre place et ne touche jamais la prime. Vous gardez la main sur votre affaire." },
    { icon: FileCheck2, title: "Aucun oubli qui fait sauter la prime", body: "Chaque point de refus est signalé avant le dépôt, avec la pièce à corriger. Un dossier refusé, c'est la prime perdue et le montage à refaire." },
    { icon: CheckCircle2, title: "Un paiement, pas un pourcentage", body: "Un seul paiement par dossier, sans abonnement imposé, jamais un prélèvement sur la prime." },
  ];

  return (
    <section className="border-y border-filigrane bg-papier py-12 sm:py-16">
      <Shell>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_2fr] lg:items-center">
          <div>
            <SectionLabel>Vos garanties</SectionLabel>
            <h2 className="mt-4 font-serif text-2xl font-semibold tracking-tight text-encre sm:text-3xl">Clair avant de commencer</h2>
            <MaisonArtisan className="mt-8 hidden w-full max-w-xs lg:block" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {garanties.map((garantie) => (
              <div key={garantie.title} className="rounded-2xl bg-blanc-casse p-5 shadow-md">
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
    { icon: FileText, title: "Le devis", body: "Le PDF, ou une photo prise sur le chantier. C’est le seul document qu’il faut pour démarrer." },
    { icon: FileCheck2, title: "La facture", body: "À la fin des travaux. Dossimo la compare au devis à votre place." },
    { icon: ShieldCheck, title: "Votre numéro RGE", body: "Saisi une fois, réutilisé sur tous vos dossiers suivants." },
  ];

  return (
    <aside className="border-b border-filigrane bg-blanc-casse py-8" aria-labelledby="preparation-title">
      <Shell>
        <div className="grid gap-6 lg:grid-cols-[0.72fr_2fr] lg:items-center">
          <div>
            <p className="label text-tampon">Pour commencer</p>
            <h2 id="preparation-title" className="mt-2 font-serif text-xl font-semibold text-encre">Rien à préparer, rien à ressaisir</h2>
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

/* ------------------------------------------------------------- Estimation */
/**
 * Le simulateur, posé JUSTE avant la tarification.
 *
 * L'ordre n'est pas cosmétique : la page annonçait 49 / 149 / 249 € sans que
 * rien, nulle part, ne dise à quoi ces montants se comparent. En lisant
 * d'abord « 1 235 € d'aide en jeu », l'artisan aborde la grille suivante avec
 * un ordre de grandeur en tête, et le prix devient un pourcentage plutôt qu'une
 * dépense sèche.
 *
 * Les montants viennent de `regles_metier` via une Server Action : la vitrine
 * ne connaît aucun barème (AGENTS.md).
 */
function Estimation() {
  return (
    <section id="estimation" className="bg-blanc-casse py-16 sm:py-20">
      <Shell>
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_0.85fr] lg:gap-14">
          <div>
            <SectionLabel>Combien est en jeu</SectionLabel>
            <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
              Avant de parler de notre prix,{" "}
              <span className="text-tampon">parlons du sien</span>.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ardoise">
              Un dossier refusé, ce n&rsquo;est pas une formalité perdue :
              c&rsquo;est l&rsquo;aide entière qui saute, et le montage à
              recommencer. Voici l&rsquo;ordre de grandeur de ce que porte un
              chantier, calculé sur les barèmes que Dossimo applique réellement.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "Les mêmes barèmes que ceux du moteur, pas une table de communication.",
                "Les quatre profils de revenus de l'Anah, sans les confondre.",
                "Ce qui n'est pas estimable est affiché comme tel, jamais arrondi à zéro.",
              ].map((p) => (
                <li key={p} className="flex items-start gap-3 text-[0.95rem] leading-relaxed text-encre">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-succes" strokeWidth={1.5} />
                  {p}
                </li>
              ))}
            </ul>

            <p className="mt-6 text-sm leading-relaxed text-ardoise">
              Dossimo est un service indépendant d&rsquo;aide à la préparation de
              dossier, non affilié à l&rsquo;Anah ni à France Rénov&rsquo;. Cette
              estimation n&rsquo;engage aucun organisme et ne vaut pas décision
              d&rsquo;attribution.
            </p>
          </div>

          <Estimateur />
        </div>
      </Shell>
    </section>
  );
}

/* ----------------------------------------------------------- Témoignages */
/**
 * Emplacements de témoignages, posés juste avant les tarifs.
 *
 * Dossimo n'a pas encore de clients (cf. section `Confiance`) : inventer une
 * citation serait une faute, pas un raccourci. On affiche donc deux places
 * RÉSERVÉES, présentées comme telles, plutôt qu'un faux avis. Le jour où un vrai
 * retour existe, on remplit l'entrée correspondante ci-dessous (`citation` non
 * nulle) et la carte bascule automatiquement du placeholder au témoignage.
 *
 * TODO(temoignages): remplacer chaque entrée par un vrai retour vérifié
 * — citation exacte, métier et département de l'artisan. Ne jamais inventer.
 */
const TEMOIGNAGES: Array<{
  citation: string | null;
  metier: string;
  departement: string;
}> = [
  { citation: null, metier: "Métier de l’artisan", departement: "Département" },
  { citation: null, metier: "Métier de l’artisan", departement: "Département" },
];

function Temoignages() {
  return (
    <section id="temoignages" className="bg-papier py-16 sm:py-20">
      <Shell>
        <div className="max-w-2xl">
          <SectionLabel>La parole aux artisans</SectionLabel>
          <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
            Les premiers retours arrivent
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ardoise">
            Dossimo est jeune. Plutôt que d&rsquo;inventer des avis, nous gardons ces
            deux places pour les premiers artisans qui auront déposé leur dossier.
            Vous pourriez être l&rsquo;un d&rsquo;eux.
          </p>
        </div>

        <ul className="mt-12 grid gap-5 md:grid-cols-2">
          {TEMOIGNAGES.map((t, i) => (
            <li key={i}>
              <figure className="flex h-full flex-col rounded-2xl border border-dashed border-filigrane bg-blanc-casse p-7">
                <Quote className="h-7 w-7 text-encre-claire" strokeWidth={1.5} aria-hidden="true" />
                {t.citation ? (
                  <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-encre">
                    « {t.citation} »
                  </blockquote>
                ) : (
                  <p className="mt-4 flex-1 text-lg leading-relaxed text-encre-claire">
                    Emplacement réservé à un retour d&rsquo;artisan vérifié.
                  </p>
                )}
                <figcaption className="mt-6 border-t border-filigrane pt-4">
                  <span className="block text-sm font-semibold text-ardoise">{t.metier}</span>
                  <span className="mt-0.5 block text-sm text-encre-claire">{t.departement}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Shell>
    </section>
  );
}

/* --------------------------------------------------------------- Pricing */
function Pricing({ grille }: { grille: GrilleAffichee | null }) {
  return (
    <section id="tarifs" className="border-t border-filigrane bg-blanc-casse py-16 sm:py-20">
      <Shell>
        <div className="rounded-2xl bg-encre px-6 py-12 shadow-lg sm:px-14 sm:py-14">
          <div>
            <div className="max-w-3xl">
              <p className="label text-accent-clair">Tarification transparente</p>
              <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-papier sm:text-[2.25rem] sm:leading-tight">
                Un paiement fixé à l&rsquo;avance,{" "}
                <span className="text-blanc-casse">
                  jamais un pourcentage sur la prime
                </span>
                .
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-papier/75">
                Un paiement unique par dossier, selon le montant d&apos;aide estimé.
                Aucun abonnement, aucun frais caché, et rien qui soit prélevé sur la
                prime de votre client : elle lui revient entière, là où un mandataire
                s&apos;intercale et en capte une partie.
              </p>
              <p className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-lg border border-papier/30 bg-papier/10 px-4 py-3 text-sm font-semibold text-papier">
                Offre de lancement : code <span className="font-mono text-blanc-casse">DOSSIMO50</span>
                · 50 % sur le premier dossier
                {grille ? ` · dès ${prixLancement(grille)} au lieu de ${grille.minLabel}` : ""}
                · jusqu’au 31 juillet 2026
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
                      className="rounded-xl border border-papier/25 bg-papier/[0.06] p-5"
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
                {["Dossier prérempli depuis votre devis", "Relecture du devis et de la facture", "Récapitulatif, checklist et rapport de contrôle", "Aucun abonnement, aucun engagement"].map((item) => (
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
              Un dossier refusé, c’est la prime entière perdue et le montage à refaire
              <span className="text-papier/30">·</span>
              DOSSIMO50 : −50 % jusqu’au 31 juillet 2026
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
        className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-center text-sm font-semibold text-blanc-casse ${FOCUS}`}
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
    <section id="contact" className="border-t border-filigrane bg-papier py-16 sm:py-20">
      <div className="mx-auto grid max-w-[1080px] items-start gap-14 px-5 sm:px-8 lg:grid-cols-2">
        <div>
          <SectionLabel>Rester en contact</SectionLabel>
          <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
            Pas de devis sous la main aujourd&rsquo;hui ?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ardoise">
            Laissez votre email : on vous recontacte pour monter votre prochain dossier
            avec vous. Si vous avez déjà un devis, l&rsquo;essai gratuit reste le chemin
            le plus court, deux minutes suffisent.
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
        <div className="rounded-2xl bg-blanc-casse p-6 shadow-lg sm:p-7">
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
    q: "Combien de temps ça me prend ?",
    a: "Le temps d'envoyer votre devis et de relire ce que Dossimo en a recopié, soit quelques minutes. Le reste, recopier les informations, vérifier les mentions, comparer devis et facture, croiser les dates, est fait pour vous. Monté à la main, le même dossier vous prend plusieurs heures.",
  },
  {
    q: "Qu'est-ce que je reçois exactement ?",
    a: "Le pack complet, prêt à déposer : le récapitulatif client prérempli, la checklist des pièces à fournir, et le rapport de contrôle qui liste les points à corriger avant le dépôt. Votre seul effort est de relire et de déposer.",
  },
  {
    q: "Dossimo dépose-t-il le dossier à ma place ?",
    a: "Non, jamais. Le dépôt est réservé aux mandataires habilités par l'Anah. Dossimo produit le pack complet et vérifié ; vous et votre client déposez vous-mêmes et conservez la prime.",
  },
  {
    q: "En quoi est-ce différent d'un mandataire ?",
    a: "Un mandataire vous décharge de la paperasse, mais il prend la main sur votre dossier et capte tout ou partie de la prime. Dossimo vous décharge de la même paperasse sans jamais s'intercaler : vous restez maître de votre client et de votre prime, et vous payez un montant fixe par dossier, jamais un pourcentage.",
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
    <section id="faq" className="bg-blanc-casse py-16 sm:py-20">
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
