import Link from "next/link";
import { notFound } from "next/navigation";

import { getDossier } from "@/lib/dossier/get-dossier";
import { rapportComplet } from "@/lib/dossier/rapport";
import { nbEcarts } from "@/lib/piece/compare";
import { resolveCerfaTemplate } from "@/lib/cerfa/registry";
import { storedVigilance } from "@/lib/llm/vigilance";
import { PointsVigilanceIA } from "@/components/dossier/points-vigilance-ia";
import { PiecesJustificatives } from "@/components/dossier/pieces-justificatives";
import { LienDepot } from "@/components/dossier/lien-depot";
import { piecesAttendues } from "@/lib/depot/pieces-attendues";
import { EcartPrime } from "@/components/dossier/ecart-prime";
import { AhObligeFill } from "@/components/dossier/ah-oblige-fill";
import { PaywallCta } from "@/components/dossier/paywall-cta";
import { CreditsCta } from "@/components/dossier/credits-cta";
import { ParcoursSelector } from "@/components/dossier/parcours-selector";
import { DepotGuide } from "@/components/dossier/depot-guide";
import { VerdictHero } from "@/components/dossier/verdict-hero";
import { ActionsRestantes } from "@/components/dossier/actions-restantes";
import { MetriquesValeur } from "@/components/dossier/metriques-valeur";
import { ConversionOffert } from "@/components/dossier/conversion-offert";
import { SectionRepliable } from "@/components/ui/section-repliable";
import { BTN_PRINCIPAL, BTN_SECONDAIRE, BTN_SECONDAIRE_SM } from "@/components/ui/boutons";
import { accesDossier } from "@/lib/dossier/acces";
import { createClient } from "@/lib/supabase/server";
import { prixPack, getActiveTiers, labelEuros } from "@/lib/pricing";
import { estimerPrime } from "@/lib/dossier/prime";
import { syntheseDossier } from "@/lib/dossier/synthese";
import { formatEuros } from "@/lib/format/montant";
import { depotGuide } from "@/lib/dossier/depot-guide";
import {
  LOGEMENT_TYPES,
  OCCUPATIONS,
  PRECARITES,
  RESIDENCES,
  posteLabel,
} from "@/lib/dossier/cee-isolation";
import {
  lignesTechniques,
  titreSectionTechnique,
} from "@/lib/dossier/geste-technique";
import {
  mentionsObligatoires,
  piecesCeeIsolation,
} from "@/lib/pack/pieces-cee-isolation";
import { SEVERITE_LABEL, type Finding, type Severite } from "@/lib/rules/types";

export const metadata = { title: "Dossier · Dossimo" };

// L'analyse assistée (points de vigilance) appelle un LLM sur un contexte enrichi :
// on relève le plafond de durée de la fonction (défaut trop court sur Vercel).
export const maxDuration = 60;

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

/** Carte de données du récapitulatif (repliée par défaut, poids visuel léger). */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded border border-filigrane bg-papier/40 p-5">
      <h3 className="mb-3 font-serif text-base font-semibold text-encre">{title}</h3>
      <dl>{children}</dl>
    </section>
  );
}

export default async function DossierPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paye?: string; annule?: string; parrain?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  // getDossier lit en auth-scopé : null si le dossier n'appartient pas à
  // l'artisan connecté (RLS). Le layout /dossiers garantit déjà l'auth.
  const data = await getDossier(id);
  if (!data) notFound();

  const { dossier, artisan, caracteristiques: c, dates } = data;
  const poste = posteLabel(c);
  const pieces = piecesCeeIsolation(data);
  const mentionsDevis = mentionsObligatoires(data).filter(
    (m) => m.document === "Devis",
  );
  // Rapport de contrôle = saisie + pièces réelles (écarts, mentions obligatoires
  // manquantes, concordance devis/facture). Même source que le rapport.pdf et le
  // pack : l'écran et le livrable ne peuvent pas se contredire.
  const { rapport, pieces: piecesReelles } = await rapportComplet(data);
  const findingsTries = [...rapport.findings].sort(
    (a, b) => SEVERITE_ORDER[a.severite] - SEVERITE_ORDER[b.severite],
  );

  // Pièces que seul le bénéficiaire peut fournir, et ce qu'il a déjà déposé.
  const attenduesClient = piecesAttendues(data);
  const nbPiecesClient = attenduesClient.filter((a) =>
    piecesReelles.some((p) => p.piece.type === a.type),
  ).length;

  // Modèle officiel en vigueur pour ce dossier à la date pertinente (§8).
  const cerfa = resolveCerfaTemplate(
    dossier.dispositif,
    c.fiche,
    dates.devis || dossier.created_at,
  );

  // Points de vigilance déjà générés (persistés) : affichage instantané.
  const vigilance = storedVigilance(data);

  // Droit d'accès au livrable (1er dossier gratuit, sinon paiement). Verrouille
  // à la fois les téléchargements (routes PDF) et le détail affiché ici.
  const acces = await accesDossier(data);

  // Estimation indicative de prime (barème piloté par la règle métier).
  const prime = estimerPrime(data);
  // Prix du pack par palier (grille en base), indexé sur l'aide estimée. Même
  // source de vérité que le checkout : l'affiché correspond au facturé.
  const supabase = await createClient();
  const tiers = await getActiveTiers(supabase);
  const prix = prixPack(prime ? Math.round(prime.montant * 100) : null, tiers);

  // Net à payer : final_price_cents (net de remise filleul + crédits déjà
  // appliqués) s'il existe, sinon le prix de base du palier. Crédits parrain
  // disponibles pour proposer le bouton « utiliser mes crédits ».
  const creditApplied = data.dossier.credit_applied_cents ?? 0;
  const discountParrain = data.dossier.discount_cents ?? 0;
  const netCents = data.dossier.final_price_cents ?? prix.cents;
  const netLabel = netCents != null ? labelEuros(netCents) : prix.label;
  const soldeCredits = data.artisan?.credit_balance_cents ?? 0;

  // Synthèse d'affichage : complétude, actions restantes, risque, métriques.
  // Dérivée du rapport déterministe et des pièces réelles — aucune règle ici.
  const synthese = syntheseDossier({
    rapport,
    pieces: piecesReelles.map(({ piece, comparaisons, mentions }) => ({
      type: piece.type,
      lue: piece.extraction_statut === "ok",
      nbEcarts: nbEcarts(comparaisons),
      mentionsPresentes:
        mentions === null
          ? null
          : mentions.filter((m) => m.statut === "presente").length,
    })),
    statut: dossier.statut,
    mentionsTotal: mentionsDevis.length,
  });

  // Montant mis en avant : celui que l'artisan a retenu (saisi), à défaut
  // l'estimation du barème. Le hero et la carte prime affichent le même.
  const primeRetenue = c.montants.prime_estime ?? prime?.montant ?? null;
  const guide = depotGuide(dossier.dispositif);

  // Action principale unique et contextuelle : réunir les pièces tant qu'elles
  // manquent, sinon récupérer le pack. Quand le dossier est verrouillé, le
  // paiement EST l'action principale : on n'en affiche pas de seconde.
  const ctaPrincipal = !acces.debloque
    ? null
    : synthese.piecesCompletes
      ? { href: `/dossiers/${id}/pack.pdf`, label: "Télécharger le pack complet", externe: true }
      : { href: "#pieces", label: "Ajouter devis + facture", externe: false };

  return (
    <main className="mx-auto max-w-4xl px-8 py-10">
      <Link
        href="/dossiers/nouveau"
        className="text-sm text-tampon underline-offset-4 transition hover:underline"
      >
        ← Nouveau dossier
      </Link>

      {/* 1. En-tête */}
      <div className="mt-4 mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-encre">
            {c.beneficiaire.prenom} {c.beneficiaire.nom}
          </h1>
          <p className="mt-1 text-sm text-ardoise">
            {poste} · <span className="font-mono text-xs">{c.fiche}</span>{" "}
            · {c.beneficiaire.commune}{" "}
            <span className="font-mono text-xs">({c.beneficiaire.code_postal})</span>
          </p>
        </div>
        {acces.gratuit ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-tampon/10 px-3 py-1 text-xs font-medium text-tampon">
            <span className="h-1.5 w-1.5 rounded-full bg-tampon" />
            Premier dossier · offert
          </span>
        ) : acces.paye ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-succes-bg px-3 py-1 text-xs font-medium text-succes">
            <span className="h-1.5 w-1.5 rounded-full bg-succes" />
            Pack débloqué
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-avertissement-bg px-3 py-1 text-xs font-medium text-avertissement">
            🔒 Verrouillé
          </span>
        )}
      </div>

      {sp.paye && acces.debloque && (
        <div className="mb-6 rounded border-l-4 border-succes bg-succes-bg px-4 py-3 text-sm text-succes">
          Paiement confirmé · le pack est débloqué. Vous pouvez télécharger tous les
          documents ci-dessous.
        </div>
      )}
      {sp.parrain === "ok" && (
        <div className="mb-6 rounded border-l-4 border-succes bg-succes-bg px-4 py-3 text-sm text-succes">
          Code parrain enregistré · la remise de 30 € s&apos;appliquera à votre
          premier dossier payant.
        </div>
      )}
      {sp.parrain === "ko" && (
        <div className="mb-6 rounded border-l-4 border-avertissement bg-avertissement-bg px-4 py-3 text-sm text-avertissement">
          Code parrain non appliqué · code inconnu, déjà utilisé, ou compte ayant
          déjà réglé un dossier.
        </div>
      )}

      {/* 2. Verdict */}
      <VerdictHero
        synthese={synthese}
        primeRetenue={primeRetenue}
        primeLabel={prime ? `Prime ${prime.dispositif} retenue` : "Prime retenue"}
      />

      {/* 3. Action principale unique + actions secondaires */}
      {ctaPrincipal && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {ctaPrincipal.externe ? (
            <a
              href={ctaPrincipal.href}
              target="_blank"
              rel="noopener"
              className={BTN_PRINCIPAL}
            >
              ↓ {ctaPrincipal.label}
            </a>
          ) : (
            <a href={ctaPrincipal.href} className={BTN_PRINCIPAL}>
              {ctaPrincipal.label}
            </a>
          )}
          <a
            href={`/dossiers/${id}/rapport.pdf`}
            target="_blank"
            rel="noopener"
            className={BTN_SECONDAIRE}
          >
            Rapport de contrôle (PDF)
          </a>
          {cerfa.ok && (
            <a
              href={`/dossiers/${id}/cerfa.pdf`}
              target="_blank"
              rel="noopener"
              className={BTN_SECONDAIRE}
            >
              Formulaire officiel
            </a>
          )}
        </div>
      )}

      {/* Paywall : quand le dossier est verrouillé, le déblocage est l'action
          principale de l'écran (seul bouton plein). */}
      {!acces.debloque && (
        <section className="mb-6 rounded-md border border-terre-cuite/30 bg-terre-cuite/5 p-5 shadow-sm">
          <h2 className="font-serif text-base font-semibold text-encre">
            Débloquez ce dossier pour accéder au pack
          </h2>
          <p className="mt-1 text-sm text-ardoise">
            Débloquez pour voir le détail de chaque contrôle, les points de
            vigilance, générer le pack complet et télécharger les documents
            (attestation, checklist, rapport…).
          </p>
          {sp.annule && (
            <p className="mt-2 text-xs text-ardoise">
              Paiement annulé · vous pouvez réessayer.
            </p>
          )}
          {discountParrain > 0 && (
            <p className="mt-2 text-xs text-succes">
              Remise parrain de {labelEuros(discountParrain)} appliquée sur ce dossier.
            </p>
          )}
          {creditApplied > 0 && (
            <p className="mt-2 text-xs text-succes">
              {labelEuros(creditApplied)} de crédits parrain appliqués
              {netCents != null && <> · reste {netLabel} à régler</>}.
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-start gap-3">
            <PaywallCta dossierId={id} prix={netLabel} />
            {soldeCredits > 0 && creditApplied === 0 && (netCents ?? 0) > 0 && (
              <CreditsCta dossierId={id} soldeLabel={labelEuros(soldeCredits)} />
            )}
          </div>
          <p className="mt-3 text-xs text-encre-claire">
            Paiement unique par Stripe. Le premier dossier de votre compte est offert.
          </p>
        </section>
      )}

      {/* 4. Actions restantes */}
      <ActionsRestantes synthese={synthese} />

      {/* 5. Métriques de valeur */}
      <MetriquesValeur synthese={synthese} />

      {/* 6. Pièces réelles : étape active */}
      {acces.debloque ? (
        <>
          <PiecesJustificatives
            dossierId={id}
            initial={piecesReelles}
            nbMentions={mentionsDevis.length}
          />
          {/* 6 bis. Les pièces qui ne peuvent venir que du client. */}
          <div className="mb-6">
            <LienDepot
              dossierId={id}
              attendues={attenduesClient}
              nbRecues={nbPiecesClient}
              prenomClient={data.caracteristiques.beneficiaire.prenom}
            />
          </div>
        </>
      ) : (
        <section className="mb-6 rounded border border-filigrane bg-blanc-casse p-5 shadow-sm">
          <h2 className="font-serif text-base font-semibold text-encre">
            Contrôle des pièces réelles
          </h2>
          <p className="mt-1 text-sm text-ardoise">
            🔒 Débloquez le dossier pour téléverser le devis et la facture : Dossimo
            les relit et vérifie les {mentionsDevis.length} mentions obligatoires
            face à votre saisie.
          </p>
        </section>
      )}

      {/* Prime · le montant retenu d'abord, l'écart en note secondaire */}
      {prime && (
        <section className="mb-6 rounded border border-filigrane bg-blanc-casse p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-base font-semibold text-encre">
                Prime {prime.dispositif} · estimation
              </h2>
              <p className="mt-1 text-xs text-ardoise">Barème appliqué : {prime.base}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-serif text-2xl font-semibold text-terre-cuite">
                {formatEuros(primeRetenue)}
              </p>
              <p className="mt-0.5 text-xs text-ardoise">
                {c.montants.prime_estime != null
                  ? "Montant retenu"
                  : "Estimation Dossimo"}
              </p>
            </div>
          </div>
          {c.montants.prime_estime != null &&
            Math.abs(c.montants.prime_estime - prime.montant) > 1 && (
              <EcartPrime
                dossierId={id}
                saisi={c.montants.prime_estime}
                estimation={prime.montant}
                base={prime.base}
                precariteLabel={PRECARITES[c.beneficiaire.precarite]}
              />
            )}
          <p className="mt-3 text-[11px] text-encre-claire">
            Estimation indicative, calculée depuis le barème de la règle métier
            (éditable dans l&apos;admin). Ne vaut pas notification de la prime.
          </p>
        </section>
      )}

      {/* 7. Parcours du dossier */}
      <ParcoursSelector dossierId={id} statut={dossier.statut} />

      {/* 8. Détails repliés */}
      <h2 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-ardoise">
        Détails du dossier
      </h2>

      <SectionRepliable
        titre="Détail des contrôles anti-refus"
        resume={`${rapport.findings.length} points de contrôle · ${synthese.nbControlesPasses} conformes${rapport.nbAvertissements > 0 ? ` · ${rapport.nbAvertissements} à vérifier` : ""}${rapport.nbBloquants > 0 ? ` · ${rapport.nbBloquants} bloquants` : ""}`}
        ouvertParDefaut={rapport.nbBloquants > 0}
      >
        {acces.debloque ? (
          <>
            <ul className="divide-y divide-filigrane">
              {findingsTries.map((f) => (
                <FindingRow key={f.code} f={f} />
              ))}
            </ul>
            <a
              href={`/dossiers/${id}/rapport.pdf`}
              target="_blank"
              rel="noopener"
              className={`mt-4 ${BTN_SECONDAIRE_SM}`}
            >
              ↓ Rapport PDF
            </a>
          </>
        ) : (
          <p className="text-sm text-ardoise">
            🔒 Le détail des points de contrôle est verrouillé. Débloquez le dossier
            pour voir chaque point et sa correction.
          </p>
        )}
      </SectionRepliable>

      <SectionRepliable
        titre="Récapitulatif complet"
        resume="Bénéficiaire, entreprise, logement, travaux, chronologie, montants"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Card title="Bénéficiaire">
            <Row label="Nom" value={`${c.beneficiaire.prenom} ${c.beneficiaire.nom}`} />
            <Row label="Adresse" value={c.beneficiaire.adresse} />
            <Row
              label="Commune"
              value={`${c.beneficiaire.commune} (${c.beneficiaire.code_postal})`}
            />
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
            <Row
              label="Année de construction"
              value={c.logement.annee_construction}
              mono
            />
            <Row label="Usage" value={RESIDENCES[c.logement.residence]} />
            <Row
              label="Surface habitable"
              value={
                c.logement.surface_habitable
                  ? `${c.logement.surface_habitable} m²`
                  : "—"
              }
              mono
            />
          </Card>

          <Card title={titreSectionTechnique(c)}>
            <Row label="Poste" value={`${poste} (${c.fiche})`} />
            {lignesTechniques(c).map((l) => (
              <Row key={l.label} label={l.label} value={l.value} mono={l.mono} />
            ))}
          </Card>

          <Card title="Chronologie">
            <Row label="Visite technique" value={date(dates.visite_technique)} mono />
            <Row label="Devis signé" value={date(dates.devis)} mono />
            <Row label="Début travaux" value={date(dates.debut_travaux)} mono />
            <Row label="Fin travaux" value={date(dates.fin_travaux)} mono />
            <Row label="Facture" value={date(dates.facture)} mono />
          </Card>

          <Card title="Montants">
            <Row label="Montant HT" value={formatEuros(c.montants.ht)} mono />
            <Row label="Montant TTC" value={formatEuros(c.montants.ttc)} mono />
            <Row
              label="Prime retenue"
              value={formatEuros(c.montants.prime_estime)}
              mono
            />
            <Row label="Statut" value={dossier.statut} />
          </Card>
        </div>
      </SectionRepliable>

      <SectionRepliable
        titre="Où déposer ce dossier"
        resume={`${guide.dispositifLabel} · ${guide.quiDepose}`}
      >
        <DepotGuide dispositif={dossier.dispositif} />
      </SectionRepliable>

      <SectionRepliable
        titre="Pack documentaire"
        resume="Page de garde · récapitulatif · rapport · checklist · attestation"
      >
        <p className="text-sm text-ardoise">
          Pack généré depuis la saisie unique. Toutes les pièces dérivent des mêmes
          données : une incohérence entre devis et facture est structurellement
          impossible.
        </p>
        {acces.debloque ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`/dossiers/${id}/pack.pdf`}
              target="_blank"
              rel="noopener"
              className={BTN_SECONDAIRE_SM}
            >
              ↓ Pack complet (PDF unique)
            </a>
            <a
              href={`/dossiers/${id}/recap.pdf`}
              target="_blank"
              rel="noopener"
              className={BTN_SECONDAIRE_SM}
            >
              Récapitulatif seul
            </a>
            <a
              href={`/dossiers/${id}/checklist.pdf`}
              target="_blank"
              rel="noopener"
              className={BTN_SECONDAIRE_SM}
            >
              Checklist seule
            </a>
          </div>
        ) : (
          <p className="mt-3 text-sm text-ardoise">
            🔒 Téléchargements verrouillés. Débloquez le dossier pour obtenir le pack
            complet et chaque document.
          </p>
        )}
      </SectionRepliable>

      <SectionRepliable
        titre="Formulaire officiel"
        resume={
          cerfa.ok
            ? `${cerfa.template.titre} · version ${cerfa.template.version}`
            : cerfa.reason
        }
      >
        {cerfa.ok ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-encre">{cerfa.template.titre}</p>
                <p className="mt-0.5 text-xs text-encre-claire">
                  {cerfa.template.arrete} · version{" "}
                  <span className="font-mono">{cerfa.template.version}</span>
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  cerfa.template.kind === "officiel"
                    ? "bg-succes-bg text-succes"
                    : "bg-tampon/10 text-tampon"
                }`}
              >
                {cerfa.template.kind === "officiel"
                  ? "Officiel"
                  : "Reproduction conforme"}
              </span>
            </div>

            {cerfa.template.kind === "reproduction" && (
              <p className="mt-3 rounded border-l-4 border-tampon bg-tampon/5 px-3 py-2 text-xs text-ardoise">
                L&apos;attestation sur l&apos;honneur CEE n&apos;est pas un Cerfa
                remplissable : c&apos;est un modèle réglementaire imprimé et signé à
                la main. Dossimo en produit une{" "}
                <strong>reproduction fidèle du modèle en vigueur</strong>,
                pré-remplie depuis votre saisie. À imprimer, puis dater et signer de
                façon manuscrite (bénéficiaire + professionnel) avant dépôt.
              </p>
            )}

            {acces.debloque ? (
              <a
                href={`/dossiers/${id}/cerfa.pdf`}
                target="_blank"
                rel="noopener"
                className={`mt-4 ${BTN_SECONDAIRE_SM}`}
              >
                ↓ Formulaire officiel pré-rempli (PDF)
              </a>
            ) : (
              <p className="mt-4 text-sm text-ardoise">
                🔒 Débloquez le dossier pour télécharger l&apos;attestation
                pré-remplie.
              </p>
            )}

            {cerfa.template.kind === "reproduction" && acces.debloque && (
              <AhObligeFill dossierId={id} />
            )}
          </>
        ) : (
          <p className="text-sm text-erreur">{cerfa.reason}</p>
        )}
      </SectionRepliable>

      <SectionRepliable
        titre="Checklist · pièces à réunir"
        resume={`${pieces.length} pièces · ${mentionsDevis.length} mentions obligatoires sur le devis et la facture`}
      >
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
          Mentions obligatoires · devis ET facture
        </h3>
        <ul className="space-y-2">
          {mentionsDevis.map((m, i) => (
            <li key={i} className="flex gap-3 text-sm text-encre">
              <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded-sm border border-filigrane" />
              {m.mention}
            </li>
          ))}
        </ul>
      </SectionRepliable>

      {acces.debloque && (
        <SectionRepliable
          titre="Points de vigilance · analyse assistée"
          resume="Conseils contextuels rédigés, en complément du contrôle automatique"
        >
          <PointsVigilanceIA
            dossierId={id}
            initial={vigilance?.points}
            initialAt={vigilance?.at}
          />
        </SectionRepliable>
      )}

      {/* 9. Conversion · uniquement pour le dossier offert */}
      {acces.gratuit && <ConversionOffert prixLabel={prix.label} />}

      <p className="mt-8 text-center text-xs text-encre-claire">
        Dossimo · service indépendant d&apos;aide à la préparation de dossier,
        non affilié à l&apos;Anah ni à France Rénov&apos;.
      </p>
    </main>
  );
}
