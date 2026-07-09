import type { QualificationRge } from "./types";

const BASE =
  "https://data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2/lines";
const TIMEOUT_MS = 8000;

export interface ResultatRge {
  /** false = annuaire injoignable (contrôle dégradé, ne pas bloquer là-dessus). */
  disponible: boolean;
  qualifications: QualificationRge[];
}

/** Ne garde que la partie AAAA-MM-JJ d'une date (les champs ADEME sont déjà ISO). */
function isoDate(s: unknown): string | null {
  if (typeof s !== "string" || !s) return null;
  const m = s.match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}

/**
 * Liste les qualifications RGE d'un SIRET dans l'annuaire ADEME / France Rénov'
 * (API data-fair publique, sans clé). La lecture des champs est défensive : le
 * schéma du dataset peut varier au fil des versions.
 */
export async function qualificationsRgeParSiret(
  siret: string,
): Promise<ResultatRge> {
  const url = `${BASE}?qs=${encodeURIComponent(`siret:"${siret}"`)}&size=100`;
  let json: unknown;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { disponible: false, qualifications: [] };
    json = await res.json();
  } catch {
    return { disponible: false, qualifications: [] };
  }

  const rows =
    (json as { results?: Record<string, unknown>[] })?.results ?? [];
  const qualifications = rows.map(
    (r): QualificationRge => ({
      numero: String(r.code_qualification ?? ""),
      qualification: String(r.nom_qualification ?? r.nom_certificat ?? ""),
      domaine: String(r.domaine ?? ""),
      meta_domaine: (r.meta_domaine as string | undefined) ?? null,
      organisme: (r.organisme as string | undefined) ?? null,
      date_debut: isoDate(r.lien_date_debut),
      date_fin: isoDate(r.lien_date_fin),
    }),
  );
  return { disponible: true, qualifications };
}
