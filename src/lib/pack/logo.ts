import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Logo « nuit » (version claire) embarqué en data-URI, pour le bandeau encre
 * des documents du pack. Lu une seule fois et mis en cache.
 */
let cache: string | null = null;

export function logoNuit(): string {
  if (cache) return cache;
  const p = path.join(process.cwd(), "public", "brand", "dossimo-logo-nuit.png");
  cache = `data:image/png;base64,${readFileSync(p).toString("base64")}`;
  return cache;
}
