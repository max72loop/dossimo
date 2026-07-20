/**
 * Cadence d'envoi : quand on a le droit d'envoyer, et combien.
 *
 * Fonctions pures, testables, sans accès base ni horloge implicite : la date
 * courante est toujours passée en argument.
 *
 * Tout est calculé en heure de Paris. Le serveur tourne en UTC : un envoi
 * planifié « 9h30 » sans conversion partirait à 11h30 en été, hors de la fenêtre
 * où un artisan lit ses mails.
 *
 * Décision 2026-07-18 : la campagne prospecte 7 jours sur 7 (le sprint contacte
 * aussi le week-end). Il n'y a donc plus de notion de jour ouvré ici ; le rythme
 * ne dépend que de la fenêtre horaire et de la montée en charge en jours
 * calendaires.
 */

/**
 * Montée en charge du volume quotidien, par jour calendaire de campagne
 * (jour 1 = `demarre_le`). Une boîte qui n'a jamais envoyé en masse et qui sort
 * 40 messages dès le premier jour se fait classer en spam, et la réputation d'un
 * domaine se répare beaucoup plus lentement qu'elle ne se casse : on démarre à
 * 15 et on monte en quatre paliers jusqu'à 40.
 *
 * Au-delà du dernier palier, le plafond de la campagne (`daily_cap_max`) prend
 * le relais.
 */
export const RAMPE_MONTEE_EN_CHARGE = [15, 25, 35, 40] as const;

/**
 * Fenêtre d'envoi, en minutes depuis minuit (heure de Paris).
 *
 * Fermeture repoussée à 18h30 le 2026-07-19 : GitHub Actions lance les exécutions
 * planifiées avec un retard régulier de une à deux heures, et un tick qui arrivait
 * à 18h10 était refusé alors qu'il restait de la file à écouler. Une demi-heure de
 * marge en fin de journée coûte peu et sauve les derniers envois.
 */
export const FENETRE = { debut: 9 * 60 + 30, fin: 18 * 60 + 30 } as const;

/** Date du jour au format `YYYY-MM-DD`, en heure de Paris. */
export function jourParis(maintenant: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(maintenant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Minutes écoulées depuis minuit, en heure de Paris. */
export function minutesParis(maintenant: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(maintenant);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  // `hour12: false` rend minuit « 24 » dans certaines implémentations d'ICU.
  const heure = get("hour") % 24;
  return heure * 60 + get("minute");
}

/** Nombre de jours calendaires entre deux dates incluses. 0 si `fin` précède `debut`. */
export function joursEntre(debut: string, fin: string): number {
  if (fin < debut) return 0;
  const [a1, m1, j1] = debut.split("-").map(Number);
  const [a2, m2, j2] = fin.split("-").map(Number);
  const ms = Date.UTC(a2, m2 - 1, j2) - Date.UTC(a1, m1 - 1, j1);
  return Math.round(ms / 86_400_000) + 1;
}

/**
 * Plafond d'envois pour la journée : palier de montée en charge tant qu'on est
 * dans les premiers jours de la campagne, plafond de la campagne ensuite.
 *
 * Renvoie 0 en dehors de la fenêtre de campagne. Aucun filtre week-end : la
 * décision du 2026-07-18 est de prospecter tous les jours, la montée en charge
 * se compte donc en jours calendaires.
 */
export function plafondDuJour(params: {
  debut: string;
  fin: string;
  jour: string;
  capMax: number;
}): number {
  const { debut, fin, jour, capMax } = params;
  if (jour < debut || jour > fin) return 0;

  const index = joursEntre(debut, jour); // 1 = premier jour de campagne
  if (index <= 0) return 0;

  const palier =
    index <= RAMPE_MONTEE_EN_CHARGE.length
      ? RAMPE_MONTEE_EN_CHARGE[index - 1]
      : capMax;
  return Math.min(palier, capMax);
}

/** Décalage de Paris sur UTC, en minutes, à un instant donné (120 en été, 60 en hiver). */
function decalageParisMinutes(instant: Date): number {
  const nom = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    timeZoneName: "longOffset",
  })
    .formatToParts(instant)
    .find((p) => p.type === "timeZoneName")?.value;
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(nom ?? "");
  if (!m) return 0;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

/**
 * Instant UTC de minuit à Paris, pour la journée parisienne qui contient
 * `maintenant`. Sert à compter ce qui est réellement sorti aujourd'hui.
 *
 * Le décalage est relu sur le candidat obtenu au premier passage : les deux jours
 * de changement d'heure, l'offset à minuit UTC n'est pas celui de minuit à Paris,
 * et une borne fausse d'une heure décale le comptage du plafond.
 */
export function debutJourParis(maintenant: Date): Date {
  const [annee, mois, jour] = jourParis(maintenant).split("-").map(Number);
  const minuitUtc = Date.UTC(annee, mois - 1, jour);
  const premier = minuitUtc - decalageParisMinutes(new Date(minuitUtc)) * 60_000;
  return new Date(minuitUtc - decalageParisMinutes(new Date(premier)) * 60_000);
}

/** Vrai si l'instant tombe dans la fenêtre horaire d'envoi (tous les jours). */
export function dansLaFenetre(maintenant: Date): boolean {
  const minutes = minutesParis(maintenant);
  return minutes >= FENETRE.debut && minutes <= FENETRE.fin;
}
