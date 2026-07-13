import { Document, Image, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import { logoNuit } from "@/lib/pack/logo";

import type { DossierComplet } from "@/lib/dossier/get-dossier";
import { LOGEMENT_TYPES, posteLabel } from "@/lib/dossier/cee-isolation";
import { lignesTechniques } from "@/lib/dossier/geste-technique";
import { dateFr, euro } from "@/lib/pack/format";
import { COLORS, styles } from "@/lib/pack/pdf-theme";

const DISCLAIMER =
  "Dossimo — service indépendant d'aide à la préparation de dossier, non affilié à l'Anah ni à France Rénov'. Reproduction fidèle du modèle réglementaire, à faire signer avant dépôt.";

/**
 * Reproduction fidèle du modèle réglementaire de l'attestation sur l'honneur CEE
 * (fiches BAR-EN), pré-remplie depuis la saisie unique. Ce N'EST PAS un placeholder :
 * la structure (cadres A/B/C, engagement, signatures) et les mentions reprennent le
 * modèle officiel en vigueur. La date et la signature restent manuscrites (exigence
 * réglementaire : signature originale, aucune rature ni blanc correcteur).
 */

const s = StyleSheet.create({
  refLine: { fontSize: 8, color: COLORS.muted, marginTop: 2 },
  intro: {
    backgroundColor: COLORS.tamponSoft,
    borderRadius: 4,
    padding: 10,
    marginBottom: 14,
    fontSize: 8.5,
    color: COLORS.ink,
    lineHeight: 1.45,
  },
  cadre: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    marginBottom: 12,
  },
  cadreTitle: {
    backgroundColor: "#f3f1ec",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.tampon,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  cadreBody: { padding: 10 },
  field: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.line,
  },
  fieldLabel: { color: COLORS.muted, width: "42%", fontSize: 9 },
  fieldValue: { fontFamily: "Helvetica-Bold", width: "58%", fontSize: 9 },
  check: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
  box: {
    width: 11,
    height: 11,
    borderWidth: 1,
    borderColor: COLORS.muted,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  boxMark: { fontSize: 9, fontFamily: "Helvetica-Bold", color: COLORS.ink, lineHeight: 1 },
  engage: { flexDirection: "row", gap: 6, marginBottom: 5 },
  engageNum: { fontFamily: "Helvetica-Bold", color: COLORS.tampon, width: 14, fontSize: 9 },
  engageText: { flex: 1, fontSize: 9, lineHeight: 1.4 },
  sigRow: { flexDirection: "row", gap: 16, marginTop: 6 },
  sigCol: { flex: 1 },
  sigWho: { fontSize: 8.5, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  sigMeta: { fontSize: 8.5, color: COLORS.muted, marginBottom: 4 },
  sigBox: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 3,
    height: 66,
  },
  note: { fontSize: 7.5, color: COLORS.warn, marginTop: 8 },
});

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value || "—"}</Text>
    </View>
  );
}

function Cadre({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.cadre} wrap={false}>
      <Text style={s.cadreTitle}>{title}</Text>
      <View style={s.cadreBody}>{children}</View>
    </View>
  );
}

function Check({ checked, label }: { checked: boolean; label: string }) {
  return (
    <View style={s.check}>
      <View style={s.box}>{checked ? <Text style={s.boxMark}>×</Text> : null}</View>
      <Text style={{ fontSize: 9 }}>{label}</Text>
    </View>
  );
}

export interface AhRef {
  titre: string;
  arrete: string;
  version: string;
  /** Modèle d'AH : 5e période, ou 6e période (annexe 7-1 modifiée au 01/04/2026). */
  variant: "p5" | "p6";
  /** Référence de la fiche en vigueur (ex. « BAR-EN-103 vA29.2 »), issue de la règle. */
  ficheRef?: string;
}

export function AttestationHonneurDocument({
  data,
  template,
}: {
  data: DossierComplet;
  template: AhRef;
}) {
  const templateRef = template;
  const c = data.caracteristiques;
  const b = c.beneficiaire;
  const geste = c.geste ?? "isolation";
  const poste = posteLabel(c);
  const lignes = lignesTechniques(c);
  const plus2ans = new Date().getFullYear() - c.logement.annee_construction > 2;

  // Formulation de l'engagement sur les caractéristiques techniques, par geste.
  const caractEngagement =
    geste === "pac_air_eau"
      ? "ETAS, puissance, régime de température, marque et référence de l'appareil, classe du régulateur"
      : geste === "cet"
        ? "COP, profil de soutirage, volume, marque et référence de l'appareil"
        : geste === "bois"
          ? "combustible, rendement énergétique, marque et référence de l'appareil"
          : "surface, résistance thermique, marque et référence de l'isolant";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBand}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            {/* @react-pdf/renderer n'expose pas d'équivalent typé de `alt`. */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={logoNuit()} style={styles.logo} />
            <Text style={styles.eyebrow}>Reproduction du modèle réglementaire</Text>
            <Text style={styles.bandTitle}>Attestation sur l&apos;honneur</Text>
            <Text style={styles.bandSubtitle}>CEE · {templateRef.ficheRef ?? c.fiche}</Text>
          </View>
          <View style={styles.bandRight}>
            <Text style={styles.bandRef}>À imprimer et signer</Text>
            <Text style={styles.bandRefSub}>modèle {templateRef.version}</Text>
          </View>
        </View>
        <View style={styles.accentLine} />

        <Text style={s.intro}>
          Reproduction fidèle du modèle réglementaire en vigueur ({templateRef.arrete}). Les
          valeurs sont reprises de la saisie unique du dossier — cohérentes avec le devis,
          la facture et le reste du pack. À imprimer, puis <Text style={{ fontFamily: "Helvetica-Bold" }}>dater
          et signer de façon manuscrite</Text> par le bénéficiaire ET le professionnel.
        </Text>

        <Cadre title="Cadre A — Nature et caractéristiques de l'opération">
          <Field label="Opération standardisée" value={`${c.fiche} — ${poste}`} />
          <Field label="Adresse des travaux" value={b.adresse} />
          <Field label="Code postal / commune" value={`${b.code_postal} ${b.commune}`} />
          <Field label="Type de logement" value={LOGEMENT_TYPES[c.logement.type]} />
          <Field label="Année de construction" value={String(c.logement.annee_construction)} />
          <Check
            checked={plus2ans}
            label="Logement achevé depuis plus de 2 ans à la date d'engagement de l'opération"
          />
          <Field label="Date de visite préalable" value={dateFr(data.dates.visite_technique)} />
          {lignes.map((l) => (
            <Field key={l.label} label={l.label} value={l.value} />
          ))}
        </Cadre>

        <Cadre title="Cadre B — Bénéficiaire">
          <Field label="Nom et prénom (ou raison sociale)" value={`${b.prenom} ${b.nom}`} />
          <Field label="Adresse des travaux" value={`${b.adresse}, ${b.code_postal} ${b.commune}`} />
          <Field label="Téléphone" value={b.telephone ?? "—"} />
          <Field label="Courriel" value={b.email ?? "—"} />
        </Cadre>

        <Cadre title="Cadre C — Professionnel ayant réalisé les travaux">
          <Field label="Raison sociale" value={data.artisan?.entreprise ?? "—"} />
          <Field label="N° SIRET" value={data.artisan?.siret ?? "—"} />
          <Field label="Qualification RGE (n° et domaine)" value={`${c.rge.numero} — ${c.rge.domaine}`} />
          <Field label="RGE valable jusqu'au" value={dateFr(c.rge.date_fin)} />
        </Cadre>

        {templateRef.variant === "p6" && (
          <Cadre title="Cadre — Coût de l'opération et aides (6e période)">
            <Field label="Coût de l'opération (TTC, pose incluse)" value={euro(c.montants.ttc)} />
            {c.montants.aides_publiques_hors_cee == null ? (
              <View style={s.field}>
                <Text style={s.fieldLabel}>Autres aides publiques perçues (hors CEE)</Text>
                <Text style={[s.fieldValue, { color: COLORS.muted }]}>
                  à compléter : ____________
                </Text>
              </View>
            ) : (
              <Field
                label="Autres aides publiques perçues (hors CEE)"
                value={
                  c.montants.aides_publiques_hors_cee > 0
                    ? euro(c.montants.aides_publiques_hors_cee)
                    : "Aucune"
                }
              />
            )}
            <Text style={{ fontSize: 8, color: COLORS.muted, marginTop: 4 }}>
              Depuis le 01/04/2026, l&apos;attestation doit préciser le coût de
              l&apos;opération et l&apos;ensemble des aides publiques perçues (hors
              incitation CEE). Renseignez les aides éventuelles (ex. MaPrimeRénov&apos;)
              avant signature.
            </Text>
          </Cadre>
        )}

        <Cadre title="Engagement sur l'honneur">
          <Text style={{ fontSize: 9, marginBottom: 6 }}>
            Le bénéficiaire et le professionnel soussignés attestent sur l&apos;honneur que :
          </Text>
          {[
            `Les travaux décrits ci-dessus ont été réalisés à l'adresse indiquée et correspondent à l'opération standardisée ${c.fiche}.`,
            `Les caractéristiques techniques mentionnées (${caractEngagement}) sont exactes et identiques à celles portées sur le devis et sur la facture.`,
            "Le professionnel disposait, à la date d'engagement de l'opération (acceptation du devis), d'une qualification RGE en cours de validité couvrant le domaine des travaux réalisés.",
            "Les matériaux éligibles ont été fournis, installés et facturés par l'entreprise mentionnée au cadre C, ou par son sous-traitant déclaré.",
            "Aucune autre demande de certificats d'économies d'énergie n'a été sollicitée pour cette même opération.",
            ...(templateRef.variant === "p6"
              ? [
                  "Les travaux ont été effectivement réalisés et l'installation mise en service ; le bénéficiaire et le professionnel attestent de cette mise en service.",
                ]
              : []),
            "Les informations portées sur la présente attestation sont exactes ; toute fausse déclaration expose son auteur aux sanctions prévues par la loi.",
          ].map((txt, i) => (
            <View style={s.engage} key={i}>
              <Text style={s.engageNum}>{i + 1}.</Text>
              <Text style={s.engageText}>{txt}</Text>
            </View>
          ))}

          <View style={s.sigRow}>
            <View style={s.sigCol}>
              <Text style={s.sigWho}>Le bénéficiaire</Text>
              <Text style={s.sigMeta}>Fait à {b.commune}, le ____________</Text>
              <Text style={s.sigMeta}>Signature (« Lu et approuvé ») :</Text>
              <View style={s.sigBox} />
            </View>
            <View style={s.sigCol}>
              <Text style={s.sigWho}>Le professionnel</Text>
              <Text style={s.sigMeta}>Fait à ____________, le ____________</Text>
              <Text style={s.sigMeta}>Signature et cachet :</Text>
              <View style={s.sigBox} />
            </View>
          </View>

          <Text style={s.note}>
            La date et la signature doivent être renseignées de façon manuscrite (signature
            originale). Aucune rature, surcharge ni blanc correcteur : le dossier serait refusé.
          </Text>
        </Cadre>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${DISCLAIMER}   ·   Page ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
