import { PRECARITES } from "@/lib/dossier/cee-isolation";
import type { CeeIsolationCaracteristiques } from "@/lib/dossier/get-dossier";
import type { AvisImposition } from "@/lib/piece/avis-imposition";
import {
  categoriePour,
  estProfilSuperieur,
  plafondPour,
  zoneDeCodePostal,
  type CategorieRevenus,
} from "@/lib/rules/plafonds";
import type { Dossier, PlafondRessources } from "@/lib/database.types";
import type { Finding } from "@/lib/rules/types";

/**
 * Contrôle de l'avis d'imposition déposé par le bénéficiaire — règles dures.
 *
 * La catégorie de revenus est déclarée à la saisie par l'artisan, qui la tient
 * souvent de son client, de mémoire. Elle commande pourtant le montant de l'aide.
 * Une grande précarité annoncée pour un ménage modeste passe tous les contrôles de
 * cohérence interne du dossier : rien, dans la saisie, ne la contredit. Elle ne se
 * découvre qu'à l'instruction, quand l'organisme lit l'avis — et recalcule.
 *
 * C'est le seul contrôle du produit qui confronte le dossier à une pièce que
 * l'artisan n'a pas écrite. Pur et synchrone : l'IA a constaté, ici on juge.
 */

/** Un avis plus vieux que ça n'est plus « le dernier avis d'imposition ». */
const ANCIENNETE_MAX_ANS = 2;

const LABEL: Record<CategorieRevenus, string> = {
  grande_precarite: PRECARITES.grande_precarite,
  precaire: PRECARITES.precaire,
  intermediaire: PRECARITES.intermediaire,
  superieur: PRECARITES.superieur,
};

/**
 * Rang de générosité de l'aide, du plus au moins aidé. Le violet et le rose
 * partagent le même rang à dessein : le CEE ne les distingue pas (même barème), et
 * l'inéligibilité MaPrimeRénov' du rose est déjà tranchée en amont (bloc
 * `avis_mpr_revenus_superieurs`). Pour la simple cohérence de catégorie, les
 * confondre évite un faux « trop prudente » quand ils ne changent aucun montant.
 */
const RANG: Record<CategorieRevenus, number> = {
  grande_precarite: 0,
  precaire: 1,
  intermediaire: 2,
  superieur: 2,
};

const eur = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/** Rapproche deux noms : « MARTIN Claire » ≈ « Claire Martin ». */
function nomsConcordent(a: string, b: string): boolean {
  const mots = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .split(/[^a-z]+/)
        .filter((m) => m.length > 2),
    );
  const A = mots(a);
  const B = mots(b);
  if (A.size === 0 || B.size === 0) return true; // Rien à comparer : on n'accuse pas.
  for (const m of A) if (B.has(m)) return true;
  return false;
}

export function controlerAvisImposition(params: {
  caracteristiques: CeeIsolationCaracteristiques;
  avis: AvisImposition;
  plafonds: readonly PlafondRessources[];
  /** Année de la demande — sert à juger l'ancienneté de l'avis. */
  anneeCourante: number;
  /**
   * Dispositif du dossier. Il commande une règle propre à MaPrimeRénov' : les
   * revenus « supérieurs » (rose) n'y sont pas éligibles par geste, alors qu'en CEE
   * ils passent sans réserve. Défaut `cee` : le comportement historique.
   */
  dispositif?: Dossier["dispositif"];
}): Finding[] {
  const { caracteristiques: c, avis, plafonds, anneeCourante } = params;
  const dispositif = params.dispositif ?? "cee";
  const out: Finding[] = [];

  if (avis.hors_sujet) {
    return [
      {
        code: "avis_hors_sujet",
        categorie: "pieces",
        severite: "bloquant",
        titre: "Le document déposé n'est pas un avis d'imposition",
        detail:
          "La pièce reçue ne ressemble pas à un avis d'impôt sur le revenu. Demandez à votre client le dernier avis complet, celui reçu cette année.",
      },
    ];
  }

  // Le nom du déclarant doit être celui du bénéficiaire du dossier.
  const beneficiaire = `${c.beneficiaire.prenom} ${c.beneficiaire.nom}`;
  if (avis.declarant && !nomsConcordent(beneficiaire, avis.declarant)) {
    out.push({
      code: "avis_declarant",
      categorie: "pieces",
      severite: "bloquant",
      titre: "L'avis n'est pas au nom du bénéficiaire",
      detail: `Le dossier est au nom de ${beneficiaire} ; l'avis déposé est au nom de ${avis.declarant}. L'aide se calcule sur les revenus du ménage qui occupe le logement.`,
    });
  }

  // Le dernier avis, pas n'importe lequel.
  if (avis.annee_revenus != null) {
    const age = anneeCourante - avis.annee_revenus;
    if (age > ANCIENNETE_MAX_ANS) {
      out.push({
        code: "avis_perime",
        categorie: "pieces",
        severite: "bloquant",
        titre: "Avis d'imposition trop ancien",
        detail: `L'avis porte sur les revenus ${avis.annee_revenus}. L'instruction exige le dernier avis disponible. Demandez à votre client celui qu'il a reçu cette année.`,
      });
    }
  }

  // Le cœur : le RFR impose-t-il la catégorie de revenus déclarée ?
  const rfr = avis.revenu_fiscal_reference;
  const personnes = avis.foyer_personnes;

  if (rfr == null) {
    out.push({
      code: "avis_illisible",
      categorie: "pieces",
      severite: "avertissement",
      titre: "Revenu fiscal de référence non lu",
      detail:
        "Le revenu fiscal de référence n'a pas pu être relevé sur l'avis. La catégorie de revenus du dossier n'a donc pas été vérifiée — contrôlez-la à l'œil, ou déposez un scan plus net.",
    });
    return out;
  }

  if (personnes == null || personnes < 1) {
    out.push({
      code: "avis_foyer_illisible",
      categorie: "pieces",
      severite: "avertissement",
      titre: "Composition du foyer non lue",
      detail: `Le revenu fiscal de référence relevé est de ${eur(rfr)}, mais le nombre de personnes du foyer n'a pas pu être établi — or les plafonds en dépendent. La catégorie de revenus n'a pas été vérifiée.`,
    });
    return out;
  }

  const zone = zoneDeCodePostal(c.beneficiaire.code_postal);
  const plafond = plafondPour(plafonds, zone, personnes);

  if (!plafond) {
    out.push({
      code: "avis_bareme_absent",
      categorie: "pieces",
      severite: "avertissement",
      titre: "Barème de ressources indisponible",
      detail:
        "Les plafonds de ressources en vigueur n'ont pas pu être chargés. La catégorie de revenus du dossier n'a pas été vérifiée contre l'avis.",
    });
    return out;
  }

  // MaPrimeRénov' 2026 : le parcours par geste n'est pas ouvert aux revenus
  // « supérieurs » (profil rose de l'Anah), au-dessus du plafond intermédiaire. Le
  // modèle interne à trois bandes range pourtant ce ménage en « classique », comme le
  // violet éligible : rien dans la saisie ne les sépare, seul l'avis tranche. Ce motif
  // prime sur la simple cohérence de catégorie — inutile de comparer au-delà.
  // Côté CEE, aucune distinction violet / rose : la règle ne s'y applique pas.
  const seuilSuperieur = plafond.intermediaire;
  if (
    dispositif === "maprimerenov" &&
    estProfilSuperieur(rfr, plafond) &&
    seuilSuperieur != null
  ) {
    out.push({
      code: "avis_mpr_revenus_superieurs",
      categorie: "pieces",
      severite: "bloquant",
      titre: "Revenus supérieurs : ménage non éligible à MaPrimeRénov'",
      detail: `L'avis (${eur(rfr)} pour ${personnes} personne${personnes > 1 ? "s" : ""}, ${zone === "idf" ? "Île-de-France" : "hors Île-de-France"}) dépasse le plafond « intermédiaire » de ${eur(seuilSuperieur)}. En 2026, MaPrimeRénov' par geste ne finance pas les revenus supérieurs (profil rose de l'Anah) : ce dossier serait refusé. Orientez le client vers un financement CEE, ouvert à tous les revenus, ou vers la rénovation d'ampleur.`,
    });
    return out;
  }

  const reelle = categoriePour(rfr, plafond);
  const declaree = c.beneficiaire.precarite;

  // Comparaison au rang, pas au token : le violet et le rose sont au même rang
  // (voir `RANG`), donc un dossier « intermédiaire » que l'avis situe « supérieur »
  // (ou l'inverse) est traité comme confirmé — aucune aide ne change entre eux.
  if (RANG[reelle] === RANG[declaree]) {
    out.push({
      code: "avis_revenus",
      categorie: "pieces",
      severite: "ok",
      titre: "Catégorie de revenus confirmée par l'avis",
      detail: `Revenu fiscal de référence : ${eur(rfr)} pour ${personnes} personne${personnes > 1 ? "s" : ""} (${zone === "idf" ? "Île-de-France" : "hors Île-de-France"}). Le dossier déclare « ${LABEL[declaree]} » : l'avis le confirme.`,
    });
    return out;
  }

  // Les deux sens sont graves, mais pas pour la même raison : trop généreux, la prime
  // sera recalculée à la baisse ; trop prudent, le client perd de l'argent auquel il a
  // droit — et personne ne le lui dira. Déclarer un profil plus aidé (rang plus bas)
  // que la réalité, c'est surestimer.
  const surestime = RANG[declaree] < RANG[reelle];

  out.push({
    code: "avis_revenus",
    categorie: "pieces",
    severite: surestime ? "bloquant" : "avertissement",
    titre: surestime
      ? "La catégorie de revenus déclarée est trop favorable"
      : "La catégorie de revenus déclarée est trop prudente",
    detail: surestime
      ? `Le dossier déclare « ${LABEL[declaree]} », mais l'avis (${eur(rfr)} pour ${personnes} personne${personnes > 1 ? "s" : ""}) place le ménage en « ${LABEL[reelle]} ». La prime sera recalculée à la baisse à l'instruction. Corrigez la saisie avant le dépôt.`
      : `Le dossier déclare « ${LABEL[declaree]} », mais l'avis (${eur(rfr)} pour ${personnes} personne${personnes > 1 ? "s" : ""}) place le ménage en « ${LABEL[reelle]} », plus favorable. Votre client a probablement droit à davantage : corrigez la saisie avant le dépôt.`,
  });

  return out;
}
