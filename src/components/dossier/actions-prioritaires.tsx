import Link from "next/link";

export type ActionPrioritaire = { dossierId: string; beneficiaire: string; detail: string; tone: "urgent" | "normal" };
export function ActionsPrioritaires({ actions }: { actions: ActionPrioritaire[] }) {
  if (!actions.length) return null;
  return <section className="mb-8 rounded border border-avertissement/30 bg-avertissement-bg p-5"><h2 className="font-serif text-lg font-semibold text-encre">À traiter aujourd’hui</h2><ul className="mt-3 divide-y divide-avertissement/20">{actions.slice(0, 5).map((action) => <li key={`${action.dossierId}:${action.detail}`} className="flex items-center justify-between gap-3 py-3 text-sm"><p><span className="font-medium text-encre">{action.beneficiaire}</span><span className="block text-ardoise">{action.detail}</span></p><Link href={`/dossiers/${action.dossierId}`} className="shrink-0 text-xs font-medium text-tampon underline">Ouvrir</Link></li>)}</ul></section>;
}
