import "server-only";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
export async function renderQuoteDocx(data: { label: string; lines: string[]; mentions: string[] }) {
  const document = new Document({ sections: [{ properties: {}, children: [new Paragraph({ text: `Lignes de devis - ${data.label}`, heading: HeadingLevel.TITLE }), new Paragraph({ children: [new TextRun({ text: "Généré par Dossimo", color: "64748B" })] }), new Paragraph({ text: "Lignes à intégrer au devis", heading: HeadingLevel.HEADING_1 }), ...data.lines.map((line) => new Paragraph({ text: line, bullet: { level: 0 } })), new Paragraph({ text: "Checklist de conformité", heading: HeadingLevel.HEADING_1 }), ...data.mentions.map((mention) => new Paragraph({ text: mention, bullet: { level: 0 } })), new Paragraph({ children: [new TextRun({ text: "Aide à la rédaction : l'artisan reste responsable de la conformité finale de son devis.", italics: true, color: "64748B" })] })] }] });
  return Packer.toBuffer(document);
}
