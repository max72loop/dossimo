import Link from "next/link";

import { BTN_SECONDAIRE } from "@/components/ui/boutons";

/**
 * Rappel de valeur en pied de page résultat, réservé au premier dossier offert.
 * Le bouton reste secondaire : l'action principale de l'écran est la
 * finalisation du dossier en cours, pas la création du suivant.
 */
export function ConversionOffert({ prixLabel }: { prixLabel: string }) {
  return (
    <section className="mt-8 rounded-md border border-terre-cuite/30 bg-terre-cuite/5 p-6 shadow-sm">
      <h2 className="font-serif text-lg font-semibold text-encre">
        Ce dossier vous a coûté 0 €
      </h2>
      <p className="mt-1.5 max-w-2xl text-sm text-ardoise">
        Le premier dossier de votre compte est offert. Débloquez les suivants
        {prixLabel !== "—" && <> à partir de {prixLabel}</>} et sécurisez-les de la
        même façon : même contrôle anti-refus, même pack documentaire cohérent.
      </p>
      <Link href="/dossiers/nouveau" className={`mt-4 ${BTN_SECONDAIRE}`}>
        Créer mon prochain dossier
      </Link>
    </section>
  );
}
