import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";

import { preparerDocument, extraireJson, MAX_PAGES_PDF } from "@/lib/piece/document";

/** Un PDF réel de `n` pages, tel que pdf-lib le compterait. */
async function pdfDe(n: number): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < n; i++) pdf.addPage([595, 842]);
  return pdf.save();
}

describe("preparerDocument", () => {
  it("prépare un PDF court : dataUrl construite une fois, réutilisable", async () => {
    const bytes = await pdfDe(2);
    const res = await preparerDocument({
      bytes,
      mime: "application/pdf",
      filename: "avis.pdf",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.doc.mime).toBe("application/pdf");
    expect(res.doc.filename).toBe("avis.pdf");
    expect(res.doc.dataUrl.startsWith("data:application/pdf;base64,")).toBe(true);
  });

  it("accepte un PDF pile au plafond", async () => {
    const res = await preparerDocument({
      bytes: await pdfDe(MAX_PAGES_PDF),
      mime: "application/pdf",
      filename: "devis.pdf",
    });
    expect(res.ok).toBe(true);
  });

  it("refuse un lot au-delà du plafond, sans encoder ni lire", async () => {
    // Le garde-fou : un « scan de tout le classeur » est arrêté avant l'upload et
    // avant tout appel au VLM, avec un message qui dit quoi déposer.
    const res = await preparerDocument({
      bytes: await pdfDe(MAX_PAGES_PDF + 1),
      mime: "application/pdf",
      filename: "tout.pdf",
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.reason).toBe("trop-de-pages");
    expect(res.pages).toBe(MAX_PAGES_PDF + 1);
    expect(res.message).toContain(String(MAX_PAGES_PDF + 1));
    expect(res.message).toContain("pages");
  });

  it("ne compte pas les pages d'une image : rien à borner", async () => {
    // Une photo n'a pas de pages ; le plafond ne la concerne pas.
    const res = await preparerDocument({
      bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
      mime: "image/jpeg",
      filename: "photo.jpg",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.doc.dataUrl.startsWith("data:image/jpeg;base64,")).toBe(true);
  });

  it("ne bloque pas sur un PDF que pdf-lib ne sait pas ouvrir", async () => {
    // Comptage = garde-fou de volume, pas validateur. Un PDF corrompu (0 page
    // comptée) passe ici ; le VLM tranchera sur la lisibilité réelle.
    const res = await preparerDocument({
      bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x00, 0x01]),
      mime: "application/pdf",
      filename: "casse.pdf",
    });
    expect(res.ok).toBe(true);
  });
});

describe("extraireJson", () => {
  it("lit un JSON nu", () => {
    expect(extraireJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("déballe les fences markdown", () => {
    expect(extraireJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extraireJson('```\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("ignore le texte autour du premier objet", () => {
    expect(extraireJson('Voici : {"a":1} — voilà.')).toEqual({ a: 1 });
  });

  it("lève sur une réponse sans JSON", () => {
    expect(() => extraireJson("désolé, je ne peux pas")).toThrow();
  });
});
