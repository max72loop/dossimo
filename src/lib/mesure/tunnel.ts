import type { StatutDossier, TypeEvenementParcours } from "@/lib/database.types";

/**
 * Le tunnel d'entreprise : contact → essai → inscription → dossier → paiement →
 * dépôt → accepté sans reprise.
 *
 * Deux consoles mesuraient déjà des bouts de cette ligne sans se parler :
 * `/admin/sprint/pilotage` s'arrête au dossier payé, `/admin/pilotage` commence
 * au dépôt. Entre les deux, l'essai n'existait nulle part. Ce module recolle la
 * ligne entière, et surtout la juge sur ce qui compte : le nombre de dossiers
 * PAYÉS puis ACCEPTÉS SANS REPRISE.
 *
 * ---------------------------------------------------------------------------
 * Ce que ce tunnel n'est pas
 * ---------------------------------------------------------------------------
 * Ce n'est PAS une cohorte. Chaque étape compte ce qui s'est produit dans la
 * fenêtre, à sa propre date : les 3 inscriptions de la semaine ne sont pas
 * forcément issues des 12 essais de la semaine. À l'échelle d'un pilote à cinq
 * artisans, suivre de vraies cohortes ne donnerait que des zéros, alors que les
 * volumes bruts se lisent d'un coup d'œil. Les taux affichés sont donc des
 * ordres de grandeur, et la page le dit.
 *
 * L'agrégation est faite en TypeScript, comme tout le reste du projet (aucune
 * vue SQL, cf. `supabase/README.md` §3), sur des volumes de pilote.
 */

/** Étapes du parcours arrivées jusqu'à `pret_depot`. Jamais `statut > 'x'` : l'ordre de l'enum ne suit pas le parcours (README §3). */
const STATUTS_COMPLETES = new Set<StatutDossier>(["pret_depot", "depose", "livre"]);

export type LigneEtape = {
  cle: string;
  libelle: string;
  /** `null` = étape non instrumentée. Jamais 0 par défaut : « rien mesuré » n'est pas « personne ». */
  valeur: number | null;
  aide: string;
};

export type Qualite = {
  lectures: number;
  echecsLecture: number;
  echecsService: number;
  echecsIllisible: number;
  /** Part des lectures qui ont échoué, `null` si aucune lecture. */
  tauxEchecLecture: number | null;
  minutesAssistance: number;
  /** Dossiers déposés dont le retour est renseigné. Dénominateur honnête des deux taux suivants. */
  retoursRenseignes: number;
  reprisesDemandees: number;
  tauxReprise: number | null;
  /** Retours où la question de la reprise n'a pas été posée : ni « avec », ni « sans ». */
  repriseInconnue: number;
};

export type LignePalier = {
  palier: string;
  prixCents: number;
  dossiersPayes: number;
  revenuCents: number;
  /** Coût LLM en micro-USD. Volontairement PAS converti en euros : voir `Tunnel`. */
  coutMicroUsd: number;
  /** `true` si au moins un appel du palier n'a pas de coût communiqué : le total est alors un plancher. */
  coutIncomplet: boolean;
  minutesAssistance: number;
};

export type Tunnel = {
  etapes: LigneEtape[];
  qualite: Qualite;
  paliers: LignePalier[];
  /** La métrique du pilote : payé PUIS accepté PUIS sans reprise. */
  payesAcceptesSansReprise: number;
  /** Acceptés et payés, mais la reprise n'a pas été renseignée. L'écart à ne pas cacher. */
  payesAcceptesRepriseInconnue: number;
};

export type DonneesTunnel = {
  contacts: { date_envoi: string | null; contact_auto_le: string | null }[];
  evenements: {
    type: TypeEvenementParcours;
    motif: string | null;
    minutes: number | null;
    dossier_id: string | null;
    created_at: string;
  }[];
  artisans: { created_at: string }[];
  dossiers: {
    id: string;
    statut: StatutDossier;
    created_at: string;
    tier_id: string | null;
    final_price_cents: number | null;
  }[];
  paiements: { dossier_id: string | null; statut: string; created_at: string }[];
  retours: {
    dossier_id: string;
    statut: string;
    reprise_demandee: boolean | null;
    updated_at: string;
  }[];
  appels: { dossier_id: string | null; cout_micro_usd: number | null; created_at: string }[];
  paliers: { id: string; name: string; price_cents: number }[];
};

/** Taux d'une étape à la suivante. `null` plutôt qu'un 0 % quand le dénominateur est vide ou non mesuré. */
export function taux(numerateur: number | null, denominateur: number | null): number | null {
  if (numerateur === null || denominateur === null || denominateur <= 0) return null;
  return numerateur / denominateur;
}

/** Dans la fenêtre ? `depuis === null` = depuis toujours. Une date absente n'est jamais dans la fenêtre. */
function dans(date: string | null | undefined, depuis: string | null): boolean {
  if (!date) return false;
  return depuis === null || date >= depuis;
}

/**
 * Recolle le tunnel à partir des lignes brutes. Fonction pure : c'est elle qui
 * porte les décisions de comptage, donc c'est elle qui se teste.
 *
 * @param depuis borne basse ISO incluse, ou `null` pour tout l'historique.
 */
export function agregerTunnel(d: DonneesTunnel, depuis: string | null): Tunnel {
  // --- Étape 1 : contact -----------------------------------------------------
  // Les deux voies de démarchage écrivent dans des colonnes distinctes (0050).
  // On additionne : le chevauchement (quelqu'un démarché deux fois) est déjà
  // surveillé par `/admin/sprint/pilotage`, qui l'affiche comme une anomalie. Le
  // dupliquer ici en le corrigeant en douce masquerait le problème.
  const contacts = d.contacts.filter(
    (c) => dans(c.date_envoi, depuis) || dans(c.contact_auto_le, depuis),
  ).length;

  const evenements = d.evenements.filter((e) => dans(e.created_at, depuis));
  const essais = evenements.filter((e) => e.type === "essai_commence").length;
  const lus = evenements.filter((e) => e.type === "devis_lu").length;
  const echecs = evenements.filter((e) => e.type === "devis_echec");

  const inscriptions = d.artisans.filter((a) => dans(a.created_at, depuis)).length;

  const dossiersFenetre = d.dossiers.filter((x) => dans(x.created_at, depuis));
  const completes = dossiersFenetre.filter((x) => STATUTS_COMPLETES.has(x.statut)).length;

  const paiementsPayes = d.paiements.filter((p) => p.statut === "paye");
  const paiementsFenetre = paiementsPayes.filter((p) => dans(p.created_at, depuis));

  const retoursFenetre = d.retours.filter((r) => dans(r.updated_at, depuis));
  const deposes = retoursFenetre.length;
  const acceptes = retoursFenetre.filter((r) => r.statut === "accepte").length;

  const etapes: LigneEtape[] = [
    { cle: "contact", libelle: "Contact", valeur: contacts, aide: "Démarchés, sprint manuel et campagne automatique réunis." },
    {
      cle: "visite",
      libelle: "Visite",
      // Assumé : le site n'a aucun analytics, et la politique de confidentialité
      // affichée le promet. Afficher un « 0 » ici ferait croire à zéro visiteur.
      valeur: null,
      aide: "Non mesuré : le site n'installe aucun traceur, et la page confidentialité l'annonce.",
    },
    { cle: "essai", libelle: "Essai commencé", valeur: essais, aide: "Un devis a été soumis à la lecture, avec ou sans compte." },
    { cle: "devis_lu", libelle: "Devis analysé", valeur: lus, aide: "La lecture a abouti et a prérempli le formulaire." },
    { cle: "inscription", libelle: "Inscription", valeur: inscriptions, aide: "Comptes artisans créés." },
    { cle: "dossier", libelle: "Dossier complété", valeur: completes, aide: "Dossiers créés dans la période et arrivés au moins à « prêt à déposer »." },
    { cle: "paiement", libelle: "Paiement", valeur: paiementsFenetre.length, aide: "Paiements encaissés." },
    { cle: "depose", libelle: "Pack déposé", valeur: deposes, aide: "Dépôts déclarés par l'artisan après envoi à l'organisme." },
    { cle: "accepte", libelle: "Dossier accepté", valeur: acceptes, aide: "Issue « accepté » déclarée par l'artisan." },
  ];

  // --- Qualité de service ----------------------------------------------------
  const lectures = essais;
  const echecsService = echecs.filter((e) => e.motif === "service_indisponible").length;
  const echecsIllisible = echecs.filter((e) => e.motif === "illisible").length;
  const minutesAssistance = evenements
    .filter((e) => e.type === "assistance")
    .reduce((n, e) => n + (e.minutes ?? 0), 0);

  const retoursRenseignes = retoursFenetre.filter((r) => r.reprise_demandee !== null).length;
  const reprisesDemandees = retoursFenetre.filter((r) => r.reprise_demandee === true).length;

  const qualite: Qualite = {
    lectures,
    // Un échec « non configuré » n'est pas un échec de lecture : rien n'a été
    // tenté. Le compter ferait passer une clé API absente pour un produit qui ne
    // sait pas lire les devis.
    echecsLecture: echecsService + echecsIllisible,
    echecsService,
    echecsIllisible,
    tauxEchecLecture: taux(echecsService + echecsIllisible, lectures),
    minutesAssistance,
    retoursRenseignes,
    reprisesDemandees,
    tauxReprise: taux(reprisesDemandees, retoursRenseignes),
    repriseInconnue: retoursFenetre.length - retoursRenseignes,
  };

  // --- Unit economics par palier --------------------------------------------
  const dossierParId = new Map(d.dossiers.map((x) => [x.id, x]));
  const dossiersPayesIds = new Set(
    paiementsFenetre.map((p) => p.dossier_id).filter((id): id is string => !!id),
  );

  const coutParDossier = new Map<string, { micro: number; incomplet: boolean }>();
  for (const a of d.appels) {
    if (!a.dossier_id) continue;
    const e = coutParDossier.get(a.dossier_id) ?? { micro: 0, incomplet: false };
    if (a.cout_micro_usd === null) e.incomplet = true;
    else e.micro += a.cout_micro_usd;
    coutParDossier.set(a.dossier_id, e);
  }

  const minutesParDossier = new Map<string, number>();
  for (const e of evenements) {
    if (e.type !== "assistance" || !e.dossier_id) continue;
    minutesParDossier.set(e.dossier_id, (minutesParDossier.get(e.dossier_id) ?? 0) + (e.minutes ?? 0));
  }

  const paliers: LignePalier[] = d.paliers.map((t) => {
    const ids = [...dossiersPayesIds].filter((id) => dossierParId.get(id)?.tier_id === t.id);
    let revenuCents = 0;
    let coutMicroUsd = 0;
    let coutIncomplet = false;
    let minutes = 0;
    for (const id of ids) {
      // `final_price_cents` est le prix RÉELLEMENT payé (remises et crédits de
      // parrainage déduits), pas le prix affiché du palier. Prendre `price_cents`
      // gonflerait le revenu de tout ce qui a été offert.
      revenuCents += dossierParId.get(id)?.final_price_cents ?? 0;
      const c = coutParDossier.get(id);
      if (c) {
        coutMicroUsd += c.micro;
        if (c.incomplet) coutIncomplet = true;
      }
      minutes += minutesParDossier.get(id) ?? 0;
    }
    return {
      palier: t.name,
      prixCents: t.price_cents,
      dossiersPayes: ids.length,
      revenuCents,
      coutMicroUsd,
      coutIncomplet,
      minutesAssistance: minutes,
    };
  });

  // --- La métrique principale -----------------------------------------------
  // Payé ET accepté ET sans reprise. Les trois conditions, dans cet ordre : un
  // dossier accepté qu'on n'a pas fait payer ne prouve pas qu'on sait vendre, et
  // un dossier accepté après correction ne prouve pas que le contrôle marche.
  const retourParDossier = new Map(d.retours.map((r) => [r.dossier_id, r]));
  let payesAcceptesSansReprise = 0;
  let payesAcceptesRepriseInconnue = 0;
  for (const id of dossiersPayesIds) {
    const r = retourParDossier.get(id);
    if (r?.statut !== "accepte") continue;
    if (r.reprise_demandee === false) payesAcceptesSansReprise += 1;
    else if (r.reprise_demandee === null) payesAcceptesRepriseInconnue += 1;
  }

  return { etapes, qualite, paliers, payesAcceptesSansReprise, payesAcceptesRepriseInconnue };
}
