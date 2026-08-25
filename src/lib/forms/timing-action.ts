"use server";

import { signerOuvertureFormulaire } from "@/lib/forms/timing";

/**
 * Émet un jeton d'ouverture frais, appelé au montage des formulaires publics.
 *
 * Séparé d'un prop passé par la page serveur : `/` (landing) est pré-rendue en
 * statique, donc un jeton généré dans le composant serveur y serait figé à
 * l'heure du build et daterait de plusieurs jours pour tout visiteur — le
 * délai minimal serait toujours franchi, et la protection neutralisée sans
 * que rien ne le signale. L'appel client garantit un jeton horodaté à
 * l'affichage réel, quelle que soit la stratégie de rendu de la page.
 */
export async function obtenirJetonOuverture(): Promise<string | null> {
  return signerOuvertureFormulaire();
}
