"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";

export type EtatEtape = "fait" | "en_cours" | "attente";

export type EtapeProgression = {
  label: string;
  etat: EtatEtape;
};

function Puce({ etat }: { etat: EtatEtape }) {
  if (etat === "fait") {
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-succes text-blanc-casse"
      >
        <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
      </motion.span>
    );
  }
  if (etat === "en_cours") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-tampon">
        <Spinner className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
      <span className="h-2.5 w-2.5 rounded-full border border-filigrane" />
    </span>
  );
}

/**
 * Voile bloquant affiché pendant un traitement long. Il tient trois rôles :
 * il nomme le travail en cours plutôt que de laisser un écran figé, il coupe
 * les interactions le temps du traitement (donc plus de double soumission),
 * et il annonce la progression aux lecteurs d'écran.
 *
 * Les étapes doivent refléter du travail réellement en cours, pas une
 * animation décorative : un faux compte à rebours détruit la confiance que
 * l'indicateur est censé construire.
 */
export function OverlayProgression({
  ouvert,
  titre,
  description,
  etapes,
}: {
  ouvert: boolean;
  titre: string;
  description?: string;
  etapes: EtapeProgression[];
}) {
  const courante = etapes.find((e) => e.etat === "en_cours")?.label ?? titre;

  return (
    <AnimatePresence>
      {ouvert && (
        <motion.div
          key="voile"
          role="dialog"
          aria-modal="true"
          aria-busy="true"
          aria-label={titre}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-encre/40 p-4 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full max-w-sm rounded-md border border-filigrane bg-blanc-casse p-6 shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="text-tampon">
                <Spinner className="h-5 w-5" />
              </span>
              <h2 className="font-display text-base font-semibold text-encre">{titre}</h2>
            </div>

            {description && <p className="mt-2 text-sm text-ardoise">{description}</p>}

            <ol className="mt-5 space-y-3">
              {etapes.map((e) => (
                <li key={e.label} className="flex items-center gap-3">
                  <Puce etat={e.etat} />
                  <span
                    className={`text-sm ${
                      e.etat === "attente"
                        ? "text-encre-claire"
                        : e.etat === "en_cours"
                          ? "font-medium text-encre"
                          : "text-ardoise"
                    }`}
                  >
                    {e.label}
                  </span>
                </li>
              ))}
            </ol>

            <p className="mt-5 border-t border-filigrane pt-4 text-xs text-encre-claire">
              Ne fermez pas cette page. Un seul dossier sera créé.
            </p>

            {/* Annonce vocale : seule l'étape courante est lue, à chaque changement. */}
            <p aria-live="polite" className="sr-only">
              {courante}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
