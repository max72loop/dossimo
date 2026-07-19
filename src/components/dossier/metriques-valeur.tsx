import { formatDuree, RISQUE_LABEL, type SyntheseDossier } from "@/lib/dossier/synthese";
import { CARTE_INTERNE } from "@/components/ui/cartes";

const RISQUE_STYLE: Record<SyntheseDossier["risque"], string> = {
  faible: "text-succes",
  moyen: "text-avertissement",
  eleve: "text-erreur",
};

function Metrique({
  valeur,
  libelle,
  detail,
  ton,
}: {
  valeur: string;
  libelle: string;
  detail: string;
  ton?: string;
}) {
  return (
    <div className={CARTE_INTERNE}>
      <p className={`font-serif text-2xl font-semibold ${ton ?? "text-encre"}`}>
        {valeur}
      </p>
      <p className="mt-1 text-sm font-medium text-encre">{libelle}</p>
      <p className="mt-0.5 text-xs text-ardoise">{detail}</p>
    </div>
  );
}

/**
 * Ce que Dossimo a produit, chiffré. Chaque valeur dérive de la synthèse : le
 * risque reprend l'indicateur unique, les mentions le devis réellement lu, le
 * temps la règle documentée dans `synthese.ts`.
 */
export function MetriquesValeur({ synthese }: { synthese: SyntheseDossier }) {
  const { minutesGagnees, mentionsVerifiees, mentionsTotal, risque } = synthese;

  return (
    <section aria-label="Valeur produite par Dossimo" className="mb-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metrique
          valeur={formatDuree(minutesGagnees)}
          libelle="Temps estimé gagné"
          detail="Documents générés et contrôles exécutés à votre place."
        />
        <Metrique
          valeur={`${mentionsVerifiees} / ${mentionsTotal}`}
          libelle="Mentions vérifiées"
          detail={
            mentionsVerifiees === 0
              ? "Ajoutez le devis pour lancer la vérification."
              : "Mentions obligatoires contrôlées sur le devis réel."
          }
        />
        <Metrique
          valeur={RISQUE_LABEL[risque]}
          libelle="Risque de refus"
          detail="Dérivé des points bloquants, des écarts et des points à vérifier."
          ton={RISQUE_STYLE[risque]}
        />
      </div>
    </section>
  );
}
