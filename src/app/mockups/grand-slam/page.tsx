import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileImage,
  HandCoins,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";

import { Illustration } from "@/components/landing/illustrations";
import { FOCUS, FOCUS_SOMBRE } from "@/components/ui/boutons";
import { Logo } from "@/components/ui/logo";
import { grillePublique } from "@/lib/landing/grille-publique";
import type { GrilleAffichee } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Maquettes Grand Slam | Dossimo",
  robots: { index: false, follow: false },
};

export default async function GrandSlamMockupsPage() {
  const grille = await grillePublique();

  return (
    <div className="min-h-full bg-papier pb-16">
      <a href="#contenu" className="skip-link">Aller aux maquettes</a>
      <header className="border-b-2 border-encre bg-papier">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-5 px-5 py-3 sm:px-8">
          <Logo hauteur="h-7 sm:h-8" />
          <p className="font-mono text-xs uppercase tracking-widest text-ardoise">Prévisualisation interne · 02 pistes</p>
        </div>
      </header>

      <main id="contenu" tabIndex={-1}>
        <div className="border-b border-encre bg-avertissement-bg px-5 py-3 text-center text-sm text-encre">
          Maquettes de positionnement : les engagements de délai et de remboursement sont des propositions à valider avant toute publication.
        </div>
        <MockupA grille={grille} />
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-filigrane" />
            <p className="font-mono text-xs uppercase tracking-widest text-ardoise">Piste B</p>
            <span className="h-px flex-1 bg-filigrane" />
          </div>
        </div>
        <MockupB grille={grille} />
      </main>
    </div>
  );
}

function Grid({ children, dark = false, className = "" }: { children: React.ReactNode; dark?: boolean; className?: string }) {
  const border = dark ? "border-papier/15" : "border-encre/10";
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 mx-auto grid max-w-7xl grid-cols-4 px-5 sm:grid-cols-12 sm:px-8">
        {Array.from({ length: 12 }, (_, index) => (
          <span key={index} className={`hidden border-l sm:block ${border} ${index === 11 ? "border-r" : ""}`} />
        ))}
        {Array.from({ length: 4 }, (_, index) => (
          <span key={index} className={`border-l sm:hidden ${border} ${index === 3 ? "border-r" : ""}`} />
        ))}
      </div>
      {children}
    </div>
  );
}

function Label({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <p className={`font-mono text-xs uppercase tracking-widest ${light ? "text-accent-clair" : "text-tampon"}`}>{children}</p>;
}

function BarCode({ light = false }: { light?: boolean }) {
  const tone = light ? "bg-papier" : "bg-encre";
  return (
    <div aria-hidden="true" className="flex h-8 items-stretch gap-1">
      {["w-1", "w-2", "w-1", "w-3", "w-1", "w-2", "w-1", "w-2", "w-3", "w-1", "w-1", "w-2"].map((width, index) => (
        <span key={index} className={`${width} ${tone}`} />
      ))}
    </div>
  );
}

function Ticket({ children, className = "", notch = "bg-accent" }: { children: React.ReactNode; className?: string; notch?: string }) {
  return (
    <article className={`relative border-2 border-encre p-6 shadow-lg sm:p-8 ${className}`}>
      <span aria-hidden="true" className={`absolute -left-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full ${notch}`} />
      <span aria-hidden="true" className={`absolute -right-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full ${notch}`} />
      {children}
    </article>
  );
}

function MockupA({ grille }: { grille: GrilleAffichee | null }) {
  return (
    <section aria-labelledby="piste-a" className="border-y border-encre bg-papier">
      <Grid>
        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 pb-8 pt-7 sm:px-8 sm:pt-10">
          <div className="relative z-10 flex items-center justify-between border-b border-encre/30 pb-4">
            <Label>01 · dossier express</Label>
            <p className="hidden font-mono text-xs uppercase tracking-widest text-ardoise sm:block">Devis → dépôt · 24 h proposées</p>
          </div>

          <div className="relative z-10 flex flex-1 flex-col justify-center py-16 sm:py-20">
            <p className="font-mono text-xs uppercase tracking-widest text-ardoise">MaPrimeRénov’ · CEE · artisans RGE</p>
            <h1 id="piste-a" className="mt-6 max-w-5xl font-serif text-6xl font-semibold leading-none tracking-tight text-encre sm:text-8xl lg:text-9xl">
              Dossier <span className="italic text-tampon">prêt.</span>
              <span className="block pl-8 sm:pl-28">Pas de retard.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-ardoise sm:text-xl">
              Envoyez votre devis en photo. Recevez sous 24 h un dossier prêt à déposer, accepté ou remboursé.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/demo" className={`group inline-flex min-h-12 items-center justify-center gap-2 bg-encre px-6 text-sm font-semibold text-blanc-casse transition-colors hover:bg-accent ${FOCUS}`}>
                Envoyer une photo du devis <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link href="/exemple" className={`inline-flex min-h-12 items-center justify-center border border-encre/30 px-6 text-sm font-semibold text-encre transition-colors hover:bg-papier-fonce ${FOCUS}`}>
                Voir le pack livré
              </Link>
            </div>
          </div>

          <div aria-hidden="true" className="absolute right-8 top-32 hidden h-48 w-40 rotate-3 border-2 border-encre bg-accent p-4 text-blanc-casse shadow-lg lg:block">
            <p className="font-mono text-xs uppercase tracking-widest text-papier/75">Devis reçu</p>
            <FileImage className="mt-8 h-10 w-10" strokeWidth={1.25} />
            <p className="mt-5 font-serif text-2xl font-semibold leading-none">Photo chantier</p>
          </div>
          <div aria-hidden="true" className="absolute bottom-36 right-28 hidden w-64 -rotate-3 border-2 border-encre bg-blanc-casse p-5 shadow-lg lg:block">
            <div className="flex items-center justify-between border-b border-filigrane pb-3">
              <p className="font-mono text-xs uppercase tracking-widest text-tampon">Contrôle</p>
              <CheckCircle2 className="h-5 w-5 text-succes" strokeWidth={1.5} />
            </div>
            <p className="mt-4 font-serif text-2xl font-semibold leading-none text-encre">Pack prêt à déposer.</p>
            <p className="mt-3 text-sm text-ardoise">Mentions · RGE · cohérence</p>
          </div>
          <div aria-hidden="true" className="absolute bottom-28 right-5 hidden w-36 rotate-6 border-2 border-encre bg-encre p-4 text-papier shadow-lg lg:block">
            <p className="font-mono text-xs uppercase tracking-widest text-accent-clair">Délai</p>
            <p className="mt-3 font-serif text-5xl font-semibold leading-none">24 h</p>
          </div>

          <div className="relative z-10 grid border-y border-encre/30 md:grid-cols-3">
            {[
              ["01", "Une photo", "Le devis suffit pour commencer."],
              ["02", "Un contrôle", "Les risques sortent avant l’instruction."],
              ["03", "Un pack", "Vous relisez, puis vous déposez."],
            ].map(([number, title, body]) => (
              <article key={number} className="border-b border-encre/30 p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 sm:p-6">
                <p className="font-mono text-xs text-tampon">{number}</p>
                <h2 className="mt-7 font-serif text-3xl font-semibold leading-none text-encre">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-ardoise">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </Grid>

      <section className="border-y border-encre bg-blanc-casse py-16 sm:py-24">
        <Grid>
          <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
            <div className="relative z-10 grid gap-8 lg:grid-cols-2 lg:items-end">
              <div>
                <Label>§ 02 · le programme du dossier</Label>
                <h2 className="mt-5 font-serif text-5xl font-semibold leading-none text-encre sm:text-6xl">Une photo.<br /><span className="italic text-tampon">Trois gestes.</span></h2>
              </div>
              <p className="max-w-xl text-lg leading-relaxed text-ardoise lg:justify-self-end">Une chronologie lisible rend le délai concret : Dossimo lit, contrôle et rassemble avant que vous ne déposiez.</p>
            </div>

            <div className="relative z-10 mt-12 overflow-x-auto border border-encre bg-papier">
              <div className="min-w-max">
                <div className="grid grid-cols-5 border-b border-encre/30 font-mono text-xs uppercase tracking-widest text-ardoise">
                  <span className="border-r border-encre/30 p-4">Étape</span>
                  <span className="border-r border-encre/30 p-4">0 h</span>
                  <span className="border-r border-encre/30 p-4">Lecture</span>
                  <span className="border-r border-encre/30 p-4">Contrôle</span>
                  <span className="p-4">24 h</span>
                </div>
                {[
                  ["Devis", "bg-accent text-blanc-casse", "Reçu en photo"],
                  ["Contrôles", "bg-encre text-blanc-casse", "Mentions, RGE, cohérence"],
                  ["Pack", "bg-papier-fonce text-encre", "Prêt à déposer"],
                ].map(([label, tone, copy]) => (
                  <div key={label} className="grid grid-cols-5 border-b border-encre/30 last:border-b-0">
                    <p className="border-r border-encre/30 p-4 font-serif text-xl font-semibold text-encre">{label}</p>
                    <span className="border-r border-encre/30 p-4" />
                    <div className={`col-span-2 m-2 flex items-center px-4 text-sm font-semibold ${tone}`}>{copy}</div>
                    <span className="border-l border-encre/30 p-4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Grid>
      </section>

      <section className="overflow-hidden border-y border-encre bg-accent py-16 text-encre sm:py-24">
        <p aria-hidden="true" className="whitespace-nowrap border-y border-encre/40 py-3 font-serif text-5xl font-semibold italic leading-none sm:text-7xl">DÉPOSER SEREINEMENT · DÉPOSER SEREINEMENT · DÉPOSER SEREINEMENT ·</p>
        <div className="mx-auto grid max-w-7xl gap-10 px-8 py-14 lg:grid-cols-2 lg:items-center">
          <div>
            <Label>§ 03 · la promesse</Label>
            <h2 className="mt-5 font-serif text-5xl font-semibold leading-none sm:text-6xl">Le « non » devient une mauvaise décision.</h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed">Une promesse nette, un délai clair, un geste simple. C’est ce qui transforme un service de contrôle en offre désirable.</p>
          </div>
          <Ticket notch="bg-accent" className="bg-blanc-casse">
            <div className="flex items-start justify-between gap-5 border-b border-encre/30 pb-5">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-tampon">Garantie candidate</p>
                <h3 className="mt-3 font-serif text-4xl font-semibold leading-none text-encre">Accepté ou remboursé.</h3>
              </div>
              <ShieldCheck className="h-8 w-8 shrink-0 text-tampon" strokeWidth={1.25} aria-hidden="true" />
            </div>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-encre">Dossier refusé pour un motif que Dossimo aurait dû détecter : remboursé, et dossier refait gratuitement.</p>
            <div className="mt-8 flex items-end justify-between gap-5 border-t border-dashed border-encre/40 pt-5">
              <p className="font-mono text-xs uppercase tracking-widest text-ardoise">Promesse à valider avant publication</p>
              <BarCode />
            </div>
          </Ticket>
        </div>
      </section>
      <PriceNote grille={grille} />
    </section>
  );
}

function MockupB({ grille }: { grille: GrilleAffichee | null }) {
  return (
    <section aria-labelledby="piste-b" className="border-y border-encre">
      <Grid dark className="bg-encre text-papier">
        <div className="relative mx-auto min-h-screen max-w-7xl px-5 pb-10 pt-7 sm:px-8 sm:pt-10">
          <div className="relative z-10 flex items-center justify-between border-b border-papier/25 pb-4">
            <Label light>02 · prime protégée</Label>
            <p className="hidden font-mono text-xs uppercase tracking-widest text-papier/60 sm:block">Sans mandataire · sans commission</p>
          </div>
          <div className="relative z-10 grid gap-12 py-20 lg:grid-cols-2 lg:items-end lg:py-28">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-accent-clair">Une offre qui prend parti</p>
              <h1 id="piste-b" className="mt-6 font-serif text-6xl font-semibold leading-none tracking-tight text-blanc-casse sm:text-8xl lg:text-9xl">La <span className="italic text-accent-clair">prime</span><br />reste ici.</h1>
            </div>
            <p className="max-w-md text-lg leading-relaxed text-papier/75 lg:justify-self-end">Dossimo prépare et contrôle. Vous gardez le client, le dépôt et l’intégralité de l’aide.</p>
          </div>

          <div aria-hidden="true" className="absolute right-10 top-44 hidden h-52 w-40 -rotate-6 border-2 border-papier bg-accent p-5 text-encre shadow-lg lg:block">
            <p className="font-mono text-xs uppercase tracking-widest">Votre rôle</p>
            <p className="mt-12 font-serif text-3xl font-semibold leading-none">Rester l’interlocuteur.</p>
          </div>
          <div aria-hidden="true" className="absolute bottom-36 right-36 hidden h-40 w-48 rotate-3 border-2 border-papier bg-papier p-4 text-encre shadow-lg lg:block">
            <Illustration src="/illustrations/artisan-protecteur.svg" className="h-full w-full object-cover" />
          </div>

          <div className="relative z-10 grid border-y border-papier/25 md:grid-cols-3">
            {[
              ["0 %", "de commission", "Le forfait ne dépend pas du montant de l’aide."],
              ["100 %", "de relation client", "Vous restez celui qui répond et qui dépose."],
              ["24 h", "proposées", "Du devis au pack, une attente bornée."],
            ].map(([number, title, body]) => (
              <article key={number} className="border-b border-papier/25 p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 sm:p-6">
                <p className="font-serif text-5xl font-semibold leading-none text-blanc-casse">{number}</p>
                <h2 className="mt-5 font-mono text-xs uppercase tracking-widest text-accent-clair">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-papier/70">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </Grid>

      <section className="border-y border-encre bg-papier py-16 sm:py-24">
        <Grid>
          <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
            <div className="relative z-10 grid gap-10 lg:grid-cols-2 lg:items-end">
              <div>
                <Label>§ 02 · contre le flou</Label>
                <h2 className="mt-5 font-serif text-5xl font-semibold leading-none text-encre sm:text-6xl">Ce que vous gardez.<br /><span className="italic text-tampon">Ce que nous faisons.</span></h2>
              </div>
              <p className="max-w-xl text-lg leading-relaxed text-ardoise lg:justify-self-end">La différence avec un mandataire devient une page à lire d’un regard, pas un paragraphe juridique dissimulé en bas de page.</p>
            </div>
            <div className="relative z-10 mt-12 grid border border-encre md:grid-cols-2">
              <div className="bg-encre p-7 text-papier sm:p-10">
                <p className="font-mono text-xs uppercase tracking-widest text-accent-clair">Vous gardez</p>
                <ul className="mt-10 space-y-6">
                  {["Votre client", "Le dépôt", "La prime", "La décision finale"].map((item) => (
                    <li key={item} className="flex items-center gap-4 border-b border-papier/20 pb-5 font-serif text-3xl font-semibold leading-none"><CheckCircle2 className="h-6 w-6 shrink-0 text-accent-clair" strokeWidth={1.25} aria-hidden="true" />{item}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-accent p-7 text-encre sm:p-10">
                <p className="font-mono text-xs uppercase tracking-widest">Dossimo fait</p>
                <ul className="mt-10 space-y-6">
                  {[
                    [ScanSearch, "Lire le devis"],
                    [FileCheck2, "Contrôler les risques"],
                    [HandCoins, "Préparer le pack"],
                    [Clock3, "Vous faire gagner du temps"],
                  ].map(([Icon, item]) => (
                    <li key={item as string} className="flex items-center gap-4 border-b border-encre/25 pb-5 font-serif text-3xl font-semibold leading-none"><Icon className="h-6 w-6 shrink-0" strokeWidth={1.25} aria-hidden="true" />{item as string}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Grid>
      </section>

      <section className="bg-blanc-casse py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-8 lg:grid-cols-2 lg:items-center">
          <Ticket notch="bg-blanc-casse" className="bg-accent">
            <p className="font-mono text-xs uppercase tracking-widest text-encre">Un prix, pas un intérêt dans votre aide</p>
            <h2 className="mt-5 font-serif text-5xl font-semibold leading-none text-encre">Forfait fixe.<br /><span className="italic">Prime intacte.</span></h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-encre">La préparation est facturée clairement. Dossimo ne prend pas une part de l’aide obtenue et n’a rien à gagner à s’interposer.</p>
            <div className="mt-8 flex items-end justify-between gap-5 border-t border-dashed border-encre/40 pt-5">
              <p className="font-mono text-xs uppercase tracking-widest text-encre">Prix affiché avant paiement</p>
              <BarCode />
            </div>
          </Ticket>
          <div>
            <Label>§ 03 · l’appel</Label>
            <h2 className="mt-5 font-serif text-4xl font-semibold leading-none text-encre sm:text-5xl">Préparer à votre place.<br />Sans prendre votre place.</h2>
            <Link href="/demo" className={`mt-8 inline-flex min-h-12 items-center gap-2 bg-encre px-6 text-sm font-semibold text-blanc-casse transition-colors hover:bg-accent ${FOCUS}`}>
              Protéger mon prochain dossier <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
      <PriceNote grille={grille} dark />
    </section>
  );
}

function PriceNote({ grille, dark = false }: { grille: GrilleAffichee | null; dark?: boolean }) {
  const background = dark ? "bg-encre text-papier" : "bg-papier text-encre";
  const focus = dark ? FOCUS_SOMBRE : FOCUS;
  return (
    <section className={`border-t border-encre py-14 sm:py-16 ${background}`}>
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 px-5 sm:px-8 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <Label light={dark}>Le prix est connu. La prime reste à votre client.</Label>
          <h2 className={`mt-4 font-serif text-4xl font-semibold leading-none sm:text-5xl ${dark ? "text-blanc-casse" : "text-encre"}`}>Pas de pourcentage.<br />Pas de surprise.</h2>
        </div>
        <div className="md:text-right">
          {grille ? (
            <p className={`font-mono text-3xl font-semibold tabular-nums ${dark ? "text-blanc-casse" : "text-encre"}`}>{grille.minLabel} à {grille.maxLabel}</p>
          ) : (
            <p className={`font-mono text-xl font-semibold ${dark ? "text-blanc-casse" : "text-encre"}`}>Tarif affiché avant paiement</p>
          )}
          <Link href="/tarifs" className={`mt-5 inline-flex min-h-11 items-center gap-2 border px-5 text-sm font-semibold transition-colors ${dark ? "border-papier/30 text-papier hover:bg-papier/10" : "border-encre/30 text-encre hover:bg-papier-fonce"} ${focus}`}>
            Consulter les tarifs <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
