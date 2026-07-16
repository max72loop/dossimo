import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";

import { getAdminEmail } from "@/lib/auth/is-admin";
import { chargerPilotage, CIBLES, ENVOIS_MINIMUM_POUR_JUGER, type VerdictCanal } from "@/lib/sprint/pilotage";

export const metadata = { title: "Pilotage du sprint · Admin" };
export const dynamic = "force-dynamic";

const VERDICT: Record<VerdictCanal, { texte: string; classe: string }> = {
  insuffisant: { texte: "Trop peu d'envois pour juger", classe: "bg-papier text-ardoise" },
  alerte: { texte: "Alerte : revoir le message", classe: "bg-erreur/10 text-erreur" },
  "sous-cible": { texte: "Sous la cible", classe: "bg-avertissement-bg text-avertissement" },
  atteint: { texte: "Cible atteinte", classe: "bg-succes/10 text-succes" },
};

const pourcent = (t: number | null) => (t === null ? "—" : `${(t * 100).toFixed(1)} %`);

/**
 * Les cinq chiffres du sprint (plan v3, §11) et le croisement utm (§12, outil 4).
 *
 * Deux blocs séparés à dessein : le déclaratif (ce que Max a marqué dans
 * `prospects_dossimo`) et le factuel (ce que le site a vu arriver via `source`).
 * Un écart entre les deux est une information — souvent un marquage oublié —,
 * pas une erreur à masquer en les additionnant.
 */
export default async function PilotageSprintPage() {
  if (!(await getAdminEmail())) notFound();

  const { jour, plafond, canaux, sources } = await chargerPilotage();
  const totalEnvois = canaux.reduce((n, c) => n + c.envois, 0);
  const aucunEnvoi = totalEnvois === 0;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/admin/sprint" className="inline-flex items-center gap-1.5 text-xs text-ardoise hover:text-tampon">
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour au lot du jour
      </Link>

      <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-encre">Pilotage du sprint</h1>
      <p className="mt-1 text-sm text-ardoise">
        Les cinq chiffres par canal, au {jour}. Cible du sprint : {CIBLES.envoisParCanal} envois par canal,{" "}
        {CIBLES.demos} essais, taux de réponse ≥ {CIBLES.whatsapp.tauxReponse * 100} % en WhatsApp et ≥{" "}
        {CIBLES.email.tauxReponse * 100} % en e-mail.
      </p>

      {aucunEnvoi && (
        <div className="mt-4 flex items-start gap-2 rounded border border-filigrane bg-papier/40 p-3 text-xs text-ardoise">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-avertissement" />
          <span>
            Aucun envoi enregistré. Si le sprint a démarré, c&apos;est que le tirage n&apos;a pas été lancé
            (<code>supabase/scripts/prospect_dossimo_tirage.sql</code>) ou que les envois ne sont pas marqués.
          </span>
        </div>
      )}

      {/* --- Déclaratif : prospects_dossimo --- */}
      <h2 className="mt-8 text-sm font-semibold text-encre">Par canal · saisi à la main</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-filigrane text-left text-[0.7rem] uppercase tracking-wide text-encre-claire">
              <th className="py-2 pr-3 font-medium">Canal</th>
              <th className="py-2 pr-3 font-medium">Assignés</th>
              <th className="py-2 pr-3 font-medium">Envois</th>
              <th className="py-2 pr-3 font-medium">Relances</th>
              <th className="py-2 pr-3 font-medium">Réponses</th>
              <th className="py-2 pr-3 font-medium">Taux</th>
              <th className="py-2 pr-3 font-medium">Essais</th>
              <th className="py-2 pr-3 font-medium">Dossiers</th>
              <th className="py-2 pr-3 font-medium">STOP</th>
              <th className="py-2 font-medium">Aujourd&apos;hui</th>
            </tr>
          </thead>
          <tbody>
            {canaux.map((c) => (
              <tr key={c.canal} className="border-b border-filigrane/60">
                <td className="py-2.5 pr-3 font-medium text-encre">{c.canal === "whatsapp" ? "WhatsApp" : "E-mail"}</td>
                <td className="py-2.5 pr-3 font-mono text-encre">{c.assignes}</td>
                <td className="py-2.5 pr-3 font-mono text-encre">
                  {c.envois}
                  <span className="text-encre-claire"> / {CIBLES.envoisParCanal}</span>
                </td>
                <td className="py-2.5 pr-3 font-mono text-encre">{c.relances}</td>
                <td className="py-2.5 pr-3 font-mono text-encre">{c.reponses}</td>
                <td className="py-2.5 pr-3">
                  <span className="font-mono text-encre">{pourcent(c.taux)}</span>
                  <span className={`ml-2 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${VERDICT[c.verdict].classe}`}>
                    {VERDICT[c.verdict].texte}
                  </span>
                </td>
                <td className="py-2.5 pr-3 font-mono text-encre">{c.demos}</td>
                <td className="py-2.5 pr-3 font-mono text-encre">{c.dossiers}</td>
                <td className="py-2.5 pr-3 font-mono text-encre">{c.stop}</td>
                <td className="py-2.5 font-mono text-encre">
                  {c.partisAujourdhui}
                  <span className="text-encre-claire"> / {plafond}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-ardoise">
        Le taux n&apos;est jugé qu&apos;à partir de {ENVOIS_MINIMUM_POUR_JUGER} envois : en dessous, un pourcentage sur
        quelques messages ne dit rien. Sous {CIBLES.alerteTauxReponse * 100} %, le plan demande de revoir le message,
        pas le canal.
      </p>

      {/* --- Factuel : tables applicatives croisées par utm --- */}
      <h2 className="mt-8 text-sm font-semibold text-encre">Par source utm · constaté sur le site</h2>
      <p className="mt-1 text-xs text-ardoise">
        Ce que le site a réellement enregistré, personne ne le saisit. Un écart avec le tableau du dessus signale le plus
        souvent un marquage oublié, pas un canal qui ne convertit pas.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-filigrane text-left text-[0.7rem] uppercase tracking-wide text-encre-claire">
              <th className="py-2 pr-3 font-medium">Source</th>
              <th className="py-2 pr-3 font-medium">Comptes créés</th>
              <th className="py-2 pr-3 font-medium">Dossiers</th>
              <th className="py-2 font-medium">Dossiers payés</th>
            </tr>
          </thead>
          <tbody>
            {sources.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-xs text-ardoise">
                  Aucun compte enregistré pour l&apos;instant.
                </td>
              </tr>
            ) : (
              sources.map((s) => (
                <tr key={s.source} className="border-b border-filigrane/60">
                  <td className="py-2.5 pr-3 font-medium text-encre">{s.source}</td>
                  <td className="py-2.5 pr-3 font-mono text-encre">{s.comptes}</td>
                  <td className="py-2.5 pr-3 font-mono text-encre">{s.dossiers}</td>
                  <td className="py-2.5 font-mono text-encre">{s.dossiersPayes}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
