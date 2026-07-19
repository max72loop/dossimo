import { BTN_SECONDAIRE_SM } from "@/components/ui/boutons";
import type { FeuilleRoute, Urgence } from "@/lib/dossier/feuille-route";

const dateFr = (s: string | null) =>
  !s ? "à venir" : new Date(s).toLocaleDateString("fr-FR");

const URGENCE: Record<Urgence, { chip: string; texte: string }> = {
  depasse: {
    chip: "border-erreur/30 bg-erreur-bg text-erreur",
    texte: "text-erreur",
  },
  proche: {
    chip: "border-avertissement/40 bg-avertissement-bg text-avertissement",
    texte: "text-avertissement",
  },
  calme: {
    chip: "border-tampon/30 bg-info-bg text-tampon",
    texte: "text-tampon",
  },
};

/**
 * Feuille de route de dépôt à l'écran : le chemin daté, l'échéance légale, le
 * destinataire. Le PDF téléchargeable (route `feuille-route.pdf`) porte le même
 * contenu ; ici on privilégie la lisibilité et l'appel à l'action.
 */
export function FeuilleDeRoute({
  feuille,
  resume,
  dossierId,
  debloque,
}: {
  feuille: FeuilleRoute;
  resume: { reunies: number; total: number; manquantes: string[] };
  dossierId: string;
  debloque: boolean;
}) {
  const ech = feuille.prochaine?.echeance ?? null;
  const u = ech ? URGENCE[ech.urgence] : URGENCE.calme;
  const dispoLabel =
    feuille.dispositif === "maprimerenov" ? "MaPrimeRénov'" : "CEE";

  return (
    <section className="mb-6 rounded-lg border-2 border-encre bg-blanc-casse p-5 shadow-[5px_5px_0_#e2ddd1]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-xl font-semibold text-encre">
          Feuille de route de dépôt
        </h2>
        <span className="text-xs font-medium text-ardoise">{dispoLabel}</span>
      </div>

      {/* Prochaine action + échéance */}
      {feuille.prochaine && (
        <div className="mt-4 rounded border border-filigrane bg-papier/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-tampon">
            À faire maintenant
          </p>
          <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
            <h3 className="font-serif text-lg font-semibold text-encre">
              {feuille.prochaine.titre}
            </h3>
            {ech && (
              <span
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${u.chip}`}
              >
                {ech.urgence === "depasse"
                  ? `Dépassée depuis ${Math.abs(ech.joursRestants)} j · le ${dateFr(ech.date)}`
                  : `Plus que ${ech.joursRestants} j · avant le ${dateFr(ech.date)}`}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ardoise">
            {feuille.prochaine.detail}
          </p>
          <p className="mt-2 text-xs font-medium text-tampon">
            {feuille.prochaine.qui}
          </p>
        </div>
      )}

      {/* Chemin daté */}
      <ol className="mt-5">
        {feuille.etapes.map((e, i) => (
          <li
            key={i}
            className="flex items-start gap-3 border-b border-filigrane py-2 last:border-0"
          >
            <span className="w-24 shrink-0 pt-0.5 text-xs text-ardoise tabular-nums">
              {dateFr(e.date)}
            </span>
            <span
              aria-hidden
              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${e.fait ? "bg-succes" : "border border-encre-claire"}`}
            />
            <span>
              <span
                className={`text-sm font-medium ${e.fait ? "text-ardoise" : "text-encre"}`}
              >
                {e.titre}
              </span>
              {e.detail && (
                <span className="block text-xs text-ardoise">{e.detail}</span>
              )}
            </span>
          </li>
        ))}
      </ol>

      {/* Destinataire + pièces + téléchargement */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded border border-filigrane bg-papier/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ardoise">
            À transmettre à
          </p>
          <p className="mt-1 font-medium text-encre">{feuille.destinataire}</p>
          <p className="mt-1 text-xs text-ardoise">
            {feuille.destinataireDetail}
          </p>
        </div>
        <div className="rounded border border-filigrane bg-papier/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ardoise">
            Pièces réunies
          </p>
          <p
            className={`mt-1 font-mono text-sm font-semibold ${resume.reunies >= resume.total ? "text-succes" : "text-avertissement"}`}
          >
            {resume.reunies} / {resume.total} obligatoires
          </p>
          {resume.manquantes.length > 0 ? (
            <p className="mt-1 text-xs text-ardoise">
              Manque : {resume.manquantes.join(", ")}
            </p>
          ) : (
            <p className="mt-1 text-xs text-ardoise">
              Toutes les pièces obligatoires sont réunies.
            </p>
          )}
        </div>
      </div>

      {debloque ? (
        <a
          href={`/dossiers/${dossierId}/feuille-route.pdf`}
          target="_blank"
          rel="noopener"
          className={`mt-4 ${BTN_SECONDAIRE_SM}`}
        >
          ↓ Feuille de route (PDF)
        </a>
      ) : (
        <p className="mt-4 text-xs text-ardoise">
          🔒 Débloquez le dossier pour télécharger la feuille de route et le pack.
        </p>
      )}
    </section>
  );
}
