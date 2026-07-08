import type { DossierComplet } from "@/lib/dossier/get-dossier";
import { estimerPrime } from "@/lib/dossier/prime";

/**
 * Tarification par PALIER selon la taille du dossier (CLAUDE.md §10 : pricing non
 * figé, structure souple). Le forfait reste FIXE (jamais un pourcentage de la
 * prime, ce qui reviendrait à en capter une part, contraire au positionnement
 * §2) : un petit chantier paie moins, un gros paie le tarif standard.
 *
 * Base : la prime estimée du dossier. Paliers surchargeables par env
 * (STRIPE_PRICE_TIERS = JSON, ex. [{"max":800,"cents":4900},...]) ; le dernier
 * palier peut omettre "max" (= sans plafond). Repli si prime non estimable.
 */
export interface Palier {
  /** Borne haute exclusive de prime (€). Absent = dernier palier, sans plafond. */
  max?: number;
  cents: number;
}

const PALIERS_DEFAUT: Palier[] = [
  { max: 800, cents: 4900 }, // petit dossier : 49 €
  { max: 2500, cents: 9900 }, // standard : 99 €
  { cents: 14900 }, // gros : 149 €
];

/** Forfait appliqué quand la prime n'est pas estimable. */
const DEFAUT_CENTS = 9900;

function paliers(): Palier[] {
  const raw = process.env.STRIPE_PRICE_TIERS;
  if (raw) {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p) && p.length && p.every((x) => typeof x?.cents === "number")) {
        return p as Palier[];
      }
    } catch {
      // JSON invalide : on retombe sur les paliers par défaut.
    }
  }
  return PALIERS_DEFAUT;
}

export function prixCentsPourPrime(prime: number | null | undefined): number {
  const cfg = process.env.STRIPE_PRICE_DEFAUT_CENTS;
  const defaut = cfg && Number(cfg) > 0 ? Number(cfg) : DEFAUT_CENTS;
  if (prime == null) return defaut;
  const grille = paliers();
  const p = grille.find((x) => x.max == null || prime < x.max) ?? grille[grille.length - 1];
  return p.cents;
}

export function labelEuros(cents: number): string {
  return (
    (cents / 100).toLocaleString("fr-FR", {
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }) + " €"
  );
}

/** Prix d'un dossier (centimes + libellé), calculé sur sa prime estimée. */
export function prixDossier(data: DossierComplet): { cents: number; label: string } {
  const prime = estimerPrime(data)?.montant ?? null;
  const cents = prixCentsPourPrime(prime);
  return { cents, label: labelEuros(cents) };
}

/** Fourchette affichée sur la landing (du plus petit au plus grand palier). */
export function fourchettePrix(): { minLabel: string; maxLabel: string } {
  const grille = paliers();
  const cents = grille.map((p) => p.cents);
  return { minLabel: labelEuros(Math.min(...cents)), maxLabel: labelEuros(Math.max(...cents)) };
}
