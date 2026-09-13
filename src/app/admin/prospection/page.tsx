import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Info, Pause, Play, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CONSOLE_MAIN, EnTeteConsole } from "@/components/admin/en-tete-console";
import { CARTE } from "@/components/ui/cartes";
import { getAdminEmail } from "@/lib/auth/is-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { TAILLE_SALVE, etatFile, statsEngagement } from "@/lib/prospection/file";
import {
  basculerPause,
  ecarterMessage,
  envoyerMaintenant,
  importerProspects,
  preparerFileAction,
  validerFile,
} from "@/lib/prospection/actions";

export const metadata = { title: "File e-mail · Admin" };
export const dynamic = "force-dynamic";

// Une salve enchaîne cinq envois espacés de quelques secondes : la durée par
// défaut d'une Server Action ne suffit pas.
export const maxDuration = 60;

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

  // La journée du jour, PLUS tout ce qui reste actionnable des jours précédents.
  // L'écran ne montrait que `scheduled_on = aujourd'hui` : un lot préparé la
  // veille et non validé devenait invisible, le bouton « Valider » se grisait, et
  // rien n'indiquait que 40 messages attendaient (constaté le 28/08/2026). On ne
  // remonte pas tout l'historique pour autant : les jours passés ne rendent que
  // le travail encore en attente.
  const { data: file, error: erreurFile } = etat.campagne
    ? await supabase
        .from("prospection_messages")
        .select("id, statut, objet, corps, scheduled_on, erreur, prospects(email, entreprise, prenom)")
        .eq("campagne_id", etat.campagne.id)
        .or(
          `scheduled_on.eq.${etat.jour},and(scheduled_on.lt.${etat.jour},statut.in.(en_attente,valide))`,
        )
        .order("scheduled_on", { ascending: true })
        .order("created_at", { ascending: true })
    : { data: null, error: null };

  // Une file affichée vide sur panne de lecture, c'est l'admin qui conclut « rien
  // à faire » alors que la base est injoignable.
  if (erreurFile) {
    throw new Error(`Lecture de la file de prospection : ${erreurFile.message}`);
  }

  type LigneFile = {
    id: string;
    statut: string;
    objet: string;
    corps: string;
    scheduled_on: string;
    erreur: string | null;
    prospects: { email: string; entreprise: string | null; prenom: string | null } | null;
  };
  const messages = (file ?? []) as unknown as LigneFile[];
  const enAttente = messages.filter((m) => m.statut === "en_attente");

  // Entonnoir d'engagement : chaque étape rapportée aux messages partis. Sous 200
  // envois, les taux sont montrés mais signalés comme non concluants.
  const tauxOuverture =
    engagement.envois === 0 ? null : (engagement.ouvreurs / engagement.envois) * 100;
  const tauxClic =
    engagement.envois === 0 ? null : (engagement.cliqueurs / engagement.envois) * 100;
  const peuDeDonnees = engagement.envois > 0 && engagement.envois < 200;

  return (
    <main className={CONSOLE_MAIN}>
      <EnTeteConsole
        titre="File e-mail"
        aide={
          etat.campagne
            ? `${etat.campagne.nom} · du ${etat.campagne.demarre_le} au ${etat.campagne.termine_le} · depuis ${etat.campagne.from_email}`
            : "Aucune campagne active."
        }
      />

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
          ratio={etat.plafond > 0 ? etat.envoyes / etat.plafond : undefined}
          note={
            etat.plafond === 0
              ? "jour non couvert par la campagne"
              : etat.plafond < (etat.campagne?.daily_cap_max ?? 40)
                ? "montée en charge"
                : "plafond nominal"
          }
        />
        <Compteur label="À relire" valeur={String(etat.enAttente)} note="en attente de validation" />
        <Compteur label="Validés" valeur={String(etat.valides)} note="prêts à partir, retard compris" />
        <Compteur
          label="Prospects restants"
          valeur={String(etat.prospectsDisponibles)}
          note={etat.echecs > 0 ? `${etat.echecs} échec(s) aujourd’hui` : "jamais contactés"}
        />
      </section>

      {/* --- Engagement cumulé : entonnoir partis → ouverts → cliqués --- */}
      <section className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="font-serif text-xl font-semibold text-encre">
            Engagement depuis le début
          </h2>
          {peuDeDonnees && (
            <Badge ton="avertissement" dot>
              Trop peu d’envois pour conclure · {engagement.envois}/200
            </Badge>
          )}
        </div>
        <p className="mt-1 max-w-2xl text-sm text-ardoise">
          Deux signaux, à lire en relatif plus qu’en absolu. Le taux d’ouverture
          vient d’un pixel : il est <strong>surévalué</strong> par le préchargement
          d’images de Gmail et Apple Mail, sous-évalué chez qui bloque les images.
          Le clic, lui, est gonflé par les scanners de sécurité des messageries
          d’entreprise. Aucun des deux n’est une vérité.
        </p>

        <div className={`mt-4 ${CARTE}`}>
          <div className="space-y-5">
            <LigneEntonnoir
              label="Messages partis"
              detail="toutes journées confondues"
              valeur={engagement.envois}
              pct={engagement.envois === 0 ? 0 : 100}
              ton="encre"
            />
            <LigneEntonnoir
              label="Ont ouvert"
              detail={
                engagement.ouverturesBrutes > engagement.ouvreurs
                  ? `${engagement.ouverturesBrutes} ouvertures en tout`
                  : "prospects distincts"
              }
              valeur={engagement.ouvreurs}
              pct={tauxOuverture}
              ton="info"
              tauxEnTete
            />
            <LigneEntonnoir
              label="Ont cliqué"
              detail={
                engagement.clicsBruts > engagement.cliqueurs
                  ? `${engagement.clicsBruts} visites en tout`
                  : "prospects distincts"
              }
              valeur={engagement.cliqueurs}
              pct={tauxClic}
              ton="succes"
              tauxEnTete
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-filigrane pt-4">
            <Badge ton={engagement.desinscriptions > 0 ? "erreur" : "neutre"} dot>
              {engagement.desinscriptions} désinscription
              {engagement.desinscriptions === 1 ? "" : "s"}
            </Badge>
            <span className="font-mono text-xs tabular-nums text-encre-claire">
              {engagement.dernierClic
                ? `dernier clic le ${new Date(engagement.dernierClic).toLocaleDateString("fr-FR")}`
                : "aucun clic à ce jour"}
            </span>
          </div>
        </div>
      </section>

      {etat.campagne?.en_pause && (
        <p className="mt-4 border-l-4 border-avertissement bg-avertissement-bg px-4 py-3 text-sm text-avertissement">
          Campagne en pause{etat.campagne.motif_pause ? ` : ${etat.campagne.motif_pause}` : ""}.
          Aucun message ne part.
        </p>
      )}

      {/* --- Pourquoi la file ne s'écoule pas, dit à l'écran plutôt que dans un
           journal que personne n'ouvre. La pause a déjà son propre bandeau. --- */}
      {etat.blocage && !etat.campagne?.en_pause && (
        <p className="mt-4 flex items-start gap-2 border-l-4 border-info bg-info-bg px-4 py-3 text-sm text-encre">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" strokeWidth={1.5} />
          {etat.blocage}
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

        <form action={envoyerMaintenant} className="flex items-center gap-2">
          <button
            type="submit"
            disabled={etat.valides === 0}
            className="inline-flex h-10 items-center gap-1.5 rounded bg-encre px-4 text-sm font-semibold text-blanc-casse transition-colors hover:bg-encre/90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" strokeWidth={1.5} />
            Envoyer {TAILLE_SALVE} messages maintenant
          </button>
          <span className="text-xs text-ardoise">
            {etat.valides} validé(s) en attente de départ
          </span>
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
          ne part jamais et sort le prospect de la campagne. Les messages d’un jour
          antérieur encore en attente ou validés sont repris ici, datés.
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
                        {m.scheduled_on !== etat.jour && (
                          <> · <span className="text-avertissement">en retard du {m.scheduled_on}</span></>
                        )}
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
  ratio,
}: {
  label: string;
  valeur: string;
  note: string;
  /** Si fourni (0–1), affiche une jauge sous le chiffre : avancement vers un plafond. */
  ratio?: number;
}) {
  return (
    <div className="rounded-2xl bg-blanc-casse p-4 shadow-lg">
      <p className="text-xs font-medium uppercase tracking-wide text-ardoise">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-encre">{valeur}</p>
      {ratio !== undefined && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-papier-fonce">
          <div
            className="h-full rounded-full bg-tampon"
            style={{ width: `${Math.min(Math.max(ratio, 0), 1) * 100}%` }}
          />
        </div>
      )}
      <p className="mt-1 text-xs text-encre-claire">{note}</p>
    </div>
  );
}

/** Tons de remplissage de l'entonnoir (DESIGN.md §2) : ouvert = info, cliqué = succès. */
const METER_FILL: Record<"encre" | "info" | "succes", string> = {
  encre: "bg-encre",
  info: "bg-tampon",
  succes: "bg-succes",
};

/**
 * Une étape de l'entonnoir : libellé + chiffre de tête (le taux pour les étapes
 * d'engagement, le volume brut pour « messages partis ») et une barre dont la
 * largeur encode ce taux, sur la même base que les messages partis (100 %).
 */
function LigneEntonnoir({
  label,
  detail,
  valeur,
  pct,
  ton,
  tauxEnTete = false,
}: {
  label: string;
  detail: string;
  valeur: number;
  pct: number | null;
  ton: "encre" | "info" | "succes";
  tauxEnTete?: boolean;
}) {
  const actif = valeur > 0;
  const largeur = actif ? Math.min(Math.max(pct ?? 0, 0), 100) : 0;
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-encre">{label}</p>
          <p className="text-xs text-encre-claire">{detail}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-2xl font-semibold leading-none tabular-nums text-encre">
            {tauxEnTete
              ? pct === null
                ? "—"
                : `${pct.toFixed(1)} %`
              : valeur.toLocaleString("fr-FR")}
          </p>
          {tauxEnTete && (
            <p className="mt-1 font-mono text-xs tabular-nums text-ardoise">
              {valeur.toLocaleString("fr-FR")} prospect{valeur === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-papier-fonce">
        <div
          className={`h-full rounded-full ${METER_FILL[ton]}`}
          style={{ width: `${largeur}%`, minWidth: actif ? "0.375rem" : undefined }}
        />
      </div>
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
