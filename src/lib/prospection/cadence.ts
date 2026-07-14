/**
 * Cadence d'envoi : quand on a le droit d'envoyer, et combien.
 *
 * Fonctions pures, testables, sans accès base ni horloge implicite : la date
 * courante est toujours passée en argument.
 *
 * Tout est calculé en heure de Paris. Le serveur tourne en UTC : un envoi
 * planifié « 9h30 » sans conversion partirait à 11h30 en été, hors de la fenêtre
 * où un artisan lit ses mails.
 */

/**
 * Montée en charge d'une boîte neuve, par jour ouvré de campagne. Une adresse
 * qui n'a jamais envoyé et qui sort 40 messages le premier jour se fait classer
 * en spam, et la réputation d'un domaine se répare beaucoup plus lentement
 * qu'elle ne se casse.
 *
 * Au-delà du dernier palier, le plafond de la campagne (`daily_cap_max`) prend
 * le relais.
 */
export const RAMPE_MONTEE_EN_CHARGE = [10, 15, 20, 30] as const;

/** Fenêtre d'envoi, en minutes depuis minuit (heure de Paris). */
export const FENETRE = { debut: 9 * 60 + 30, fin: 17 * 60 + 30 } as const;

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

/** Lundi = 1 … dimanche = 7, à partir d'une date `YYYY-MM-DD`. */
function jourDeLaSemaine(iso: string): number {
  const [a, m, j] = iso.split("-").map(Number);
  const jour = new Date(Date.UTC(a, m - 1, j)).getUTCDay();
  return jour === 0 ? 7 : jour;
}

export function estJourOuvre(iso: string): boolean {
  return jourDeLaSemaine(iso) <= 5;
}

/** Nombre de jours ouvrés entre deux dates incluses. 0 si `fin` précède `debut`. */
export function joursOuvresEntre(debut: string, fin: string): number {
  if (fin < debut) return 0;
  let compte = 0;
  const [a, m, j] = debut.split("-").map(Number);
  const curseur = new Date(Date.UTC(a, m - 1, j));
  for (let i = 0; i < 400; i++) {
    const iso = curseur.toISOString().slice(0, 10);
    if (iso > fin) break;
    if (estJourOuvre(iso)) compte++;
    curseur.setUTCDate(curseur.getUTCDate() + 1);
  }
  return compte;
}

/**
 * Plafond d'envois pour la journée : palier de montée en charge tant qu'on est
 * dans les premiers jours ouvrés de la campagne, plafond de la campagne ensuite.
 *
 * Renvoie 0 hors de la fenêtre de campagne et les jours non ouvrés : un mail de
 * prospection qui tombe un dimanche est un mail lu lundi, dans une pile, ou pas
 * lu du tout.
 */
export function plafondDuJour(params: {
  debut: string;
  fin: string;
  jour: string;
  capMax: number;
}): number {
  const { debut, fin, jour, capMax } = params;
  if (jour < debut || jour > fin) return 0;
  if (!estJourOuvre(jour)) return 0;

  const index = joursOuvresEntre(debut, jour); // 1 = premier jour ouvré
  if (index <= 0) return 0;

  const palier =
    index <= RAMPE_MONTEE_EN_CHARGE.length
      ? RAMPE_MONTEE_EN_CHARGE[index - 1]
      : capMax;
  return Math.min(palier, capMax);
}

/** Vrai si l'instant tombe dans la fenêtre d'envoi d'un jour ouvré. */
export function dansLaFenetre(maintenant: Date): boolean {
  const jour = jourParis(maintenant);
  if (!estJourOuvre(jour)) return false;
  const minutes = minutesParis(maintenant);
  return minutes >= FENETRE.debut && minutes <= FENETRE.fin;
}
