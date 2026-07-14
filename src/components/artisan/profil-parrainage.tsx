"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { BTN_SECONDAIRE_SM } from "@/components/ui/boutons";
import type { ReferralStatus } from "@/lib/database.types";

export interface CreditVue {
  id: string;
  label: string;
  expireLe: string;
}

export interface FilleulVue {
  id: string;
  statut: ReferralStatus;
  creeLe: string;
}

const STATUT_FILLEUL: Record<ReferralStatus, { texte: string; classe: string }> = {
  pending: { texte: "En attente de son 1er dossier payé", classe: "bg-papier-fonce text-ardoise" },
  rewarded: { texte: "Crédit versé", classe: "bg-succes-bg text-succes" },
  capped: { texte: "Plafond atteint", classe: "bg-avertissement-bg text-avertissement" },
  self_blocked: { texte: "Auto-parrainage refusé", classe: "bg-erreur-bg text-erreur" },
};

function CodeParrain({ code }: { code: string }) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(code);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers refusé (contexte non sécurisé) : le code reste lisible
      // et sélectionnable à l'écran, l'artisan peut le recopier.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <code className="rounded border border-filigrane bg-papier px-3 py-2 font-mono text-base font-semibold tracking-wider text-encre">
        {code}
      </code>
      <button type="button" onClick={copier} className={BTN_SECONDAIRE_SM}>
        {copie ? (
          <>
            <Check className="mr-1.5 h-3.5 w-3.5" strokeWidth={2} />
            Copié
          </>
        ) : (
          <>
            <Copy className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
            Copier
          </>
        )}
      </button>
    </div>
  );
}

export function SectionParrainage({
  code,
  soldeLabel,
  credits,
  filleuls,
}: {
  code: string | null;
  soldeLabel: string;
  credits: CreditVue[];
  filleuls: FilleulVue[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-ardoise">Votre code</p>
          <div className="mt-2">
            {code ? (
              <CodeParrain code={code} />
            ) : (
              <p className="text-sm text-ardoise">
                Votre code sera généré à la création de votre premier dossier.
              </p>
            )}
          </div>
          <p className="mt-3 text-sm text-ardoise">
            Votre filleul saisit ce code sur son premier dossier et bénéficie d&apos;une remise.
            Vous recevez un crédit dès qu&apos;il le paie.
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-ardoise">Crédits disponibles</p>
          <p className="mt-2 font-serif text-3xl font-semibold text-encre">{soldeLabel}</p>
          {credits.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {credits.map((c) => (
                <li key={c.id} className="text-xs text-ardoise">
                  {c.label} expire le {c.expireLe}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ardoise">
              Déductibles de vos prochains dossiers, au moment du paiement.
            </p>
          )}
        </div>
      </div>

      {filleuls.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ardoise">
            Vos filleuls ({filleuls.length})
          </p>
          <ul className="mt-2 divide-y divide-filigrane">
            {filleuls.map((f) => {
              const statut = STATUT_FILLEUL[f.statut];
              return (
                <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span className="text-sm text-ardoise">Inscrit le {f.creeLe}</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${statut.classe}`}>
                    {statut.texte}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
