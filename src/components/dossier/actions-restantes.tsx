import type { SyntheseDossier } from "@/lib/dossier/synthese";

/**
 * Ce qu'il reste à faire, pas ce qui menace. Les contrôles automatiques déjà
 * validés (déterministes) sont rappelés en pied de carte ; le rouge est réservé
 * aux vrais points bloquants, portés par l'action « contrôles ».
 */
export function ActionsRestantes({ synthese }: { synthese: SyntheseDossier }) {
  const { actions, nbActionsRestantes, nbControlesPasses, nbBloquants } = synthese;
  const prochaine = actions.find((action) => !action.fait);
  const href = prochaine?.id === "controles" ? "#controle-detail" : prochaine?.id === "depot" ? "#parcours" : "#pieces";

  return (
    <section className="mb-6 rounded-lg border-2 border-encre bg-blanc-casse p-5 shadow-[5px_5px_0_#e2ddd1]">
      {prochaine && (
        <div className="mb-5 border-b border-filigrane pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-tampon">À faire maintenant</p>
          <h2 className="mt-1 font-serif text-xl font-semibold text-encre">{prochaine.label}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ardoise">{prochaine.detail}</p>
          <a href={href} className="mt-4 inline-flex h-11 items-center rounded bg-terre-cuite px-5 text-sm font-semibold text-blanc-casse transition hover:bg-terre-cuite-hover">
            Faire cette étape
          </a>
        </div>
      )}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-base font-semibold text-encre">
          {nbActionsRestantes === 0
            ? "Toutes les étapes sont faites"
            : "Actions restantes pour passer Prêt à déposer"}
        </h2>
        <span className="text-xs font-medium text-ardoise">
          {nbActionsRestantes} action{nbActionsRestantes > 1 ? "s" : ""} restante
          {nbActionsRestantes > 1 ? "s" : ""}
        </span>
      </div>

      <details open={nbActionsRestantes <= 1}>
        <summary className="mt-3 cursor-pointer text-sm font-medium text-tampon">Voir les 4 étapes du dossier</summary>
      <ul className="mt-4 space-y-3">
        {actions.map((a) => {
          const bloquant = a.id === "controles" && nbBloquants > 0;
          return (
            <li key={a.id} className="flex gap-3">
              <span
                aria-hidden
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border text-[10px] font-bold ${
                  a.fait
                    ? "border-succes bg-succes text-blanc-casse"
                    : bloquant
                      ? "border-erreur bg-erreur-bg"
                      : "border-filigrane"
                }`}
              >
                {a.fait ? "✓" : ""}
              </span>
              <span>
                <span
                  className={`text-sm font-medium ${
                    a.fait
                      ? "text-ardoise line-through decoration-filigrane"
                      : bloquant
                        ? "text-erreur"
                        : "text-encre"
                  }`}
                >
                  {a.label}
                </span>
                <span className="sr-only">{a.fait ? " (fait)" : " (à faire)"}</span>
                <span className="block text-xs text-ardoise">{a.detail}</span>
              </span>
            </li>
          );
        })}
      </ul>
      </details>

      {nbControlesPasses > 0 && nbBloquants === 0 && (
        <p className="mt-4 rounded border-l-4 border-succes bg-succes-bg px-3 py-2 text-xs text-succes">
          Les contrôles automatiques (chronologie, qualification RGE, performance
          technique, cohérence des montants) sont déjà validés :{" "}
          {nbControlesPasses} point{nbControlesPasses > 1 ? "s" : ""} conforme
          {nbControlesPasses > 1 ? "s" : ""}. Continuez avec les pièces et les
          étapes indiquées ci-dessus.
        </p>
      )}
    </section>
  );
}
