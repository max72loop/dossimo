import { BarreCompletude } from "@/components/dossier/barre-completude";
import { formatEuros } from "@/lib/format/montant";
import type { SyntheseDossier } from "@/lib/dossier/synthese";

/**
 * Bloc de synthèse en tête de page : le verdict, sa preuve chiffrée, la prime
 * retenue et la complétude. Unique indicateur de risque global — les autres
 * blocs le reprennent, aucun ne le contredit.
 */
export function VerdictHero({
  synthese,
  primeRetenue,
  primeLabel,
}: {
  synthese: SyntheseDossier;
  /** Montant retenu (saisi si présent, sinon estimation), ou null si inconnu. */
  primeRetenue: number | null;
  /** Ex. « Prime CEE retenue ». */
  primeLabel: string;
}) {
  const { conforme, nbControlesPasses, nbBloquants, pourcentage, nbActionsRestantes } =
    synthese;

  return (
    <section
      aria-labelledby="verdict-titre"
      className={`mb-6 rounded-md border p-6 shadow-sm ${
        conforme
          ? "border-succes/30 bg-succes-bg"
          : "border-avertissement/40 bg-avertissement-bg"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-blanc-casse ${
                conforme ? "bg-succes" : "bg-avertissement"
              }`}
            >
              {conforme ? "✓" : "!"}
            </span>
            <h2
              id="verdict-titre"
              className={`font-serif text-2xl font-semibold ${
                conforme ? "text-succes" : "text-avertissement"
              }`}
            >
              {conforme ? "Dossier conforme" : "Dossier à corriger"}
            </h2>
          </div>
          <p className="mt-2 text-sm text-encre">
            {nbControlesPasses} contrôle{nbControlesPasses > 1 ? "s" : ""} anti-refus
            passé{nbControlesPasses > 1 ? "s" : ""} ·{" "}
            <span className={nbBloquants > 0 ? "font-semibold text-erreur" : undefined}>
              {nbBloquants} point{nbBloquants > 1 ? "s" : ""} bloquant
              {nbBloquants > 1 ? "s" : ""}
            </span>
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-serif text-3xl font-semibold text-encre">
            {formatEuros(primeRetenue)}
          </p>
          <p className="mt-0.5 text-xs text-ardoise">{primeLabel}</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-4 text-sm">
          <span className="font-medium text-encre">
            Dossier complété à {pourcentage} %
          </span>
          <span className="text-xs text-ardoise">
            {nbActionsRestantes === 0
              ? "Prêt à déposer"
              : `Il reste ${nbActionsRestantes} action${nbActionsRestantes > 1 ? "s" : ""} avant Prêt à déposer`}
          </span>
        </div>
        <BarreCompletude pourcentage={pourcentage} conforme={conforme} />
      </div>
    </section>
  );
}
