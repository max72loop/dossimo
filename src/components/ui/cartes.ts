/**
 * Cartes de l'espace artisan — parti « cartes flottantes » (DESIGN.md §5).
 *
 * Source unique du traitement de carte, comme `boutons.ts` l'est pour les
 * actions. Sur le web : ombre douce sur le crème, coins bien arrondis, PAS de
 * bordure (la sémantique passe par le fond teinté ou le badge, jamais un aplat
 * plein saturé). Le PDF, lui, garde des cartes bordées (`pdf-theme.ts`) car
 * l'ombre ne tient pas à l'impression N/B.
 */

/** Carte flottante principale (blocs de premier plan). */
export const CARTE = "rounded-2xl bg-blanc-casse p-6 shadow-lg";

/** Carte flottante secondaire, relief plus discret. */
export const CARTE_SM = "rounded-2xl bg-blanc-casse p-5 shadow-md";

/** Bloc imbriqué DANS une carte flottante : pas d'ombre, fond légèrement teinté. */
export const CARTE_INTERNE = "rounded-xl bg-papier/50 p-4";
