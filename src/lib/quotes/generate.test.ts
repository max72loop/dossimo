import { describe, expect, it } from "vitest";
import { generateQuote } from "@/lib/quotes/generate";

describe("generateQuote", () => {
  const fields = [{ key: "etas", label: "ETAS", type: "number" as const, unit: "%", required: true, min_value: 126, max_value: null }];
  it("bloque une valeur hors seuil", () => expect(generateQuote({ fields, lines: [], values: { etas: "120" }, context: {} }).ok).toBe(false));
  it("injecte les variables dans les lignes", () => {
    const r = generateQuote({ fields, lines: [{ type: "performance", template: "ETAS {{etas}} %" }], values: { etas: "126" }, context: {} });
    expect(r).toMatchObject({ ok: true, lines: [{ text: "ETAS 126 %" }] });
  });
});
