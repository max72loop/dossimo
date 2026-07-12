import Link from "next/link";
import { FolderOpen } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getCurrentArtisan } from "@/lib/auth/get-artisan";
import { TYPES_ISOLATION, type TypeIsolation } from "@/lib/dossier/cee-isolation";
import { PaywallCta } from "@/components/dossier/paywall-cta";
import { prixPack, getActiveTiers } from "@/lib/pricing";
import { estimerPrime } from "@/lib/dossier/prime";
import { getAdminEmail } from "@/lib/auth/is-admin";
import { ETAPE_PAR_STATUT, PARCOURS } from "@/lib/dossier/parcours";
import { controlerDossier } from "@/lib/rules/controle-dossier";
import { fusionnerRapport } from "@/lib/rules/controle-pieces";
import { chargerPlafonds, findingsDesPieces } from "@/lib/dossier/rapport";
import { versEcarts } from "@/lib/piece/get";
import { suivrePieces, type SuiviPieces } from "@/lib/depot/suivi";
import type { DossierComplet } from "@/lib/dossier/get-dossier";
import type { PieceJustificative } from "@/lib/database.types";
import { TableauDeBord, type StatsTableau } from "@/components/dossier/tableau-de-bord";

export const metadata = { title: "Mes dossiers · Dossimo" };

// Parcours partagé (liste + page dossier). Repli sur « Nouveau » si l'état n'est
// pas encore reconnu (migration 0007 du parcours pas encore appliquée).
const STATUT = ETAPE_PAR_STATUT;

const euro = (n: number | null) =>
  n == null ? "—" : n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const date = (s: string) => new Date(s).toLocaleDateString("fr-FR");

type Beneficiaire = { prenom?: string; nom?: string };

export default async function DossiersPage() {
  const artisan = await getCurrentArtisan();
  // Le layout garantit l'auth ; ce garde-fou satisfait le typage.
  if (!artisan) return null;

  const supabase = await createClient();
  const { data: dossiers } = await supabase
    .from("dossiers")
    .select(
      "id, statut, dispositif, type_travaux, commune, code_postal, montant_estime, created_at, caracteristiques_techniques_json, dates_json, pieces_vues_at",
    )
    .order("created_at", { ascending: false });

  const rows = dossiers ?? [];
  const adminEmail = await getAdminEmail();

  // Accès (paiement) calculé pour toute la liste. Le dossier le plus ancien est
  // offert (§10) ; les autres nécessitent un paiement encaissé.
  const { data: paiements } = await supabase
    .from("paiements")
    .select("dossier_id, montant")
    .eq("statut", "paye");
  const paidSet = new Set((paiements ?? []).map((p) => p.dossier_id));
  const revenu = (paiements ?? []).reduce((s, p) => s + (Number(p.montant) || 0), 0);
  // rows est trié du plus récent au plus ancien → le dernier est le plus ancien.
  const gratuitId = rows.length ? rows[rows.length - 1].id : null;
  const acces = (id: string): "gratuit" | "paye" | "verrouille" =>
    id === gratuitId ? "gratuit" : paidSet.has(id) ? "paye" : "verrouille";

  // Règles actives (1 requête) pour évaluer la conformité de chaque dossier.
  const { data: regles } = await supabase
    .from("regles_metier")
    .select("dispositif, type_travaux, condition_json")
    .eq("actif", true);
  const reglesMap = new Map(
    (regles ?? []).map((r) => [
      `${r.dispositif}:${r.type_travaux}`,
      { condition: r.condition_json, pieces: [], mentions: [], version: 1, versionFormulaire: null },
    ]),
  );

  // Pièces réelles de TOUS les dossiers affichés, en une seule requête, puis
  // réparties. Sans elles, la liste jugerait sur la seule saisie et annoncerait
  // « conforme » un dossier que la page dossier déclare bloquant, écarts et mentions
  // manquantes à l'appui : deux verdicts pour un même dossier.
  const idsDossiers = rows.map((d) => d.id);
  const [{ data: toutesPieces }, plafonds] = await Promise.all([
    idsDossiers.length
      ? supabase
          .from("pieces_justificatives")
          .select("*")
          .in("dossier_id", idsDossiers)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as PieceJustificative[] }),
    chargerPlafonds(supabase),
  ]);
  const piecesParDossier = new Map<string, PieceJustificative[]>();
  for (const p of toutesPieces ?? []) {
    const liste = piecesParDossier.get(p.dossier_id) ?? [];
    liste.push(p);
    piecesParDossier.set(p.dossier_id, liste);
  }

  // Statistiques du tableau de bord.
  const parEtat = Object.fromEntries(
    PARCOURS.map((e) => [e.statut, 0]),
  ) as StatsTableau["parEtat"];
  let conformes = 0;
  let baseConformite = 0;
  // Paliers de prix chargés une fois (grille en base) puis appliqués par ligne.
  const tiers = await getActiveTiers(supabase);
  const prixParDossier = new Map<string, string>();
  // Résumé de contrôle par dossier : sert d'aperçu (compteur de bloquants) sur
  // les lignes verrouillées, sans exposer le détail (voir page dossier).
  const controleParDossier = new Map<
    string,
    { nbBloquants: number; conforme: boolean }
  >();
  // Où en sont les pièces que seul le client peut fournir, et ce qui est arrivé
  // depuis le dernier passage de l'artisan sur le dossier.
  const suiviParDossier = new Map<string, SuiviPieces>();
  for (const d of rows) {
    parEtat[d.statut] = (parEtat[d.statut] ?? 0) + 1;
    try {
      const data = {
        dossier: { id: d.id, dispositif: d.dispositif },
        artisan: null,
        caracteristiques: d.caracteristiques_techniques_json,
        dates: d.dates_json,
        regle: reglesMap.get(`${d.dispositif}:${d.type_travaux}`) ?? null,
      } as unknown as DossierComplet;
      baseConformite += 1;
      const piecesDuDossier = piecesParDossier.get(d.id) ?? [];
      // Même moteur que la page dossier : saisie + pièces réelles.
      const rapport = fusionnerRapport(
        controlerDossier(data),
        findingsDesPieces(data, versEcarts(data, piecesDuDossier), plafonds),
      );
      if (rapport.conforme) conformes += 1;
      suiviParDossier.set(
        d.id,
        suivrePieces(data, piecesDuDossier, d.pieces_vues_at),
      );
      controleParDossier.set(d.id, {
        nbBloquants: rapport.nbBloquants,
        conforme: rapport.conforme,
      });
      const aide = estimerPrime(data);
      prixParDossier.set(
        d.id,
        prixPack(aide ? Math.round(aide.montant * 100) : null, tiers).label,
      );
    } catch {
      // dossier incomplet : exclu du calcul de conformité.
    }
  }
  const suivis = [...suiviParDossier.values()];
  const stats: StatsTableau = {
    total: rows.length,
    parEtat,
    payes: paidSet.size,
    revenu,
    conformes,
    tauxConformite: baseConformite ? Math.round((conformes / baseConformite) * 100) : null,
    nouvellesPieces: suivis.reduce((n, s) => n + s.nouvelles, 0),
    dossiersAvecNouveautes: suivis.filter((s) => s.nouvelles > 0).length,
    dossiersEnAttenteClient: suivis.filter((s) => s.attendues > 0 && !s.complet).length,
  };

  return (
    <div className="mx-auto max-w-[1280px] px-8 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-encre">
            Mes dossiers
          </h1>
          {/* Construite en JS : le transform JSX avale l'espace qui suit une
              interpolation, et l'accueil affichait « Bonjour Marc· vos dossiers ». */}
          <p className="mt-2 text-ardoise">
            {`Bonjour ${artisan.prenom} · vos dossiers MaPrimeRénov' et CEE, au même endroit.`}
          </p>
        </div>
        {adminEmail && (
          <Link
            href="/admin/regles"
            className="shrink-0 rounded border border-filigrane bg-blanc-casse px-3 py-1.5 text-xs font-medium text-ardoise transition hover:bg-papier"
          >
            ⚙ Règles métier
          </Link>
        )}
      </div>

      {rows.length > 0 && (
        <div className="mt-8">
          <TableauDeBord stats={stats} />
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded border border-dashed border-filigrane bg-blanc-casse px-6 py-16 text-center">
          <FolderOpen className="h-8 w-8 text-encre-claire" strokeWidth={1.5} />
          <p className="mt-4 font-serif text-lg font-semibold text-encre">
            Aucun dossier pour l&rsquo;instant
          </p>
          <p className="mt-1 max-w-sm text-sm text-ardoise">
            Créez votre premier dossier CEE isolation : le pack et le contrôle
            anti-refus se génèrent depuis une saisie unique.
          </p>
          <Link
            href="/dossiers/nouveau"
            className="mt-6 inline-flex h-11 items-center rounded bg-terre-cuite px-5 text-sm font-medium text-blanc-casse transition-colors hover:bg-terre-cuite-hover"
          >
            Créer un dossier
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded border border-filigrane bg-blanc-casse shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-filigrane bg-papier-fonce text-xs text-ardoise">
                <tr>
                  <th className="px-5 py-3 font-medium">Bénéficiaire</th>
                  <th className="px-5 py-3 font-medium">Poste</th>
                  <th className="px-5 py-3 font-medium">Commune</th>
                  <th className="px-5 py-3 font-medium">Prime estimée</th>
                  <th className="px-5 py-3 font-medium">Créé le</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium">Pièces client</th>
                  <th className="px-5 py-3 font-medium">Accès / paiement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-filigrane">
                {rows.map((d) => {
                  const carac = d.caracteristiques_techniques_json as unknown as {
                    beneficiaire?: Beneficiaire;
                  } | null;
                  const b = carac?.beneficiaire;
                  const poste = TYPES_ISOLATION[d.type_travaux as TypeIsolation];
                  const st = STATUT[d.statut] ?? PARCOURS[0];
                  return (
                    <tr
                      key={d.id}
                      className="group relative cursor-pointer transition-colors hover:bg-papier"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/dossiers/${d.id}`}
                          className="font-medium text-encre transition-colors group-hover:text-tampon"
                        >
                          {/* Overlay « stretched link » : rend toute la ligne cliquable. */}
                          <span className="absolute inset-0" aria-hidden="true" />
                          {b ? `${b.prenom ?? ""} ${b.nom ?? ""}`.trim() || "—" : "—"}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-ardoise">
                        {poste ? poste.label : d.type_travaux}
                      </td>
                      <td className="px-5 py-3 text-ardoise">
                        {d.commune ?? "—"}
                        {d.code_postal ? (
                          <span className="ml-1 font-mono text-xs text-encre-claire">
                            {d.code_postal}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-encre">
                        {euro(d.montant_estime)}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-ardoise">
                        {date(d.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${st.cls}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>
                      {/* Ce que le client a déposé, et ce qui vient d'arriver. Sans
                          ce signal, une pièce qui bascule le dossier en refus attend
                          que l'artisan rouvre le dossier par hasard. */}
                      <td className="px-5 py-3">
                        {(() => {
                          const s = suiviParDossier.get(d.id);
                          if (!s || s.attendues === 0) {
                            return <span className="text-xs text-encre-claire">—</span>;
                          }
                          return (
                            <span className="inline-flex items-center gap-2">
                              <span
                                className={`font-mono text-xs ${
                                  s.complet ? "text-succes" : "text-ardoise"
                                }`}
                              >
                                {s.recues}/{s.attendues}
                              </span>
                              {s.nouvelles > 0 ? (
                                <span className="relative z-10 inline-flex items-center gap-1 rounded-full bg-info-bg px-2 py-0.5 text-[10px] font-semibold text-info">
                                  <span className="h-1.5 w-1.5 rounded-full bg-info" />
                                  {s.nouvelles} nouvelle{s.nouvelles > 1 ? "s" : ""}
                                </span>
                              ) : null}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-3">
                        {acces(d.id) === "gratuit" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-tampon/10 px-2.5 py-1 text-xs font-medium text-tampon">
                            <span className="h-1.5 w-1.5 rounded-full bg-tampon" />
                            Offert
                          </span>
                        ) : acces(d.id) === "paye" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-succes-bg px-2.5 py-1 text-xs font-medium text-succes">
                            <span className="h-1.5 w-1.5 rounded-full bg-succes" />
                            Débloqué
                          </span>
                        ) : (
                          // relative z-10 : le CTA de paiement reste cliquable au-dessus
                          // de l'overlay qui rend toute la ligne cliquable.
                          <div className="relative z-10 flex w-fit flex-col items-start gap-1.5">
                            <PaywallCta dossierId={d.id} prix={prixParDossier.get(d.id) ?? "149 €"} compact />
                            {(() => {
                              const ctrl = controleParDossier.get(d.id);
                              if (!ctrl) return null;
                              return ctrl.nbBloquants > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-erreur-bg px-2 py-0.5 text-[10px] font-medium text-erreur">
                                  {ctrl.nbBloquants} bloquant{ctrl.nbBloquants > 1 ? "s" : ""}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-succes-bg px-2 py-0.5 text-[10px] font-medium text-succes">
                                  Aucun bloquant
                                </span>
                              );
                            })()}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
