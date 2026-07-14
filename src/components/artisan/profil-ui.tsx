import type { ReactNode } from "react";
import { AlertCircle, Check } from "lucide-react";

import type { ProfilResult } from "@/lib/artisan/profil-actions";

export const CHAMP =
  "h-10 w-full rounded border border-filigrane bg-blanc-casse px-3 text-sm text-encre placeholder:text-encre-claire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-encre disabled:cursor-not-allowed disabled:opacity-60";

export const LABEL = "block text-xs font-medium text-ardoise";

/** Section du compte : un titre, une intention, un contenu. */
export function Carte({
  id,
  titre,
  description,
  children,
}: {
  id: string;
  titre: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titre`}
      className="scroll-mt-24 rounded-md border border-filigrane bg-blanc-casse shadow-sm"
    >
      <header className="border-b border-filigrane px-5 py-4 sm:px-6">
        <h2 id={`${id}-titre`} className="font-serif text-lg font-semibold text-encre">
          {titre}
        </h2>
        {description && <p className="mt-1 text-sm text-ardoise">{description}</p>}
      </header>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

/** Champ de formulaire étiqueté, avec son erreur de validation. */
export function Champ({
  label,
  name,
  erreurs,
  aide,
  className = "",
  ...props
}: {
  label: string;
  name: string;
  erreurs?: string[];
  aide?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `champ-${name}`;
  const erreur = erreurs?.[0];
  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur ? `${id}-erreur` : aide ? `${id}-aide` : undefined}
        className={`mt-1.5 ${CHAMP} ${erreur ? "border-erreur" : ""}`}
        {...props}
      />
      {erreur ? (
        <p id={`${id}-erreur`} className="mt-1.5 flex items-center gap-1.5 text-xs text-erreur">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          {erreur}
        </p>
      ) : aide ? (
        <p id={`${id}-aide`} className="mt-1.5 text-xs text-encre-claire">
          {aide}
        </p>
      ) : null}
    </div>
  );
}

/** Retour d'une action : confirmation ou échec global. */
export function Message({ resultat }: { resultat: ProfilResult | null }) {
  if (!resultat) return null;

  if (resultat.ok) {
    return (
      <p className="flex items-start gap-2 rounded border border-succes/25 bg-succes-bg px-3 py-2 text-sm text-succes">
        <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
        {resultat.message ?? "Enregistré."}
      </p>
    );
  }

  // Les erreurs de champ s'affichent sous les champs concernés.
  if (resultat.fieldErrors) return null;

  return (
    <p className="flex items-start gap-2 rounded border border-erreur/25 bg-erreur-bg px-3 py-2 text-sm text-erreur">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
      {resultat.error}
    </p>
  );
}

/** Ligne d'information en lecture seule. */
export function LigneInfo({ label, valeur }: { label: string; valeur: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-filigrane py-3 last:border-0">
      <dt className="text-sm text-ardoise">{label}</dt>
      <dd className="text-sm font-medium text-encre">{valeur}</dd>
    </div>
  );
}
