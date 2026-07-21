import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * État vide partagé (DESIGN.md §5 : « un vide n'est jamais un blanc »). Icône
 * discrète, un titre, une phrase, et TOUJOURS une action de sortie. Carte
 * flottante (`shadow-lg`), comme le reste de l'espace artisan.
 *
 * Source unique pour ne pas voir chaque écran réinventer son vide avec des
 * marges et des tailles qui divergent.
 */
export function EmptyState({
  icon: Icon,
  titre,
  description,
  action,
}: {
  icon?: LucideIcon;
  titre: string;
  description?: ReactNode;
  /** Bouton ou lien de sortie (utiliser `BTN_PRINCIPAL`/`BTN_SECONDAIRE`). */
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-blanc-casse px-6 py-16 text-center shadow-lg">
      {Icon && (
        <Icon className="h-8 w-8 text-encre-claire" strokeWidth={1.5} aria-hidden="true" />
      )}
      <p className="mt-4 font-serif text-lg font-semibold text-encre">{titre}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-ardoise">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
