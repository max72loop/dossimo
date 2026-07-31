import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Charge les motifs de refus depuis `refus_motifs`.
 *
 * Pourquoi le client service-role et pas le client public : `refus_motifs` est en
 * RLS SANS POLICY (migration 0053). Personne ne la lit avec la clé anon, pas plus
 * Googlebot qu'un visiteur. Ces pages sont publiques et rendues côté serveur, et
 * seul du contenu éditorial non nominatif en sort. C'est exactement le montage de
 * `gestes-loader.ts` pour `regles_metier`, et la raison est la même : on ne
 * rouvre pas un accès `anon` sur le schéma pour publier du texte.
 *
 * Dégradation gracieuse : base injoignable ou requête en erreur, on renvoie une
 * liste vide plutôt que de faire échouer le build. Les autres pages du cluster
 * restent servies, et aucune page motif n'est publiée à moitié.
 *
 * `publie = false` ne sort JAMAIS : un motif dont les assertions n'ont pas été
 * relues existe en base et n'a pas d'URL (docs/cluster-refus.md § 3.1 bis).
 */

export type MotifAide = "maprimerenov" | "cee" | "les_deux";

export interface MotifSection {
  heading: string;
  paragraphs: string[];
}

export interface MotifFaq {
  question: string;
  answer: string;
}

export interface RefusMotif {
  slug: string;
  libelle: string;
  aide: MotifAide;
  description: string;
  /**
   * « La décision peut-elle être utilement reprise sur ce motif ? » Un `false`
   * n'est pas un dossier perdu : c'est un défaut qui ne se répare pas sur CE
   * dossier. La nuance est portée par le texte du motif, jamais par ce booléen
   * seul, et aucun affichage ne doit le retourner en verdict.
   */
  contestable: boolean;
  metaTitle: string;
  metaDescription: string;
  sections: MotifSection[];
  faq: MotifFaq[];
  /** Date de dernière modification en base, `AAAA-MM-JJ`, pour le sitemap et le JSON-LD. */
  updated: string;
}

/** Ligne brute telle que sélectionnée, avant normalisation du JSON éditorial. */
interface MotifRow {
  slug: string;
  libelle: string;
  aide: string;
  description: string;
  contestable: boolean;
  meta_title: string;
  meta_description: string;
  contenu_json: unknown;
  updated_at: string;
}

const AIDES: readonly string[] = ["maprimerenov", "cee", "les_deux"];

function estObjet(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * `contenu_json` est un `jsonb` libre côté base : le type TypeScript ne prouve
 * rien sur sa forme. On ne fait donc pas confiance à la colonne, on la normalise.
 * Une section sans titre ou sans paragraphe est écartée plutôt que rendue vide.
 */
function lireSections(contenu: unknown): MotifSection[] {
  if (!estObjet(contenu) || !Array.isArray(contenu.sections)) return [];
  return contenu.sections.flatMap((brute): MotifSection[] => {
    if (!estObjet(brute)) return [];
    const heading = typeof brute.heading === "string" ? brute.heading.trim() : "";
    const paragraphs = Array.isArray(brute.paragraphs)
      ? brute.paragraphs.filter((p): p is string => typeof p === "string" && p.trim() !== "")
      : [];
    if (heading === "" || paragraphs.length === 0) return [];
    return [{ heading, paragraphs }];
  });
}

function lireFaq(contenu: unknown): MotifFaq[] {
  if (!estObjet(contenu) || !Array.isArray(contenu.faq)) return [];
  return contenu.faq.flatMap((brute): MotifFaq[] => {
    if (!estObjet(brute)) return [];
    const question = typeof brute.question === "string" ? brute.question.trim() : "";
    const answer = typeof brute.answer === "string" ? brute.answer.trim() : "";
    if (question === "" || answer === "") return [];
    return [{ question, answer }];
  });
}

function toMotif(row: MotifRow): RefusMotif | null {
  // Un motif sans section n'a pas de page : il occuperait une URL sans rien y
  // dire, ce que le chantier refuse explicitement (docs/cluster-refus.md § 3.1).
  const sections = lireSections(row.contenu_json);
  if (sections.length === 0) return null;
  if (!AIDES.includes(row.aide)) return null;

  return {
    slug: row.slug,
    libelle: row.libelle,
    aide: row.aide as MotifAide,
    description: row.description,
    contestable: row.contestable,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    sections,
    faq: lireFaq(row.contenu_json),
    updated: row.updated_at.slice(0, 10),
  };
}

export async function getMotifsPublies(): Promise<RefusMotif[]> {
  try {
    const { data, error } = await createAdminClient()
      .from("refus_motifs")
      .select(
        "slug,libelle,aide,description,contestable,meta_title,meta_description,contenu_json,updated_at",
      )
      .eq("publie", true)
      .order("libelle", { ascending: true });

    if (error || !data) return [];

    return (data as MotifRow[])
      .map(toMotif)
      .filter((motif): motif is RefusMotif => motif !== null);
  } catch {
    return [];
  }
}

export async function getMotifParSlug(slug: string): Promise<RefusMotif | null> {
  const motifs = await getMotifsPublies();
  return motifs.find((motif) => motif.slug === slug) ?? null;
}

/** Motifs qui concernent un dispositif : les siens, plus ceux communs aux deux. */
export function motifsPourAide(
  motifs: readonly RefusMotif[],
  aide: Exclude<MotifAide, "les_deux">,
): RefusMotif[] {
  return motifs.filter((motif) => motif.aide === aide || motif.aide === "les_deux");
}

/** Libellé d'affichage du dispositif concerné par un motif. */
export const LIBELLE_AIDE: Record<MotifAide, string> = {
  maprimerenov: "MaPrimeRénov’",
  cee: "CEE",
  les_deux: "MaPrimeRénov’ et CEE",
};
