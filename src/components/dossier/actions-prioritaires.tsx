import Link from "next/link";
import { CheckCircle2, Clock3, ListTodo } from "lucide-react";

import { CARTE_LISTE } from "@/components/ui/cartes";

export type ActionPrioritaire = {
  dossierId: string;
  beneficiaire: string;
  detail: string;
  categorie: "aujourdhui" | "client" | "depot";
};

const CATEGORIES = [
  {
    id: "aujourdhui" as const,
    titre: "À faire aujourd’hui",
    vide: "Rien à faire de votre côté pour le moment.",
    icon: ListTodo,
    accent: "bg-accent",
  },
  {
    id: "client" as const,
    titre: "En attente du client",
    vide: "Aucun dossier n’attend de pièce client.",
    icon: Clock3,
    accent: "bg-avertissement",
  },
  {
    id: "depot" as const,
    titre: "Prêts à déposer",
    vide: "Aucun dossier prêt à déposer.",
    icon: CheckCircle2,
    accent: "bg-succes",
  },
];

export function ActionsPrioritaires({ actions }: { actions: ActionPrioritaire[] }) {
  return (
    <section aria-label="Mes tâches" className="grid gap-5 lg:grid-cols-3">
      {CATEGORIES.map((categorie) => {
        const taches = actions.filter((action) => action.categorie === categorie.id);
        const Icon = categorie.icon;
        return (
          <div key={categorie.id} className={CARTE_LISTE}>
            <div className="flex items-center gap-3 border-b border-filigrane px-5 py-4">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-blanc-casse ${categorie.accent}`}>
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <h2 className="font-serif text-lg font-semibold text-encre">{categorie.titre}</h2>
              <span className="ml-auto font-mono text-xs text-ardoise">{taches.length}</span>
            </div>
            {taches.length ? (
              <ul className="divide-y divide-filigrane">
                {taches.map((action) => (
                  <li key={`${action.dossierId}:${action.detail}`} className="p-5">
                    <p className="text-sm leading-6 text-encre">
                      <span className="font-semibold">{action.beneficiaire}</span>
                      <span className="text-encre-claire"> — </span>
                      {action.detail}
                    </p>
                    <Link
                      href={`/dossiers/${action.dossierId}`}
                      className="mt-4 inline-flex h-9 items-center rounded bg-accent px-4 text-xs font-semibold text-blanc-casse transition hover:bg-accent-hover"
                    >
                      Continuer
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm leading-6 text-ardoise">{categorie.vide}</p>
            )}
          </div>
        );
      })}
    </section>
  );
}
