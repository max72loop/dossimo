import Link from "next/link";
import { Download, ReceiptText } from "lucide-react";

import { listerFactures } from "@/lib/factures/get-facture";
import { mentionsIncompletes } from "@/lib/legal/editeur";
import { formatEuros } from "@/lib/format/montant";

export const metadata = { title: "Factures · Dossimo" };

function dateFr(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR");
}

export default async function FacturesPage() {
  const factures = await listerFactures();
  const indisponible = mentionsIncompletes();

  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-encre">
        Factures
      </h1>
      <p className="mt-2 text-ardoise">
        Une facture est émise automatiquement à chaque paiement encaissé.
      </p>

      {indisponible && factures.length > 0 && (
        <p className="mt-6 rounded border-l-4 border-avertissement bg-avertissement-bg px-4 py-3 text-sm text-avertissement">
          Le téléchargement est momentanément indisponible : l&apos;identité de
          l&apos;émetteur doit être complétée. Vos factures sont enregistrées et
          resteront accessibles.
        </p>
      )}

      {factures.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded border border-dashed border-filigrane bg-blanc-casse px-6 py-16 text-center">
          <ReceiptText className="h-8 w-8 text-encre-claire" strokeWidth={1.5} />
          <p className="mt-4 font-serif text-lg font-semibold text-encre">
            Aucune facture
          </p>
          <p className="mt-1 text-sm text-ardoise">
            Vos factures apparaîtront ici dès votre premier dossier payé.
          </p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-filigrane rounded border border-filigrane bg-blanc-casse">
          {factures.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="font-mono text-sm font-medium text-encre">{f.numero}</p>
                <p className="text-xs text-ardoise">Émise le {dateFr(f.emise_le)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="text-sm font-semibold text-encre">
                  {formatEuros(f.total_ttc_cents / 100)}
                </span>
                {indisponible ? (
                  <span className="text-xs text-encre-claire">Indisponible</span>
                ) : (
                  <Link
                    href={`/factures/${f.id}/facture.pdf`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-sm text-tampon underline-offset-4 hover:underline"
                  >
                    <Download className="h-4 w-4" strokeWidth={1.75} />
                    PDF
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
