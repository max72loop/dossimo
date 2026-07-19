"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  enregistrerRetourDepot,
  type RetourStatut,
} from "@/lib/dossier/oblige-actions";

/**
 * Capture de l'issue d'un dossier après dépôt, pour MaPrimeRénov'.
 *
 * Le CEE a déjà cette boucle (ObligeSuivi), couplée au choix de l'obligé. Le MPR
 * n'a pas d'obligé — le dépôt va à l'Anah, par le client — mais l'issue reste la
 * donnée la plus précieuse : un refus survenu malgré un contrôle « conforme » est
 * le signal qui doit durcir la règle. On réutilise la même table `retours_depot`
 * et la même action ; seul l'habillage change (pas d'obligé ici).
 */
const OPTIONS: { value: RetourStatut; label: string; actif: string }[] = [
  { value: "en_cours", label: "En cours", actif: "bg-encre text-blanc-casse" },
  { value: "accepte", label: "Accepté", actif: "bg-succes text-blanc-casse" },
  { value: "refuse", label: "Refusé", actif: "bg-erreur text-blanc-casse" },
  { value: "abandonne", label: "Abandonné", actif: "bg-ardoise text-blanc-casse" },
];

export function IssueDossier({
  dossierId,
  retour,
}: {
  dossierId: string;
  retour: { statut: RetourStatut; motif: string | null; detail: string | null } | null;
}) {
  const router = useRouter();
  const [statut, setStatut] = useState<RetourStatut>(retour?.statut ?? "en_cours");
  const [motif, setMotif] = useState(retour?.motif ?? "");
  const [detail, setDetail] = useState(retour?.detail ?? "");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function save() {
    setMessage(null);
    startTransition(async () => {
      const res = await enregistrerRetourDepot({ dossierId, statut, motif, detail });
      if (res.ok) {
        setMessage("Issue enregistrée.");
        router.refresh();
      } else {
        setMessage(res.error ?? "Erreur.");
      }
    });
  }

  const input =
    "mt-1 w-full rounded border border-filigrane bg-blanc-casse px-3 py-2 text-sm text-encre";

  return (
    <section className="rounded border border-filigrane bg-papier/40 p-5">
      <h2 className="font-serif text-lg font-semibold text-encre">
        Après le dépôt du dossier
      </h2>
      <p className="mt-1 text-sm text-ardoise">
        Renseignez l&apos;issue reçue de l&apos;Anah. C&apos;est votre suivi, et
        ça affine les contrôles pour vos prochains dossiers.
      </p>

      {/* Contrôle segmenté */}
      <div className="mt-4 inline-flex flex-wrap overflow-hidden rounded border border-filigrane">
        {OPTIONS.map((o, i) => {
          const active = statut === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => setStatut(o.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${i > 0 ? "border-l border-filigrane" : ""} ${active ? o.actif : "bg-blanc-casse text-ardoise hover:bg-papier"}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {statut === "refuse" && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-encre">
            Motif remonté par l&apos;Anah
          </label>
          <input
            className={input}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Ex. pièce manquante, incohérence relevée à l'instruction…"
          />
          <div className="mt-3 rounded bg-encre px-4 py-3 text-sm text-blanc-casse">
            Un refus survenu sur un dossier jugé conforme est le signal le plus
            utile : signalez-le, il devient un point de contrôle à durcir pour vos
            prochains dossiers.
          </div>
        </div>
      )}

      <div className="mt-4">
        <label className="block text-sm font-medium text-encre">
          Commentaire <span className="font-normal text-ardoise">(facultatif)</span>
        </label>
        <textarea
          className={input}
          rows={2}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Retour de l'organisme, date de versement…"
        />
      </div>

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="mt-4 rounded bg-terre-cuite px-4 py-2 text-sm font-medium text-blanc-casse transition hover:bg-terre-cuite-hover disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer l'issue"}
      </button>
      {message && (
        <p className="mt-3 text-sm text-ardoise" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
