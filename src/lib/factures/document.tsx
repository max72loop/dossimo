import { Document, Image, Page, Text, View } from "@react-pdf/renderer";

import { euro, dateFr } from "@/lib/pack/format";
import { logoNuit } from "@/lib/pack/logo";
import { COLORS, styles } from "@/lib/pack/pdf-theme";
import { editeur } from "@/lib/legal/editeur";
import { DISCLAIMER_DOSSIMO } from "@/lib/legal/mentions";
import type { FactureComplete } from "@/lib/factures/get-facture";

const cents = (c: number) => euro(c / 100);

const DISCLAIMER = DISCLAIMER_DOSSIMO;

function Partie({
  titre,
  lignes,
}: {
  titre: string;
  lignes: (string | null)[];
}) {
  return (
    <View style={styles.col}>
      <Text style={styles.sectionTitle}>{titre}</Text>
      <View style={styles.card}>
        {lignes.filter(Boolean).map((l, i) => (
          <Text key={i} style={{ marginBottom: 1.5, fontFamily: i === 0 ? "Helvetica-Bold" : "Helvetica" }}>
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

/**
 * Facture. Le vendeur est lu dans `editeur` (entité unique) ; l'acheteur et les
 * lignes viennent de l'instantané figé en base à l'émission — une facture ne
 * change pas quand l'artisan met à jour sa fiche.
 */
export function FactureDocument({ data }: { data: FactureComplete }) {
  const { facture, acheteur, lignes } = data;
  const avecTva = facture.total_tva_cents > 0;

  const villeAcheteur = [acheteur.code_postal, acheteur.ville]
    .filter(Boolean)
    .join(" ");

  return (
    <Document
      title={`Facture ${facture.numero}`}
      author={editeur.nomCommercial}
      subject={`Facture ${facture.numero}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBand}>
          <View style={{ flex: 1, paddingRight: 12 }}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- React-PDF ne supporte pas `alt`. */}
          <Image src={logoNuit()} style={styles.logo} />
            <Text style={styles.eyebrow}>Facture</Text>
            <Text style={styles.bandTitle}>{facture.numero}</Text>
            <Text style={styles.bandSubtitle}>
              Émise le {dateFr(facture.emise_le)}
            </Text>
          </View>
          <View style={styles.bandRight}>
            <Text style={styles.bandRef}>{cents(facture.total_ttc_cents)}</Text>
            <Text style={styles.bandRefSub}>Payé</Text>
          </View>
        </View>
        <View style={styles.accentLine} />

        {/* Vendeur / acheteur : identités et SIRET des deux parties. */}
        <View style={[styles.twoCol, { marginBottom: 16 }]}>
          <Partie
            titre="Émetteur"
            lignes={[
              editeur.raisonSociale,
              editeur.formeJuridique,
              editeur.adresse,
              `SIRET ${editeur.siret}`,
              editeur.rcs,
              editeur.emailContact,
            ]}
          />
          <Partie
            titre="Client"
            lignes={[
              acheteur.entreprise,
              [acheteur.prenom, acheteur.nom].filter(Boolean).join(" ") || null,
              acheteur.adresse,
              villeAcheteur || null,
              acheteur.siret ? `SIRET ${acheteur.siret}` : null,
              acheteur.email,
            ]}
          />
        </View>

        {/* Lignes de prestation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prestation</Text>
          {lignes.map((l, i) => (
            <View key={i} style={styles.finding}>
              <Text style={styles.findingTitle}>{l.designation}</Text>
              <Text style={styles.findingDetail}>{l.detail}</Text>
              <View style={[styles.row, { borderBottomWidth: 0, marginTop: 4 }]}>
                <Text style={styles.rowLabel}>
                  {l.quantite} × {cents(l.pu_ht_cents)}
                </Text>
                <Text style={styles.rowValue}>{cents(l.total_ht_cents)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totaux. En franchise en base, HT = TTC : une seule ligne suffit,
            afficher « HT » puis « TTC » pour le même montant sème le doute. */}
        <View style={[styles.section, { alignItems: "flex-end" }]}>
          <View style={{ width: 240 }}>
            {avecTva ? (
              <>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Total HT</Text>
                  <Text style={styles.rowValue}>{cents(facture.total_ht_cents)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>TVA {facture.tva_taux} %</Text>
                  <Text style={styles.rowValue}>{cents(facture.total_tva_cents)}</Text>
                </View>
              </>
            ) : null}
            <View style={[styles.row, { borderBottomWidth: 0, marginTop: 2 }]}>
              <Text style={[styles.rowLabel, { fontFamily: "Helvetica-Bold", color: COLORS.ink }]}>
                {avecTva ? "Total TTC" : "Total à payer"}
              </Text>
              <Text style={[styles.rowValue, { fontSize: 13 }]}>
                {cents(facture.total_ttc_cents)}
              </Text>
            </View>
          </View>
        </View>

        {/* Mention de TVA figée à l'émission, et conditions de règlement B2B. */}
        <View style={styles.noteCard}>
          <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 3 }}>
            {facture.mention_tva}
          </Text>
          <Text style={{ color: COLORS.muted }}>{editeur.reglement.conditions}</Text>
          <Text style={{ color: COLORS.muted }}>{editeur.reglement.escompte}</Text>
          <Text style={{ color: COLORS.muted }}>{editeur.reglement.penalites}</Text>
          <Text style={{ color: COLORS.muted }}>{editeur.reglement.indemnite}</Text>
        </View>

        <Text style={styles.footer} fixed>
          {DISCLAIMER}
        </Text>
      </Page>
    </Document>
  );
}
