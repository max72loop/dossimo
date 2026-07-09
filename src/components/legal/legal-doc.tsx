import type { ReactNode } from "react";

/* Primitives typographiques partagées par les pages légales (mentions, CGV,
   confidentialité). Style sobre, aligné sur l'identité Dossimo. */

export function LegalDoc({
  titre,
  intro,
  maj,
  children,
}: {
  titre: string;
  intro?: ReactNode;
  maj: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-[760px] px-6 py-16 sm:py-20">
      <p className="label flex items-center gap-2.5 text-tampon">
        <span className="h-px w-6 bg-tampon" />
        Informations légales
      </p>
      <h1 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-encre sm:text-[2.5rem] sm:leading-tight">
        {titre}
      </h1>
      {intro ? (
        <p className="mt-4 text-lg leading-relaxed text-ardoise">{intro}</p>
      ) : null}
      <p className="mt-4 font-mono text-xs text-encre-claire">
        Dernière mise à jour : {maj}
      </p>
      <div className="mt-10 space-y-8">{children}</div>
    </article>
  );
}

export function LegalSection({
  titre,
  children,
}: {
  titre: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl font-semibold text-encre">{titre}</h2>
      <div className="space-y-3 text-[0.95rem] leading-relaxed text-ardoise">
        {children}
      </div>
    </section>
  );
}

/** Ligne clé/valeur pour les fiches d'identité (éditeur, hébergeur…). */
export function LegalRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-filigrane py-2.5 sm:flex-row sm:gap-4">
      <span className="w-52 shrink-0 text-sm font-medium text-encre">
        {label}
      </span>
      <span className="text-[0.95rem] text-ardoise">{children}</span>
    </div>
  );
}
