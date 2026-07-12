"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { uploadPiece } from "@/lib/piece/actions";
import type { EntreeChecklist } from "@/lib/piece/checklist";
import type { TypePiece } from "@/lib/database.types";

/**
 * La checklist, devenue vivante.
 *
 * Elle listait les pièces à réunir sans jamais savoir lesquelles étaient là : des
 * cases que l'artisan cochait dans sa tête. Chaque entrée sait désormais si sa pièce
 * est déposée, et celles qui lui incombent se déposent ici même. Celles de son client
 * sont marquées comme telles : il n'a rien à faire, c'est le lien de dépôt qui s'en
 * charge — et il ne les verse pas à sa place.
 */

/** Libellé du bouton, par type manquant. Deux photos = deux boutons. */
const LIBELLE: Partial<Record<TypePiece, string>> = {
  devis: "Déposer le devis",
  facture: "Déposer la facture",
  qualification_rge: "Déposer le certificat",
  fiche_technique: "Déposer la fiche",
  cadre_contribution: "Déposer le cadre",
  attestation_honneur: "Déposer l'attestation",
  photo_avant: "Photo avant",
  photo_apres: "Photo après",
};

function BoutonDepot({
  dossierId,
  type,
  onFait,
}: {
  dossierId: string;
  type: TypePiece;
  onFait: () => void;
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
    const res = await uploadPiece(dossierId, type, fd);

    setEnvoi(false);
    if (input.current) input.current.value = "";
    if (!res.ok) return setErreur(res.error);
    onFait();
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="sr-only"
        onChange={(e) => choisir(e.target.files?.[0])}
        disabled={envoi}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={envoi}
        className="inline-flex h-8 items-center rounded border border-encre/25 bg-blanc-casse px-2.5 text-xs font-medium text-encre transition-colors hover:bg-papier-fonce disabled:cursor-not-allowed disabled:opacity-60"
      >
        {envoi ? "Envoi…" : (LIBELLE[type] ?? "Déposer")}
      </button>
      {erreur ? <span className="text-xs text-erreur">{erreur}</span> : null}
    </span>
  );
}

export function ChecklistPieces({
  dossierId,
  entrees,
  mentions,
  debloque,
}: {
  dossierId: string;
  entrees: EntreeChecklist[];
  mentions: string[];
  debloque: boolean;
}) {
  const router = useRouter();
  const [, refresh] = useTransition();
  const rafraichir = () => refresh(() => router.refresh());

  return (
    <>
      <ul className="space-y-3">
        {entrees.map((e) => (
          <li key={e.id} className="flex gap-3">
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border text-[10px] ${
                e.deposee
                  ? "border-succes bg-succes text-blanc-casse"
                  : "border-filigrane"
              }`}
              aria-hidden="true"
            >
              {e.deposee ? "✓" : ""}
            </span>

            <span className="min-w-0 flex-1">
              <span
                className={`text-sm font-medium ${
                  e.deposee ? "text-ardoise line-through" : "text-encre"
                }`}
              >
                {e.label}
              </span>
              {e.obligatoire && !e.deposee && (
                <span className="ml-2 text-[10px] font-semibold uppercase text-terre-cuite">
                  obligatoire
                </span>
              )}
              {e.fournisseur === "beneficiaire" && !e.deposee && (
                <span className="ml-2 rounded-full bg-info-bg px-2 py-0.5 text-[10px] font-medium text-info">
                  votre client
                </span>
              )}

              <span className="block text-xs text-ardoise">{e.description}</span>

              {/* Ce qui incombe à l'artisan se dépose ici. Ce qui incombe au client
                  ne s'y dépose pas : le lien de dépôt existe pour ça. */}
              {!e.deposee && e.fournisseur === "artisan" && debloque && (
                <span className="mt-2 flex flex-wrap gap-2">
                  {e.manquants.map((t) => (
                    <BoutonDepot
                      key={t}
                      dossierId={dossierId}
                      type={t}
                      onFait={rafraichir}
                    />
                  ))}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <h3 className="mt-6 mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ardoise">
        Mentions obligatoires · devis ET facture
      </h3>
      <ul className="space-y-2">
        {mentions.map((m, i) => (
          <li key={i} className="flex gap-3 text-sm text-encre">
            <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded-sm border border-filigrane" />
            {m}
          </li>
        ))}
      </ul>
    </>
  );
}
