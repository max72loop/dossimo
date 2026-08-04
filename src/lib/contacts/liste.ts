import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { choisirAccroche } from "@/lib/sprint/accroches";
import type { CanalEchange, EtatContact } from "@/lib/database.types";

/**
 * Lecture du fichier de prospection refondu (migrations 0057 / 0058).
 *
 * Remplace `src/lib/sprint/lot.ts`, qui préparait un « lot du jour » par bras
 * d'un A/B abandonné. Le modèle ne connaît plus de bras : il connaît des
 * contacts et leurs échanges, et la console filtre là-dedans.
 *
 * Tout passe par `contacts_synthese`, jamais par `contacts` directement : la vue
 * porte l'historique agrégé (dernier contact, canal de réponse, à relancer) que
 * chaque écran redemanderait sinon contact par contact.
 *
 * Service-role obligatoire : RLS fermée sans policy, grants retirés à
 * anon/authenticated (0057 §8).
 */

/** Combien de contacts par page. PostgREST plafonne de toute façon à 1 000. */
export const TAILLE_PAGE = 50;

/** Au-delà, un contact silencieux mérite une relance (ancien « J+5 » du sprint). */
export const DELAI_RELANCE_JOURS = 5;

export type FiltreContacts = {
  /** Recherche libre : dénomination, nom, ville, code postal, SIREN. */
  q?: string;
  etat?: EtatContact | "tous";
  /** Contacts joignables par ce canal, indépendamment de ce qu'on leur a déjà envoyé. */
  joignable?: CanalEchange | "tous";
  /** Silencieux depuis plus de DELAI_RELANCE_JOURS. */
  aRelancer?: boolean;
  /** Apparus dans l'annuaire RGE depuis le 1er du mois courant. */
  nouveaux?: boolean;
  page?: number;
};

export type ContactListe = {
  id: string;
  siren: string;
  denomination: string | null;
  nom: string | null;
  city: string | null;
  codePostal: string | null;
  telephone: string | null;
  telephoneMobile: boolean;
  emailPrincipal: string | null;
  emailValide: boolean;
  emails: string[];
  website: string | null;
  rgeDomaines: string[];
  /** Libellé de métier déduit des domaines RGE, pour situer l'artisan d'un coup d'œil. */
  metier: string;
  etat: EtatContact;
  dernierContactLe: string | null;
  dernierCanal: CanalEchange | null;
  canauxUtilises: CanalEchange[];
  nbSollicitations: number;
  nbReponses: number;
  nbAppels: number;
  reponduLe: string | null;
  canalDeReponse: CanalEchange | null;
  aRelancer: boolean;
  joursDepuisContact: number | null;
  premiereVueLe: string;
  sortiDuRgeLe: string | null;
};

export type ComptesEtat = Record<EtatContact | "total" | "nouveaux", number>;

export type StatCanal = {
  canal: CanalEchange;
  touches: number;
  repondeurs: number;
  stops: number;
  premiers: number;
  relances: number;
  ouvreurs: number;
  /** null = aucun envoi sur ce canal. On n'affiche pas un pourcentage calculé sur rien. */
  tauxReponse: number | null;
};

export type PageContacts = {
  contacts: ContactListe[];
  total: number;
  page: number;
  nbPages: number;
  comptes: ComptesEtat;
  stats: StatCanal[];
};

/** Premier jour du mois courant, heure de Paris, au format YYYY-MM-DD. */
export function debutDuMoisParis(d: Date = new Date()): string {
  const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(d);
  return `${jour.slice(0, 7)}-01`;
}

/** Jour - n en heure de Paris, au format ISO. Sert la borne « à relancer ». */
function ilYAJours(n: number, d: Date = new Date()): string {
  return new Date(d.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Littéral et non tableau joint : `select()` déduit le type des lignes de la
 * CHAÎNE elle-même. Un `join()` produit un `string` opaque, et Supabase retombe
 * alors sur un type d'erreur générique qui fait perdre tout contrôle sur les
 * noms de colonnes.
 */
// prettier-ignore
const CHAMPS = "id, siren, denomination, nom, city, code_postal, telephone, telephone_mobile, email_principal, email_valide, emails, website, rge_domaines, etat, premiere_vue_le, sorti_du_rge_le, dernier_contact_le, dernier_canal, canaux_utilises, nb_sollicitations, nb_reponses, nb_appels, repondu_le, canal_de_reponse, a_relancer, jours_depuis_contact";

/**
 * Construit la clause `or` de la recherche libre.
 *
 * Les virgules, parenthèses et astérisques sont la syntaxe même de `or` côté
 * PostgREST : laissées passer, elles ne provoquent pas une erreur mais une
 * requête qui ne veut plus rien dire, et l'écran affiche alors sereinement le
 * mauvais résultat. On les retire, puis on COMPACTE les blancs : les retirer
 * sans compacter laisserait « Dupont, (Nord) » devenir « Dupont   Nord », qui
 * ne correspond à aucune dénomination réelle.
 *
 * Limite assumée : le motif reste une seule sous-chaîne, donc « Dupont Nord »
 * ne trouvera pas « Dupont et Fils Nord ». Une recherche par mots isolés
 * multiplierait les clauses pour un gain nul sur un fichier de 3 300 lignes.
 */
export function clauseRecherche(q: string): string {
  const motif = `*${q.replace(/[(),*]/g, " ").replace(/\s+/g, " ").trim()}*`;
  const clauses = [
    `denomination.ilike.${motif}`,
    `nom.ilike.${motif}`,
    `city.ilike.${motif}`,
    `code_postal.ilike.${motif}`,
    `email_principal.ilike.${motif}`,
  ];
  const siren = q.replace(/\D/g, "");
  if (siren.length >= 3) clauses.push(`siren.ilike.*${siren}*`);
  return clauses.join(",");
}

/** Une page de contacts, plus les compteurs d'en-tête. */
export async function chargerContacts(f: FiltreContacts = {}): Promise<PageContacts> {
  const admin = createAdminClient();
  const page = Math.max(1, f.page ?? 1);
  const debut = (page - 1) * TAILLE_PAGE;

  // Les filtres sont chaînés ici plutôt que dans un helper générique : le
  // typage de PostgREST contraint le nom de colonne à un littéral connu, et un
  // helper qui accepte `string` perd cette vérification, donc la protection
  // contre une colonne mal orthographiée.
  let requete = admin.from("contacts_synthese").select(CHAMPS, { count: "exact" });

  const q = f.q?.trim();
  if (q) requete = requete.or(clauseRecherche(q));
  if (f.etat && f.etat !== "tous") requete = requete.eq("etat", f.etat);

  if (f.joignable && f.joignable !== "tous") {
    // « Joignable » décrit la coordonnée disponible, pas l'historique : c'est ce
    // qui permet de constituer une liste d'appels sans jamais deviner un numéro.
    if (f.joignable === "telephone") requete = requete.not("telephone", "is", null);
    else if (f.joignable === "whatsapp" || f.joignable === "sms") requete = requete.eq("telephone_mobile", true);
    else if (f.joignable === "email") requete = requete.eq("email_valide", true);
  }

  if (f.aRelancer) {
    // Recalculé ici plutôt que filtré sur la colonne `a_relancer` de la vue :
    // PostgREST ne pousse pas un filtre sur une expression agrégée dans le
    // GROUP BY. La borne reste identique à celle que la vue applique.
    requete = requete
      .eq("etat", "contacte")
      .lt("dernier_contact_le", ilYAJours(DELAI_RELANCE_JOURS));
  }

  if (f.nouveaux) requete = requete.gte("premiere_vue_le", debutDuMoisParis());

  const [liste, comptes, stats] = await Promise.all([
    requete
      // Les plus récemment touchés d'abord : on veut voir en haut ce qui bouge,
      // pas l'ordre alphabétique d'un fichier figé.
      .order("dernier_contact_le", { ascending: false, nullsFirst: false })
      .order("siren", { ascending: true })
      .range(debut, debut + TAILLE_PAGE - 1),
    chargerComptes(),
    chargerStatsCanal(),
  ]);

  if (liste.error) throw new Error(`Lecture des contacts : ${liste.error.message}`);

  const contacts: ContactListe[] = (liste.data ?? []).map((r) => {
    const rge = (r.rge_domaines ?? []).filter(Boolean) as string[];
    return {
      id: r.id,
      siren: r.siren,
      denomination: r.denomination,
      nom: r.nom,
      city: r.city,
      codePostal: r.code_postal,
      telephone: r.telephone,
      telephoneMobile: r.telephone_mobile === true,
      emailPrincipal: r.email_principal,
      emailValide: r.email_valide === true,
      emails: (r.emails ?? []).filter(Boolean) as string[],
      website: r.website,
      rgeDomaines: rge,
      metier: choisirAccroche(rge).accroche.metier,
      etat: r.etat,
      dernierContactLe: r.dernier_contact_le,
      dernierCanal: r.dernier_canal,
      canauxUtilises: (r.canaux_utilises ?? []) as CanalEchange[],
      nbSollicitations: Number(r.nb_sollicitations ?? 0),
      nbReponses: Number(r.nb_reponses ?? 0),
      nbAppels: Number(r.nb_appels ?? 0),
      reponduLe: r.repondu_le,
      canalDeReponse: r.canal_de_reponse,
      aRelancer: r.a_relancer === true,
      joursDepuisContact: r.jours_depuis_contact,
      premiereVueLe: r.premiere_vue_le,
      sortiDuRgeLe: r.sorti_du_rge_le,
    };
  });

  const total = liste.count ?? 0;
  return {
    contacts,
    total,
    page,
    nbPages: Math.max(1, Math.ceil(total / TAILLE_PAGE)),
    comptes,
    stats,
  };
}

/** Répartition par état, plus les nouveaux du mois. Compteurs d'en-tête. */
export async function chargerComptes(): Promise<ComptesEtat> {
  const admin = createAdminClient();
  const base = () => admin.from("contacts").select("id", { count: "exact", head: true });
  const etats: EtatContact[] = [
    "jamais_contacte", "contacte", "en_discussion", "client", "refus", "injoignable",
  ];

  const [total, nouveaux, ...parEtat] = await Promise.all([
    base(),
    base().gte("premiere_vue_le", debutDuMoisParis()),
    ...etats.map((e) => base().eq("etat", e)),
  ]);

  const erreur = [total, nouveaux, ...parEtat].find((r) => r.error);
  if (erreur?.error) throw new Error(`Comptes contacts : ${erreur.error.message}`);

  const comptes = {
    total: total.count ?? 0,
    nouveaux: nouveaux.count ?? 0,
  } as ComptesEtat;
  etats.forEach((e, i) => {
    comptes[e] = parEtat[i].count ?? 0;
  });
  return comptes;
}

/**
 * Performance par canal. C'est la réponse à « lesquels répondent par WhatsApp,
 * lesquels par e-mail » au niveau agrégé : le canal d'une réponse est une donnée
 * du journal, plus une déduction.
 */
export async function chargerStatsCanal(): Promise<StatCanal[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("stats_canal").select("*");
  if (error) throw new Error(`Statistiques par canal : ${error.message}`);
  return (data ?? [])
    .map((r) => ({
      canal: r.canal,
      touches: Number(r.touches ?? 0),
      repondeurs: Number(r.repondeurs ?? 0),
      stops: Number(r.stops ?? 0),
      premiers: Number(r.premiers ?? 0),
      relances: Number(r.relances ?? 0),
      ouvreurs: Number(r.ouvreurs ?? 0),
      tauxReponse: r.taux_reponse === null ? null : Number(r.taux_reponse),
    }))
    .sort((a, b) => b.touches - a.touches);
}

export type EchangeAffiche = {
  id: string;
  canal: CanalEchange;
  sens: "sortant" | "entrant";
  nature: string;
  issue: string | null;
  survenuLe: string;
  automatique: boolean;
  commentaire: string | null;
};

/** L'historique complet d'un contact, du plus récent au plus ancien. */
export async function chargerEchanges(contactId: string): Promise<EchangeAffiche[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("contact_echanges")
    .select("id, canal, sens, nature, issue, survenu_le, automatique, commentaire")
    .eq("contact_id", contactId)
    .order("survenu_le", { ascending: false });
  if (error) throw new Error(`Lecture des échanges : ${error.message}`);
  return (data ?? []).map((e) => ({
    id: e.id,
    canal: e.canal,
    sens: e.sens,
    nature: e.nature,
    issue: e.issue,
    survenuLe: e.survenu_le,
    automatique: e.automatique,
    commentaire: e.commentaire,
  }));
}
