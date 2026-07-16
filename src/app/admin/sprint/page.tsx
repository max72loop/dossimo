import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { getAdminEmail } from "@/lib/auth/is-admin";
import { chargerLotDuJour, PLAFOND_QUOTIDIEN, type CanalSprint } from "@/lib/sprint/lot";
import { SprintListe } from "@/components/admin/sprint-liste";

export const metadata = { title: "Sprint prospection · Admin" };
export const dynamic = "force-dynamic";

/**
 * Console du sprint bicanal WhatsApp / e-mail (plan de lancement v3).
 *
 * Prépare le « lot du jour » : contacts assignés au canal, non désinscrits, pas
 * encore envoyés, avec le message personnalisé prêt à copier et le lien wa.me.
 * L'envoi reste manuel (l'humain relit, copie, clique) : c'est ce qui protège le
 * numéro WhatsApp et le domaine. On ne fait que préparer et enregistrer l'état.
 */
export default async function SprintPage({
  searchParams,
}: {
  searchParams: Promise<{ canal?: string; n?: string }>;
}) {
  if (!(await getAdminEmail())) notFound();

  const { canal, n } = await searchParams;
  const canalChoisi: CanalSprint = canal === "email" ? "email" : "whatsapp";
  const demande = Number.parseInt(n ?? "", 10);
  const taille = Number.isFinite(demande) && demande > 0 ? Math.min(demande, PLAFOND_QUOTIDIEN) : PLAFOND_QUOTIDIEN;

  const lot = await chargerLotDuJour(canalChoisi, taille);
  const { comptes } = lot;

  const ongletClass = (actif: boolean) =>
    `rounded px-4 py-2 text-sm font-medium transition ${
      actif ? "bg-terre-cuite text-blanc-casse" : "border border-filigrane bg-blanc-casse text-ardoise hover:border-tampon"
    }`;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-encre">Sprint prospection</h1>
      <p className="mt-1 text-sm text-ardoise">
        Lot du jour, envoi manuel. Relis chaque message, copie, envoie, puis marque « envoyé ».
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link href="/admin/sprint?canal=whatsapp" className={ongletClass(canalChoisi === "whatsapp")}>
          WhatsApp
        </Link>
        <Link href="/admin/sprint?canal=email" className={ongletClass(canalChoisi === "email")}>
          E-mail
        </Link>
      </div>

      {/* Compteurs du canal */}
      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Assignés au canal", v: comptes.totalCanal },
          { l: "Déjà envoyés", v: comptes.envoyes },
          { l: "Envoyés aujourd'hui", v: `${comptes.envoyesAujourdhui} / ${comptes.plafond}` },
          { l: "Désinscrits (STOP)", v: comptes.optOut },
        ].map((k) => (
          <div key={k.l} className="rounded border border-filigrane bg-blanc-casse p-3">
            <dt className="text-[0.7rem] uppercase tracking-wide text-encre-claire">{k.l}</dt>
            <dd className="mt-1 font-mono text-lg font-semibold text-encre">{k.v}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 text-xs text-ardoise">
        Reste sous le plafond du jour : <strong>{comptes.restantsPlafond}</strong> message(s). Ce lot en affiche{" "}
        <strong>{lot.contacts.length}</strong>.
        {comptes.restantsPlafond === 0 && " Plafond atteint : reprends demain."}
      </p>

      {lot.inconnus.length > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded border border-avertissement/40 bg-avertissement-bg p-3 text-xs text-encre">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-avertissement" />
          <span>
            Libellés <code>rge_domaines</code> non reconnus (accroche générique appliquée par défaut, à mapper dans{" "}
            <code>accroches.ts</code>) : {lot.inconnus.join(" · ")}
          </span>
        </div>
      )}

      <div className="mt-6">
        <SprintListe contacts={lot.contacts} canal={canalChoisi} />
      </div>
    </main>
  );
}
