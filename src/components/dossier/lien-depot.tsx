"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { BTN_PRINCIPAL, BTN_SECONDAIRE_SM } from "@/components/ui/boutons";
import { creerLienDepot, revoquerLienDepot } from "@/lib/depot/actions";
import type { PieceAttendue } from "@/lib/depot/pieces-attendues";

/**
 * Le geste que l'artisan attendait : réclamer à son client les pièces qu'il n'a pas,
 * sans les lui courir après par mail.
 *
 * Il génère un lien, il le colle dans sa conversation WhatsApp. C'est tout. Le lien
 * n'est affiché qu'une fois — le token n'est stocké que haché, Dossimo ne peut pas le
 * réafficher — d'où le ton de l'écran : copiez-le maintenant.
 */
export function LienDepot({
  dossierId,
  attendues,
  nbRecues,
  prenomClient,
  initialUrl,
}: {
  dossierId: string;
  attendues: PieceAttendue[];
  nbRecues: number;
  prenomClient: string;
  initialUrl: string | null;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [copie, setCopie] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  if (attendues.length === 0) return null;

  const total = attendues.length;
  const complet = nbRecues >= total;
  const partage = url
    ? `Bonjour ${prenomClient}, vous pouvez déposer ici les pièces de votre dossier : ${url}`
    : "";

  async function generer() {
    setEnvoi(true);
    setErreur(null);
    const res = await creerLienDepot(dossierId);
    setEnvoi(false);
    if (!res.ok) return setErreur(res.error);
    setUrl(res.url);
  }

  async function copier() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      setErreur("Copie impossible. Sélectionnez le lien à la main.");
    }
  }

  async function revoquer() {
    await revoquerLienDepot(dossierId);
    setUrl(null);
  }

  return (
    <section className="rounded-lg border border-encre/12 bg-blanc-casse p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-encre">
            Les pièces de {prenomClient}
          </h2>
          <p className="mt-1 max-w-prose text-sm text-ardoise">
            {complet
              ? `${prenomClient} a déposé les ${total} pièces attendues. Rien à relancer.`
              : `${total} pièce${total > 1 ? "s" : ""} ne peuvent venir que de votre client. Envoyez-lui un lien : il dépose depuis son téléphone, sans créer de compte.`}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            complet
              ? "bg-succes-bg text-succes"
              : "bg-papier-fonce text-ardoise"
          }`}
        >
          {nbRecues} / {total} reçue{total > 1 ? "s" : ""}
        </span>
      </div>

      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {attendues.map((p) => (
          <li key={p.type} className="text-sm text-ardoise">
            <span className="text-encre-claire">·</span> {p.titre}
          </li>
        ))}
      </ul>

      <AnimatePresence mode="wait">
        {url ? (
          <motion.div
            key="lien"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 rounded border border-info/25 bg-info-bg p-4"
          >
            <p className="text-xs font-medium text-info">
              Lien unique de ce dossier, réutilisé dans toutes les relances.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded border border-encre/12 bg-blanc-casse px-3 py-2 font-mono text-xs text-encre">
                {url}
              </code>
              <button type="button" onClick={copier} className={BTN_SECONDAIRE_SM}>
                {copie ? "Copié" : "Copier"}
              </button>
            </div>
            <p className="mt-3 text-xs text-ardoise">
              Un seul lien reste actif. Vous pouvez le retrouver ici jusqu&apos;à sa révocation ou son expiration.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`https://wa.me/?text=${encodeURIComponent(partage)}`} target="_blank" rel="noreferrer" className={BTN_SECONDAIRE_SM}>Envoyer par WhatsApp</a>
              <a href={`sms:?&body=${encodeURIComponent(partage)}`} className={BTN_SECONDAIRE_SM}>Envoyer par SMS</a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {erreur ? (
        <p className="mt-3 text-sm text-erreur">{erreur}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {!url && (
          <button type="button" onClick={generer} disabled={envoi} className={BTN_PRINCIPAL}>
            {envoi ? "Création…" : "Créer le lien unique de dépôt"}
          </button>
        )}
        {url && (
          <button type="button" onClick={revoquer} className="text-xs text-ardoise underline underline-offset-2 hover:text-encre">
            Révoquer ce lien
          </button>
        )}
      </div>
    </section>
  );
}
