import { depotGuide } from "@/lib/dossier/depot-guide";
import type { Dispositif } from "@/lib/database.types";

/**
 * Bloc d'aide contextuel « Où déposer ce dossier » : à qui, quand, quoi envoyer,
 * selon le dispositif. Rappelle que Dossimo ne dépose jamais (CLAUDE.md §2).
 * Présentationnel — pas d'état, server component.
 */
export function DepotGuide({ dispositif }: { dispositif: Dispositif }) {
  const g = depotGuide(dispositif);

  return (
    <section className="mb-6 rounded border border-filigrane bg-blanc-casse p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-base font-semibold text-encre">
            Où déposer ce dossier
          </h2>
          <p className="mt-1 text-xs text-ardoise">
            Parcours de dépôt propre à {g.dispositifLabel}. {g.quiDepose}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-tampon/10 px-3 py-1 text-xs font-medium text-tampon">
          {g.dispositifLabel}
        </span>
      </div>

      <dl className="mt-4 space-y-4">
        {/* À qui / où */}
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ardoise">
            À qui / où
          </dt>
          <dd className="mt-1">
            <span className="text-sm font-medium text-encre">{g.destinataire}</span>
            <span className="mt-0.5 block text-xs text-ardoise">
              {g.destinataireDetail}
            </span>
          </dd>
        </div>

        {/* Quand */}
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ardoise">
            Quand
          </dt>
          <dd className="mt-2">
            <ol className="space-y-2">
              {g.quand.map((etape, i) => (
                <li key={etape.titre} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-papier-fonce text-[11px] font-semibold text-encre">
                    {i + 1}
                  </span>
                  <span>
                    <span className="text-sm font-medium text-encre">
                      {etape.titre}
                    </span>
                    <span className="block text-xs text-ardoise">{etape.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </dd>
        </div>

        {/* Ce que vous envoyez */}
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ardoise">
            Ce que vous envoyez
          </dt>
          <dd className="mt-1 text-xs text-ardoise">{g.aEnvoyer}</dd>
        </div>
      </dl>

      <p className="mt-4 rounded border-l-4 border-tampon bg-tampon/5 px-3 py-2 text-xs text-ardoise">
        Dossimo prépare et vérifie le pack, mais <strong>ne dépose jamais</strong> le
        dossier et ne touche pas la prime. Vous gardez la main sur votre client et
        votre relation.
      </p>
    </section>
  );
}
