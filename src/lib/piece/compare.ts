import type { DossierComplet } from "@/lib/dossier/get-dossier";
import type { TypePiece } from "@/lib/database.types";
import type { ExtractedPiece } from "@/lib/piece/extract";

/**
 * Vérification croisée entre les VRAIES pièces (extraites) et la saisie unique.
 * C'est ce qui transforme le contrôle en garantie : un écart entre le devis et
 * la saisie (ex. 80 m² vs 95 m²) devient visible avant dépôt.
 */

export type StatutEcart = "ok" | "ecart" | "absent";

export interface Comparaison {
  champ: string;
  saisie: string;
  piece: string;
  statut: StatutEcart;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const strMatch = (a: string, b: string) => {
  const x = norm(a).replace(/\s/g, "");
  const y = norm(b).replace(/\s/g, "");
  return x === y || x.includes(y) || y.includes(x);
};

const numEq = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

/** Normalise une date (ISO ou JJ/MM/AAAA ou variantes) en "JJ/MM/AAAA". */
function dateKey(s: string | null): string | null {
  if (!s) return null;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const fr = s.match(/(\d{1,2})[/.\s-](\d{1,2})[/.\s-](\d{2,4})/);
  if (fr) {
    const y = fr[3].length === 2 ? `20${fr[3]}` : fr[3];
    return `${fr[1].padStart(2, "0")}/${fr[2].padStart(2, "0")}/${y}`;
  }
  return norm(s);
}

const eur = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export function comparerPiece(
  data: DossierComplet,
  ex: ExtractedPiece,
  type: TypePiece,
): Comparaison[] {
  const c = data.caracteristiques;
  const dateSaisie = type === "facture" ? data.dates.facture : data.dates.devis;
  const out: Comparaison[] = [];

  const push = (
    champ: string,
    saisie: string,
    piece: string,
    ok: boolean | null,
  ) => {
    const statut: StatutEcart = piece === "—" || ok === null ? "absent" : ok ? "ok" : "ecart";
    out.push({ champ, saisie, piece, statut });
  };

  // Bénéficiaire
  const benef = `${c.beneficiaire.prenom} ${c.beneficiaire.nom}`;
  push(
    "Bénéficiaire",
    benef,
    ex.beneficiaire_nom ?? "—",
    ex.beneficiaire_nom ? strMatch(benef, ex.beneficiaire_nom) : null,
  );
  push(
    "Code postal",
    c.beneficiaire.code_postal,
    ex.code_postal ?? "—",
    ex.code_postal ? norm(c.beneficiaire.code_postal) === norm(ex.code_postal) : null,
  );

  // Travaux
  push(
    "Surface isolée",
    `${c.travaux.surface_isolee_m2} m²`,
    ex.surface_isolee_m2 != null ? `${ex.surface_isolee_m2} m²` : "—",
    ex.surface_isolee_m2 != null
      ? numEq(c.travaux.surface_isolee_m2, ex.surface_isolee_m2, 0.5)
      : null,
  );
  push(
    "Résistance R",
    `${c.travaux.resistance_thermique_r}`,
    ex.resistance_thermique_r != null ? `${ex.resistance_thermique_r}` : "—",
    ex.resistance_thermique_r != null
      ? numEq(c.travaux.resistance_thermique_r, ex.resistance_thermique_r, 0.05)
      : null,
  );
  if (c.travaux.isolant_marque) {
    push(
      "Marque isolant",
      c.travaux.isolant_marque,
      ex.isolant_marque ?? "—",
      ex.isolant_marque ? strMatch(c.travaux.isolant_marque, ex.isolant_marque) : null,
    );
  }
  if (c.travaux.isolant_reference) {
    push(
      "Référence isolant",
      c.travaux.isolant_reference,
      ex.isolant_reference ?? "—",
      ex.isolant_reference ? strMatch(c.travaux.isolant_reference, ex.isolant_reference) : null,
    );
  }

  // Montants
  push(
    "Montant HT",
    eur(c.montants.ht),
    ex.montant_ht != null ? eur(ex.montant_ht) : "—",
    ex.montant_ht != null ? numEq(c.montants.ht, ex.montant_ht, 1) : null,
  );
  push(
    "Montant TTC",
    eur(c.montants.ttc),
    ex.montant_ttc != null ? eur(ex.montant_ttc) : "—",
    ex.montant_ttc != null ? numEq(c.montants.ttc, ex.montant_ttc, 1) : null,
  );

  // Date (devis ou facture selon la pièce)
  const dsKey = dateKey(dateSaisie);
  const dpKey = dateKey(ex.date);
  push(
    type === "facture" ? "Date facture" : "Date devis",
    dsKey ?? "—",
    dpKey ?? "—",
    dpKey && dsKey ? dpKey === dsKey : null,
  );

  // RGE
  push(
    "N° RGE",
    c.rge.numero,
    ex.rge_numero ?? "—",
    ex.rge_numero ? strMatch(c.rge.numero, ex.rge_numero) : null,
  );

  return out;
}

export function nbEcarts(comps: Comparaison[]): number {
  return comps.filter((c) => c.statut === "ecart").length;
}
