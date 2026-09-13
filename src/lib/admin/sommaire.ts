import "server-only";

import { chargerContacts } from "@/lib/contacts/liste";
import { etatFile } from "@/lib/prospection/file";
import { chargerTunnel, FENETRE_JOURS } from "@/lib/mesure/tunnel-charge";
import { chargerInventaire } from "@/lib/admin/inventaire";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Les chiffres du jour du sommaire `/admin`, indexés par `href` de console.
 *
 * Le sommaire n'était qu'une liste de cartes : il fallait ouvrir chaque
 * console pour savoir s'il y avait quelque chose à y faire. Ici, chaque carte
 * dit d'elle-même « 12 à relire » ou « 3 à relancer », et le sommaire devient
 * le point d'entrée de la journée.
 *
 * Deux règles :
 *
 *  - **Aucun chiffre n'est recalculé.** Chaque indicateur vient de la lecture
 *    que la console elle-même utilise (`etatFile`, `chargerContacts`,
 *    `chargerTunnel`, `chargerInventaire`) : le sommaire et la console ne
 *    peuvent pas se contredire.
 *  - **Une panne casse la page.** Un `?? 0` afficherait « 0 à relire » sur une
 *    base injoignable, et la journée passerait sans que la file soit validée.
 *    Toutes les lectures appelées ici lèvent déjà sur `error` ; les comptages
 *    directs ci-dessous font pareil.
 */
export type Indicateur = {
  valeur: number | string;
  libelle: string;
  ton?: "neutre" | "alerte";
};

export type Indicateurs = Record<string, Indicateur[]>;

export async function chargerIndicateurs(): Promise<Indicateurs> {
  const admin = createAdminClient();

  /** Comptage `head: true`, fail loud, pour les tables sans lecture partagée. */
  const compter = async (
    libelle: string,
    requete: PromiseLike<{ count: number | null; error: { message: string } | null }>,
  ) => {
    const { count, error } = await requete;
    if (error) throw new Error(`Sommaire admin, ${libelle} : ${error.message}`);
    return count ?? 0;
  };

  const [file, contacts, tunnel, inventaire, depotsEnCours, depotsRefuses, reglesActives, modelesAValider] =
    await Promise.all([
      etatFile(),
      // `aRelancer` seul : la page 1 suffit, on ne lit que `total` et `comptes`.
      chargerContacts({ aRelancer: true, page: 1 }),
      chargerTunnel(),
      chargerInventaire(),
      compter("dépôts en cours", admin.from("retours_depot").select("dossier_id", { count: "exact", head: true }).eq("statut", "en_cours")),
      compter("dépôts refusés", admin.from("retours_depot").select("dossier_id", { count: "exact", head: true }).eq("statut", "refuse")),
      compter("règles actives", admin.from("regles_metier").select("id", { count: "exact", head: true }).eq("actif", true)),
      compter("modèles à valider", admin.from("quote_templates").select("id", { count: "exact", head: true }).eq("placeholder", true)),
    ]);

  const payesSemaine = tunnel.semaine.etapes.find((e) => e.cle === "paiement")?.valeur ?? null;

  const indicateurs: Indicateurs = {
    "/admin/contacts": [
      { valeur: contacts.total, libelle: "à relancer", ton: contacts.total > 0 ? "alerte" : "neutre" },
      { valeur: contacts.comptes.nouveaux, libelle: "nouveaux ce mois" },
    ],
    "/admin/prospection": [
      { valeur: file.enAttente, libelle: "à relire", ton: file.enAttente > 0 ? "alerte" : "neutre" },
      { valeur: file.valides, libelle: "validés en attente" },
      { valeur: `${file.envoyes} / ${file.plafond}`, libelle: "partis aujourd'hui" },
    ],
    "/admin/tunnel": [
      // `null` = étape non instrumentée : « — », jamais 0 (DESIGN.md §6).
      { valeur: payesSemaine === null ? "—" : payesSemaine, libelle: `payés sur ${FENETRE_JOURS} j` },
      { valeur: tunnel.total.payesAcceptesSansReprise, libelle: "acceptés sans reprise" },
    ],
    "/admin/pilotage": [
      { valeur: depotsEnCours, libelle: "dépôts en cours" },
      { valeur: depotsRefuses, libelle: "refusés", ton: depotsRefuses > 0 ? "alerte" : "neutre" },
    ],
    "/admin/regles": [{ valeur: reglesActives, libelle: "règles actives" }],
    "/admin/devis": [
      { valeur: modelesAValider, libelle: "modèles à valider", ton: modelesAValider > 0 ? "alerte" : "neutre" },
    ],
    "/admin/donnees": [
      { valeur: inventaire.resume.total, libelle: "dossiers" },
      { valeur: inventaire.resume.suspects, libelle: "suspects (test ?)", ton: inventaire.resume.suspects > 0 ? "alerte" : "neutre" },
    ],
  };

  // La pause a son propre bandeau sur la console ; ici on ne signale que ce
  // qui bloque sans que personne l'ait décidé.
  if (file.blocage && !file.campagne?.en_pause) {
    indicateurs["/admin/prospection"].push({ valeur: "!", libelle: file.blocage, ton: "alerte" });
  }

  return indicateurs;
}
