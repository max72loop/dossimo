import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getAdminEmail } from "@/lib/auth/is-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { chargerTunnel, FENETRE_JOURS } from "@/lib/mesure/tunnel-charge";
import { taux, type LigneEtape } from "@/lib/mesure/tunnel";
import { formatEuros } from "@/lib/format/montant";
import { SaisieAssistance } from "@/components/admin/saisie-assistance";

export const metadata = { title: "Tunnel d'entreprise · Admin" };
export const dynamic = "force-dynamic";

/**
 * Le tableau de bord d'entreprise : ce que Dossimo vend, pas ce qu'il construit.
 *
 * Il réunit ce que deux consoles voyaient séparément (`/admin/sprint/pilotage`
 * s'arrêtait au dossier payé, `/admin/pilotage` commençait au dépôt) et ajoute
 * les trois chiffres qui décident de la rentabilité : le coût de production, le
 * temps humain, et la part de dossiers acceptés SANS reprise.
 *
 * Règle tenue partout ici : une valeur inconnue s'affiche « — », jamais un zéro
 * ni une estimation (DESIGN.md §6, AGENTS.md). Un tableau de bord qui invente
 * est plus dangereux qu'un tableau de bord vide.
 */

const USD = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

const pourcent = (t: number | null) => (t === null ? "—" : `${(t * 100).toFixed(0)} %`);
const nombre = (n: number | null) => (n === null ? "—" : n.toLocaleString("fr-FR"));
const dollars = (micro: number) => USD.format(micro / 1_000_000);

/** Taux d'une étape vers la précédente ÉTAPE MESURÉE : la visite, non instrumentée, ne casse pas la chaîne. */
function conversions(etapes: LigneEtape[]): (number | null)[] {
  let precedente: number | null = null;
  return etapes.map((e) => {
    const t = e.valeur === null ? null : taux(e.valeur, precedente);
    if (e.valeur !== null) precedente = e.valeur;
    return t;
  });
}

export default async function TunnelPage() {
  if (!(await getAdminEmail())) notFound();

  const { semaine, total } = await chargerTunnel();

  // Liste courte pour la saisie du temps d'assistance : les dossiers récents.
  const admin = createAdminClient();
  const { data: recents } = await admin
    .from("dossiers")
    .select("id, type_travaux, commune, created_at")
    .order("created_at", { ascending: false })
    .limit(40);

  const dossiersSaisie = (recents ?? []).map((d) => ({
    id: d.id,
    libelle: `${d.type_travaux}${d.commune ? ` · ${d.commune}` : ""} · ${d.id.slice(0, 8)}`,
  }));

  const tauxSemaine = conversions(semaine.etapes);
  const tauxTotal = conversions(total.etapes);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs text-ardoise hover:text-tampon"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Administration
      </Link>

      <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-encre">
        Tunnel d&apos;entreprise
      </h1>
      <p className="mt-1 text-sm text-ardoise">
        Du premier contact au dossier accepté. Chaque étape compte ce qui s&apos;est produit dans la
        période, à sa propre date : ce n&apos;est pas une cohorte, les taux sont des ordres de
        grandeur.
      </p>

      {/* --- La métrique principale ------------------------------------- */}
      <section className="mt-6 rounded-2xl bg-encre p-6 text-blanc-casse shadow-lg">
        <p className="text-xs uppercase tracking-wide text-accent-clair">La métrique du pilote</p>
        <p className="mt-2 font-serif text-4xl font-semibold tabular-nums">
          {total.payesAcceptesSansReprise}
        </p>
        <p className="mt-1 text-sm">
          dossiers payés, puis acceptés, sans qu&apos;aucune correction ait été demandée.
        </p>
        {total.payesAcceptesRepriseInconnue > 0 && (
          <p className="mt-3 text-xs text-accent-clair">
            {total.payesAcceptesRepriseInconnue} autre
            {total.payesAcceptesRepriseInconnue > 1 ? "s" : ""} dossier
            {total.payesAcceptesRepriseInconnue > 1 ? "s" : ""} payé
            {total.payesAcceptesRepriseInconnue > 1 ? "s" : ""} et accepté
            {total.payesAcceptesRepriseInconnue > 1 ? "s" : ""} sans que la question de la reprise
            ait été renseignée. Tant qu&apos;elle ne l&apos;est pas, ils ne comptent pas ici.
          </p>
        )}
      </section>

      {/* --- L'entonnoir -------------------------------------------------- */}
      <h2 className="mt-8 text-sm font-semibold text-encre">L&apos;entonnoir</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[38rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-filigrane text-left text-[0.7rem] uppercase tracking-wide text-encre-claire">
              <th className="py-2 pr-3 font-medium">Étape</th>
              <th className="py-2 pr-3 text-right font-medium">{FENETRE_JOURS} derniers jours</th>
              <th className="py-2 pr-3 text-right font-medium">Conv.</th>
              <th className="py-2 pr-3 text-right font-medium">Depuis le début</th>
              <th className="py-2 text-right font-medium">Conv.</th>
            </tr>
          </thead>
          <tbody>
            {semaine.etapes.map((e, i) => (
              <tr key={e.cle} className="border-b border-filigrane/60">
                <td className="py-2.5 pr-3">
                  <span className="font-medium text-encre">{e.libelle}</span>
                  <span className="block text-xs text-ardoise">{e.aide}</span>
                </td>
                <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-encre">
                  {nombre(e.valeur)}
                </td>
                <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-ardoise">
                  {pourcent(tauxSemaine[i])}
                </td>
                <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-encre">
                  {nombre(total.etapes[i].valeur)}
                </td>
                <td className="py-2.5 text-right font-mono tabular-nums text-ardoise">
                  {pourcent(tauxTotal[i])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Qualité de service ------------------------------------------- */}
      <h2 className="mt-8 text-sm font-semibold text-encre">Qualité de service</h2>
      <p className="mt-1 text-xs text-ardoise">
        Sur tout l&apos;historique. Un échec « lecture non activée » n&apos;est pas compté comme un
        échec de lecture : rien n&apos;avait été tenté.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <Chiffre
          label="Échec de lecture"
          valeur={pourcent(total.qualite.tauxEchecLecture)}
          note={`${total.qualite.echecsIllisible} document(s) illisible(s), ${total.qualite.echecsService} panne(s) de service`}
        />
        <Chiffre
          label="Correction demandée"
          valeur={pourcent(total.qualite.tauxReprise)}
          note={
            total.qualite.repriseInconnue > 0
              ? `${total.qualite.repriseInconnue} retour(s) sans réponse à la question`
              : `sur ${total.qualite.retoursRenseignes} retour(s) renseigné(s)`
          }
        />
        <Chiffre
          label="Assistance humaine"
          valeur={`${total.qualite.minutesAssistance} min`}
          note="temps saisi à la main, tous dossiers confondus"
        />
        <Chiffre
          label="Lectures tentées"
          valeur={String(total.qualite.lectures)}
          note={`dont ${semaine.qualite.lectures} sur ${FENETRE_JOURS} jours`}
        />
      </div>

      {/* --- Unit economics ----------------------------------------------- */}
      <h2 className="mt-8 text-sm font-semibold text-encre">Par palier</h2>
      <p className="mt-1 text-xs text-ardoise">
        Revenu réellement encaissé (remises et crédits de parrainage déduits), en face du coût de
        production. Les paliers viennent de <code>pricing_tiers</code>, jamais du code.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[38rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-filigrane text-left text-[0.7rem] uppercase tracking-wide text-encre-claire">
              <th className="py-2 pr-3 font-medium">Palier</th>
              <th className="py-2 pr-3 text-right font-medium">Prix</th>
              <th className="py-2 pr-3 text-right font-medium">Payés</th>
              <th className="py-2 pr-3 text-right font-medium">Revenu</th>
              <th className="py-2 pr-3 text-right font-medium">Coût LLM</th>
              <th className="py-2 text-right font-medium">Assistance</th>
            </tr>
          </thead>
          <tbody>
            {total.paliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-xs text-ardoise">
                  Aucun palier actif dans <code>pricing_tiers</code>.
                </td>
              </tr>
            ) : (
              total.paliers.map((p) => (
                <tr key={p.palier} className="border-b border-filigrane/60">
                  <td className="py-2.5 pr-3 font-medium text-encre">{p.palier}</td>
                  <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-ardoise">
                    {formatEuros(p.prixCents / 100)}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-encre">
                    {p.dossiersPayes}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-encre">
                    {formatEuros(p.revenuCents / 100)}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-encre">
                    {dollars(p.coutMicroUsd)}
                    {p.coutIncomplet && (
                      <span className="ml-1 text-avertissement" title="Coût non communiqué pour au moins un appel : ce total est un plancher.">
                        +
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-encre">
                    {p.minutesAssistance} min
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-ardoise">
        Pas de colonne « marge » : le revenu est encaissé en euros, le coût LLM facturé en dollars,
        et Dossimo n&apos;a aucune source de taux de change. En afficher une reviendrait à inventer
        un chiffre sur la ligne où il coûte le plus cher de se tromper. Le temps d&apos;assistance
        reste en minutes pour la même raison : aucun taux horaire n&apos;est acté.
      </p>

      <SaisieAssistance dossiers={dossiersSaisie} />

      <p className="mt-8 text-xs text-ardoise">
        La ligne « Visite » restera à « — » tant que le site n&apos;aura aucune mesure
        d&apos;audience. C&apos;est un choix : la page confidentialité annonce qu&apos;il n&apos;y a
        pas de traceur, et un comptage anonyme agrégé se décide avant de se coder.
      </p>
    </main>
  );
}

function Chiffre({ label, valeur, note }: { label: string; valeur: string; note: string }) {
  return (
    <div className="rounded border border-filigrane bg-papier/40 p-3">
      <p className="text-[0.7rem] uppercase tracking-wide text-encre-claire">{label}</p>
      <p className="mt-1 font-mono text-xl tabular-nums text-encre">{valeur}</p>
      <p className="mt-0.5 text-xs text-ardoise">{note}</p>
    </div>
  );
}
