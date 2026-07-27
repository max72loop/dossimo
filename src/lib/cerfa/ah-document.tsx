import { Document, Image, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import { logoNuit } from "@/lib/pack/logo";

import type { DossierComplet } from "@/lib/dossier/get-dossier";
import { LOGEMENT_TYPES, posteLabel } from "@/lib/dossier/cee-isolation";
import { lignesTechniques } from "@/lib/dossier/geste-technique";
import { dateFr, euro } from "@/lib/pack/format";
import { COLORS, styles } from "@/lib/pack/pdf-theme";
import { DISCLAIMER_DOSSIMO } from "@/lib/legal/mentions";

const DISCLAIMER = `${DISCLAIMER_DOSSIMO} Document de préparation : ce n'est pas une attestation sur l'honneur, ne le signez pas et ne le déposez pas.`;

/**
 * FICHE DE PRÉPARATION de l'attestation sur l'honneur CEE — pas une AH.
 *
 * Dossimo ne reproduit PAS l'AH, et c'est une contrainte de droit, pas un choix
 * de prudence. Annexe 7 de l'arrêté du 4 septembre 2014 modifié : « aucune
 * modification du contenu et de l'organisation de l'attestation sur l'honneur
 * n'est autorisée », hors les éléments que le demandeur (l'obligé) dactylographie
 * lui-même — sa raison sociale, son SIREN, sa mention CNIL. L'AH vierge naît donc
 * chez l'obligé et nulle part ailleurs (revue du 2026-07-25, CHANGELOG-cerfa.md).
 *
 * Ce document rassemble les valeurs issues de la saisie unique pour que l'artisan
 * les reporte sur l'AH de son obligé sans se contredire d'une pièce à l'autre.
 * D'où l'absence délibérée de cadres A/B/C, d'engagement sur l'honneur et de
 * zones de signature : leur présence rendrait la confusion possible.
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

function Bloc({ title, children }: { title: string; children: React.ReactNode }) {
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

export function PreparationAhDocument({
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
          : geste === "solaire_thermique"
            ? "nature de l'appoint et du fluide, surface hors-tout des capteurs, efficacité énergétique ECS, nombre et capacité des ballons, certification des capteurs, marque et référence de l'équipement"
            : "surface, résistance thermique, marque et référence de l'isolant";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBand}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            {/* @react-pdf/renderer n'expose pas d'équivalent typé de `alt`. */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={logoNuit()} style={styles.logo} />
            <Text style={styles.eyebrow}>Document de travail Dossimo</Text>
            <Text style={styles.bandTitle}>Préparer votre attestation sur l&apos;honneur</Text>
            <Text style={styles.bandSubtitle}>CEE · {templateRef.ficheRef ?? c.fiche}</Text>
          </View>
          <View style={styles.bandRight}>
            <Text style={styles.bandRef}>Ne pas signer</Text>
            <Text style={styles.bandRefSub}>ne pas déposer</Text>
          </View>
        </View>
        <View style={styles.accentLine} />

        <Text style={s.intro}>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>
            Ceci n&apos;est pas une attestation sur l&apos;honneur.
          </Text>{" "}
          L&apos;AH ne peut être émise que par votre obligé : {templateRef.arrete} lui
          réserve la partie « demandeur » (raison sociale, SIREN, mention CNIL) et
          interdit toute modification du contenu et de l&apos;organisation du modèle.
          Demandez-lui la sienne. Cette fiche rassemble les valeurs exactes à y
          reporter, telles qu&apos;elles figurent sur le devis, la facture et le reste
          du pack : c&apos;est ce qui vous évite l&apos;incohérence entre pièces.
        </Text>

        <Bloc title="Opération et logement">
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
        </Bloc>

        <Bloc title="Bénéficiaire">
          <Field label="Nom et prénom (ou raison sociale)" value={`${b.prenom} ${b.nom}`} />
          <Field label="Adresse des travaux" value={`${b.adresse}, ${b.code_postal} ${b.commune}`} />
          <Field label="Téléphone" value={b.telephone ?? "—"} />
          <Field label="Courriel" value={b.email ?? "—"} />
        </Bloc>

        <Bloc title="Professionnel ayant réalisé les travaux">
          <Field label="Raison sociale" value={data.artisan?.entreprise ?? "—"} />
          <Field label="N° SIRET" value={data.artisan?.siret ?? "—"} />
          <Field label="Qualification RGE (n° et domaine)" value={`${c.rge.numero} — ${c.rge.domaine}`} />
          <Field label="RGE valable jusqu'au" value={dateFr(c.rge.date_fin)} />
        </Bloc>

        {/* Cadre A des six fiches. Bloc rendu seulement si une sous-traitance a
            été déclarée : l'afficher vide sur les autres dossiers ferait croire
            à une information manquante. */}
        {c.sous_traitant && (
          <Bloc title="Sous-traitant titulaire du signe de qualité">
            <Text style={{ fontSize: 8.5, color: COLORS.muted, marginBottom: 6 }}>
              À reporter au cadre A : le professionnel titulaire du signe de
              qualité ayant réalisé l&apos;opération, puisqu&apos;il n&apos;est pas
              le signataire de l&apos;attestation.
            </Text>
            <Field label="Nom" value={c.sous_traitant.nom} />
            <Field label="Prénom" value={c.sous_traitant.prenom} />
            <Field label="Raison sociale" value={c.sous_traitant.raison_sociale} />
            <Field label="N° SIRET" value={c.sous_traitant.siret} />
          </Bloc>
        )}

        {templateRef.variant === "p6" && (
          <Bloc title="Coût de l'opération et aides publiques">
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
          </Bloc>
        )}

        {/* Pas d'engagement sur l'honneur ni de zone de signature : ce document
            n'est pas l'AH, et lui en donner l'apparence serait le piège même que
            la requalification cherche à supprimer. À la place, la marche à suivre. */}
        <Bloc title="Ce qu'il vous reste à faire">
          {[
            "Demandez à votre obligé (le financeur qui verse la prime) son attestation sur l'honneur pour cette opération. Lui seul peut l'émettre : elle porte sa raison sociale, son SIREN et sa mention CNIL.",
            "Reportez-y les valeurs ci-dessus à l'identique. Elles sont déjà cohérentes avec le devis, la facture et le reste du pack.",
            `Vérifiez en particulier les caractéristiques techniques (${caractEngagement}) : un écart entre l'attestation, le devis et la facture est un motif de refus classique.`,
            "Si l'AH de votre obligé est un PDF à champs, téléversez-la dans Dossimo : le report se fait automatiquement.",
            "Faites dater et signer l'AH de façon manuscrite par le bénéficiaire ET par vous. Signature originale, aucune rature, surcharge ni blanc correcteur.",
          ].map((txt, i) => (
            <View style={s.engage} key={i}>
              <Text style={s.engageNum}>{i + 1}.</Text>
              <Text style={s.engageText}>{txt}</Text>
            </View>
          ))}

          <Text style={s.note}>
            Ne signez pas et ne déposez pas la présente fiche : elle n&apos;a aucune
            valeur d&apos;attestation. Seule l&apos;AH de votre obligé est recevable.
          </Text>
        </Bloc>

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
