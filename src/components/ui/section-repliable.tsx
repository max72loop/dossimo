/**
 * Section de détail repliée par défaut. S'appuie sur `<details>/<summary>`
 * natifs : ouverture au clavier et restitution correcte par les lecteurs
 * d'écran, sans état ni librairie.
 */
export function SectionRepliable({
  titre,
  resume,
  id,
  ouvertParDefaut = false,
  children,
}: {
  titre: string;
  resume?: string;
  id?: string;
  ouvertParDefaut?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      id={id}
      open={ouvertParDefaut}
      className="group mb-3 overflow-hidden rounded-2xl bg-blanc-casse shadow-lg"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded px-5 py-4 hover:bg-papier/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-encre [&::-webkit-details-marker]:hidden">
        <div>
          <h2 className="font-serif text-base font-semibold text-encre">{titre}</h2>
          {resume && <p className="mt-0.5 text-xs text-ardoise">{resume}</p>}
        </div>
        <span
          aria-hidden
          className="shrink-0 text-encre-claire transition-transform group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <div className="border-t border-filigrane px-5 py-4">{children}</div>
    </details>
  );
}
