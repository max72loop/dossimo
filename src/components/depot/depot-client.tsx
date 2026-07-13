"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { deposerPiece, retirerPiece, type PieceDeposee } from "@/lib/depot/actions";
import { desinscrireDesRelances } from "@/lib/reminders/actions";
import type { PieceAttendue, PieceBeneficiaire } from "@/lib/depot/pieces-attendues";

/**
 * L'écran du bénéficiaire. Une personne qui n'a jamais entendu parler de Dossimo,
 * qui arrive d'un SMS, sur un téléphone, et qui doit photographier quatre papiers.
 *
 * Tout est fait pour qu'il n'ait rien à comprendre : une pièce = une carte, un bouton,
 * un état. Pas de jargon, pas de compte à créer, pas de formulaire à valider à la fin.
 * Chaque dépôt part tout seul — s'il ferme l'onglet après trois pièces sur quatre, les
 * trois sont arrivées.
 */

function Coche() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path
        d="M5 10.5l3.2 3.2L15 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CarteePiece({
  attendue,
  deposee,
  token,
  onDepot,
  onRetrait,
}: {
  attendue: PieceAttendue;
  deposee: PieceDeposee | undefined;
  token: string;
  onDepot: (p: PieceDeposee) => void;
  onRetrait: (id: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function choisir(file: File | undefined) {
    if (!file) return;
    setEnvoi(true);
    setErreur(null);

    const fd = new FormData();
    fd.append("file", file);
    const res = await deposerPiece(token, attendue.type, fd);

    setEnvoi(false);
    if (input.current) input.current.value = "";
    if (!res.ok) return setErreur(res.error);
    onDepot(res.piece);
  }

  async function retirer() {
    if (!deposee) return;
    setEnvoi(true);
    const res = await retirerPiece(token, deposee.id);
    setEnvoi(false);
    if (res.ok) onRetrait(deposee.id);
  }

  const recue = Boolean(deposee);

  return (
    <motion.li
      layout
      className={`rounded-xl border p-5 transition-colors ${
        recue
          ? "border-succes/30 bg-succes-bg/40"
          : "border-encre/12 bg-blanc-casse"
      }`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            recue
              ? "bg-succes text-blanc-casse"
              : "border border-encre/20 bg-papier text-encre-claire"
          }`}
          aria-hidden="true"
        >
          {recue ? <Coche /> : null}
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-semibold text-encre">
            {attendue.titre}
          </h2>

          {recue && deposee ? (
            <p className="mt-1 truncate text-sm text-succes">
              Bien reçu — {deposee.nomFichier ?? "document envoyé"}
            </p>
          ) : (
            <p className="mt-1 text-sm text-ardoise">{attendue.aide}</p>
          )}

          {erreur ? <p className="mt-2 text-sm text-erreur">{erreur}</p> : null}

          <div className="mt-4">
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(e) => choisir(e.target.files?.[0])}
              disabled={envoi}
            />
            {recue ? (
              <button
                type="button"
                onClick={retirer}
                disabled={envoi}
                className="text-xs text-ardoise underline underline-offset-2 hover:text-encre disabled:opacity-50"
              >
                {envoi ? "…" : "Envoyer un autre fichier à la place"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => input.current?.click()}
                disabled={envoi}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-encre px-5 text-sm font-semibold text-blanc-casse transition-colors hover:bg-encre/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {envoi ? "Envoi en cours…" : "Choisir un fichier ou photographier"}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.li>
  );
}

export function DepotClient({
  token,
  prenom,
  entreprise,
  attendues,
  initiales,
}: {
  token: string;
  prenom: string;
  entreprise: string;
  attendues: PieceAttendue[];
  initiales: PieceDeposee[];
}) {
  const [deposees, setDeposees] = useState<PieceDeposee[]>(initiales);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [unsubscribeError, setUnsubscribeError] = useState<string | null>(null);

  const parType = new Map<PieceBeneficiaire, PieceDeposee>();
  for (const p of deposees) parType.set(p.type as PieceBeneficiaire, p);

  const total = attendues.length;
  const recues = attendues.filter((a) => parType.has(a.type)).length;
  const complet = recues === total;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12 sm:py-16">
      <header>
        <p className="font-display text-sm font-bold tracking-tight text-encre">
          dossimo
        </p>
        <h1 className="mt-8 font-display text-2xl font-bold leading-tight text-encre sm:text-3xl">
          Bonjour {prenom}, il manque {total === 1 ? "un document" : `${total} documents`} à votre dossier.
        </h1>
        {/* Phrases construites en JS, pas en texte JSX : le transform avale l'espace
            qui suit une interpolation, et « Isolation Durandprépare » est la première
            chose que lit le client. */}
        <p className="mt-3 max-w-prose text-base leading-relaxed text-ardoise">
          {`${entreprise} prépare votre dossier d'aide à la rénovation. Ces pièces ne peuvent venir que de vous. Photographiez-les ou déposez-les ici : c'est tout ce qu'on vous demande.`}
        </p>
      </header>

      {/* Une jauge, parce que savoir combien il reste est la seule question qu'on se
          pose sur ce genre de page. */}
      <div className="mt-8" aria-hidden="true">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-papier-fonce">
          <motion.div
            className={complet ? "h-full bg-succes" : "h-full bg-encre"}
            initial={false}
            animate={{ width: `${total ? (recues / total) * 100 : 0}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          />
        </div>
        <p className="mt-2 text-xs font-medium text-ardoise">
          {recues} sur {total} envoyé{recues > 1 ? "s" : ""}
        </p>
      </div>

      <ul className="mt-8 grid gap-4">
        {attendues.map((a) => (
          <CarteePiece
            key={a.type}
            attendue={a}
            deposee={parType.get(a.type)}
            token={token}
            onDepot={(p) =>
              setDeposees((prev) => [...prev.filter((x) => x.type !== p.type), p])
            }
            onRetrait={(id) =>
              setDeposees((prev) => prev.filter((x) => x.id !== id))
            }
          />
        ))}
      </ul>

      <AnimatePresence>
        {complet ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-xl border border-succes/30 bg-succes-bg p-5"
          >
            <p className="font-display text-base font-semibold text-succes">
              C&apos;est complet. Merci {prenom}.
            </p>
            <p className="mt-1 text-sm text-encre">
              {`${entreprise} a reçu vos documents et poursuit le montage de votre dossier. Vous pouvez fermer cette page.`}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <footer className="mt-12 border-t border-encre/10 pt-6">
        <p className="text-xs leading-relaxed text-encre-claire">
          {`Vos documents sont transmis à ${entreprise} pour le montage de votre dossier, et ne servent à rien d'autre. Ce lien vous est personnel : ne le partagez pas. Dossimo est un service indépendant d'aide à la préparation de dossier, non affilié à l'Anah ni à France Rénov'.`}
        </p>
        {unsubscribed ? <p className="mt-3 text-xs text-succes">Les relances automatiques sont désactivées pour ce dossier.</p> : <button type="button" onClick={async () => { setUnsubscribeError(null); const result = await desinscrireDesRelances(token); if (!result.ok) setUnsubscribeError(result.error); else setUnsubscribed(true); }} className="mt-3 text-xs text-ardoise underline underline-offset-2 hover:text-encre">Ne plus recevoir de relances</button>}
        {unsubscribeError && <p className="mt-2 text-xs text-erreur">{unsubscribeError}</p>}
      </footer>
    </main>
  );
}
