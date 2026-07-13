import { ChevronDown, HelpCircle, Mail, Phone, X } from "lucide-react";

import { editeur } from "@/lib/legal/editeur";

export function AideDossimo() {
  return (
    <details className="group fixed bottom-4 right-4 z-50">
      <summary className="ml-auto flex h-12 cursor-pointer list-none items-center gap-2 rounded-full bg-encre px-4 text-sm font-semibold text-papier shadow-lg transition hover:bg-encre/90 [&::-webkit-details-marker]:hidden">
        <HelpCircle className="h-5 w-5 group-open:hidden" />
        <X className="hidden h-5 w-5 group-open:block" />
        <span className="group-open:hidden">Je suis bloqué</span>
        <span className="hidden group-open:inline">Fermer l’aide</span>
      </summary>
      <section className="absolute bottom-15 right-0 mb-3 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-encre/20 bg-blanc-casse p-5 shadow-2xl" aria-label="Aide Dossimo">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-tampon">Besoin d’aide ?</p>
              <h2 className="mt-1 font-serif text-xl font-semibold text-encre">Ne restez pas bloqué</h2>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <details className="rounded border border-filigrane bg-papier/50 px-3 py-2.5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-encre">
                Expliquez-moi les couleurs
                <ChevronDown className="h-4 w-4" />
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-ardoise">Rouge : à corriger avant le dépôt. Orange : à vérifier. Vert : contrôle réussi. Dossimo affiche toujours l’action à faire sous le problème.</p>
            </details>
            <a href={`mailto:${editeur.emailContact}?subject=Je%20suis%20bloqu%C3%A9%20sur%20mon%20dossier`} className="flex items-center gap-3 rounded border border-filigrane px-3 py-3 text-sm font-medium text-encre transition hover:bg-papier">
              <Mail className="h-4 w-4 text-tampon" />Envoyer une photo du problème
            </a>
            <a href={`mailto:${editeur.emailContact}?subject=Demande%20de%20rappel%20Dossimo&body=Mon%20num%C3%A9ro%20de%20t%C3%A9l%C3%A9phone%20%3A%20`} className="flex items-center gap-3 rounded border border-filigrane px-3 py-3 text-sm font-medium text-encre transition hover:bg-papier">
              <Phone className="h-4 w-4 text-tampon" />Demander à être rappelé
            </a>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-encre-claire">Aucun message n’est envoyé sans votre action : votre messagerie s’ouvre d’abord.</p>
      </section>
    </details>
  );
}
