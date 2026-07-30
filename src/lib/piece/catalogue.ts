import type { TypePiece } from "@/lib/database.types";

/**
 * Le catalogue des pièces : libellés, ce que l'artisan peut déposer lui-même,
 * limites d'envoi. Source unique, comme `boutons.ts` l'est pour les actions.
 *
 * Ces valeurs vivaient recopiées dans quatre endroits : la table `TYPE_LABEL` de
 * `pieces-justificatives.tsx`, la table `LIBELLE` de `checklist-pieces.tsx`, le
 * `TYPES_ARTISAN` de `piece/actions.ts` et un `TAILLE_MAX = 15 Mo` redéfini dans
 * chaque Server Action qui reçoit un fichier. La zone de dépôt n'offrait d'ailleurs
 * que « devis » et « facture » là où le serveur en accepte neuf : la liste affichée
 * et la liste autorisée avaient déjà divergé.
 *
 * Aucune règle métier ici : ce que le dossier EXIGE reste décidé par
 * `regles_metier` via `piecesCeeIsolation` (CLAUDE.md §11). Ce fichier ne dit que
 * comment on nomme une pièce et qui la dépose.
 */

/** Nom d'une pièce, tel qu'on le montre à l'artisan. */
export const LIBELLE_PIECE: Record<TypePiece, string> = {
  devis: "Devis",
  facture: "Facture",
  qualification_rge: "Certificat RGE",
  fiche_technique: "Fiche technique",
  cadre_contribution: "Cadre de contribution",
  attestation_honneur: "Attestation sur l'honneur",
  photo_avant: "Photo avant travaux",
  photo_apres: "Photo après travaux",
  autre: "Autre document",
  // Déposées par le bénéficiaire via son lien de dépôt.
  avis_imposition: "Avis d'imposition",
  piece_identite: "Pièce d'identité",
  titre_propriete: "Titre de propriété",
  rib: "RIB",
  attestation_bailleur: "Engagement de bailleur",
};

/**
 * Ce que l'ARTISAN dépose, dans l'ordre où on le lui propose. Les pièces du
 * bénéficiaire (identité, avis d'imposition, titre, RIB, engagement de bailleur)
 * n'y sont pas : elles passent par son lien de dépôt, et l'artisan ne doit pas
 * pouvoir les verser à sa place.
 */
export const TYPES_ARTISAN = [
  "devis",
  "facture",
  "qualification_rge",
  "fiche_technique",
  "cadre_contribution",
  "attestation_honneur",
  "photo_avant",
  "photo_apres",
  "autre",
] as const satisfies readonly TypePiece[];

export type TypeArtisan = (typeof TYPES_ARTISAN)[number];

const ARTISAN = new Set<string>(TYPES_ARTISAN);

export function estTypeArtisan(type: TypePiece): type is TypeArtisan {
  return ARTISAN.has(type);
}

/**
 * Les seules pièces dont le contenu est LU par le modèle. Elles seules portent les
 * caractéristiques du chantier et les mentions exigées par la fiche, donc elles
 * seules peuvent contredire la saisie (cf. `piece/actions.ts`). C'est aussi ce qui
 * justifie d'annoncer une attente plus longue à l'écran sur ces deux-là.
 */
export const TYPES_LUS = new Set<TypePiece>(["devis", "facture"]);

/** Libellé d'un bouton de dépôt ciblé (checklist, raccourcis de la zone de dépôt). */
export const LIBELLE_DEPOT: Record<TypeArtisan, string> = {
  devis: "Déposer le devis",
  facture: "Déposer la facture",
  qualification_rge: "Déposer le certificat",
  fiche_technique: "Déposer la fiche",
  cadre_contribution: "Déposer le cadre",
  attestation_honneur: "Déposer l'attestation",
  photo_avant: "Photo avant",
  photo_apres: "Photo après",
  autre: "Déposer",
};

/** Taille maximale d'une pièce, à l'envoi comme à la réception : 15 Mo. */
export const TAILLE_MAX_PIECE = 15 * 1024 * 1024;

/** Formats acceptés, pour l'attribut `accept` d'un `input[type=file]`. */
export const ACCEPT_DOCUMENT = "image/jpeg,image/png,image/webp,application/pdf";

/** Mêmes formats, sans le PDF : ce que l'appareil photo peut produire. */
export const ACCEPT_PHOTO = "image/jpeg,image/png,image/webp";

/**
 * Type deviné d'après le nom du fichier. L'artisan dépose « Facture_Dupont.pdf »
 * ou « devis-2026-04.pdf » : le lui faire reclasser à la main est un clic pour rien
 * dans neuf cas sur dix.
 *
 * Deviner n'est pas décider : le résultat est proposé, l'artisan le voit et peut le
 * corriger avant l'envoi. Sans indice, on renvoie `null` et on lui demande — un type
 * inventé enverrait le document au mauvais contrôle et cocherait la mauvaise case de
 * la checklist.
 */
export function devinerType(nomFichier: string): TypeArtisan | null {
  const n = nomFichier
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Un nom de document explicite l'emporte toujours sur « avant / après », qui
  // n'est qu'un indice de repli : « devis-avant-travaux.pdf » est un devis, pas
  // une photo.
  if (/factur/.test(n)) return "facture";
  if (/devis|proposition|estimation/.test(n)) return "devis";
  if (/rge|qualibat|qualifelec|qualisol|qualipac|certificat|qualification/.test(n)) {
    return "qualification_rge";
  }
  if (/fiche[^a-z]*tech|technique|notice|documentation/.test(n)) return "fiche_technique";
  if (/cadre|contribution/.test(n)) return "cadre_contribution";
  if (/attestation|honneur/.test(n)) return "attestation_honneur";
  if (/avant|before/.test(n) && !/avantage/.test(n)) return "photo_avant";
  if (/apres|after/.test(n)) return "photo_apres";

  return null;
}
