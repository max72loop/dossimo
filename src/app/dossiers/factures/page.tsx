import Link from "next/link";
import { Download, FolderOpen, ReceiptText, TriangleAlert } from "lucide-react";

import { listerFactures } from "@/lib/factures/get-facture";
import type { LigneFacture } from "@/lib/factures/get-facture";
import { mentionsIncompletes } from "@/lib/legal/editeur";
import { formatEuros } from "@/lib/format/montant";
import { createClient } from "@/lib/supabase/server";
import { CARTE, CARTE_LISTE } from "@/components/ui/cartes";
import { BTN_PRINCIPAL, BTN_SECONDAIRE, FOCUS } from "@/components/ui/boutons";
import type { Facture } from "@/lib/database.types";

export const metadata = { title: "Factures"};

function dateFr(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR");
}

/** Ce qui a été facturé, lu dans l'instantané figé à l'émission. */
function designation(facture: Facture): string | null {
  const lignes = (Array.isArray(facture.lignes_json)
    ? facture.lignes_json
    : []) as unknown as LigneFacture[];
  const premiere = lignes[0]?.designation?.trim();
  if (!premiere) return null;
  return lignes.length > 1 ? `${premiere} et ${lignes.length - 1} autre${lignes.length > 2 ? "s" : ""}` : premiere;
}

type Beneficiaire = { prenom?: string; nom?: string };

/**
 * De quel chantier vient chaque facture. Sans ce libellé, un artisan qui cherche
 * « la facture du chantier Dupont » n'a qu'une suite de numéros à parcourir.
 * Requête auth-scopée : la RLS ne renvoie que ses dossiers.
 */
async function chantiersParDossier(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dossiers")
    .select("id, commune, caracteristiques_techniques_json")
    .in("id", ids);
  // Libellé purement indicatif : son absence dégrade l'affichage, elle ne doit
  // pas emporter la page. La facture, elle, reste listée avec son numéro.
  if (error) return new Map();
  return new Map(
    (data ?? []).map((d) => {
      const b = (d.caracteristiques_techniques_json as { beneficiaire?: Beneficiaire } | null)
        ?.beneficiaire;
      const nom = [b?.prenom, b?.nom].filter(Boolean).join(" ").trim();
      return [d.id, nom || d.commune || "Dossier"];
    }),
  );
}

export default async function FacturesPage() {
  let factures: Facture[];
  try {
    factures = await listerFactures();
  } catch {
    // Une erreur se dit et propose une reprise (DESIGN.md §5). Surtout, on
    // n'annonce pas « Aucune facture » quand on n'a simplement pas pu lire.
    return (
      <div className="mx-auto max-w-5xl px-8 py-12 xl:px-10">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-encre">Factures</h1>
        <div className={`mt-8 ${CARTE}`} role="alert">
          <p className="flex items-center gap-2 font-serif text-lg font-semibold text-erreur">
            <TriangleAlert className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            Vos factures n&apos;ont pas pu être chargées
          </p>
          <p className="mt-2 text-sm text-ardoise">
            Rien n&apos;est perdu : elles restent enregistrées. Réessayez dans un
            instant, et écrivez-nous si le problème persiste.
          </p>
          <Link href="/dossiers/factures" className={`mt-6 ${BTN_SECONDAIRE}`}>
            Réessayer
          </Link>
        </div>
      </div>
    );
  }

  const indisponible = mentionsIncompletes();
  const chantiers = await chantiersParDossier([
    ...new Set(factures.map((f) => f.dossier_id).filter((v): v is string => Boolean(v))),
  ]);

  // Regroupement par année : c'est la maille dont l'artisan a besoin pour son
  // comptable, et elle évite qu'une liste plate devienne un mur au bout de
  // quelques dizaines de dossiers. `factures` arrive déjà triée par date
  // décroissante, donc chaque groupe l'est aussi.
  const parAnnee = new Map<number, Facture[]>();
  for (const f of factures) {
    const liste = parAnnee.get(f.annee) ?? [];
    liste.push(f);
    parAnnee.set(f.annee, liste);
  }
  const annees = [...parAnnee.entries()].sort((a, b) => b[0] - a[0]);
  const totalCents = factures.reduce((s, f) => s + f.total_ttc_cents, 0);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 xl:px-10">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-encre">
        Factures
      </h1>
      <p className="mt-2 text-ardoise">
        Une facture est émise automatiquement à chaque paiement encaissé.
      </p>

      {factures.length > 0 && (
        <p className="mt-4 font-mono text-sm tabular-nums text-ardoise">
          {factures.length} facture{factures.length > 1 ? "s" : ""} · {formatEuros(totalCents / 100)} au total
        </p>
      )}

      {/* Le bandeau ne concerne que l'identité de l'ÉDITEUR (Dossimo), pas celle
          de l'artisan : il n'a aucune action à mener. On le tait donc quand il
          n'y a aucune facture à télécharger, où il ne serait que du bruit. */}
      {indisponible && factures.length > 0 && (
        <p
          className="mt-6 flex items-start gap-2 rounded border-l-4 border-avertissement bg-avertissement-bg px-4 py-3 text-sm text-avertissement"
          role="status"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>
            Le téléchargement est momentanément indisponible, le temps que nous
            complétions l&apos;identité de l&apos;émetteur. Vous n&apos;avez rien à
            faire : vos factures sont enregistrées et resteront accessibles.
          </span>
        </p>
      )}

      {factures.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl bg-blanc-casse px-6 py-16 text-center shadow-lg">
          <ReceiptText className="h-8 w-8 text-encre-claire" strokeWidth={1.5} aria-hidden="true" />
          <p className="mt-4 font-serif text-lg font-semibold text-encre">
            Aucune facture
          </p>
          <p className="mt-1 max-w-sm text-sm text-ardoise">
            Vos factures apparaîtront ici dès votre premier dossier payé, sans
            aucune démarche de votre part.
          </p>
          {/* Un vide n'est jamais un blanc : il propose une sortie (DESIGN.md §5). */}
          <Link href="/dossiers" className={`mt-6 ${BTN_PRINCIPAL}`}>
            Voir mes dossiers
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {annees.map(([annee, lignes]) => {
            const totalAnnee = lignes.reduce((s, f) => s + f.total_ttc_cents, 0);
            return (
              <section key={annee} className={CARTE_LISTE} aria-labelledby={`annee-${annee}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-filigrane px-5 py-4">
                  <h2 id={`annee-${annee}`} className="font-serif text-xl font-semibold text-encre">
                    {annee}
                  </h2>
                  <p className="font-mono text-xs tabular-nums text-ardoise">
                    {lignes.length} facture{lignes.length > 1 ? "s" : ""} · {formatEuros(totalAnnee / 100)}
                  </p>
                </div>

                <ul className="divide-y divide-filigrane">
                  {lignes.map((f) => {
                    const objet = designation(f);
                    const chantier = f.dossier_id ? chantiers.get(f.dossier_id) : null;
                    return (
                      <li
                        key={f.id}
                        className="px-5 py-4 transition-colors hover:bg-papier/60 sm:flex sm:items-center sm:gap-6"
                      >
                        <div className="min-w-0 sm:flex-1">
                          <p className="font-mono text-sm font-medium tabular-nums text-encre">
                            {f.numero}
                          </p>
                          <p className="mt-0.5 truncate text-sm text-ardoise">
                            {objet ?? "Prestation Dossimo"}
                          </p>
                          {chantier && f.dossier_id ? (
                            <Link
                              href={`/dossiers/${f.dossier_id}`}
                              className={`mt-1 inline-block truncate text-xs text-tampon underline-offset-4 hover:underline ${FOCUS}`}
                            >
                              Chantier {chantier}
                            </Link>
                          ) : null}
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-4 sm:mt-0 sm:shrink-0 sm:justify-end sm:gap-6">
                          <time
                            dateTime={f.emise_le}
                            className="font-mono text-xs tabular-nums text-ardoise sm:w-24 sm:text-right"
                          >
                            {dateFr(f.emise_le)}
                          </time>
                          <span className="font-mono text-sm font-semibold tabular-nums text-encre sm:w-28 sm:text-right">
                            {formatEuros(f.total_ttc_cents / 100)}
                          </span>
                          {indisponible ? (
                            <span className="text-xs text-encre-claire sm:w-24 sm:text-right">
                              Indisponible
                            </span>
                          ) : (
                            <Link
                              href={`/factures/${f.id}/facture.pdf`}
                              target="_blank"
                              className={`inline-flex h-11 items-center gap-1.5 text-sm text-tampon underline-offset-4 hover:underline sm:h-auto sm:w-24 sm:justify-end ${FOCUS}`}
                            >
                              <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                              PDF
                              <span className="sr-only"> de la facture {f.numero}</span>
                            </Link>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {factures.length > 0 && (
        <p className="mt-8 flex items-center gap-2 text-xs text-encre-claire">
          <FolderOpen className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          Conservez vos factures : elles vous sont demandées en cas de contrôle.
        </p>
      )}
    </div>
  );
}
