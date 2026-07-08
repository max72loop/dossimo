import Link from "next/link";
import { FolderOpen } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getCurrentArtisan } from "@/lib/auth/get-artisan";
import { TYPES_ISOLATION, type TypeIsolation } from "@/lib/dossier/cee-isolation";
import type { StatutDossier } from "@/lib/database.types";
import { PaywallCta } from "@/components/dossier/paywall-cta";
import { PRIX_DOSSIER_LABEL } from "@/lib/stripe/client";
import { getAdminEmail } from "@/lib/auth/is-admin";

export const metadata = { title: "Mes dossiers · Dossimo" };

const STATUT: Record<StatutDossier, { label: string; cls: string; dot: string }> = {
  nouveau: { label: "Nouveau", cls: "bg-papier-fonce text-ardoise", dot: "bg-encre-claire" },
  en_traitement: { label: "En traitement", cls: "bg-avertissement-bg text-avertissement", dot: "bg-avertissement" },
  livre: { label: "Livré", cls: "bg-succes-bg text-succes", dot: "bg-succes" },
};

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
      "id, statut, type_travaux, commune, code_postal, montant_estime, created_at, caracteristiques_techniques_json",
    )
    .order("created_at", { ascending: false });

  const rows = dossiers ?? [];
  const adminEmail = await getAdminEmail();

  // Accès (paiement) calculé pour toute la liste en 1 requête supplémentaire :
  // le dossier le plus ancien est offert (§10) ; les autres nécessitent un
  // paiement encaissé. Voir src/lib/dossier/acces.ts pour la logique côté PDF.
  const { data: paiements } = await supabase
    .from("paiements")
    .select("dossier_id")
    .eq("statut", "paye");
  const paidSet = new Set((paiements ?? []).map((p) => p.dossier_id));
  // rows est trié du plus récent au plus ancien → le dernier est le plus ancien.
  const gratuitId = rows.length ? rows[rows.length - 1].id : null;
  const acces = (id: string): "gratuit" | "paye" | "verrouille" =>
    id === gratuitId ? "gratuit" : paidSet.has(id) ? "paye" : "verrouille";

  return (
    <div className="mx-auto max-w-[1280px] px-8 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-encre">
            Mes dossiers
          </h1>
          <p className="mt-2 text-ardoise">
            Bonjour {artisan.prenom} · vos dossiers MaPrimeRénov&rsquo; et CEE,
            au même endroit.
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
                  const st = STATUT[d.statut];
                  return (
                    <tr key={d.id} className="transition-colors hover:bg-papier">
                      <td className="px-5 py-3">
                        <Link
                          href={`/dossiers/${d.id}`}
                          className="font-medium text-encre hover:text-tampon"
                        >
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
                          <PaywallCta dossierId={d.id} prix={PRIX_DOSSIER_LABEL} compact />
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
