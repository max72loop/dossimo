/**
 * Validation SIRET.
 *
 * Un SIRET faux ou mal recopié est un motif de refus direct : il figure sur le
 * devis, la facture et le Cerfa, tous générés depuis la fiche artisan. On le
 * valide donc à la saisie plutôt qu'à la génération.
 *
 * Format : 14 chiffres, avec clé de contrôle de Luhn (doublement des rangs
 * pairs en base 0, la longueur étant paire).
 */

/** SIRET de La Poste : dérogation historique, non conforme à Luhn. */
const DEROGATION_LA_POSTE = /^356000000\d{5}$/;

/** Retire espaces, points et tirets d'une saisie SIRET. */
export function normaliserSiret(valeur: string): string {
  return valeur.replace(/[\s.-]/g, "");
}

export function siretValide(valeur: string): boolean {
  const chiffres = normaliserSiret(valeur);
  if (!/^\d{14}$/.test(chiffres)) return false;
  if (DEROGATION_LA_POSTE.test(chiffres)) return true;

  let somme = 0;
  for (let i = 0; i < 14; i++) {
    let n = Number(chiffres[i]);
    if (i % 2 === 0) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    somme += n;
  }
  return somme % 10 === 0;
}

/** Affichage lisible : 123 456 789 00012 (SIREN + NIC). */
export function formaterSiret(valeur: string): string {
  const c = normaliserSiret(valeur);
  if (c.length !== 14) return valeur;
  return `${c.slice(0, 3)} ${c.slice(3, 6)} ${c.slice(6, 9)} ${c.slice(9)}`;
}
