"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, Mail, Phone, X } from "lucide-react";

export function AideDossimo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <section className="mb-3 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-encre/20 bg-blanc-casse p-5 shadow-2xl" aria-label="Aide Dossimo">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-tampon">Besoin d’aide ?</p>
              <h2 className="mt-1 font-serif text-xl font-semibold text-encre">Ne restez pas bloqué</h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer l’aide" className="rounded p-1 text-ardoise hover:bg-papier">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 space-y-2">
            <details className="rounded border border-filigrane bg-papier/50 px-3 py-2.5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-encre">
                Expliquez-moi les couleurs
                <ChevronDown className="h-4 w-4" />
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-ardoise">Rouge : à corriger avant le dépôt. Orange : à vérifier. Vert : contrôle réussi. Dossimo affiche toujours l’action à faire sous le problème.</p>
            </details>
            <a href="mailto:contact@dossimo.fr?subject=Je%20suis%20bloqu%C3%A9%20sur%20mon%20dossier" className="flex items-center gap-3 rounded border border-filigrane px-3 py-3 text-sm font-medium text-encre transition hover:bg-papier">
              <Mail className="h-4 w-4 text-tampon" />Envoyer une photo du problème
            </a>
            <a href="mailto:contact@dossimo.fr?subject=Demande%20de%20rappel%20Dossimo&body=Mon%20num%C3%A9ro%20de%20t%C3%A9l%C3%A9phone%20%3A%20" className="flex items-center gap-3 rounded border border-filigrane px-3 py-3 text-sm font-medium text-encre transition hover:bg-papier">
              <Phone className="h-4 w-4 text-tampon" />Demander à être rappelé
            </a>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-encre-claire">Aucun message n’est envoyé sans votre action : votre messagerie s’ouvre d’abord.</p>
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="ml-auto flex h-12 items-center gap-2 rounded-full bg-encre px-4 text-sm font-semibold text-papier shadow-lg transition hover:bg-encre/90"
      >
        <HelpCircle className="h-5 w-5" />
        Je suis bloqué
      </button>
    </div>
  );
}
