import Link from "next/link";
import { FolderOpen } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getCurrentArtisan } from "@/lib/auth/get-artisan";
import { TYPES_ISOLATION, type TypeIsolation } from "@/lib/dossier/cee-isolation";
import { PaywallCta } from "@/components/dossier/paywall-cta";
import { prixPack, getActiveTiers } from "@/lib/pricing";
import { estimerPrime } from "@/lib/dossier/prime";
import { ETAPE_PAR_STATUT, PARCOURS } from "@/lib/dossier/parcours";
import { controlerDossier } from "@/lib/rules/controle-dossier";
import { fusionnerRapport } from "@/lib/rules/controle-pieces";
import { chargerPlafonds, findingsDesPieces } from "@/lib/dossier/rapport";
import { versEcarts } from "@/lib/piece/get";
import { suivrePieces, type SuiviPieces } from "@/lib/depot/suivi";
import type { DossierComplet } from "@/lib/dossier/get-dossier";
import type { PieceJustificative } from "@/lib/database.types";
import { TableauDeBord, type StatsTableau } from "@/components/dossier/tableau-de-bord";
import { ActionsPrioritaires, type ActionPrioritaire } from "@/components/dossier/actions-prioritaires";

export const metadata = { title: "Mes dossiers"};

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

  // Accès (paiement) calculé pour toute la liste. Le dossier le plus ancien est
  // offert (§10) ; les autres nécessitent un paiement encaissé.
  const { data: paiements } = await supabase
    .from("paiements")
    .select("dossier_id, montant")
    .eq("statut", "paye");
  const paidSet = new Set((paiements ?? []).map((p) => p.dossier_id));
  const revenu = (paiements ?? []).reduce((s, p) => s + (Number(p.montant) || 0), 0);
  const acces = (id: string): "paye" | "verrouille" =>
    paidSet.has(id) ? "paye" : "verrouille";

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
  const actionsPrioritaires: ActionPrioritaire[] = [];
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
      const suivi = suivrePieces(
        data,
        piecesDuDossier,
        d.pieces_vues_at,
      );
      suiviParDossier.set(
        d.id,
        suivi,
      );
      const beneficiaire = (d.caracteristiques_techniques_json as { beneficiaire?: Beneficiaire }).beneficiaire;
      const nomClient = [beneficiaire?.prenom, beneficiaire?.nom].filter(Boolean).join(" ") || "Bénéficiaire";
      if (d.statut === "pret_depot") {
        actionsPrioritaires.push({ dossierId: d.id, beneficiaire: nomClient, detail: "déposer le dossier", categorie: "depot" });
      } else if (d.statut !== "depose" && d.statut !== "livre") {
        const manquantes = suivi.attendues - suivi.recues;
        if (suivi.nouvelles > 0) {
          actionsPrioritaires.push({ dossierId: d.id, beneficiaire: nomClient, detail: `examiner ${suivi.nouvelles} nouvelle${suivi.nouvelles > 1 ? "s" : ""} pièce${suivi.nouvelles > 1 ? "s" : ""}`, categorie: "aujourdhui" });
        } else if (manquantes > 0) {
          actionsPrioritaires.push({ dossierId: d.id, beneficiaire: nomClient, detail: `relancer pour ${manquantes} pièce${manquantes > 1 ? "s" : ""} manquante${manquantes > 1 ? "s" : ""}`, categorie: "client" });
        } else {
          const premierBlocage = rapport.findings.find((finding) => finding.severite === "bloquant");
          actionsPrioritaires.push({
            dossierId: d.id,
            beneficiaire: nomClient,
            detail: premierBlocage ? `corriger : ${premierBlocage.titre.toLocaleLowerCase("fr-FR")}` : "compléter le dossier",
            categorie: "aujourdhui",
          });
        }
      }
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
    <div className="mx-auto max-w-[1440px] px-8 py-12 xl:px-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-tampon">Bonjour {artisan.prenom}</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-encre">Que faut-il faire aujourd’hui ?</h1>
          {/* Construite en JS : le transform JSX avale l'espace qui suit une
              interpolation, et l'accueil affichait « Bonjour Marc· vos dossiers ». */}
          <p className="mt-2 text-ardoise">
            Vos prochaines actions d’abord. Les chiffres et l’historique restent disponibles plus bas.
          </p>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="mt-8">
          <ActionsPrioritaires actions={actionsPrioritaires} />
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded border border-dashed border-filigrane bg-blanc-casse px-6 py-16 text-center">
          <FolderOpen className="h-8 w-8 text-encre-claire" strokeWidth={1.5} />
          <p className="mt-4 font-serif text-lg font-semibold text-encre">
            Aucun dossier pour l&rsquo;instant
          </p>
          <p className="mt-1 max-w-sm text-sm text-ardoise">
            Ajoutez simplement votre devis. Dossimo préremplit le dossier et vous guide jusqu’au dépôt.
          </p>
          <Link
            href="/dossiers/nouveau"
            className="mt-6 inline-flex h-11 items-center rounded bg-terre-cuite px-5 text-sm font-medium text-blanc-casse transition-colors hover:bg-terre-cuite-hover"
          >
            Déposer mon premier devis
          </Link>
        </div>
      ) : (
        <details className="mt-10 rounded-md border border-filigrane bg-blanc-casse">
          <summary className="cursor-pointer px-5 py-5 font-serif text-xl font-semibold text-encre transition hover:bg-papier-fonce/50 sm:px-6">
            Toute mon activité
            <span className="ml-3 font-sans text-sm font-normal text-ardoise">Statistiques, prix et historique des dossiers</span>
          </summary>
          <div className="border-t border-filigrane p-5 sm:p-6">
            <TableauDeBord stats={stats} />
        <div className="mt-6 space-y-3 md:hidden">
          {rows.map((d) => {
            const carac = d.caracteristiques_techniques_json as unknown as { beneficiaire?: Beneficiaire } | null;
            const b = carac?.beneficiaire;
            const st = STATUT[d.statut] ?? PARCOURS[0];
            const ctrl = controleParDossier.get(d.id);
            const suivi = suiviParDossier.get(d.id);
            return (
              <Link key={d.id} href={`/dossiers/${d.id}`} className="block rounded-lg border border-filigrane bg-blanc-casse p-4 shadow-sm transition active:bg-papier">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-lg font-semibold text-encre">{b ? `${b.prenom ?? ""} ${b.nom ?? ""}`.trim() || "Bénéficiaire" : "Bénéficiaire"}</p>
                    <p className="mt-0.5 text-xs text-ardoise">{d.commune ?? "Commune à compléter"} · {date(d.created_at)}</p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${st.cls}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{st.label}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {ctrl && ctrl.nbBloquants > 0 && <span className="rounded-full bg-erreur-bg px-2.5 py-1 font-medium text-erreur">{ctrl.nbBloquants} point{ctrl.nbBloquants > 1 ? "s" : ""} à corriger</span>}
                  {suivi && suivi.nouvelles > 0 && <span className="rounded-full bg-info-bg px-2.5 py-1 font-medium text-info">{suivi.nouvelles} nouvelle{suivi.nouvelles > 1 ? "s" : ""} pièce{suivi.nouvelles > 1 ? "s" : ""}</span>}
                  {ctrl?.conforme && <span className="rounded-full bg-succes-bg px-2.5 py-1 font-medium text-succes">Aucun blocage</span>}
                </div>
                <p className="mt-4 text-sm font-semibold text-tampon">Ouvrir et voir la prochaine action →</p>
              </Link>
            );
          })}
        </div>
        <div className="mt-8 hidden overflow-hidden rounded border border-filigrane bg-blanc-casse shadow-sm md:block">
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
                        {acces(d.id) === "paye" ? (
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
                                <span className="mt-1 block border-t border-filigrane pt-1.5 text-[10px] font-medium text-erreur">
                                  Contrôle : {ctrl.nbBloquants} point{ctrl.nbBloquants > 1 ? "s" : ""} à corriger
                                </span>
                              ) : (
                                <span className="mt-1 block border-t border-filigrane pt-1.5 text-[10px] font-medium text-succes">
                                  Contrôle : aucun point à corriger
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
          </div>
        </details>
      )}
    </div>
  );
}
