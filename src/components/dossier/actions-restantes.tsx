import type { SyntheseDossier } from "@/lib/dossier/synthese";

/**
 * Ce qu'il reste à faire, pas ce qui menace. Les contrôles automatiques déjà
 * validés (déterministes) sont rappelés en pied de carte ; le rouge est réservé
 * aux vrais points bloquants, portés par l'action « contrôles ».
 */
export function ActionsRestantes({ synthese }: { synthese: SyntheseDossier }) {
  const { actions, nbActionsRestantes, nbControlesPasses, nbBloquants } = synthese;

  return (
    <section className="mb-6 rounded border border-filigrane bg-blanc-casse p-5 shadow-sm">
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

      {nbControlesPasses > 0 && (
        <p className="mt-4 rounded border-l-4 border-succes bg-succes-bg px-3 py-2 text-xs text-succes">
          Les contrôles automatiques (chronologie, qualification RGE, performance
          technique, cohérence des montants) sont déjà validés :{" "}
          {nbControlesPasses} point{nbControlesPasses > 1 ? "s" : ""} conforme
          {nbControlesPasses > 1 ? "s" : ""}. Il ne vous reste que les pièces à
          joindre.
        </p>
      )}
    </section>
  );
}
