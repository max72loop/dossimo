import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Carte, LigneInfo } from "@/components/artisan/profil-ui";
import { FormeAdresse, FormeContact, FormeEntreprise } from "@/components/artisan/profil-forms";
import { SectionParrainage, type CreditVue, type FilleulVue } from "@/components/artisan/profil-parrainage";
import { SectionSecurite } from "@/components/artisan/profil-securite";
import { getCurrentArtisan, getCurrentUser } from "@/lib/auth/get-artisan";
import { formaterSiret } from "@/lib/artisan/siret";
import { labelEuros } from "@/lib/pricing";
import { getReferralOverview } from "@/lib/referral";
import { createClient } from "@/lib/supabase/server";
import type { Artisan } from "@/lib/database.types";

export const metadata = { title: "Mon compte · Dossimo" };

const SECTIONS = [
  { id: "entreprise", titre: "Entreprise" },
  { id: "responsable", titre: "Responsable" },
  { id: "facturation", titre: "Facturation" },
  { id: "securite", titre: "Sécurité" },
  { id: "parrainage", titre: "Parrainage" },
] as const;

const dateCourte = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Champs sans lesquels une pièce générée part incomplète ou non conforme. Le
 * contrôle anti-refus commence ici : un SIRET manquant sur la fiche devient un
 * SIRET manquant sur le devis.
 */
function champsManquants(artisan: Artisan) {
  const manque: { label: string; ancre: string }[] = [];
  if (!artisan.siret) manque.push({ label: "SIRET", ancre: "entreprise" });
  if (!artisan.qualification_rge)
    manque.push({ label: "Qualification RGE", ancre: "entreprise" });
  if (!artisan.telephone) manque.push({ label: "Téléphone", ancre: "responsable" });
  if (!artisan.adresse || !artisan.code_postal || !artisan.ville)
    manque.push({ label: "Adresse de facturation", ancre: "facturation" });
  return manque;
}

function Completude({ artisan }: { artisan: Artisan }) {
  const manque = champsManquants(artisan);

  if (manque.length === 0) {
    return (
      <p className="mt-6 flex items-center gap-2 rounded border border-succes/25 bg-succes-bg px-4 py-3 text-sm text-succes">
        <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} />
        Profil complet. Vos dossiers et vos factures partent avec toutes les mentions requises.
      </p>
    );
  }

  return (
    <div className="mt-6 rounded border border-avertissement/30 bg-avertissement-bg px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-medium text-avertissement">
        <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        {manque.length} information{manque.length > 1 ? "s" : ""} à compléter
      </p>
      <p className="mt-1.5 text-sm text-ardoise">
        Ces champs alimentent vos devis, vos factures et vos Cerfa. Tant qu&apos;ils sont vides, les
        pièces générées restent incomplètes.
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {manque.map((m) => (
          <li key={m.label}>
            <Link
              href={`#${m.ancre}`}
              className="inline-flex items-center rounded border border-avertissement/30 bg-blanc-casse px-2.5 py-1 text-xs font-medium text-encre transition-colors hover:bg-papier-fonce"
            >
              {m.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function CompteArtisanPage() {
  const artisan = await getCurrentArtisan();
  if (!artisan) redirect("/connexion");

  const user = await getCurrentUser();
  const supabase = await createClient();
  const parrainage = await getReferralOverview(supabase, artisan.id);

  const email = user?.email ?? artisan.email;

  const credits: CreditVue[] = parrainage.credits
    .filter((c) => c.status === "active")
    .map((c) => ({
      id: c.id,
      label: labelEuros(c.amount_cents - c.consumed_cents),
      expireLe: dateCourte.format(new Date(c.expires_at)),
    }));

  const filleuls: FilleulVue[] = parrainage.referrals.map((r) => ({
    id: r.id,
    statut: r.status,
    creeLe: dateCourte.format(new Date(r.created_at)),
  }));

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-12 xl:px-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-tampon">Mon compte</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-encre">
          {artisan.entreprise}
        </h1>
        <p className="mt-3 text-ardoise">
          Ces informations préremplissent vos dossiers, vos devis et vos factures. Elles sont
          saisies une fois, puis reprises partout.
        </p>
        <Completude artisan={artisan} />
      </header>

      <div className="mt-8 gap-10 lg:flex">
        <nav
          aria-label="Sections du compte"
          className="hidden w-44 shrink-0 lg:block"
        >
          <ul className="sticky top-24 space-y-1">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <Link
                  href={`#${s.id}`}
                  className="block rounded px-3 py-1.5 text-sm text-ardoise transition-colors hover:bg-papier-fonce hover:text-encre"
                >
                  {s.titre}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 space-y-6">
          <Carte
            id="entreprise"
            titre="Entreprise"
            description="Identité portée sur chaque pièce générée."
          >
            <FormeEntreprise artisan={artisan} />
          </Carte>

          <Carte
            id="responsable"
            titre="Responsable"
            description="La personne qui signe les pièces du dossier."
          >
            <FormeContact artisan={artisan} />
          </Carte>

          <Carte
            id="facturation"
            titre="Adresse de facturation"
            description="Mention obligatoire sur vos factures Dossimo."
          >
            <FormeAdresse artisan={artisan} />
          </Carte>

          <Carte
            id="securite"
            titre="Sécurité"
            description="Accès à votre espace et à vos dossiers clients."
          >
            <SectionSecurite email={email} />
          </Carte>

          <Carte
            id="parrainage"
            titre="Parrainage"
            description="Parrainez un artisan, recevez un crédit sur vos dossiers."
          >
            <SectionParrainage
              code={parrainage.code}
              soldeLabel={labelEuros(parrainage.balanceCents)}
              credits={credits}
              filleuls={filleuls}
            />
          </Carte>

          <Carte id="compte" titre="Votre compte" description="Récapitulatif de l'abonnement.">
            <dl>
              <LigneInfo label="Identifiant de connexion" valeur={email} />
              <LigneInfo
                label="SIRET"
                valeur={
                  artisan.siret ? (
                    formaterSiret(artisan.siret)
                  ) : (
                    <span className="text-encre-claire">Non renseigné</span>
                  )
                }
              />
              <LigneInfo
                label="Compte ouvert le"
                valeur={dateCourte.format(new Date(artisan.created_at))}
              />
            </dl>
            <p className="mt-5 text-xs leading-5 text-encre-claire">
              Dossimo est un service indépendant d&apos;aide à la préparation de dossier, non
              affilié à l&apos;Anah ni à France Rénov&apos;. Pour fermer votre compte et supprimer
              vos données, écrivez à{" "}
              <a
                href="mailto:contact@dossimo.app?subject=Suppression%20de%20mon%20compte"
                className="text-tampon underline-offset-4 hover:underline"
              >
                contact@dossimo.app
              </a>
              .
            </p>
          </Carte>
        </div>
      </div>
    </main>
  );
}
