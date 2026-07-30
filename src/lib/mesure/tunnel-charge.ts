import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { agregerTunnel, type DonneesTunnel, type Tunnel } from "@/lib/mesure/tunnel";

/**
 * Chargement des lignes brutes du tunnel, puis agrégation en TypeScript.
 *
 * Les erreurs remontent, elles ne sont pas avalées : contrairement au journal de
 * mesure (`journal.ts`, fail-soft assumé), ce chemin-ci porte bien une promesse
 * à un humain. Un tableau de bord qui affiche des zéros parce qu'une requête a
 * échoué est pire que pas de tableau de bord : on prend des décisions sur du
 * vide en croyant lire du réel.
 */

/** Fenêtre courte du tableau de bord. Hebdomadaire, comme la revue qu'elle sert. */
export const FENETRE_JOURS = 7;

export type TunnelComplet = {
  /** Ce que la semaine a produit. */
  semaine: Tunnel;
  /** Tout l'historique : à l'échelle d'un pilote, c'est souvent le seul chiffre non nul. */
  total: Tunnel;
  depuis: string;
};

export async function chargerTunnel(): Promise<TunnelComplet> {
  const admin = createAdminClient();
  const depuis = new Date(Date.now() - FENETRE_JOURS * 24 * 60 * 60 * 1000).toISOString();

  const [contacts, evenements, artisans, dossiers, paiements, retours, appels, paliers] =
    await Promise.all([
      admin.from("prospects_dossimo").select("date_envoi, contact_auto_le"),
      admin.from("evenements_parcours").select("type, motif, minutes, dossier_id, created_at"),
      admin.from("artisans").select("created_at"),
      admin.from("dossiers").select("id, statut, created_at, tier_id, final_price_cents"),
      admin.from("paiements").select("dossier_id, statut, created_at"),
      admin.from("retours_depot").select("dossier_id, statut, reprise_demandee, updated_at"),
      admin.from("appels_llm").select("dossier_id, cout_micro_usd, created_at"),
      admin.from("pricing_tiers").select("id, name, price_cents").eq("active", true),
    ]);

  const echec = [contacts, evenements, artisans, dossiers, paiements, retours, appels, paliers].find(
    (r) => r.error,
  );
  if (echec?.error) throw new Error(`Tunnel : ${echec.error.message}`);

  const donnees: DonneesTunnel = {
    contacts: contacts.data ?? [],
    evenements: evenements.data ?? [],
    artisans: artisans.data ?? [],
    dossiers: dossiers.data ?? [],
    paiements: paiements.data ?? [],
    retours: retours.data ?? [],
    appels: appels.data ?? [],
    paliers: paliers.data ?? [],
  };

  return {
    semaine: agregerTunnel(donnees, depuis),
    total: agregerTunnel(donnees, null),
    depuis,
  };
}
