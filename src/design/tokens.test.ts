import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { TOKENS } from "@/design/tokens";

/**
 * Garde-fou du miroir palette (DESIGN.md §1). `globals.css` ne peut pas importer
 * le TypeScript (Tailwind v4 impose le `@theme` en CSS), donc il reste un miroir
 * manuel de `tokens.ts`. Ce test vérifie qu'ils sont IDENTIQUES, dans les deux
 * sens : une dérive devient un test rouge, plus un oubli silencieux.
 */
function colorsFromGlobals(): Record<string, string> {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
  const out: Record<string, string> = {};
  // Ne capture que les DÉFINITIONS `--color-x: #hex;` ; les usages `var(--color-x)`
  // n'ont pas de `: #hex;` et sont donc ignorés.
  const re = /--color-([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) out[m[1]] = m[2].toLowerCase();
  return out;
}

describe("miroir tokens.ts ↔ globals.css", () => {
  it("chaque token concorde en valeur dans globals.css", () => {
    const css = colorsFromGlobals();
    for (const [name, value] of Object.entries(TOKENS)) {
      expect(css[name], `--color-${name}`).toBe(value.toLowerCase());
    }
  });

  it("aucun --color-* du CSS n'échappe à tokens.ts (dérive inverse)", () => {
    const css = colorsFromGlobals();
    expect(Object.keys(css).sort()).toEqual(Object.keys(TOKENS).sort());
  });
});
