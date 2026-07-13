import Link from "next/link";

export type ActionPrioritaire = { dossierId: string; beneficiaire: string; detail: string; tone: "urgent" | "normal" };
export function ActionsPrioritaires({ actions }: { actions: ActionPrioritaire[] }) {
  return (
    <section className={`mb-6 rounded-lg border p-5 ${actions.length ? "border-avertissement/30 bg-avertissement-bg" : "border-succes/25 bg-succes-bg"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ardoise">Votre prochaine action</p>
      <h2 className="mt-1 font-serif text-xl font-semibold text-encre">
        {actions.length ? "À traiter aujourd’hui" : "Rien d’urgent aujourd’hui"}
      </h2>
      {actions.length ? (
        <ul className="mt-3 divide-y divide-avertissement/20">
          {actions.slice(0, 5).map((action, index) => (
            <li key={`${action.dossierId}:${action.detail}`} className="flex items-center justify-between gap-3 py-3 text-sm">
              <p className="flex min-w-0 items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-encre text-xs font-semibold text-papier">{index + 1}</span>
                <span>
                  <span className="font-medium text-encre">{action.beneficiaire}</span>
                  <span className="block text-ardoise">{action.detail}</span>
                </span>
              </p>
              <Link href={`/dossiers/${action.dossierId}`} className="shrink-0 rounded bg-terre-cuite px-3 py-2 text-xs font-medium text-blanc-casse transition hover:bg-terre-cuite-hover">Faire maintenant</Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ardoise">Vos dossiers n’attendent aucune pièce nouvelle. Vous pouvez en démarrer un nouveau quand vous êtes prêt.</p>
      )}
    </section>
  );
}
