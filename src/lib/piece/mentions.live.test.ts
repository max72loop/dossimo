import { readFileSync, existsSync } from "node:fs";

import { describe, it, expect } from "vitest";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { verifierMentions } from "@/lib/piece/mentions";
import { preparerDocument } from "@/lib/piece/document";

/**
 * Test d'INTÉGRATION de la passe « mentions » : il appelle vraiment le VLM.
 *
 * Les tests de `controle-pieces.test.ts` vérifient le JUGEMENT (une mention absente
 * vaut refus). Celui-ci vérifie le CONSTAT : le modèle sait-il réellement voir qu'une
 * mention manque d'un devis ? C'est le seul maillon qu'aucun test pur ne peut couvrir,
 * et le seul endroit où le prompt est mis à l'épreuve.
 *
 * Ignoré automatiquement sans `OPENROUTER_API_KEY` (donc en CI et pour qui n'a pas de
 * clé) : `npm test` reste vert et hors ligne. Pour le lancer :
 *
 *     OPENROUTER_API_KEY=sk-... npx vitest run src/lib/piece/mentions.live.test.ts
 *
 * (la clé est aussi lue depuis `.env.local` si elle s'y trouve).
 */

// Vitest ne charge pas .env.local : on le lit nous-mêmes, sans dépendance.
if (!process.env.OPENROUTER_API_KEY && existsSync(".env.local")) {
  for (const ligne of readFileSync(".env.local", "utf8").split("\n")) {
    const m = ligne.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

// Une clé locale ne doit pas rendre `npm test` non déterministe ni consommer du
// crédit API. Le test réel est opt-in : RUN_LIVE_LLM_TESTS=1 npm run test.
const CLE = process.env.RUN_LIVE_LLM_TESTS === "1" && !!process.env.OPENROUTER_API_KEY;

/** Les 6 mentions exigées par la fiche BAR-EN-101, interpolées pour ce dossier. */
const MENTIONS_EXIGEES = [
  "Fiche CEE : BAR-EN-101",
  "Marque et référence de l'isolant posé",
  "Surface isolée : 95 m²",
  "Résistance thermique R = 7.5 m²·K/W",
  "Certification de l'isolant (ACERMI ou équivalent)",
  "Mention de la qualification RGE (n° et domaine)",
];

/**
 * Devis PIÉGÉ, fabriqué pour que chaque statut soit atteignable :
 *  — fiche, marque/référence, surface, RGE : présents         → « presente »
 *  — résistance R : le devis porte 6,5 là où le dossier dit 7.5 → « divergente »
 *  — certification ACERMI : ABSENTE du document                → « absente »
 * Si le modèle rend « tout présent », le prompt ne protège personne.
 */
async function devisPiege(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const police = await pdf.embedFont(StandardFonts.Helvetica);
  const gras = await pdf.embedFont(StandardFonts.HelveticaBold);

  const lignes: [string, boolean][] = [
    ["DEVIS N° 2026-0412", true],
    ["", false],
    ["Isolation Martin SARL — SIRET 12345678900012", false],
    ["Qualification RGE : QB/12345 — domaine Qualibat 7131", false],
    ["", false],
    ["Bénéficiaire : Claire MARTIN", false],
    ["12 rue des Lilas, 93100 Montreuil", false],
    ["", false],
    ["Opération : BAR-EN-101 — Isolation de combles perdus", true],
    ["", false],
    ["Surface isolée : 95 m²", false],
    ["Isolant : laine de verre Isover, référence IBR 300", false],
    ["Résistance thermique R = 6,5 m²·K/W", false], // ← divergent (dossier : 7.5)
    ["Épaisseur : 300 mm", false],
    // ← AUCUNE mention de certification ACERMI : c'est le piège.
    ["", false],
    ["Montant HT : 4 200,00 €", false],
    ["TVA 5,5 % : 231,00 €", false],
    ["Montant TTC : 4 431,00 €", true],
    ["", false],
    ["Date : 10/03/2026", false],
  ];

  let y = 780;
  for (const [texte, bold] of lignes) {
    if (texte) {
      page.drawText(texte, {
        x: 50,
        y,
        size: bold ? 13 : 11,
        font: bold ? gras : police,
        color: rgb(0.1, 0.1, 0.1),
      });
    }
    y -= 22;
  }
  return pdf.save();
}

describe.skipIf(!CLE)("verifierMentions — appel réel au VLM", () => {
  it(
    "voit la mention absente et la mention divergente d'un devis piégé",
    { timeout: 90_000 },
    async () => {
      const prep = await preparerDocument({
        bytes: await devisPiege(),
        mime: "application/pdf",
        filename: "devis-piege.pdf",
      });
      if (!prep.ok) throw new Error("préparation du devis piégé impossible");
      const res = await verifierMentions({
        doc: prep.doc,
        type: "devis",
        mentions: MENTIONS_EXIGEES,
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      // Trace lisible : c'est ce qu'on veut voir de ses yeux la première fois.
      for (const m of res.mentions) {
        console.log(
          `${m.statut.padEnd(11)} conf=${m.confiance.toFixed(2)}  ${m.mention}` +
            (m.verbatim ? `\n            → « ${m.verbatim} »` : ""),
        );
      }

      // Contrat de forme : une entrée par mention exigée, dans le même ordre.
      expect(res.mentions).toHaveLength(MENTIONS_EXIGEES.length);
      expect(res.mentions.map((m) => m.mention)).toEqual(MENTIONS_EXIGEES);

      const par = (frag: string) =>
        res.mentions.find((m) => m.mention.includes(frag))!;

      // Le cœur : ACERMI n'est pas au document. Le modèle doit le dire, et le dire
      // avec assez de confiance pour que le contrôle conclue au refus (seuil 0,6).
      const acermi = par("ACERMI");
      expect(acermi.statut).toBe("absente");
      expect(acermi.confiance).toBeGreaterThanOrEqual(0.6);

      // Le devis porte bien un R, mais pas celui du dossier.
      expect(par("Résistance").statut).toBe("divergente");

      // Ce qui EST écrit doit être reconnu : sinon on crie au loup sur tout.
      expect(par("Fiche CEE").statut).toBe("presente");
      expect(par("Surface").statut).toBe("presente");
      expect(par("RGE").statut).toBe("presente");
    },
  );
});
