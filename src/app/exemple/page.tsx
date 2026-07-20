import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileSearch,
  FileText,
  LayoutList,
} from "lucide-react";

import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { FOCUS } from "@/components/ui/boutons";
import { CTA_DEMO } from "@/lib/landing/copy";
import { publicMetadata } from "@/lib/seo/site";

export const metadata: Metadata = publicMetadata({
  path: "/exemple",
  title: "Le pack Dossimo en exemple : voyez ce que vous recevez",
  description:
    "Le pack documentaire complet généré sur un chantier d'isolation de combles : récapitulatif client, rapport de contrôle anti-refus et checklist des pièces. Consultable sans compte.",
});

/**
 * La preuve produit : le pack, montré au lieu d'être décrit.
 *
 * La vitrine énumérait les pièces du pack sans jamais en montrer une seule, et
 * le seul chemin pour les voir passait par la création d'un compte, la saisie
 * d'un dossier et un paiement. Un visiteur venu d'un guide SEO n'ira pas si
 * loin sur un premier passage : cette page est la marche intermédiaire entre
 * « je découvre » et « je confie le devis d'un vrai client ».
 *
 * Le PDF servi par `/exemple/pack.pdf` est produit par le vrai moteur sur un
 * dossier fictif, pas maquetté à la main : ce que le visiteur télécharge est
 * exactement ce que l'artisan recevra, à la mise en page près.
 */
const PIECES = [
  {
    icon: FileText,
    titre: "Le récapitulatif client",
    corps:
      "Toutes les données du chantier sur une page : le bénéficiaire, le logement, le geste, les caractéristiques techniques, les montants et la qualification RGE. C'est la pièce que votre client relit et signe.",
  },
  {
    icon: FileSearch,
    titre: "Le rapport de contrôle",
    corps:
      "Le cœur de Dossimo. Chaque point de contrôle passé au crible, avec les constats bloquants séparés des simples avertissements, et pour chacun la raison du refus qu'il évite.",
  },
  {
    icon: LayoutList,
    titre: "La checklist des pièces",
    corps:
      "La liste exacte des justificatifs exigés par la fiche pour ce geste, avec ce qui est obligatoire et ce qui ne l'est pas. Elle vous dit quand le dossier est complet.",
  },
  {
    icon: ClipboardCheck,
    titre: "La page de garde",
    corps:
      "Le verdict en une page : la référence du pack, le dispositif, l'état du contrôle et la liste des pièces jointes. C'est par elle que commence le dossier.",
  },
];

export default function ExemplePage() {
  return (
    <div className="flex min-h-full flex-col bg-papier">
      <a href="#contenu" className="skip-link">Aller au contenu principal</a>
      <SiteHeader />

      <main id="contenu" className="flex-1" tabIndex={-1}>
        <section className="border-b border-encre bg-encre">
          <div className="mx-auto max-w-[1080px] px-5 py-14 sm:px-8 sm:py-16">
            <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-accent-clair">
              <span className="h-2 w-2 rounded-full bg-accent-clair" />
              Exemple complet · sans compte · sans email
            </p>
            <h1 className="mt-6 max-w-3xl font-serif text-[2.4rem] font-semibold leading-[1.05] tracking-tight text-blanc-casse sm:text-[3.2rem]">
              Voici exactement ce que vous recevez.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-papier/70">
              Le pack ci-dessous a été produit par Dossimo sur un chantier
              d&rsquo;isolation de combles perdus. Rien n&rsquo;a été retouché : c&rsquo;est
              le moteur de contrôle qui a rédigé le rapport, sur un dossier fictif
              monté pour l&rsquo;occasion.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/exemple/pack.pdf"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-blanc-casse shadow-md transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-clair"
              >
                <Download className="h-4 w-4" strokeWidth={1.5} />
                Ouvrir le pack d&rsquo;exemple
              </a>
              <Link
                href="/demo"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-papier/30 px-6 py-3 text-sm font-medium text-papier transition-colors hover:bg-papier/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papier"
              >
                {CTA_DEMO}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="h-1 bg-accent" />
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.25rem] sm:leading-tight">
              Quatre pièces, un seul document
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ardoise">
              Dossimo les assemble dans l&rsquo;ordre où elles se lisent, et vous
              livre le tout en un PDF unique.
            </p>

            <ul className="mt-10 grid gap-5 sm:grid-cols-2">
              {PIECES.map((p) => (
                <li key={p.titre} className="rounded-2xl bg-blanc-casse p-6 shadow-md">
                  <p.icon className="h-5 w-5 text-tampon" strokeWidth={1.5} />
                  <h3 className="mt-3 font-serif text-xl font-semibold text-encre">{p.titre}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ardoise">{p.corps}</p>
                </li>
              ))}
            </ul>

            {/* Aperçu intégré : le visiteur voit le document sans quitter la page.
                `<object>` retombe sur son contenu enfant quand le navigateur ne
                sait pas afficher un PDF en ligne, ce que font la plupart des
                navigateurs mobiles : le lien de repli n'est donc pas décoratif. */}
            <div className="mt-12 overflow-hidden rounded-2xl border border-filigrane bg-blanc-casse shadow-lg">
              <object
                data="/exemple/pack.pdf"
                type="application/pdf"
                aria-label="Aperçu du pack documentaire d'exemple"
                className="block h-[640px] w-full"
              >
                <div className="p-8">
                  <p className="text-sm leading-relaxed text-ardoise">
                    Votre navigateur n&rsquo;affiche pas les PDF directement.
                  </p>
                  <a
                    href="/exemple/pack.pdf"
                    className={`mt-3 inline-flex items-center gap-2 text-sm font-semibold text-tampon underline underline-offset-4 ${FOCUS}`}
                  >
                    <Download className="h-4 w-4" strokeWidth={1.5} />
                    Télécharger le pack d&rsquo;exemple
                  </a>
                </div>
              </object>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-ardoise">
              Dossier fictif : le bénéficiaire, l&rsquo;entreprise et le numéro RGE
              sont des exemples. Les seuils, les mentions obligatoires et le barème
              de prime, eux, sont ceux réellement en vigueur dans Dossimo.
            </p>
          </div>
        </section>

        <section className="border-t border-filigrane bg-papier-fonce/60 py-14 sm:py-16">
          <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-encre sm:text-3xl">
              Ce que l&rsquo;exemple ne contient pas
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ardoise">
              Deux pièces sont volontairement absentes de ce téléchargement public :
              l&rsquo;attestation de pré-contrôle et le formulaire officiel. Ce sont
              les deux documents qui se signent et se déposent, et un spécimen en
              libre accès pourrait être présenté comme un vrai contrôle. Ils vous
              sont remis dans votre dossier.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:max-w-3xl">
              {[
                "Attestation de pré-contrôle, à faire signer",
                "Formulaire officiel prérempli (Cerfa / attestation sur l'honneur)",
                "Feuille de route de dépôt, étape par étape",
                "Points de vigilance rédigés pour votre chantier",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-encre">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-succes" strokeWidth={1.5} />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col items-start gap-4 rounded-xl border-l-4 border-l-accent bg-info-bg px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-relaxed text-encre">
                <span className="font-semibold">Le vôtre en quelques minutes :</span>{" "}
                envoyez un devis, Dossimo en tire le même pack.
              </p>
              <Link
                href="/demo"
                className={`shrink-0 text-sm font-semibold text-tampon underline underline-offset-4 ${FOCUS}`}
              >
                {CTA_DEMO} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
