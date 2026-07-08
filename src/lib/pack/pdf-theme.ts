import { StyleSheet } from "@react-pdf/renderer";

/**
 * Palette et styles partagés des documents du pack. Alignés sur la direction
 * artistique « Atelier Conforme » : encre, terre cuite, bleu tampon, sémantiques.
 * (React-PDF n'utilise que les polices standard : Helvetica ici.)
 */
export const COLORS = {
  ink: "#16202b", // encre
  muted: "#5b636d", // ardoise
  line: "#e2ddd1", // filigrane
  brand: "#16202b", // mot-signe encre (documents monochromes)
  tampon: "#35507f", // bleu de marque (titres de section, info)
  tamponSoft: "#e9edf4",
  ok: "#2d6a4f", // succès
  okSoft: "#e7f1ea",
  danger: "#9b2c2c", // erreur
  dangerSoft: "#f6e9e6",
  warn: "#a8730b", // vigilance
  warnSoft: "#f6eed6",
};

export const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontSize: 10,
    color: COLORS.ink,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingBottom: 12,
    marginBottom: 18,
  },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold", color: COLORS.brand },
  docType: { fontSize: 9, color: COLORS.muted, marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  title: { fontSize: 15, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  subtitle: { fontSize: 10, color: COLORS.muted },

  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.tampon,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.line,
    paddingVertical: 3,
  },
  rowLabel: { color: COLORS.muted, flex: 1 },
  rowValue: {
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    flex: 1,
  },

  twoCol: { flexDirection: "row", gap: 24 },
  col: { flex: 1 },

  card: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
  },
  brandCard: {
    backgroundColor: COLORS.tamponSoft,
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },

  checkItem: { flexDirection: "row", marginBottom: 10, gap: 8 },
  checkBox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: COLORS.muted,
    borderRadius: 2,
    marginTop: 1,
  },
  checkLabel: { fontFamily: "Helvetica-Bold" },
  checkDesc: { color: COLORS.muted, marginTop: 1 },
  badge: {
    fontSize: 7,
    color: COLORS.ok,
    fontFamily: "Helvetica-Bold",
  },

  banner: {
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  bannerTitle: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  finding: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.line,
  },
  sevBadge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    width: 58,
    textAlign: "center",
  },
  findingTitle: { fontFamily: "Helvetica-Bold" },
  findingDetail: { color: COLORS.muted, marginTop: 1 },

  aiNote: { fontSize: 8, color: COLORS.muted, marginTop: 4, marginBottom: 8 },
  aiPoste: { fontFamily: "Helvetica", color: COLORS.muted },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    fontSize: 7.5,
    color: COLORS.muted,
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: COLORS.line,
    paddingTop: 8,
  },
});
