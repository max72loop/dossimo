import { Document, Page, Text, View } from "@react-pdf/renderer";

import type { DossierComplet } from "@/lib/dossier/get-dossier";
import {
  LOGEMENT_TYPES,
  OCCUPATIONS,
  PRECARITES,
  RESIDENCES,
  TYPES_ISOLATION,
} from "@/lib/dossier/cee-isolation";
import { dateFr, euro } from "@/lib/pack/format";
import {
  mentionsObligatoires,
  piecesCeeIsolation,
} from "@/lib/pack/pieces-cee-isolation";
import { COLORS, styles } from "@/lib/pack/pdf-theme";
import {
  SEVERITE_LABEL,
  type RapportControle,
  type Severite,
} from "@/lib/rules/types";
import type { PointVigilance } from "@/lib/llm/vigilance";

const DISCLAIMER =
  "Dossimo — service indépendant d'aide à la préparation de dossier, non affilié à l'Anah ni à France Rénov'. Dossimo ne dépose pas le dossier et ne perçoit pas la prime.";

function Header({ docType, title, subtitle }: { docType: string; title: string; subtitle: string }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brand}>Dossimo</Text>
        <Text style={styles.docType}>{docType}</Text>
      </View>
      <View style={styles.headerRight}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function Footer() {
  return (
    <Text
      style={styles.footer}
      render={({ pageNumber, totalPages }) =>
        `${DISCLAIMER}   ·   Page ${pageNumber}/${totalPages}`
      }
      fixed
    />
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{String(value)}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Récap client
// ---------------------------------------------------------------------------
export function RecapDocument({ data }: { data: DossierComplet }) {
  const { caracteristiques: c, dates, artisan } = data;
  const travaux = TYPES_ISOLATION[c.travaux.type_isolation];

  return (
    <Document
      title={`Récapitulatif — ${c.beneficiaire.prenom} ${c.beneficiaire.nom}`}
      author="Dossimo"
    >
      <Page size="A4" style={styles.page}>
        <Header
          docType="Récapitulatif client"
          title={`${c.beneficiaire.prenom} ${c.beneficiaire.nom}`}
          subtitle={`${travaux.label} · ${c.fiche}`}
        />

        <View style={styles.brandCard}>
          <Text>
            Récapitulatif des informations du chantier d'isolation. Ce document
            reprend la saisie unique : toutes les pièces du dossier en découlent.
            Vérifiez chaque donnée avant génération des documents officiels.
          </Text>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Section title="Bénéficiaire">
              <Row label="Nom" value={`${c.beneficiaire.prenom} ${c.beneficiaire.nom}`} />
              <Row label="Adresse" value={c.beneficiaire.adresse} />
              <Row label="Commune" value={`${c.beneficiaire.commune} (${c.beneficiaire.code_postal})`} />
              <Row label="Occupation" value={OCCUPATIONS[c.beneficiaire.occupation]} />
              <Row label="Revenus" value={PRECARITES[c.beneficiaire.precarite]} />
              {c.beneficiaire.email ? <Row label="Email" value={c.beneficiaire.email} /> : null}
              {c.beneficiaire.telephone ? <Row label="Téléphone" value={c.beneficiaire.telephone} /> : null}
            </Section>
          </View>
          <View style={styles.col}>
            <Section title="Logement">
              <Row label="Type" value={LOGEMENT_TYPES[c.logement.type]} />
              <Row label="Année de construction" value={c.logement.annee_construction} />
              <Row label="Usage" value={RESIDENCES[c.logement.residence]} />
              <Row label="Surface habitable" value={c.logement.surface_habitable ? `${c.logement.surface_habitable} m²` : "—"} />
            </Section>
          </View>
        </View>

        <Section title="Travaux d'isolation">
          <Row label="Poste" value={`${travaux.label} (${c.fiche})`} />
          <Row label="Surface isolée" value={`${c.travaux.surface_isolee_m2} m²`} />
          <Row label="Isolant" value={c.travaux.isolant_type} />
          <Row label="Résistance thermique R" value={`${c.travaux.resistance_thermique_r} m²·K/W`} />
          <Row label="Marque / référence" value={[c.travaux.isolant_marque, c.travaux.isolant_reference].filter(Boolean).join(" ") || "—"} />
          <Row label="Épaisseur" value={c.travaux.epaisseur_mm ? `${c.travaux.epaisseur_mm} mm` : "—"} />
        </Section>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Section title="Chronologie">
              <Row label="Visite technique" value={dateFr(dates.visite_technique)} />
              <Row label="Devis signé" value={dateFr(dates.devis)} />
              <Row label="Début travaux" value={dateFr(dates.debut_travaux)} />
              <Row label="Fin travaux" value={dateFr(dates.fin_travaux)} />
              <Row label="Facture" value={dateFr(dates.facture)} />
            </Section>
          </View>
          <View style={styles.col}>
            <Section title="Montants">
              <Row label="Montant HT" value={euro(c.montants.ht)} />
              <Row label="Montant TTC" value={euro(c.montants.ttc)} />
              <Row label="Prime CEE estimée" value={euro(c.montants.prime_estime)} />
            </Section>
          </View>
        </View>

        <Section title="Entreprise réalisant les travaux">
          <Row label="Raison sociale" value={artisan?.entreprise ?? "—"} />
          <Row label="SIRET" value={artisan?.siret ?? "—"} />
          <Row label="Qualification RGE" value={`${c.rge.numero} — ${c.rge.domaine}`} />
          <Row label="RGE valable jusqu'au" value={dateFr(c.rge.date_fin)} />
        </Section>

        <Footer />
      </Page>
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Rapport de contrôle anti-refus
// ---------------------------------------------------------------------------
const SEV_COLORS: Record<Severite, { fg: string; bg: string }> = {
  bloquant: { fg: COLORS.danger, bg: COLORS.dangerSoft },
  avertissement: { fg: COLORS.warn, bg: COLORS.warnSoft },
  ok: { fg: COLORS.ok, bg: COLORS.okSoft },
};

const SEV_ORDER: Record<Severite, number> = {
  bloquant: 0,
  avertissement: 1,
  ok: 2,
};

const AI_SEV: Record<
  PointVigilance["severite"],
  { fg: string; bg: string; label: string }
> = {
  important: { fg: COLORS.danger, bg: COLORS.dangerSoft, label: "IMPORTANT" },
  vigilance: { fg: COLORS.warn, bg: COLORS.warnSoft, label: "VIGILANCE" },
  info: { fg: COLORS.tampon, bg: COLORS.tamponSoft, label: "INFO" },
};

export function ControleDocument({
  data,
  rapport,
  vigilance,
}: {
  data: DossierComplet;
  rapport: RapportControle;
  vigilance?: PointVigilance[];
}) {
  const { caracteristiques: c } = data;
  const travaux = TYPES_ISOLATION[c.travaux.type_isolation];
  const findings = [...rapport.findings].sort(
    (a, b) => SEV_ORDER[a.severite] - SEV_ORDER[b.severite],
  );
  const banner = rapport.conforme
    ? { fg: COLORS.ok, bg: COLORS.okSoft }
    : { fg: COLORS.danger, bg: COLORS.dangerSoft };

  return (
    <Document title={`Rapport de contrôle — ${c.beneficiaire.prenom} ${c.beneficiaire.nom}`} author="Dossimo">
      <Page size="A4" style={styles.page}>
        <Header
          docType="Rapport de contrôle anti-refus"
          title={rapport.conforme ? "Aucun point bloquant" : `${rapport.nbBloquants} point(s) bloquant(s)`}
          subtitle={`${travaux.label} · ${c.fiche} · ${c.beneficiaire.prenom} ${c.beneficiaire.nom}`}
        />

        <View style={[styles.banner, { backgroundColor: banner.bg }]}>
          <Text style={[styles.bannerTitle, { color: banner.fg }]}>
            {rapport.conforme
              ? "Le dossier ne présente aucun point bloquant."
              : "Des points bloquants doivent être corrigés avant dépôt."}
          </Text>
          <Text style={{ marginTop: 3 }}>
            {rapport.nbBloquants} bloquant(s) · {rapport.nbAvertissements} à
            vérifier. Contrôle automatisé des règles dures (chronologie, RGE,
            éligibilité, performance, montants).
          </Text>
        </View>

        {findings.map((f) => {
          const sc = SEV_COLORS[f.severite];
          return (
            <View key={f.code} style={styles.finding} wrap={false}>
              <Text style={[styles.sevBadge, { color: sc.fg, backgroundColor: sc.bg }]}>
                {SEVERITE_LABEL[f.severite].toUpperCase()}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.findingTitle}>{f.titre}</Text>
                <Text style={styles.findingDetail}>{f.detail}</Text>
              </View>
            </View>
          );
        })}

        {vigilance && vigilance.length > 0 ? (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>
              Points de vigilance — analyse assistée
            </Text>
            <Text style={styles.aiNote}>
              Complément contextuel généré automatiquement, à relire. Ne
              remplace pas le contrôle de conformité ni la décision de
              l&apos;instructeur.
            </Text>
            {vigilance.map((p, i) => {
              const sc = AI_SEV[p.severite];
              return (
                <View key={i} style={styles.finding} wrap={false}>
                  <Text style={[styles.sevBadge, { color: sc.fg, backgroundColor: sc.bg }]}>
                    {sc.label}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.findingTitle}>
                      {p.titre}
                      {p.poste ? <Text style={styles.aiPoste}>  · {p.poste}</Text> : null}
                    </Text>
                    <Text style={styles.findingDetail}>{p.detail}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        <Footer />
      </Page>
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Checklist / bordereau de pièces
// ---------------------------------------------------------------------------
export function ChecklistDocument({ data }: { data: DossierComplet }) {
  const { caracteristiques: c } = data;
  const travaux = TYPES_ISOLATION[c.travaux.type_isolation];
  const pieces = piecesCeeIsolation(data);
  const mentions = mentionsObligatoires(data);
  const mentionsDevis = mentions.filter((m) => m.document === "Devis");

  return (
    <Document title={`Checklist — ${c.beneficiaire.prenom} ${c.beneficiaire.nom}`} author="Dossimo">
      <Page size="A4" style={styles.page}>
        <Header
          docType="Checklist de conformité"
          title="Pièces à réunir"
          subtitle={`${travaux.label} · ${c.fiche} · ${c.beneficiaire.prenom} ${c.beneficiaire.nom}`}
        />

        <View style={styles.brandCard}>
          <Text>
            Bordereau des pièces à joindre au dossier {c.fiche}. Cochez chaque
            élément avant dépôt. Le contrôle automatisé anti-refus (chronologie,
            RGE, cohérence des montants) s'ajoutera au rapport de contrôle.
          </Text>
        </View>

        <Section title="Pièces du dossier">
          {pieces.map((p) => (
            <View key={p.id} style={styles.checkItem} wrap={false}>
              <View style={styles.checkBox} />
              <View style={{ flex: 1 }}>
                <Text>
                  <Text style={styles.checkLabel}>{p.label}</Text>
                  {p.obligatoire ? <Text style={styles.badge}>  · OBLIGATOIRE</Text> : null}
                </Text>
                <Text style={styles.checkDesc}>{p.description}</Text>
              </View>
            </View>
          ))}
        </Section>

        <Section title="Mentions obligatoires — devis ET facture (à l'identique)">
          {mentionsDevis.map((m, i) => (
            <View key={i} style={styles.checkItem} wrap={false}>
              <View style={styles.checkBox} />
              <Text style={{ flex: 1 }}>{m.mention}</Text>
            </View>
          ))}
        </Section>

        <Footer />
      </Page>
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Page de garde du pack complet (PDF fusionné)
// ---------------------------------------------------------------------------
export function PackCoverDocument({
  data,
  rapport,
  cerfaTitre,
  hasVigilance,
}: {
  data: DossierComplet;
  rapport: RapportControle;
  cerfaTitre?: string;
  hasVigilance: boolean;
}) {
  const { caracteristiques: c } = data;
  const travaux = TYPES_ISOLATION[c.travaux.type_isolation];
  const conforme = rapport.conforme;

  const sommaire = [
    "Récapitulatif client — la saisie unique dont tout le pack découle",
    `Rapport de contrôle anti-refus${hasVigilance ? " (dont points de vigilance rédigés)" : ""}`,
    "Checklist de conformité — pièces à réunir et mentions obligatoires",
    cerfaTitre ?? null,
  ].filter(Boolean) as string[];

  return (
    <Document title={`Pack — ${c.beneficiaire.prenom} ${c.beneficiaire.nom}`} author="Dossimo">
      <Page size="A4" style={styles.page}>
        <Header
          docType="Pack documentaire"
          title={`${c.beneficiaire.prenom} ${c.beneficiaire.nom}`}
          subtitle={`${travaux.label} · ${c.fiche}`}
        />

        <View
          style={{
            borderRadius: 4,
            padding: 12,
            marginBottom: 16,
            backgroundColor: conforme ? COLORS.okSoft : COLORS.dangerSoft,
          }}
        >
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: 12,
              color: conforme ? COLORS.ok : COLORS.danger,
            }}
          >
            {conforme
              ? "Aucun point bloquant détecté au contrôle automatique."
              : `${rapport.nbBloquants} point(s) bloquant(s) à corriger avant dépôt.`}
          </Text>
          <Text style={{ marginTop: 3, color: COLORS.muted }}>
            {rapport.nbAvertissements > 0
              ? `${rapport.nbAvertissements} point(s) à vérifier. `
              : ""}
            Détail dans le rapport de contrôle ci-joint.
          </Text>
        </View>

        <Section title="Ce pack contient">
          {sommaire.map((titre, i) => (
            <View
              key={i}
              style={{ flexDirection: "row", gap: 8, paddingVertical: 4 }}
              wrap={false}
            >
              <Text style={{ fontFamily: "Helvetica-Bold", color: COLORS.tampon }}>
                {i + 1}.
              </Text>
              <Text style={{ flex: 1 }}>{titre}</Text>
            </View>
          ))}
        </Section>

        <View style={styles.brandCard}>
          <Text>
            Toutes les pièces de ce pack sont générées depuis la même saisie
            unique : elles sont cohérentes entre elles par construction (un écart
            devis/facture, premier motif de refus, devient structurellement
            impossible). Ce pack est une aide à la préparation : l&apos;artisan et
            son client déposent eux-mêmes le dossier auprès de l&apos;organisme
            compétent.
          </Text>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}
