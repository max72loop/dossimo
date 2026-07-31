import { editeur } from "@/lib/legal/editeur";

/**
 * Adresse de repli du cluster « refus », affichée quand la soumission ne peut pas
 * aboutir (quota atteint, limiteur en panne, écriture refusée).
 *
 * Elle vit ici et non dans `actions.ts` pour une raison de contrainte, pas de
 * goût : un module `"use server"` ne peut exporter que des fonctions asynchrones.
 * La constante y était exportée sans que rien ne l'importe encore, donc sans que
 * le build ait eu l'occasion de le dire. Le formulaire, lui, en a besoin côté
 * client, ce qui rendait l'erreur inévitable dès le premier import.
 */
export const EMAIL_REPLI = editeur.emailContact;
