/**
 * Import de la liste de prospects, depuis un CSV collé dans l'admin.
 *
 * Parseur maison (RFC 4180 : guillemets, guillemets doublés, retours à la ligne
 * dans un champ). Une dépendance de plus pour trois colonnes ne se justifie pas.
 *
 * Ce module ne fait AUCUN accès base : il valide, normalise et déduplique le
 * fichier. Les exclusions qui demandent la base (suppressions, artisans déjà
 * clients) sont appliquées à l'insertion, dans `import.ts`.
 */

/** Colonnes reconnues. `email` et `source` sont les seules obligatoires. */
export const COLONNES = [
  "email",
  "prenom",
  "nom",
  "entreprise",
  "ville",
  "code_postal",
  "source",
] as const;

export interface LigneProspect {
  email: string;
  prenom: string | null;
  nom: string | null;
  entreprise: string | null;
  ville: string | null;
  code_postal: string | null;
  source: string;
}

export interface ResultatParse {
  lignes: LigneProspect[];
  /** Lignes écartées, avec leur numéro (1 = première ligne de données). */
  rejets: Array<{ ligne: number; valeur: string; motif: string }>;
}

/** Découpe un CSV en tableau de cellules. Gère `,` et `;` comme séparateurs. */
export function decouper(texte: string): string[][] {
  const contenu = texte.replace(/\r\n?/g, "\n").trim();
  if (!contenu) return [];

  // Séparateur déduit de l'en-tête : les exports français utilisent `;`.
  const entete = contenu.split("\n")[0];
  const sep =
    (entete.match(/;/g)?.length ?? 0) > (entete.match(/,/g)?.length ?? 0)
      ? ";"
      : ",";

  const lignes: string[][] = [];
  let cellule = "";
  let ligne: string[] = [];
  let dansGuillemets = false;

  for (let i = 0; i < contenu.length; i++) {
    const c = contenu[i];

    if (dansGuillemets) {
      if (c === '"') {
        if (contenu[i + 1] === '"') {
          cellule += '"';
          i++;
        } else {
          dansGuillemets = false;
        }
      } else {
        cellule += c;
      }
      continue;
    }

    if (c === '"') {
      dansGuillemets = true;
    } else if (c === sep) {
      ligne.push(cellule);
      cellule = "";
    } else if (c === "\n") {
      ligne.push(cellule);
      lignes.push(ligne);
      ligne = [];
      cellule = "";
    } else {
      cellule += c;
    }
  }
  ligne.push(cellule);
  lignes.push(ligne);

  return lignes;
}

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}$/i;

/**
 * Adresses génériques : légitimes en B2B, mais impossibles à personnaliser et
 * plus souvent surveillées par des filtres. On les garde, sans prénom.
 */
export function estAdresseGenerique(email: string): boolean {
  return /^(contact|info|accueil|commercial|secretariat|devis|admin|no-?reply)@/i.test(
    email,
  );
}

/**
 * Parse le CSV et renvoie les lignes exploitables. `sourceParDefaut` est utilisée
 * quand le fichier n'a pas de colonne `source` : cette information est obligatoire
 * (RGPD art. 14, on doit dire au destinataire d'où vient son adresse), donc on la
 * demande dans le formulaire d'import plutôt que de la deviner.
 */
export function parserProspects(
  texte: string,
  sourceParDefaut: string,
): ResultatParse {
  const grille = decouper(texte);
  const rejets: ResultatParse["rejets"] = [];
  if (grille.length < 2) {
    return { lignes: [], rejets };
  }

  const entete = grille[0].map((c) => c.trim().toLowerCase());
  const index = (nom: string) => entete.indexOf(nom);
  const iEmail = index("email");
  if (iEmail === -1) {
    return {
      lignes: [],
      rejets: [
        { ligne: 0, valeur: grille[0].join(","), motif: "colonne « email » absente" },
      ],
    };
  }

  const champ = (ligne: string[], nom: string): string | null => {
    const i = index(nom);
    if (i === -1) return null;
    const v = (ligne[i] ?? "").trim();
    return v === "" ? null : v;
  };

  const lignes: LigneProspect[] = [];
  const vues = new Set<string>();

  for (let n = 1; n < grille.length; n++) {
    const brut = grille[n];
    const email = (brut[iEmail] ?? "").trim().toLowerCase();

    if (!email) continue; // ligne vide en fin de fichier
    if (!EMAIL.test(email)) {
      rejets.push({ ligne: n, valeur: email, motif: "adresse invalide" });
      continue;
    }
    if (vues.has(email)) {
      rejets.push({ ligne: n, valeur: email, motif: "doublon dans le fichier" });
      continue;
    }
    vues.add(email);

    lignes.push({
      email,
      prenom: estAdresseGenerique(email) ? null : champ(brut, "prenom"),
      nom: champ(brut, "nom"),
      entreprise: champ(brut, "entreprise"),
      ville: champ(brut, "ville"),
      code_postal: champ(brut, "code_postal"),
      source: champ(brut, "source") ?? sourceParDefaut,
    });
  }

  return { lignes, rejets };
}
