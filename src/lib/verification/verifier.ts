import type { Famille } from "@/lib/dossier/cee-isolation";
import { domaineCouvreGeste } from "./domaines";
import { rechercheEntreprise } from "./annuaire";
import { qualificationsRgeParSiret } from "./rge";
import {
  entrepriseDemo,
  entrepriseDemoGenerique,
  type EntrepriseDemo,
} from "./fixtures";
import type {
  QualificationRge,
  StatutRge,
  VerificationEntreprise,
  VerificationMode,
} from "./types";

/**
 * Mode de vérification, piloté par `DOSSIMO_VERIFICATION_MODE` :
 *  - `reel` (défaut) : appelle les annuaires officiels ;
 *  - `demo`  : accepte tout SIRET via une entreprise fictive (démos, tests) ;
 *  - `off`   : désactive la vérification (aucun appel, statut « non_verifie »).
 */
export function verificationMode(): VerificationMode {
  const v = (process.env.DOSSIMO_VERIFICATION_MODE ?? "reel").toLowerCase();
  return v === "demo" || v === "off" ? v : "reel";
}

export interface EntreeVerification {
  siret: string;
  famille: Famille;
  /** Date du devis (ISO) : la qualif RGE doit la couvrir. Null = non jugée. */
  dateDevis: string | null;
}

function parseDate(s: string | null): number | null {
  if (!s) return null;
  const t = Date.parse(`${s}T00:00:00`);
  return Number.isNaN(t) ? null : t;
}

/**
 * Choisit, parmi les qualifs RGE, celle qui couvre le domaine du geste ET la
 * date du devis. Renvoie le statut et la qualif retenue.
 */
export function evaluerRge(
  qualifications: QualificationRge[],
  famille: Famille,
  dateDevis: string | null,
): { statut: StatutRge; retenue: QualificationRge | null } {
  if (qualifications.length === 0) return { statut: "aucune", retenue: null };

  const duDomaine = qualifications.filter((q) =>
    domaineCouvreGeste(q.domaine, famille),
  );
  if (duDomaine.length === 0) return { statut: "domaine_absent", retenue: null };

  const dDevis = parseDate(dateDevis);
  // Sans date de devis, on ne peut pas juger la couverture temporelle : on
  // retient la qualif du bon domaine (la chronologie est contrôlée ailleurs).
  if (dDevis == null) return { statut: "couvert", retenue: duDomaine[0] };

  const couvrante = duDomaine.find((q) => {
    const debut = parseDate(q.date_debut);
    const fin = parseDate(q.date_fin);
    return (debut == null || debut <= dDevis) && (fin == null || dDevis <= fin);
  });
  if (couvrante) return { statut: "couvert", retenue: couvrante };
  return { statut: "expire", retenue: duDomaine[0] };
}

function depuisDemo(
  e: EntrepriseDemo,
  entree: EntreeVerification,
  mode: VerificationMode,
): VerificationEntreprise {
  const { statut, retenue } = evaluerRge(
    e.qualifications,
    entree.famille,
    entree.dateDevis,
  );
  return {
    mode,
    effectuee_le: new Date().toISOString(),
    siret: entree.siret,
    entreprise: {
      statut: e.actif ? "actif" : "ferme",
      denomination: e.denomination,
    },
    rge: { statut, retenue, qualifications: e.qualifications },
  };
}

/**
 * Vérifie une entreprise et sa qualification RGE contre les annuaires officiels
 * (ou les fixtures de démo selon le mode). Ne LÈVE JAMAIS : une panne réseau se
 * traduit par un statut `indisponible` (contrôle dégradé), jamais par une
 * erreur qui ferait échouer la création du dossier.
 */
export async function verifierEntreprise(
  entree: EntreeVerification,
): Promise<VerificationEntreprise> {
  const mode = verificationMode();

  if (mode === "off") {
    return {
      mode,
      effectuee_le: null,
      siret: entree.siret,
      entreprise: { statut: "non_verifie", denomination: null },
      rge: { statut: "non_verifie", retenue: null, qualifications: [] },
    };
  }

  // Fixtures de démo : reconnues même en mode « reel » (démo sur production).
  const fixture = entrepriseDemo(entree.siret);
  if (fixture) return depuisDemo(fixture, entree, mode);

  if (mode === "demo") {
    return depuisDemo(entrepriseDemoGenerique(entree.siret), entree, mode);
  }

  // Mode réel : les deux annuaires officiels, en parallèle.
  const [annuaire, rge] = await Promise.all([
    rechercheEntreprise(entree.siret),
    qualificationsRgeParSiret(entree.siret),
  ]);

  const rgeEval: { statut: StatutRge; retenue: QualificationRge | null } =
    rge.disponible
      ? evaluerRge(rge.qualifications, entree.famille, entree.dateDevis)
      : { statut: "indisponible", retenue: null };

  return {
    mode,
    effectuee_le: new Date().toISOString(),
    siret: entree.siret,
    entreprise: { statut: annuaire.statut, denomination: annuaire.denomination },
    rge: {
      statut: rgeEval.statut,
      retenue: rgeEval.retenue,
      qualifications: rge.qualifications,
    },
  };
}
