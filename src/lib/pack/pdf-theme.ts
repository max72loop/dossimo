import { StyleSheet } from "@react-pdf/renderer";

import { TOKENS } from "@/design/tokens";

/**
 * Palette et styles partagés des documents du pack. Direction : bandeau encre
 * pleine largeur + filet d'accent, cartes BORDÉES (jamais de bloc plein d'une
 * seule couleur), badges contournés, sémantique portée par la bordure.
 * (React-PDF n'utilise que les polices standard : Helvetica ici.)
 *
 * Les couleurs viennent de `@/design/tokens` (source unique, cf. DESIGN.md §1) :
 * ce fichier ne recopie plus les hex à la main. Seules `onInk` et `eyebrow` sont
 * propres au PDF (texte et sur-titre sur le bandeau encre) et n'existent pas dans
 * la palette web.
 */
export const COLORS = {
  ink: TOKENS.encre,
  muted: TOKENS.ardoise,
  faint: TOKENS["encre-claire"],
  line: TOKENS.filigrane,
  paper: TOKENS.papier,
  card: TOKENS["blanc-casse"], // fond de carte
  brand: TOKENS.encre,
  onInk: "#ffffff", // spécifique PDF : texte sur bandeau encre
  eyebrow: TOKENS["accent-clair"], // sur-titre clair sur encre (accent lisible sur foncé)
  accent: TOKENS.tampon, // filet et liens (bleu de marque)
  tampon: TOKENS.tampon,
  tamponSoft: TOKENS["info-bg"],
  ok: TOKENS.succes,
  okSoft: TOKENS["succes-bg"],
  danger: TOKENS.erreur,
  dangerSoft: TOKENS["erreur-bg"],
  warn: TOKENS.avertissement,
  warnSoft: TOKENS["avertissement-bg"],
};

// Marges de page : le bandeau et le filet « débordent » via des marges
// négatives égales à ces valeurs (full-bleed).
const PAD_X = 44;
const PAD_TOP = 40;

export const styles = StyleSheet.create({
  page: {
    paddingTop: PAD_TOP,
    paddingBottom: 56,
    paddingHorizontal: PAD_X,
    fontSize: 10,
    color: COLORS.ink,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },

  // ---- Bandeau encre pleine largeur -------------------------------------
  headerBand: {
    marginTop: -PAD_TOP,
    marginHorizontal: -PAD_X,
    paddingHorizontal: PAD_X,
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: COLORS.ink,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  accentLine: {
    marginHorizontal: -PAD_X,
    height: 3,
    backgroundColor: COLORS.accent,
    marginBottom: 20,
  },
  logo: { width: 82, height: 27, objectFit: "contain", alignSelf: "flex-start", marginBottom: 12 },
  eyebrow: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.eyebrow,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  bandTitle: { fontSize: 19, fontFamily: "Helvetica-Bold", color: COLORS.onInk, lineHeight: 1.15 },
  bandSubtitle: { fontSize: 9.5, color: COLORS.eyebrow, marginTop: 5 },
  bandRight: { alignItems: "flex-end", maxWidth: 200 },
  bandRef: { fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.onInk },
  bandRefSub: { fontSize: 8.5, color: COLORS.eyebrow, marginTop: 2, textAlign: "right" },

  // ---- Sections & lignes -------------------------------------------------
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
  rowValue: { fontFamily: "Helvetica-Bold", textAlign: "right", flex: 1 },

  twoCol: { flexDirection: "row", gap: 24 },
  col: { flex: 1 },

  // ---- Cartes (fond clair + bordure, accent à gauche) --------------------
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 5,
    padding: 12,
    marginBottom: 10,
  },
  // Encadré d'accent : filet gauche coloré (jamais de fond plein saturé).
  noteCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    borderRadius: 5,
    padding: 12,
    marginBottom: 16,
  },

  // ---- Cartouches de synthèse (rapport) ----------------------------------
  statRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderLeftWidth: 3,
    borderRadius: 5,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  statNum: { fontSize: 17, fontFamily: "Helvetica-Bold" },
  statLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 1,
  },

  // ---- Bannière (bordée, pas de bloc plein) ------------------------------
  banner: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderRadius: 5,
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 16,
  },
  bannerTitle: { fontSize: 12, fontFamily: "Helvetica-Bold" },

  // ---- Constat (carte bordée + filet gauche coloré) ----------------------
  finding: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderLeftWidth: 3,
    borderRadius: 5,
    padding: 10,
    marginBottom: 8,
  },
  findingHead: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 3 },
  findingCat: { fontSize: 8, color: COLORS.muted },
  findingTitle: { fontFamily: "Helvetica-Bold" },
  findingDetail: { color: COLORS.muted, marginTop: 2 },
  // Badge CONTOURNÉ : bordure + texte colorés, fond transparent.
  sevBadge: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
    textAlign: "center",
  },

  // ---- Checklist ---------------------------------------------------------
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
  badge: { fontSize: 7, color: COLORS.ok, fontFamily: "Helvetica-Bold" },

  aiNote: { fontSize: 8, color: COLORS.muted, marginTop: 4, marginBottom: 8 },
  aiPoste: { fontFamily: "Helvetica", color: COLORS.muted },

  footer: {
    position: "absolute",
    bottom: 24,
    left: PAD_X,
    right: PAD_X,
    fontSize: 7.5,
    color: COLORS.faint,
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: COLORS.line,
    paddingTop: 8,
  },
});
