import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import {
  DECLINAISONS,
  LOCKUP_VIEWBOX,
  MIN_PX,
  MOT_SIGNE_D,
  RATIO_LOCKUP,
  SYMBOLE_D,
  SYMBOLE_VIEWBOX,
  type Declinaison,
} from "@/lib/brand/mark";

/**
 * Garde-fou du miroir logo (DESIGN.md §1 et §5), sur le modèle de `tokens.test.ts`.
 *
 * `mark.ts` est l'auteur du signe ; les fichiers de `public/brand/` en sont des
 * dérivés produits par `node scripts/brand-assets.mjs`. Rien n'empêche
 * techniquement de retoucher un SVG à la main dans un éditeur, ou de laisser un
 * PNG d'avant la refonte : le site afficherait alors un logo et les PDF un autre,
 * sans qu'aucun outil ne s'en plaigne. Ce test ferme cette porte.
 *
 * Le contrôle du rapport d'aspect des PNG n'est pas décoratif : c'est exactement
 * ce qui a failli passer inaperçu le 2026-07-25. Le logo est passé d'un rapport de
 * 2,96 à 4,88, et le bandeau des PDF gardait un cadre à l'ancien rapport.
 */
function lire(chemin: string): string {
  return readFileSync(join(process.cwd(), chemin), "utf8");
}

/** Rapport largeur / hauteur d'un PNG, lu dans son en-tête IHDR. */
function ratioPng(chemin: string): number {
  const buf = readFileSync(join(process.cwd(), chemin));
  expect(buf.subarray(1, 4).toString("latin1"), `${chemin} n'est pas un PNG`).toBe("PNG");
  return buf.readUInt32BE(16) / buf.readUInt32BE(20);
}

const LOCKUPS: Array<[string, Declinaison]> = [
  ["public/brand/dossimo-logo.svg", "encre"],
  ["public/brand/dossimo-logo-nuit.svg", "nuit"],
  ["public/brand/dossimo-logo-mono-encre.svg", "mono-encre"],
  ["public/brand/dossimo-logo-mono-blanc.svg", "mono-blanc"],
];

const SYMBOLES: Array<[string, Declinaison]> = [
  ["public/brand/dossimo-symbole.svg", "encre"],
  ["public/brand/dossimo-symbole-nuit.svg", "nuit"],
  ["public/brand/dossimo-symbole-blanc.svg", "mono-blanc"],
];

describe("miroir mark.ts ↔ public/brand", () => {
  it.each(LOCKUPS)("%s porte les tracés et les couleurs du module", (chemin, variante) => {
    const svg = lire(chemin);
    const { symbole, motSigne } = DECLINAISONS[variante];
    expect(svg).toContain(`viewBox="${LOCKUP_VIEWBOX}"`);
    expect(svg).toContain(`fill="${symbole}" d="${SYMBOLE_D}"`);
    expect(svg).toContain(`fill="${motSigne}" d="${MOT_SIGNE_D}"`);
  });

  it.each(SYMBOLES)("%s porte le symbole du module", (chemin, variante) => {
    const svg = lire(chemin);
    expect(svg).toContain(`viewBox="${SYMBOLE_VIEWBOX}"`);
    expect(svg).toContain(`fill="${DECLINAISONS[variante].symbole}" d="${SYMBOLE_D}"`);
  });

  it("les rasters de la signature gardent le rapport d'aspect du tracé", () => {
    // Tolérance d'un pixel d'arrondi sur la largeur rendue.
    for (const chemin of ["public/brand/dossimo-logo-nuit.png", "public/brand/dossimo-logo.png"]) {
      expect(ratioPng(chemin), chemin).toBeCloseTo(RATIO_LOCKUP, 1);
    }
  });

  it("le cadre du logo dans les PDF suit ce rapport d'aspect", async () => {
    // Le bandeau des trois documents (pack, facture, attestation) partage ce style.
    const { styles } = await import("@/lib/pack/pdf-theme");
    const cadre = styles.logo as { width: number; height: number };
    expect(cadre.width / cadre.height).toBeCloseTo(RATIO_LOCKUP, 1);
  });

  it("les pastilles d'icône sont carrées", () => {
    for (const chemin of [
      "public/brand/dossimo-icon.png",
      "public/brand/dossimo-icon-clair.png",
      "public/brand/dossimo-avatar-512.png",
      "src/app/icon.png",
      "src/app/icon1.png",
      "src/app/icon2.png",
      "src/app/apple-icon.png",
    ]) {
      expect(ratioPng(chemin), chemin).toBe(1);
    }
  });

  /**
   * Les trois tailles d'icône existent pour que l'onglet reçoive un 16 px rendu
   * net plutôt qu'un 512 réduit par le navigateur. Next lisant la taille dans le
   * fichier, une icône régénérée à la mauvaise dimension passerait inaperçue :
   * d'où la vérification des dimensions exactes, et non du seul carré.
   */
  it("les trois icônes d'application couvrent 16, 32 et 512 px", () => {
    const cotes = ["src/app/icon.png", "src/app/icon1.png", "src/app/icon2.png"].map((chemin) => {
      const buf = readFileSync(join(process.cwd(), chemin));
      return buf.readUInt32BE(16);
    });
    expect(cotes.sort((a, b) => a - b)).toEqual([16, 32, 512]);
  });

  it("favicon.ico embarque bien un 16 et un 32", () => {
    // Conteneur ICO : type à l'octet 2, nombre d'images à l'octet 4, puis une
    // entrée de 16 octets par image dont le premier octet est le côté.
    const buf = readFileSync(join(process.cwd(), "src/app/favicon.ico"));
    expect(buf.readUInt16LE(2), "type ICO").toBe(1);
    expect(buf.readUInt16LE(4), "nombre d'images").toBe(2);
    expect([buf.readUInt8(6), buf.readUInt8(22)]).toEqual([16, 32]);
  });

  /**
   * La taille minimale ne reste pas une consigne écrite : elle est vérifiée sur
   * les classes réellement passées au composant. `h-5` = 20 px dans l'échelle
   * Tailwind (4 px par pas), donc toute hauteur sous `h-5` est refusée, préfixes
   * responsives compris.
   */
  it("aucune hauteur de logo ne descend sous la taille minimale", () => {
    const fichiers: string[] = [];
    const parcourir = (dossier: string) => {
      for (const e of readdirSync(join(process.cwd(), dossier), { withFileTypes: true })) {
        if (e.isDirectory()) parcourir(`${dossier}/${e.name}`);
        else if (e.name.endsWith(".tsx")) fichiers.push(`${dossier}/${e.name}`);
      }
    };
    parcourir("src");

    const hauteurs: Array<[string, number]> = [];
    for (const chemin of fichiers) {
      for (const m of lire(chemin).matchAll(/hauteur="([^"]+)"/g)) {
        for (const classe of m[1].split(/\s+/)) {
          const pas = classe.match(/(?:^|:)h-(\d+(?:\.\d+)?)$/);
          if (pas) hauteurs.push([`${chemin} → ${classe}`, Number(pas[1]) * 4]);
        }
      }
    }
    // La valeur par défaut du composant compte comme un usage à part entière.
    const parDefaut = lire("src/components/ui/logo.tsx").match(/hauteur = "h-(\d+)"/);
    expect(parDefaut, "hauteur par défaut de <Logo> illisible").not.toBeNull();
    hauteurs.push([`défaut de <Logo> → h-${parDefaut![1]}`, Number(parDefaut![1]) * 4]);

    expect(hauteurs.length).toBeGreaterThan(0);
    for (const [ou, px] of hauteurs) {
      expect(px, ou).toBeGreaterThanOrEqual(MIN_PX.lockup);
    }
  });

  it("le bleu de marque n'est jamais posé sur fond encre", () => {
    // Règle de contraste : #35507f sur #16202b plafonne à 1,95:1. La déclinaison
    // `nuit` doit donc utiliser autre chose que le bleu de la déclinaison claire.
    expect(DECLINAISONS.nuit.symbole).not.toBe(DECLINAISONS.encre.symbole);
  });
});
