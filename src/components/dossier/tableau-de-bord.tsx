import { PARCOURS } from "@/lib/dossier/parcours";
import type { StatutDossier } from "@/lib/database.types";

export interface StatsTableau {
  total: number;
  parEtat: Record<StatutDossier, number>;
  payes: number;
  revenu: number;
  conformes: number;
  tauxConformite: number | null;
  /** Pièces déposées par les clients depuis le dernier passage de l'artisan. */
  nouvellesPieces: number;
  /** Dossiers concernés par ces nouvelles pièces. */
  dossiersAvecNouveautes: number;
  /** Dossiers qui attendent encore une pièce de leur bénéficiaire. */
  dossiersEnAttenteClient: number;
}

const euro = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function Tuile({
  label,
  valeur,
  sous,
}: {
  label: string;
  valeur: string;
  sous?: string;
}) {
  return (
    <div className="rounded border border-filigrane bg-blanc-casse p-4">
      <p className="text-xs text-ardoise">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold text-encre">{valeur}</p>
      {sous && <p className="mt-0.5 text-xs text-encre-claire">{sous}</p>}
    </div>
  );
}

/** Vue de pilotage : volume, parcours, revenus, conformité. */
export function TableauDeBord({ stats }: { stats: StatsTableau }) {
  const max = Math.max(1, ...PARCOURS.map((e) => stats.parEtat[e.statut] ?? 0));

  return (
    <section className="mb-8">
      {/* Le seul endroit du produit où l'artisan apprend que son client a déposé
          quelque chose. Faute d'e-mail, c'est l'espace qui sonne — et il ne sonne
          que quand il y a du neuf. */}
      {stats.nouvellesPieces > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded border border-info/25 bg-info-bg px-4 py-3">
          <span className="h-2 w-2 shrink-0 rounded-full bg-info" aria-hidden="true" />
          <p className="text-sm font-medium text-info">
            {stats.nouvellesPieces === 1
              ? "Un client a déposé une pièce"
              : `Vos clients ont déposé ${stats.nouvellesPieces} pièces`}
          </p>
          <p className="text-sm text-encre">
            {stats.dossiersAvecNouveautes === 1
              ? "sur 1 dossier, depuis votre dernier passage."
              : `sur ${stats.dossiersAvecNouveautes} dossiers, depuis votre dernier passage.`}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Tuile label="Dossiers" valeur={String(stats.total)} />
        <Tuile
          label="Débloqués (payés)"
          valeur={String(stats.payes)}
          sous={stats.revenu > 0 ? `${euro(stats.revenu)} encaissés` : "1er dossier offert"}
        />
        <Tuile
          label="Conformité"
          valeur={stats.tauxConformite == null ? "—" : `${stats.tauxConformite}%`}
          sous={
            stats.tauxConformite == null
              ? "aucun dossier"
              : `${stats.conformes}/${stats.total} sans point bloquant`
          }
        />
        <Tuile
          label="Prêts à déposer"
          valeur={String(stats.parEtat.pret_depot ?? 0)}
          sous={`${stats.parEtat.depose ?? 0} déposé(s) · ${stats.parEtat.livre ?? 0} soldé(s)`}
        />
        <Tuile
          label="En attente du client"
          valeur={String(stats.dossiersEnAttenteClient)}
          sous={
            stats.dossiersEnAttenteClient === 0
              ? "aucune pièce à réclamer"
              : stats.dossiersEnAttenteClient === 1
                ? "dossier dont le client n'a pas tout déposé"
                : "dossiers dont le client n'a pas tout déposé"
          }
        />
      </div>

      <div className="mt-3 rounded border border-filigrane bg-blanc-casse p-4">
        <p className="text-xs font-medium text-ardoise">Répartition par étape du parcours</p>
        <ul className="mt-3 space-y-2">
          {PARCOURS.map((etape) => {
            const n = stats.parEtat[etape.statut] ?? 0;
            return (
              <li key={etape.statut} className="flex items-center gap-3 text-sm">
                <span className="w-32 shrink-0 text-ardoise">{etape.label}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-papier-fonce">
                  <span
                    className="block h-full rounded-full bg-tampon"
                    style={{ width: `${(n / max) * 100}%` }}
                  />
                </span>
                <span className="w-6 shrink-0 text-right font-mono text-xs text-encre">{n}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
