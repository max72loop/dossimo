import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileCheck2, ScanSearch, Upload } from "lucide-react";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { VisiteGuidee } from "@/components/landing/visite-guidee";
import { FOCUS_SOMBRE } from "@/components/ui/boutons";
import { CTA_DEMO } from "@/lib/landing/copy";
import { publicMetadata } from "@/lib/seo/site";

export const metadata: Metadata = publicMetadata({
  path: "/visite",
  title: "Visite guidée : monter un dossier MaPrimeRénov’ ou CEE, écran par écran",
  description:
    "Suivez un dossier de bout en bout dans Dossimo : devis déposé, préremplissage, contrôle des mentions et de la qualification RGE, checklist des pièces. Sans compte, quel que soit le geste.",
});

/**
 * Page autonome de la visite guidée. Elle existe pour trois usages que l'ancre
 * `/#visite` ne couvre pas : un lien propre à envoyer en prospection, une cible
 * indexable par les moteurs, et une lecture sans le reste de la longue landing.
 * La visite elle-même vient du composant partagé — une seule implémentation, un
 * seul identifiant de démo (`lib/landing/visite.ts`).
 */
export default function VisitePage() {
  return (
    <div className="flex min-h-full flex-col bg-papier pb-20 md:pb-0">
      <a href="#contenu" className="skip-link">
        Aller au contenu principal
      </a>
      <SiteHeader />
      <main id="contenu" className="flex-1" tabIndex={-1}>
        <section className="bg-encre py-16 sm:py-20">
          <Shell>
            <p className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.14em] text-accent-clair">
              <span className="h-2 w-2 rounded-full bg-accent-clair" />
              Visite guidée · sans compte
            </p>
            <h1 className="mt-5 max-w-3xl font-serif text-4xl font-semibold leading-[1.06] tracking-tight text-blanc-casse sm:text-5xl">
              Le parcours complet,{" "}
              <span className="text-accent-clair">écran par écran.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-papier/75">
              Un dossier suivi du devis déposé jusqu&rsquo;au pack contrôlé, sur les
              écrans réels de Dossimo. Le parcours est le même pour l&rsquo;isolation,
              la pompe à chaleur, le chauffe-eau et le chauffage au bois : seules les
              caractéristiques techniques exigées par la fiche changent.
            </p>
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-papier/65">
              {["Aucun compte à créer", "Rien à installer", "Vous avancez à votre rythme"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent-clair" strokeWidth={1.5} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Shell>
        </section>

        <section className="bg-papier py-14 sm:py-16">
          <Shell>
            <VisiteGuidee />
          </Shell>
        </section>

        <section className="bg-blanc-casse py-16 sm:py-20">
          <Shell>
            <h2 className="max-w-3xl font-serif text-3xl font-semibold leading-tight tracking-tight text-encre sm:text-4xl">
              Ce que la visite montre.
            </h2>
            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {REPERES.map((repere) => (
                <li key={repere.titre} className="rounded-2xl bg-papier p-6 shadow-md">
                  <repere.icon className="h-7 w-7 text-tampon" strokeWidth={1.5} aria-hidden="true" />
                  <h3 className="mt-5 font-serif text-lg font-semibold text-encre">{repere.titre}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ardoise">{repere.corps}</p>
                </li>
              ))}
            </ul>
            <p className="mt-10 max-w-3xl text-xs leading-relaxed text-ardoise">
              Le dossier montré est fictif : bénéficiaire, entreprise et numéro RGE sont
              des exemples. Les mentions obligatoires et les contrôles, eux, sont ceux
              réellement appliqués par Dossimo. Dossimo est un service indépendant
              d&rsquo;aide à la préparation de dossier, non affilié à l&rsquo;Anah ni à
              France Rénov&rsquo;.
            </p>
          </Shell>
        </section>

        <section className="bg-encre py-16 sm:py-20">
          <Shell className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="max-w-2xl font-serif text-3xl font-semibold leading-tight tracking-tight text-blanc-casse sm:text-4xl">
                Le vôtre, à partir d&rsquo;un devis.
              </h2>
              <p className="mt-4 max-w-2xl leading-relaxed text-papier/75">
                Envoyez un PDF ou une photo prise sur le chantier. Dossimo recopie, contrôle
                et prépare le pack ; vous relisez et vous déposez.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/demo"
                className={"group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-papier px-6 text-sm font-semibold text-encre transition-colors hover:bg-blanc-casse " + FOCUS_SOMBRE}
              >
                {CTA_DEMO}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link
                href="/exemple"
                className={"inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-papier/30 px-6 text-sm font-medium text-papier transition-colors hover:bg-papier/10 " + FOCUS_SOMBRE}
              >
                Voir un pack réel
              </Link>
            </div>
          </Shell>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

const REPERES = [
  {
    icon: Upload,
    titre: "Le devis fait la saisie",
    corps:
      "Un PDF ou une photo suffit : le client, les montants et les données techniques sont recopiés à votre place, vous ne faites que relire.",
  },
  {
    icon: ScanSearch,
    titre: "Les contrôles, avant le dépôt",
    corps:
      "Mentions obligatoires, validité de la qualification RGE, cohérence devis-facture : chaque point est vérifié, avec le motif de refus qu'il évite.",
  },
  {
    icon: FileCheck2,
    titre: "La checklist jusqu'au vert",
    corps:
      "Les pièces exigées par la fiche de votre geste se cochent au fur et à mesure. Quand tout est vert, le dossier est prêt à déposer.",
  },
] as const;

function Shell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={"mx-auto max-w-7xl px-5 sm:px-8 " + className}>{children}</div>;
}
