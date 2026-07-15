import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Inventaire des dossiers pour la console de nettoyage admin (`/admin/donnees`).
 *
 * Lecture seule : on charge chaque dossier avec son artisan et le décompte de
 * ses pièces, puis on calcule des *signaux* qui laissent penser qu'il s'agit
 * d'une saisie de test. Ces signaux ne suppriment RIEN — ils pré-signalent des
 * lignes que l'admin valide ensuite à la main dans le tableau.
 */

export interface DossierInventaire {
  id: string;
  dispositif: string;
  type_travaux: string;
  statut: string;
  commune: string | null;
  montant_estime: number | null;
  client_identifie: boolean;
  created_at: string;
  delivered_at: string | null;
  artisan: { nom: string; entreprise: string; email: string } | null;
  nbPieces: number;
  tailleFichiers: number; // octets, somme des pièces
  signaux: string[];
  suspect: boolean;
}

export interface ResumeInventaire {
  total: number;
  suspects: number;
  parDispositif: [string, number][];
  parStatut: [string, number][];
  pieces: number;
  tailleTotale: number; // octets
}

// Domaines et motifs d'e-mail jetables ou de test.
const EMAIL_JETABLE =
  /@(?:yopmail|mailinator|jetable|guerrillamail|trashmail|sharklasers|tempmail|example|test)\./i;
const EMAIL_TEST = /(?:^|[._+-])(?:test|demo|essai|fake|exemple|example)/i;
// Mots qui trahissent une saisie bidon dans un champ texte libre.
const TEXTE_TEST = /\b(?:test|demo|essai|azerty|qwerty|aaa+|xxx+|zzz+|lorem|toto|tata)\b/i;

const JOURS = 24 * 60 * 60 * 1000;

function calculerSignaux(d: {
  type_travaux: string;
  commune: string | null;
  client_identifie: boolean;
  montant_estime: number | null;
  delivered_at: string | null;
  created_at: string;
  nbPieces: number;
  artisan: { nom: string; entreprise: string; email: string } | null;
  maintenant: number;
}): { signaux: string[]; suspect: boolean } {
  const signaux: string[] = [];
  let fort = false;

  const email = d.artisan?.email ?? "";
  if (EMAIL_JETABLE.test(email) || EMAIL_TEST.test(email)) {
    signaux.push("e-mail de test");
    fort = true;
  }

  const champsTexte = [d.type_travaux, d.commune, d.artisan?.entreprise, d.artisan?.nom]
    .filter(Boolean)
    .join(" ");
  if (TEXTE_TEST.test(champsTexte)) {
    signaux.push("mot « test/demo » dans les champs");
    fort = true;
  }

  let faibles = 0;
  if (!d.client_identifie && (d.montant_estime === null || d.montant_estime === 0)) {
    signaux.push("client absent + montant nul");
    faibles++;
  }
  if (d.nbPieces === 0) {
    signaux.push("aucune pièce");
    faibles++;
  }
  const ageJours = (d.maintenant - new Date(d.created_at).getTime()) / JOURS;
  if (!d.delivered_at && ageJours > 14) {
    signaux.push("jamais livré, > 14 j");
    faibles++;
  }

  // Suspect si un signal fort (e-mail/texte de test) ou au moins deux signaux faibles.
  return { signaux, suspect: fort || faibles >= 2 };
}

export async function chargerInventaire(): Promise<{
  dossiers: DossierInventaire[];
  resume: ResumeInventaire;
}> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("dossiers")
    .select(
      "id, dispositif, type_travaux, statut, commune, montant_estime, client_identifie, created_at, delivered_at, artisans(nom, entreprise, email), pieces_justificatives(id, taille)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[inventaire] chargement dossiers:", error.message);
    throw new Error("Chargement de l'inventaire impossible.");
  }

  const maintenant = Date.now();
  const dossiers: DossierInventaire[] = (data ?? []).map((row) => {
    const pieces = (row.pieces_justificatives ?? []) as { id: string; taille: number | null }[];
    const artisan = (row.artisans ?? null) as
      | { nom: string; entreprise: string; email: string }
      | null;
    const nbPieces = pieces.length;
    const tailleFichiers = pieces.reduce((s, p) => s + (p.taille ?? 0), 0);
    const { signaux, suspect } = calculerSignaux({
      type_travaux: row.type_travaux,
      commune: row.commune,
      client_identifie: row.client_identifie,
      montant_estime: row.montant_estime,
      delivered_at: row.delivered_at,
      created_at: row.created_at,
      nbPieces,
      artisan,
      maintenant,
    });
    return {
      id: row.id,
      dispositif: row.dispositif,
      type_travaux: row.type_travaux,
      statut: row.statut,
      commune: row.commune,
      montant_estime: row.montant_estime,
      client_identifie: row.client_identifie,
      created_at: row.created_at,
      delivered_at: row.delivered_at,
      artisan,
      nbPieces,
      tailleFichiers,
      signaux,
      suspect,
    };
  });

  // Les suspects remontent en haut, puis tri par date décroissante (déjà appliqué).
  dossiers.sort((a, b) => Number(b.suspect) - Number(a.suspect));

  const compter = (cle: (d: DossierInventaire) => string) => {
    const m = new Map<string, number>();
    for (const d of dossiers) m.set(cle(d), (m.get(cle(d)) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  const resume: ResumeInventaire = {
    total: dossiers.length,
    suspects: dossiers.filter((d) => d.suspect).length,
    parDispositif: compter((d) => d.dispositif),
    parStatut: compter((d) => d.statut),
    pieces: dossiers.reduce((s, d) => s + d.nbPieces, 0),
    tailleTotale: dossiers.reduce((s, d) => s + d.tailleFichiers, 0),
  };

  return { dossiers, resume };
}
