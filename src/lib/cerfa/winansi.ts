// Caracteres hors Latin-1 rencontres en pratique, mappes vers un equivalent
// encodable en WinAnsi (polices standard pdf-lib). Le cas critique est U+202F
// (espace fine insecable) inseree par le formatage fr-FR des montants.
const NBSP_LIKE = new Set([0x00a0, 0x202f, 0x2009, 0x2007, 0x200a]);
const SINGLE_QUOTE = new Set([0x2018, 0x2019, 0x201a, 0x201b]);
const DOUBLE_QUOTE = new Set([0x201c, 0x201d]);
const DASH = new Set([0x2013, 0x2014]);

/**
 * Ramene une chaine dans le sous-ensemble encodable par les polices standard
 * (WinAnsi ~ Latin-1). Les accents francais (<= 0xFF) sont conserves ; les
 * caracteres hors Latin-1 non mappes sont retires plutot que de faire echouer
 * tout le PDF.
 */
export function winAnsiSafe(s: string): string {
  let out = "";
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp <= 0xff) out += ch;
    else if (NBSP_LIKE.has(cp)) out += " ";
    else if (SINGLE_QUOTE.has(cp)) out += "'";
    else if (DOUBLE_QUOTE.has(cp)) out += '"';
    else if (DASH.has(cp)) out += "-";
    else if (cp === 0x2026) out += "...";
    else if (cp === 0x0153) out += "oe";
    else if (cp === 0x0152) out += "OE";
    // sinon : caractere hors WinAnsi, retire.
  }
  return out;
}
