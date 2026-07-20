import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Pause, Play } from "lucide-react";

import { getAdminEmail } from "@/lib/auth/is-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { etatFile, statsEngagement } from "@/lib/prospection/file";
import {
  basculerPause,
  ecarterMessage,
  importerProspects,
  preparerFileAction,
  validerFile,
} from "@/lib/prospection/actions";

export const metadata = { title: "Prospection · Admin"};
export const dynamic = "force-dynamic";

/**
 * Console de prospection.
 *
 * L'écran n'a qu'une raison d'être : **rien ne part sans qu'un humain ait lu le
 * message tel qu'il partira**. Le corps affiché ici est le corps exact stocké en
 * base, pas une prévisualisation reconstruite. C'est ce qui fait qu'un prénom mal
 * importé se voit avant l'envoi, et non dans la réponse furieuse d'un artisan.
 */
export default async function AdminProspectionPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const admin = await getAdminEmail();
  if (!admin) notFound();

  const { ok, erreur } = await searchParams;
  const [etat, engagement] = await Promise.all([etatFile(), statsEngagement()]);
  const supabase = createAdminClient();

  const { data: file } = etat.campagne
    ? await supabase
        .from("prospection_messages")
        .select("id, statut, objet, corps, scheduled_on, erreur, prospects(email, entreprise, prenom)")
        .eq("campagne_id", etat.campagne.id)
        .eq("scheduled_on", etat.jour)
        .order("created_at", { ascending: true })
    : { data: null };

  type LigneFile = {
    id: string;
    statut: string;
    objet: string;
    corps: string;
    erreur: string | null;
    prospects: { email: string; entreprise: string | null; prenom: string | null } | null;
  };
  const messages = (file ?? []) as unknown as LigneFile[];
  const enAttente = messages.filter((m) => m.statut === "en_attente");

  return (
    <main className="mx-auto max-w-4xl px-8 py-10">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/admin/regles" className="text-tampon underline-offset-4 hover:underline">
          ← Règles métier
        </Link>
        <Link href="/admin/pilotage" className="text-tampon underline-offset-4 hover:underline">
          Pilotage terrain →
        </Link>
      </div>

      <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-encre">
        Prospection
      </h1>
      <p className="mt-2 text-sm text-ardoise">
        {etat.campagne
          ? `${etat.campagne.nom} · du ${etat.campagne.demarre_le} au ${etat.campagne.termine_le} · depuis ${etat.campagne.from_email}`
          : "Aucune campagne active."}
      </p>

      {ok && (
        <p className="mt-4 flex items-start gap-2 border-l-4 border-succes bg-succes-bg px-4 py-3 text-sm text-encre">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-succes" strokeWidth={1.5} />
          {ok}
        </p>
      )}
      {erreur && (
        <p className="mt-4 flex items-start gap-2 border-l-4 border-erreur bg-erreur-bg px-4 py-3 text-sm text-erreur">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
          {erreur}
        </p>
      )}

      {/* --- Compteurs du jour --- */}
      <section className="mt-8 grid gap-3 sm:grid-cols-4">
        <Compteur
          label="Envoyés aujourd’hui"
          valeur={`${etat.envoyes} / ${etat.plafond}`}
          note={
            etat.plafond === 0
              ? "hors fenêtre"
              : etat.plafond < (etat.campagne?.daily_cap_max ?? 40)
                ? "montée en charge"
                : "plafond nominal"
          }
        />
        <Compteur label="À relire" valeur={String(etat.enAttente)} note="en attente de validation" />
        <Compteur label="Validés" valeur={String(etat.valides)} note="partiront dans la journée" />
        <Compteur
          label="Prospects restants"
          valeur={String(etat.prospectsDisponibles)}
          note={etat.echecs > 0 ? `${etat.echecs} échec(s) aujourd’hui` : "jamais contactés"}
        />
      </section>

      {/* --- Engagement cumulé (hors jour courant : un clic arrive rarement le jour de l'envoi) --- */}
      <section className="mt-6">
        <h2 className="font-serif text-xl font-semibold text-encre">
          Engagement depuis le début
        </h2>
        <p className="mt-1 text-sm text-ardoise">
          Seuls les clics sur le lien de démo sont mesurés. Les ouvertures ne le
          sont pas : la campagne ne pose aucun pixel de suivi, et n’en posera pas.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Compteur
            label="Messages partis"
            valeur={String(engagement.envois)}
            note="toutes journées confondues"
          />
          <Compteur
            label="Ont cliqué"
            valeur={String(engagement.cliqueurs)}
            note={
              engagement.clicsBruts > engagement.cliqueurs
                ? `${engagement.clicsBruts} visites au total`
                : "prospects distincts"
            }
          />
          <Compteur
            label="Taux de clic"
            valeur={
              engagement.envois === 0
                ? "—"
                : `${((engagement.cliqueurs / engagement.envois) * 100).toFixed(1)} %`
            }
            note={
              engagement.envois < 200
                ? `trop peu d’envois pour conclure (${engagement.envois}/200)`
                : "sur les messages partis"
            }
          />
          <Compteur
            label="Désinscriptions"
            valeur={String(engagement.desinscriptions)}
            note={
              engagement.dernierClic
                ? `dernier clic le ${new Date(engagement.dernierClic).toLocaleDateString("fr-FR")}`
                : "aucun clic à ce jour"
            }
          />
        </div>
      </section>

      {etat.campagne?.en_pause && (
        <p className="mt-4 border-l-4 border-avertissement bg-avertissement-bg px-4 py-3 text-sm text-avertissement">
          Campagne en pause{etat.campagne.motif_pause ? ` : ${etat.campagne.motif_pause}` : ""}.
          Aucun message ne part.
        </p>
      )}

      {/* --- Commandes --- */}
      <section className="mt-6 flex flex-wrap items-center gap-3">
        <form action={preparerFileAction}>
          <button
            type="submit"
            className="h-10 rounded border border-encre px-4 text-sm font-medium text-encre transition-colors hover:bg-papier-fonce"
          >
            Préparer la file du jour
          </button>
        </form>

        <form action={validerFile}>
          <button
            type="submit"
            disabled={enAttente.length === 0}
            className="h-10 rounded bg-accent px-4 text-sm font-semibold text-blanc-casse transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            Valider les {enAttente.length} messages relus
          </button>
        </form>

        <form action={basculerPause} className="flex items-center gap-2">
          <input
            name="motif"
            placeholder="Motif (si pause)"
            className="h-10 rounded border border-filigrane bg-blanc-casse px-3 text-sm"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-1.5 rounded border border-encre px-4 text-sm font-medium text-encre transition-colors hover:bg-papier-fonce"
          >
            {etat.campagne?.en_pause ? (
              <>
                <Play className="h-4 w-4" strokeWidth={1.5} /> Relancer
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" strokeWidth={1.5} /> Mettre en pause
              </>
            )}
          </button>
        </form>
      </section>

      {/* --- File du jour --- */}
      <section className="mt-10">
        <h2 className="font-serif text-xl font-semibold text-encre">
          File du {etat.jour}
        </h2>
        <p className="mt-1 text-sm text-ardoise">
          Le corps affiché est celui qui partira, mot pour mot. Un message écarté
          ne part jamais et sort le prospect de la campagne.
        </p>

        {messages.length === 0 ? (
          <p className="mt-6 rounded border border-dashed border-filigrane bg-papier/40 px-4 py-6 text-sm text-ardoise">
            File vide. « Préparer la file du jour » sélectionne les prospects jamais
            contactés, dans la limite du plafond.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {messages.map((m) => (
              <li key={m.id} className="border border-filigrane bg-blanc-casse">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-encre">
                        {m.prospects?.email ?? "—"}
                      </span>
                      <span className="block truncate text-xs text-ardoise">
                        {m.prospects?.entreprise ?? "sans entreprise"} ·{" "}
                        {m.prospects?.prenom ? `prénom : ${m.prospects.prenom}` : "sans prénom"}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <Etat statut={m.statut} />
                      <span className="text-xs text-tampon underline underline-offset-4">
                        Lire
                      </span>
                    </span>
                  </summary>
                  <div className="border-t border-filigrane px-4 py-4">
                    <p className="font-mono text-xs text-ardoise">Objet : {m.objet}</p>
                    <pre className="mt-3 whitespace-pre-wrap font-sans text-[0.813rem] leading-relaxed text-encre">
                      {m.corps}
                    </pre>
                    {m.erreur && (
                      <p className="mt-3 text-xs text-erreur">Erreur : {m.erreur}</p>
                    )}
                    {(m.statut === "en_attente" || m.statut === "valide") && (
                      <form action={ecarterMessage} className="mt-4">
                        <input type="hidden" name="id" value={m.id} />
                        <button
                          type="submit"
                          className="h-9 rounded border border-erreur px-3 text-xs font-medium text-erreur transition-colors hover:bg-erreur-bg"
                        >
                          Écarter ce message
                        </button>
                      </form>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --- Import --- */}
      <section className="mt-12 border-t border-filigrane pt-8">
        <h2 className="font-serif text-xl font-semibold text-encre">
          Importer des prospects
        </h2>
        <p className="mt-1 text-sm text-ardoise">
          CSV avec au minimum une colonne <code>email</code>. Colonnes reconnues :
          email, prenom, nom, entreprise, ville, code_postal, source.
        </p>

        <form action={importerProspects} className="mt-5 grid gap-4">
          <div>
            <label htmlFor="source" className="block text-sm font-medium text-encre">
              D’où viennent ces adresses ?
            </label>
            <p className="mt-1 text-xs text-ardoise">
              Cette phrase est reprise telle quelle dans le pied du message. Le RGPD
              (art. 14) impose de dire au destinataire où l’on a trouvé son adresse.
              Écrivez-la à la première personne, ex. « votre entreprise figure dans
              l’annuaire public des professionnels RGE ».
            </p>
            <input
              id="source"
              name="source"
              required
              maxLength={200}
              placeholder="votre entreprise figure dans l’annuaire public des professionnels RGE"
              className="mt-2 h-11 w-full rounded border border-filigrane bg-blanc-casse px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="csv" className="block text-sm font-medium text-encre">
              Contenu du CSV
            </label>
            <textarea
              id="csv"
              name="csv"
              required
              rows={8}
              placeholder={"email,prenom,entreprise,ville\njean@toiture62.fr,Jean,Toiture 62,Lens"}
              className="mt-2 w-full rounded border border-filigrane bg-blanc-casse px-3 py-2 font-mono text-xs"
            />
          </div>
          <button
            type="submit"
            className="h-11 w-fit rounded bg-encre px-5 text-sm font-semibold text-blanc-casse transition-colors hover:bg-encre/90"
          >
            Importer
          </button>
        </form>
      </section>
    </main>
  );
}

function Compteur({
  label,
  valeur,
  note,
}: {
  label: string;
  valeur: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl bg-blanc-casse p-4 shadow-lg">
      <p className="text-xs font-medium uppercase tracking-wide text-ardoise">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-encre">{valeur}</p>
      <p className="mt-1 text-xs text-encre-claire">{note}</p>
    </div>
  );
}

function Etat({ statut }: { statut: string }) {
  const map: Record<string, string> = {
    en_attente: "bg-avertissement-bg text-avertissement",
    valide: "bg-info-bg text-tampon",
    envoye: "bg-succes-bg text-succes",
    echec: "bg-erreur-bg text-erreur",
    annule: "bg-papier-fonce text-ardoise",
  };
  const libelle: Record<string, string> = {
    en_attente: "à relire",
    valide: "validé",
    envoye: "envoyé",
    echec: "échec",
    annule: "écarté",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[statut] ?? ""}`}>
      {libelle[statut] ?? statut}
    </span>
  );
}
