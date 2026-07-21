import { Document, Image, Page, Text, View } from "@react-pdf/renderer";

import type { DossierComplet } from "@/lib/dossier/get-dossier";
import { logoNuit } from "@/lib/pack/logo";
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
import { dateFr, euro } from "@/lib/pack/format";
import type { FeuilleRoute, Urgence } from "@/lib/dossier/feuille-route";
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
import { DISCLAIMER_DOSSIMO_COMPLET } from "@/lib/legal/mentions";

const DISCLAIMER = DISCLAIMER_DOSSIMO_COMPLET;

/** Libellé court du dispositif pour les sur-titres. */
function dispoLabel(data: DossierComplet): string {
  return data.dossier.dispositif === "maprimerenov" ? "MaPrimeRénov'" : "CEE";
}

/**
 * Référence de pack lisible et déterministe (identifiant partagé entre toutes
 * les pièces). Format : DS-AAAA-MMJJ-XXXX (date de création + fragment d'id).
 */
export function packRef(data: DossierComplet): string {
  const iso = (data.dossier.created_at ?? "").slice(0, 10);
  const compact = iso.replace(/-/g, "");
  const d = compact.length === 8 ? `${compact.slice(0, 4)}-${compact.slice(4)}` : "0000-0000";
  const frag = String(data.dossier.id ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || "0000";
  return `DS-${d}-${frag}`;
}

// ---------------------------------------------------------------------------
// Blocs partagés
// ---------------------------------------------------------------------------
function Header({
  eyebrow,
  title,
  subtitle,
  refTop,
  refSub,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  refTop?: string;
  refSub?: string;
}) {
  return (
    <>
      <View style={styles.headerBand}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- React-PDF ne supporte pas `alt`. */}
          <Image src={logoNuit()} style={styles.logo} />
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.bandTitle}>{title}</Text>
          {subtitle ? <Text style={styles.bandSubtitle}>{subtitle}</Text> : null}
        </View>
        {refTop || refSub ? (
          <View style={styles.bandRight}>
            {refTop ? <Text style={styles.bandRef}>{refTop}</Text> : null}
            {refSub ? <Text style={styles.bandRefSub}>{refSub}</Text> : null}
          </View>
        ) : null}
      </View>
      <View style={styles.accentLine} />
    </>
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

/** Carte d'information encadrée (fond clair, filet gauche d'accent). */
function NoteCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.noteCard}>
      <Text>{children}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Récap client
// ---------------------------------------------------------------------------
export function RecapDocument({ data }: { data: DossierComplet }) {
  const { caracteristiques: c, dates, artisan } = data;
  const poste = posteLabel(c);

  return (
    <Document
      title={`Récapitulatif — ${c.beneficiaire.prenom} ${c.beneficiaire.nom}`}
      author="Dossimo"
    >
      <Page size="A4" style={styles.page}>
        <Header
          eyebrow={`Pack ${dispoLabel(data)}`}
          title="Récapitulatif client"
          subtitle={`${poste} · ${c.fiche}`}
          refTop={packRef(data)}
          refSub={`${c.beneficiaire.prenom} ${c.beneficiaire.nom}`}
        />

        <NoteCard>
          Récapitulatif des informations du chantier. Ce document reprend la
          saisie unique : toutes les pièces du dossier en découlent. Vérifiez
          chaque donnée avant génération des documents officiels.
        </NoteCard>

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

        <Section title={titreSectionTechnique(c)}>
          <Row label="Poste" value={`${poste} (${c.fiche})`} />
          {lignesTechniques(c).map((l) => (
            <Row key={l.label} label={l.label} value={l.value} />
          ))}
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
              <Row label="Prime estimée" value={euro(c.montants.prime_estime)} />
              {c.montants.aides_publiques_hors_cee != null ? (
                <Row label="Aides publiques (hors CEE)" value={euro(c.montants.aides_publiques_hors_cee)} />
              ) : null}
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
const SEV_COLORS: Record<Severite, string> = {
  bloquant: COLORS.danger,
  avertissement: COLORS.warn,
  ok: COLORS.ok,
};

const SEV_ORDER: Record<Severite, number> = { bloquant: 0, avertissement: 1, ok: 2 };

/** Libellés lisibles des catégories de contrôle (sinon le slug brut). */
const CATEGORIE_LABEL: Record<string, string> = {
  chronologie: "Chronologie",
  entreprise: "Entreprise (SIRENE)",
  rge: "Qualification RGE",
  eligibilite: "Éligibilité",
  technique: "Performance technique",
  montants: "Cohérence des montants",
  pieces: "Pièces",
};
const catLabel = (c: string) => CATEGORIE_LABEL[c] ?? c;

const AI_SEV: Record<PointVigilance["severite"], { color: string; label: string }> = {
  important: { color: COLORS.danger, label: "IMPORTANT" },
  vigilance: { color: COLORS.warn, label: "VIGILANCE" },
  info: { color: COLORS.tampon, label: "INFO" },
};

/** Badge de sévérité contourné (bordure + texte colorés, sans fond plein). */
function SevBadge({ color, children }: { color: string; children: string }) {
  return (
    <Text style={[styles.sevBadge, { color, borderColor: color }]}>{children}</Text>
  );
}

/** Cartouche de synthèse (filet gauche coloré). */
function StatCard({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={[styles.statNum, { color }]}>{n}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

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
  const poste = posteLabel(c);
  const findings = [...rapport.findings].sort(
    (a, b) => SEV_ORDER[a.severite] - SEV_ORDER[b.severite],
  );
  const nbConformes = findings.filter((f) => f.severite === "ok").length;
  const bannerColor = rapport.conforme ? COLORS.ok : COLORS.danger;

  return (
    <Document title={`Rapport de contrôle — ${c.beneficiaire.prenom} ${c.beneficiaire.nom}`} author="Dossimo">
      <Page size="A4" style={styles.page}>
        <Header
          eyebrow={`Pack ${dispoLabel(data)}`}
          title="Rapport de contrôle anti-refus"
          subtitle={`${poste} · ${c.fiche}`}
          refTop={packRef(data)}
          refSub={`${c.beneficiaire.prenom} ${c.beneficiaire.nom}`}
        />

        <View style={[styles.banner, { borderColor: bannerColor, borderLeftColor: bannerColor }]}>
          <Text style={[styles.bannerTitle, { color: bannerColor }]}>
            {rapport.conforme
              ? "Aucun point bloquant — dossier prêt à vérifier avant dépôt."
              : "Dossier non déposable en l'état."}
          </Text>
          <Text style={{ marginTop: 3, color: COLORS.muted }}>
            {rapport.conforme
              ? "Contrôle automatisé des règles dures (chronologie, RGE, éligibilité, performance, montants)."
              : `${rapport.nbBloquants} anomalie(s) bloquante(s) à corriger avant tout dépôt auprès de l'obligé.`}
          </Text>
        </View>

        <View style={styles.statRow}>
          <StatCard n={rapport.nbBloquants} label="Bloquants" color={COLORS.danger} />
          <StatCard n={rapport.nbAvertissements} label="À vérifier" color={COLORS.warn} />
          <StatCard n={nbConformes} label="Conforme" color={COLORS.ok} />
        </View>

        <Text style={styles.sectionTitle}>Points à traiter</Text>
        {findings.map((f) => {
          const color = SEV_COLORS[f.severite];
          return (
            <View key={f.code} style={[styles.finding, { borderLeftColor: color }]} wrap={false}>
              <View style={styles.findingHead}>
                <SevBadge color={color}>{SEVERITE_LABEL[f.severite].toUpperCase()}</SevBadge>
                <Text style={styles.findingCat}>{catLabel(f.categorie)}</Text>
              </View>
              <Text style={styles.findingTitle}>{f.titre}</Text>
              <Text style={styles.findingDetail}>{f.detail}</Text>
            </View>
          );
        })}

        {vigilance && vigilance.length > 0 ? (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Points de vigilance — analyse assistée</Text>
            <Text style={styles.aiNote}>
              Complément contextuel généré automatiquement, à relire. Ne remplace
              pas le contrôle de conformité ni la décision de l&apos;instructeur.
            </Text>
            {vigilance.map((p, i) => {
              const sc = AI_SEV[p.severite];
              return (
                <View key={i} style={[styles.finding, { borderLeftColor: sc.color }]} wrap={false}>
                  <View style={styles.findingHead}>
                    <SevBadge color={sc.color}>{sc.label}</SevBadge>
                    {p.poste ? <Text style={styles.findingCat}>{p.poste}</Text> : null}
                  </View>
                  <Text style={styles.findingTitle}>{p.titre}</Text>
                  <Text style={styles.findingDetail}>{p.detail}</Text>
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
  const poste = posteLabel(c);
  const pieces = piecesCeeIsolation(data);
  const mentions = mentionsObligatoires(data);
  const mentionsDevis = mentions.filter((m) => m.document === "Devis");

  return (
    <Document title={`Checklist — ${c.beneficiaire.prenom} ${c.beneficiaire.nom}`} author="Dossimo">
      <Page size="A4" style={styles.page}>
        <Header
          eyebrow={`Pack ${dispoLabel(data)}`}
          title="Checklist de conformité"
          subtitle={`${poste} · ${c.fiche}`}
          refTop={packRef(data)}
          refSub={`${c.beneficiaire.prenom} ${c.beneficiaire.nom}`}
        />

        <NoteCard>
          Bordereau des pièces à joindre au dossier {c.fiche}. Cochez chaque
          élément avant dépôt. Le contrôle automatisé anti-refus (chronologie,
          RGE, cohérence des montants) s&apos;ajoute au rapport de contrôle.
        </NoteCard>

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
function HealthRow({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
      <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 13, color, width: 16 }}>{n}</Text>
      <Text style={{ color: COLORS.muted }}>{label}</Text>
    </View>
  );
}

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
  const poste = posteLabel(c);
  const conforme = rapport.conforme;
  const nbConformes = rapport.findings.filter((f) => f.severite === "ok").length;
  const statutColor = conforme ? COLORS.ok : COLORS.danger;

  const sommaire = [
    { t: "Feuille de route de dépôt", d: "Le chemin daté et l'échéance à tenir" },
    { t: "Récapitulatif client", d: "La saisie unique dont tout le pack découle" },
    { t: "Rapport de contrôle anti-refus", d: hasVigilance ? "Dont points de vigilance rédigés" : "Règles dures : chronologie, RGE, montants" },
    { t: "Checklist de conformité", d: "Pièces à réunir et mentions obligatoires" },
    ...(cerfaTitre ? [{ t: "Attestation sur l'honneur", d: "Modèle réglementaire, à imprimer et signer" }] : []),
  ];

  return (
    <Document title={`Pack — ${c.beneficiaire.prenom} ${c.beneficiaire.nom}`} author="Dossimo">
      <Page size="A4" style={styles.page}>
        <Header
          eyebrow={`Pack documentaire ${dispoLabel(data)}`}
          title={poste}
          subtitle={`Fiche ${data.regle?.versionFormulaire ?? c.fiche}`}
          refTop={packRef(data)}
          refSub={`${c.beneficiaire.prenom} ${c.beneficiaire.nom}`}
        />

        <View style={styles.twoCol}>
          {/* Santé du dossier */}
          <View style={{ width: 190 }}>
            <View style={[styles.card, { marginBottom: 0 }]}>
              <Text style={styles.sectionTitle}>Santé du dossier</Text>
              <Text
                style={{
                  alignSelf: "flex-start",
                  fontFamily: "Helvetica-Bold",
                  fontSize: 9.5,
                  color: statutColor,
                  borderWidth: 1,
                  borderColor: statutColor,
                  borderRadius: 12,
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                  marginTop: 2,
                }}
              >
                {conforme ? "Prêt à vérifier" : "Non déposable"}
              </Text>
              <HealthRow n={rapport.nbBloquants} label="points bloquants" color={COLORS.danger} />
              <HealthRow n={rapport.nbAvertissements} label="à vérifier" color={COLORS.warn} />
              <HealthRow n={nbConformes} label="conformes" color={COLORS.ok} />
            </View>
          </View>

          {/* Identité du dossier */}
          <View style={styles.col}>
            <Row label="Bénéficiaire" value={`${c.beneficiaire.prenom} ${c.beneficiaire.nom}`} />
            <Row label="Logement" value={`${c.beneficiaire.adresse}, ${c.beneficiaire.code_postal} ${c.beneficiaire.commune}`} />
            <Row label="Profil" value={`${OCCUPATIONS[c.beneficiaire.occupation]} · ${PRECARITES[c.beneficiaire.precarite]}`} />
            <Row label="Opération" value={`${poste} (${c.fiche})`} />
            <Row label="N° de pack" value={packRef(data)} />
            <Row label="Préparé le" value={dateFr(data.dossier.created_at?.slice(0, 10) ?? null)} />
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Composition du pack</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {sommaire.map((s, i) => (
              <View
                key={i}
                style={[styles.card, { flex: 1, marginBottom: 0 }]}
                wrap={false}
              >
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 15, color: COLORS.accent }}>
                  {i + 1}
                </Text>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9.5, marginTop: 4 }}>{s.t}</Text>
                <Text style={{ fontSize: 8, color: COLORS.muted, marginTop: 2 }}>{s.d}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          <NoteCard>
            Toutes les pièces de ce pack sont générées depuis la même saisie
            unique : elles sont cohérentes entre elles par construction (un écart
            devis/facture, premier motif de refus, devient structurellement
            impossible). Ce pack est une aide à la préparation : l&apos;artisan et
            son client déposent eux-mêmes le dossier auprès de l&apos;organisme
            compétent.
          </NoteCard>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Attestation de pré-contrôle
// ---------------------------------------------------------------------------
export function AttestationControleDocument({
  data,
  rapport,
  dateControle,
}: {
  data: DossierComplet;
  rapport: RapportControle;
  /** Date de délivrance de l'attestation (ISO yyyy-mm-dd). */
  dateControle: string;
}) {
  const { caracteristiques: c } = data;
  const poste = posteLabel(c);
  const conforme = rapport.conforme;
  const total = rapport.findings.length;
  const verdictColor = conforme ? COLORS.ok : COLORS.danger;

  // Regroupement des points de contrôle par famille : une famille est « passée »
  // si elle ne porte aucun point bloquant.
  const familles = new Map<string, { n: number; bloquants: number }>();
  for (const f of rapport.findings) {
    const e = familles.get(f.categorie) ?? { n: 0, bloquants: 0 };
    e.n += 1;
    if (f.severite === "bloquant") e.bloquants += 1;
    familles.set(f.categorie, e);
  }

  return (
    <Document
      title={`Attestation de pré-contrôle — ${c.beneficiaire.prenom} ${c.beneficiaire.nom}`}
      author="Dossimo"
    >
      <Page size="A4" style={styles.page}>
        <Header
          eyebrow={`Attestation de pré-contrôle · ${dispoLabel(data)}`}
          title={conforme ? "Dossier vérifié, aucun point bloquant." : "Dossier non déposable en l'état."}
          subtitle={`${poste} · ${c.fiche} · ${c.beneficiaire.prenom} ${c.beneficiaire.nom}`}
          refTop={packRef(data)}
          refSub={`Délivrée le ${dateFr(dateControle)}`}
        />

        <View style={{ flexDirection: "row", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, lineHeight: 1.5 }}>
              Dossimo atteste avoir soumis ce dossier à son{" "}
              <Text style={{ fontFamily: "Helvetica-Bold" }}>
                contrôle de conformité anti-refus
              </Text>{" "}
              avant tout dépôt, et{" "}
              {conforme ? (
                <Text>
                  n&apos;avoir relevé{" "}
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>
                    aucun point bloquant
                  </Text>{" "}
                  sur les {total} points contrôlés.
                </Text>
              ) : (
                <Text>
                  avoir relevé{" "}
                  <Text style={{ fontFamily: "Helvetica-Bold", color: COLORS.danger }}>
                    {rapport.nbBloquants} point(s) bloquant(s)
                  </Text>{" "}
                  à corriger avant tout dépôt.
                </Text>
              )}
            </Text>
          </View>
          {/* Cachet : cadre double, sémantique par la bordure. */}
          <View
            style={{
              width: 150,
              borderWidth: 2,
              borderColor: verdictColor,
              borderRadius: 4,
              paddingVertical: 8,
              paddingHorizontal: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: verdictColor, letterSpacing: 1, borderBottomWidth: 0.5, borderBottomColor: verdictColor, paddingBottom: 3, marginBottom: 4, textAlign: "center" }}>
              DOSSIMO · CONTRÔLE
            </Text>
            <Text style={{ fontSize: 17, fontFamily: "Helvetica-Bold", color: verdictColor, letterSpacing: 1 }}>
              {conforme ? "CONFORME" : "À CORRIGER"}
            </Text>
            <Text style={{ fontSize: 7.5, color: verdictColor, marginTop: 3 }}>
              {rapport.nbBloquants} bloquant · {dateFr(dateControle)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Familles de contrôle</Text>
        <View style={{ marginBottom: 16 }}>
          {[...familles.entries()].map(([cat, e]) => (
            <View
              key={cat}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingVertical: 5,
                borderBottomWidth: 0.5,
                borderBottomColor: COLORS.line,
              }}
              wrap={false}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: e.bloquants === 0 ? COLORS.ok : COLORS.danger,
                }}
              />
              <Text style={{ flex: 1, fontFamily: "Helvetica-Bold" }}>{catLabel(cat)}</Text>
              <Text style={{ fontSize: 9, color: COLORS.muted }}>
                {e.n} point{e.n > 1 ? "s" : ""}
                {e.bloquants > 0 ? ` · ${e.bloquants} bloquant(s)` : ""}
              </Text>
            </View>
          ))}
        </View>

        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8.5, color: COLORS.muted }}>
          Contrôle automatisé Dossimo · {packRef(data)} · {dateFr(dateControle)}
        </Text>

        <View style={{ marginTop: 14 }}>
          <View style={[styles.banner, { borderColor: COLORS.ink, borderLeftColor: COLORS.ink }]}>
            <Text style={{ fontSize: 9, color: COLORS.muted, lineHeight: 1.5 }}>
              Cette attestation certifie le{" "}
              <Text style={{ fontFamily: "Helvetica-Bold", color: COLORS.ink }}>
                passage du contrôle Dossimo
              </Text>
              . Elle ne vaut pas accord de l&apos;Anah, de France Rénov&apos; ni de
              l&apos;obligé : la décision finale appartient à l&apos;instructeur.
            </Text>
          </View>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Feuille de route de dépôt
// ---------------------------------------------------------------------------
const URGENCE_COLOR: Record<Urgence, string> = {
  depasse: COLORS.danger,
  proche: COLORS.warn,
  calme: COLORS.tampon,
};

export function FeuilleRouteDocument({
  data,
  feuille,
  pieces,
}: {
  data: DossierComplet;
  feuille: FeuilleRoute;
  pieces?: { reunies: number; total: number; manquantes: string[] };
}) {
  const { caracteristiques: c } = data;
  const poste = posteLabel(c);
  const ech = feuille.prochaine?.echeance ?? null;
  const echColor = ech ? URGENCE_COLOR[ech.urgence] : COLORS.tampon;

  return (
    <Document
      title={`Feuille de route — ${c.beneficiaire.prenom} ${c.beneficiaire.nom}`}
      author="Dossimo"
    >
      <Page size="A4" style={styles.page}>
        <Header
          eyebrow={`Feuille de route de dépôt · ${dispoLabel(data)}`}
          title={poste}
          subtitle={`${c.fiche} · ${c.beneficiaire.commune}`}
          refTop={packRef(data)}
          refSub={`${c.beneficiaire.prenom} ${c.beneficiaire.nom}`}
        />

        <NoteCard>
          Le chemin de ce dossier, daté depuis votre saisie, et l&apos;échéance
          légale qui en découle. Dossimo ne dépose jamais : cette feuille dit quoi
          faire, avec qui, et avant quand.
        </NoteCard>

        <Text style={styles.sectionTitle}>Le chemin du dossier</Text>
        <View style={{ marginBottom: 14 }}>
          {feuille.etapes.map((e, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                gap: 10,
                alignItems: "flex-start",
                paddingVertical: 5,
                borderBottomWidth: 0.5,
                borderBottomColor: COLORS.line,
              }}
              wrap={false}
            >
              <Text style={{ width: 68, fontSize: 9, color: COLORS.muted }}>
                {e.date ? dateFr(e.date) : "à venir"}
              </Text>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  marginTop: 3,
                  backgroundColor: e.fait ? COLORS.ok : COLORS.card,
                  borderWidth: e.fait ? 0 : 1,
                  borderColor: COLORS.faint,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "Helvetica-Bold",
                    color: e.fait ? COLORS.muted : COLORS.ink,
                  }}
                >
                  {e.titre}
                </Text>
                {e.detail ? (
                  <Text style={{ fontSize: 8.5, color: COLORS.muted, marginTop: 1 }}>
                    {e.detail}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {feuille.prochaine ? (
          <View
            style={[styles.banner, { borderColor: echColor, borderLeftColor: echColor }]}
            wrap={false}
          >
            <Text style={styles.sectionTitle}>À faire maintenant</Text>
            <Text style={[styles.bannerTitle, { color: COLORS.ink }]}>
              {feuille.prochaine.titre}
            </Text>
            {ech ? (
              <Text style={{ marginTop: 4, fontFamily: "Helvetica-Bold", color: echColor }}>
                {ech.urgence === "depasse"
                  ? `Échéance dépassée depuis ${Math.abs(ech.joursRestants)} jour(s) · le ${dateFr(ech.date)}`
                  : `Plus que ${ech.joursRestants} jour(s) · avant le ${dateFr(ech.date)}`}
              </Text>
            ) : null}
            <Text style={{ marginTop: 4, color: COLORS.muted }}>
              {feuille.prochaine.detail}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 8.5, color: COLORS.tampon }}>
              {feuille.prochaine.qui}
            </Text>
          </View>
        ) : null}

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>À transmettre à</Text>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12 }}>
                {feuille.destinataire}
              </Text>
              <Text style={{ fontSize: 8.5, color: COLORS.muted, marginTop: 3 }}>
                {feuille.destinataireDetail}
              </Text>
            </View>
          </View>
          {pieces ? (
            <View style={styles.col}>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Pièces réunies</Text>
                <Text
                  style={{
                    fontFamily: "Helvetica-Bold",
                    fontSize: 12,
                    color: pieces.reunies >= pieces.total ? COLORS.ok : COLORS.warn,
                  }}
                >
                  {pieces.reunies} / {pieces.total} obligatoires
                </Text>
                {pieces.manquantes.length > 0 ? (
                  <Text style={{ fontSize: 8.5, color: COLORS.muted, marginTop: 3 }}>
                    Manque : {pieces.manquantes.join(", ")}
                  </Text>
                ) : (
                  <Text style={{ fontSize: 8.5, color: COLORS.muted, marginTop: 3 }}>
                    Toutes les pièces obligatoires sont réunies.
                  </Text>
                )}
              </View>
            </View>
          ) : null}
        </View>

        <Footer />
      </Page>
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Fiche client (bénéficiaire)
// ---------------------------------------------------------------------------
const ETAPES_CLIENT: Record<
  "cee" | "maprimerenov",
  { titre: string; detail: string; flag?: string }[]
> = {
  maprimerenov: [
    {
      titre: "Déposez votre demande sur maprimerenov.gouv.fr",
      detail:
        "La demande doit être faite, et acceptée, avant que le chantier commence. Votre dossier est déjà prêt : il n'y a qu'à le déposer.",
      flag: "avant les travaux",
    },
    {
      titre: "Attendez l'accord de l'Anah",
      detail:
        "Votre artisan ne démarre les travaux qu'une fois votre accord reçu. C'est ce qui protège votre prime.",
    },
    {
      titre: "Après les travaux, déposez votre facture",
      detail:
        "Ce dernier geste déclenche le versement de la prime sur votre compte.",
    },
  ],
  cee: [
    {
      titre: "Vous n'avez aucun dépôt à faire",
      detail: "Votre artisan transmet le dossier complet au financeur (l'obligé).",
    },
    {
      titre: "Signez l'attestation sur l'honneur",
      detail:
        "Votre artisan vous la présente : datez et signez à la main, sans rature ni blanc correcteur.",
    },
    {
      titre: "La prime vous revient",
      detail: "Selon les modalités de l'offre signée avec le financeur.",
    },
  ],
};

export function FicheClientDocument({
  data,
  primeMontant,
  pieces,
}: {
  data: DossierComplet;
  primeMontant: number | null;
  pieces: { titre: string; deposee: boolean }[];
}) {
  const { caracteristiques: c, artisan } = data;
  const poste = posteLabel(c);
  const entreprise = artisan?.entreprise ?? "votre artisan";
  const dispositif =
    data.dossier.dispositif === "maprimerenov" ? "maprimerenov" : "cee";
  const etapes = ETAPES_CLIENT[dispositif];

  return (
    <Document
      title={`Votre dossier — ${c.beneficiaire.prenom} ${c.beneficiaire.nom}`}
      author="Dossimo"
    >
      <Page size="A4" style={styles.page}>
        <Header
          eyebrow={`Votre dossier · ${dispoLabel(data)}`}
          title={`Bonjour ${c.beneficiaire.prenom}, votre dossier est prêt.`}
          subtitle={`${poste} · préparé pour vous par ${entreprise}`}
          refTop={entreprise}
          refSub="votre artisan RGE"
        />

        <View
          style={[
            styles.card,
            { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
          ]}
        >
          <View>
            <Text style={styles.sectionTitle}>Montant estimé de votre prime</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 26, color: COLORS.ok }}>
              {primeMontant != null ? euro(primeMontant) : "à confirmer"}
            </Text>
          </View>
          <Text style={{ fontSize: 8.5, color: COLORS.muted, maxWidth: 190, textAlign: "right" }}>
            Versée sur votre compte, à vous. Estimation indicative : elle ne vaut
            pas notification de la prime.
          </Text>
        </View>

        <View style={{ marginTop: 6 }}>
          <Text style={styles.sectionTitle}>Ce qu&apos;il vous reste à faire</Text>
          {etapes.map((e, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 10, marginBottom: 8 }} wrap={false}>
              <Text style={{ width: 16, fontFamily: "Helvetica-Bold", color: COLORS.tampon }}>
                {i + 1}
              </Text>
              <View style={{ flex: 1 }}>
                <Text>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>{e.titre}</Text>
                  {e.flag ? (
                    <Text style={{ color: COLORS.warn, fontFamily: "Helvetica-Bold" }}>
                      {"  "}({e.flag})
                    </Text>
                  ) : null}
                </Text>
                <Text style={{ fontSize: 9, color: COLORS.muted, marginTop: 1 }}>{e.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        {pieces.length > 0 ? (
          <View style={{ marginTop: 6 }}>
            <Text style={styles.sectionTitle}>Vos pièces</Text>
            {pieces.map((p, i) => (
              <View key={i} style={styles.checkItem} wrap={false}>
                <View
                  style={[
                    styles.checkBox,
                    p.deposee ? { backgroundColor: COLORS.ok, borderColor: COLORS.ok } : {},
                  ]}
                />
                <Text style={{ flex: 1 }}>
                  {p.titre}
                  {p.deposee ? <Text style={styles.badge}>  · reçue</Text> : null}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[styles.noteCard, { marginTop: 12 }]}>
          <Text>
            {entreprise} a fait vérifier la conformité de votre dossier par Dossimo,
            un service indépendant, avant tout dépôt. Vous gardez votre artisan et
            l&apos;intégralité de votre prime. Dossimo ne dépose pas votre dossier
            et ne touche jamais votre prime.
          </Text>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}
