import Link from "next/link";
import { notFound } from "next/navigation";

import { getDossier } from "@/lib/dossier/get-dossier";
import { getDossierPieces } from "@/lib/piece/get";
import { resolveCerfaTemplate } from "@/lib/cerfa/registry";
import { PointsVigilanceIA } from "@/components/dossier/points-vigilance-ia";
import { PiecesJustificatives } from "@/components/dossier/pieces-justificatives";
import { AhObligeFill } from "@/components/dossier/ah-oblige-fill";
import {
  LOGEMENT_TYPES,
  OCCUPATIONS,
  PRECARITES,
  RESIDENCES,
  TYPES_ISOLATION,
} from "@/lib/dossier/cee-isolation";
import {
  mentionsObligatoires,
  piecesCeeIsolation,
} from "@/lib/pack/pieces-cee-isolation";
import { controlerDossierCeeIsolation } from "@/lib/rules/cee-isolation";
import { SEVERITE_LABEL, type Finding, type Severite } from "@/lib/rules/types";

export const metadata = { title: "Dossier — Dossimo" };

const euro = (n: number | null) =>
  n == null ? "—" : n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

const date = (s: string | null) =>
  !s ? "—" : new Date(s).toLocaleDateString("fr-FR");

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-filigrane py-2 text-sm last:border-0">
      <dt className="text-ardoise">{label}</dt>
      <dd
        className={`text-right text-encre ${mono ? "font-mono text-xs" : "font-medium"}`}
      >
        {value}
      </dd>
    </div>
  );
}

const SEVERITE_ORDER: Record<Severite, number> = {
  bloquant: 0,
  avertissement: 1,
  ok: 2,
};

const SEVERITE_STYLE: Record<Severite, string> = {
  bloquant: "border-erreur/30 bg-erreur-bg text-erreur",
  avertissement: "border-avertissement/30 bg-avertissement-bg text-avertissement",
  ok: "border-succes/30 bg-succes-bg text-succes",
};

function FindingRow({ f }: { f: Finding }) {
  return (
    <li className="flex gap-3 py-2">
      <span
        className={`mt-0.5 h-fit shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${SEVERITE_STYLE[f.severite]}`}
      >
        {SEVERITE_LABEL[f.severite]}
      </span>
      <span>
        <span className="text-sm font-medium text-encre">{f.titre}</span>
        <span className="block text-xs text-ardoise">{f.detail}</span>
      </span>
    </li>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded border border-filigrane bg-blanc-casse p-5 shadow-sm">
      <h2 className="mb-3 font-serif text-base font-semibold text-encre">
        {title}
      </h2>
      <dl>{children}</dl>
    </section>
  );
}

export default async function DossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // getDossier lit en auth-scopé : null si le dossier n'appartient pas à
  // l'artisan connecté (RLS). Le layout /dossiers garantit déjà l'auth.
  const data = await getDossier(id);
  if (!data) notFound();

  const { dossier, artisan, caracteristiques: c, dates } = data;
  const travaux = TYPES_ISOLATION[c.travaux.type_isolation];
  const pieces = piecesCeeIsolation(data);
  const mentionsDevis = mentionsObligatoires(data).filter(
    (m) => m.document === "Devis",
  );
  const rapport = controlerDossierCeeIsolation(data);
  const findingsTries = [...rapport.findings].sort(
    (a, b) => SEVERITE_ORDER[a.severite] - SEVERITE_ORDER[b.severite],
  );

  // Modèle officiel en vigueur pour ce dossier à la date pertinente (§8).
  const cerfa = resolveCerfaTemplate(
    dossier.dispositif,
    c.fiche,
    dates.devis || dossier.created_at,
  );

  // Pièces réelles uploadées + écarts avec la saisie.
  const piecesReelles = await getDossierPieces(data);

  return (
    <main className="mx-auto max-w-4xl px-8 py-10">
      <Link
        href="/dossiers/nouveau"
        className="text-sm text-tampon underline-offset-4 transition hover:underline"
      >
        ← Nouveau dossier
      </Link>

      <div className="mt-4 mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-encre">
            {c.beneficiaire.prenom} {c.beneficiaire.nom}
          </h1>
          <p className="mt-1 text-sm text-ardoise">
            {travaux.label} · <span className="font-mono text-xs">{c.fiche}</span>{" "}
            · {c.beneficiaire.commune}{" "}
            <span className="font-mono text-xs">({c.beneficiaire.code_postal})</span>
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-succes-bg px-3 py-1 text-xs font-medium text-succes">
          <span className="h-1.5 w-1.5 rounded-full bg-succes" />
          Dossier créé
        </span>
      </div>

      {/* Rapport de contrôle déterministe */}
      <section className="mb-6 overflow-hidden rounded border border-filigrane bg-blanc-casse shadow-sm">
        <div
          className={`flex items-center justify-between gap-4 px-5 py-4 ${
            rapport.conforme ? "bg-succes-bg" : "bg-erreur-bg"
          }`}
        >
          <div>
            <h2 className="font-serif text-base font-semibold text-encre">
              Rapport de contrôle anti-refus
            </h2>
            <p
              className={`text-sm ${rapport.conforme ? "text-succes" : "text-erreur"}`}
            >
              {rapport.conforme
                ? "Aucun point bloquant détecté."
                : `${rapport.nbBloquants} point(s) bloquant(s) à corriger avant dépôt.`}
              {rapport.nbAvertissements > 0 &&
                ` · ${rapport.nbAvertissements} à vérifier.`}
            </p>
          </div>
          <a
            href={`/dossiers/${id}/rapport.pdf`}
            target="_blank"
            rel="noopener"
            className="shrink-0 rounded border border-encre bg-blanc-casse px-3 py-1.5 text-xs font-medium text-encre transition hover:bg-papier-fonce"
          >
            ↓ Rapport PDF
          </a>
        </div>
        <ul className="divide-y divide-filigrane px-5 py-2">
          {findingsTries.map((f) => (
            <FindingRow key={f.code} f={f} />
          ))}
        </ul>
      </section>

      {/* Pièces réelles (devis/facture) : cohérence avec la saisie */}
      <PiecesJustificatives dossierId={id} initial={piecesReelles} />

      {/* Points de vigilance rédigés (LLM, à la demande) */}
      <PointsVigilanceIA dossierId={id} />

      {/* Pack documentaire */}
      <div className="mt-6 mb-6 rounded border border-filigrane bg-papier-fonce p-5">
        <p className="text-sm text-encre">
          Pack documentaire généré depuis la saisie unique. Toutes les pièces
          dérivent des mêmes données.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`/dossiers/${id}/recap.pdf`}
            target="_blank"
            rel="noopener"
            className="inline-flex h-10 items-center rounded bg-terre-cuite px-4 text-sm font-medium text-blanc-casse transition-colors hover:bg-terre-cuite-hover"
          >
            ↓ Récapitulatif client (PDF)
          </a>
          <a
            href={`/dossiers/${id}/checklist.pdf`}
            target="_blank"
            rel="noopener"
            className="inline-flex h-10 items-center rounded border border-encre bg-blanc-casse px-4 text-sm font-medium text-encre transition-colors hover:bg-papier"
          >
            ↓ Checklist de conformité (PDF)
          </a>
        </div>
      </div>

      {/* Formulaire officiel (Cerfa) */}
      <section className="mb-6 rounded border border-filigrane bg-blanc-casse p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-base font-semibold text-encre">
              Formulaire officiel
            </h2>
            {cerfa.ok ? (
              <>
                <p className="mt-1 text-sm text-ardoise">{cerfa.template.titre}</p>
                <p className="mt-0.5 text-xs text-encre-claire">
                  {cerfa.template.arrete} · version{" "}
                  <span className="font-mono">{cerfa.template.version}</span>
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-erreur">{cerfa.reason}</p>
            )}
          </div>
          {cerfa.ok && (
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                cerfa.template.kind === "officiel"
                  ? "bg-succes-bg text-succes"
                  : "bg-tampon/10 text-tampon"
              }`}
            >
              {cerfa.template.kind === "officiel" ? "Officiel" : "Reproduction conforme"}
            </span>
          )}
        </div>

        {cerfa.ok && cerfa.template.kind === "reproduction" && (
          <p className="mt-3 rounded border-l-4 border-tampon bg-tampon/5 px-3 py-2 text-xs text-ardoise">
            L&apos;attestation sur l&apos;honneur CEE n&apos;est pas un Cerfa
            remplissable : c&apos;est un modèle réglementaire imprimé et signé à la
            main. Dossimo en produit une <strong>reproduction fidèle du modèle en
            vigueur</strong>, pré-remplie depuis votre saisie. À imprimer, puis dater
            et signer de façon manuscrite (bénéficiaire + professionnel) avant dépôt.
          </p>
        )}

        {cerfa.ok && (
          <a
            href={`/dossiers/${id}/cerfa.pdf`}
            target="_blank"
            rel="noopener"
            className="mt-4 inline-flex h-10 items-center rounded bg-encre px-4 text-sm font-medium text-papier transition-colors hover:bg-encre/90"
          >
            ↓ Formulaire officiel pré-rempli (PDF)
          </a>
        )}

        {cerfa.ok && cerfa.template.kind === "reproduction" && (
          <AhObligeFill dossierId={id} />
        )}
      </section>

      {/* Données du dossier */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Bénéficiaire">
          <Row label="Nom" value={`${c.beneficiaire.prenom} ${c.beneficiaire.nom}`} />
          <Row label="Adresse" value={c.beneficiaire.adresse} />
          <Row label="Commune" value={`${c.beneficiaire.commune} (${c.beneficiaire.code_postal})`} />
          <Row label="Occupation" value={OCCUPATIONS[c.beneficiaire.occupation]} />
          <Row label="Revenus" value={PRECARITES[c.beneficiaire.precarite]} />
        </Card>

        <Card title="Entreprise (RGE)">
          <Row label="Raison sociale" value={artisan?.entreprise ?? "—"} />
          <Row label="SIRET" value={artisan?.siret ?? "—"} mono />
          <Row label="N° RGE" value={c.rge.numero} mono />
          <Row label="Domaine" value={c.rge.domaine} />
          <Row label="RGE valable jusqu'au" value={date(c.rge.date_fin)} mono />
        </Card>

        <Card title="Logement">
          <Row label="Type" value={LOGEMENT_TYPES[c.logement.type]} />
          <Row label="Année de construction" value={c.logement.annee_construction} mono />
          <Row label="Usage" value={RESIDENCES[c.logement.residence]} />
          <Row label="Surface habitable" value={c.logement.surface_habitable ? `${c.logement.surface_habitable} m²` : "—"} mono />
        </Card>

        <Card title="Travaux">
          <Row label="Poste" value={`${travaux.label} (${c.fiche})`} />
          <Row label="Surface isolée" value={`${c.travaux.surface_isolee_m2} m²`} mono />
          <Row label="Isolant" value={c.travaux.isolant_type} />
          <Row label="Résistance R" value={`${c.travaux.resistance_thermique_r} m²·K/W`} mono />
          <Row label="Marque / réf." value={[c.travaux.isolant_marque, c.travaux.isolant_reference].filter(Boolean).join(" ") || "—"} />
        </Card>

        <Card title="Chronologie">
          <Row label="Visite technique" value={date(dates.visite_technique)} mono />
          <Row label="Devis signé" value={date(dates.devis)} mono />
          <Row label="Début travaux" value={date(dates.debut_travaux)} mono />
          <Row label="Fin travaux" value={date(dates.fin_travaux)} mono />
          <Row label="Facture" value={date(dates.facture)} mono />
        </Card>

        <Card title="Montants">
          <Row label="Montant HT" value={euro(c.montants.ht)} mono />
          <Row label="Montant TTC" value={euro(c.montants.ttc)} mono />
          <Row label="Prime CEE estimée" value={euro(c.montants.prime_estime)} mono />
          <Row label="Statut" value={dossier.statut} />
        </Card>
      </div>

      {/* Checklist */}
      <section className="mt-8 rounded border border-filigrane bg-blanc-casse p-5 shadow-sm">
        <h2 className="mb-1 font-serif text-base font-semibold text-encre">
          Checklist — pièces à réunir
        </h2>
        <p className="mb-4 text-xs text-ardoise">
          Le contrôle automatisé anti-refus (chronologie, RGE, cohérence des
          montants) s&apos;ajoute au rapport de contrôle.
        </p>
        <ul className="space-y-3">
          {pieces.map((p) => (
            <li key={p.id} className="flex gap-3">
              <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded-sm border border-filigrane" />
              <span>
                <span className="text-sm font-medium text-encre">{p.label}</span>
                {p.obligatoire && (
                  <span className="ml-2 text-[10px] font-semibold uppercase text-terre-cuite">
                    obligatoire
                  </span>
                )}
                <span className="block text-xs text-ardoise">{p.description}</span>
              </span>
            </li>
          ))}
        </ul>

        <h3 className="mt-6 mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ardoise">
          Mentions obligatoires — devis ET facture
        </h3>
        <ul className="space-y-2">
          {mentionsDevis.map((m, i) => (
            <li key={i} className="flex gap-3 text-sm text-encre">
              <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded-sm border border-filigrane" />
              {m.mention}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-center text-xs text-encre-claire">
        Dossimo — service indépendant d&apos;aide à la préparation de dossier,
        non affilié à l&apos;Anah ni à France Rénov&apos;.
      </p>
    </main>
  );
}
