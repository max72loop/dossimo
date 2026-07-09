"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { BTN_SECONDAIRE } from "@/components/ui/boutons";
import { uploadPiece, deletePiece } from "@/lib/piece/actions";
import type { PieceAvecEcarts } from "@/lib/piece/get";
import type { Comparaison } from "@/lib/piece/compare";
import type { TypePiece } from "@/lib/database.types";

const TYPE_LABEL: Record<TypePiece, string> = {
  devis: "Devis",
  facture: "Facture",
  autre: "Autre",
};

function EcartsTable({ comps }: { comps: Comparaison[] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-encre-claire">
          <tr>
            <th className="py-1 pr-3 font-medium">Champ</th>
            <th className="py-1 pr-3 font-medium">Saisie</th>
            <th className="py-1 pr-3 font-medium">Pièce</th>
            <th className="py-1 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-filigrane">
          {comps.map((c, i) => (
            <tr
              key={i}
              className={c.statut === "ecart" ? "bg-erreur-bg/60" : undefined}
            >
              <td className="py-1.5 pr-3 text-ardoise">{c.champ}</td>
              <td className="py-1.5 pr-3 font-mono text-encre">{c.saisie}</td>
              <td
                className={`py-1.5 pr-3 font-mono ${c.statut === "ecart" ? "font-semibold text-erreur" : "text-encre"}`}
              >
                {c.piece}
              </td>
              <td className="py-1.5">
                {c.statut === "ok" && <span className="text-succes">✓</span>}
                {c.statut === "ecart" && (
                  <span className="font-semibold text-erreur">≠ écart</span>
                )}
                {c.statut === "absent" && (
                  <span className="text-encre-claire">non lu</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PieceCard({
  dossierId,
  item,
  onChanged,
}: {
  dossierId: string;
  item: PieceAvecEcarts;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const { piece, comparaisons } = item;
  const ecarts = comparaisons.filter((c) => c.statut === "ecart").length;
  const echec = piece.extraction_statut !== "ok";

  async function remove() {
    setBusy(true);
    await deletePiece(dossierId, piece.id);
    onChanged();
  }

  return (
    <div className="rounded border border-filigrane bg-papier p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-tampon/10 px-2 py-0.5 text-[11px] font-medium text-tampon">
              {TYPE_LABEL[piece.type]}
            </span>
            <span className="truncate text-sm text-encre">{piece.nom_fichier}</span>
          </div>
          {!echec && (
            <p className="mt-1 text-xs">
              {ecarts > 0 ? (
                <span className="font-medium text-erreur">
                  {ecarts} écart{ecarts > 1 ? "s" : ""} avec la saisie
                </span>
              ) : (
                <span className="text-succes">Cohérent avec la saisie ✓</span>
              )}
            </p>
          )}
          {echec && (
            <p className="mt-1 text-xs text-avertissement">
              Lecture automatique impossible · {piece.extraction_erreur ?? "document illisible."}
            </p>
          )}
        </div>
        <button
          onClick={remove}
          disabled={busy}
          className="shrink-0 text-xs text-ardoise underline-offset-2 hover:text-erreur hover:underline disabled:opacity-50"
        >
          {busy ? "…" : "Supprimer"}
        </button>
      </div>
      {!echec && comparaisons.length > 0 && <EcartsTable comps={comparaisons} />}
    </div>
  );
}

export function PiecesJustificatives({
  dossierId,
  initial,
  nbMentions,
}: {
  dossierId: string;
  initial: PieceAvecEcarts[];
  /** Nombre de mentions obligatoires contrôlées sur le devis. */
  nbMentions: number;
}) {
  const router = useRouter();
  const [type, setType] = useState<TypePiece>("devis");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("loading");
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await uploadPiece(dossierId, type, fd);
      if (!res.ok) setError(res.error);
      else if (res.statut === "echec")
        setError(res.message ?? "Document illisible, mais conservé.");
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setStatus("idle");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section
      id="pieces"
      className="mb-6 scroll-mt-6 rounded-md border border-tampon/25 bg-blanc-casse p-5 shadow-sm"
    >
      <h2 className="font-serif text-lg font-semibold text-encre">
        Ajoutez votre devis, Dossimo vérifie {nbMentions} mentions obligatoires
      </h2>
      <p className="mt-1.5 text-sm text-ardoise">
        Dossimo relit la pièce et compare surface, résistance R, montants, dates et
        mentions RGE à votre saisie. Un écart devient visible avant le dépôt, pas
        après le refus. Vous restez juge.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex overflow-hidden rounded border border-filigrane">
          {(["devis", "facture"] as TypePiece[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1.5 text-sm transition-colors ${
                type === t
                  ? "bg-tampon text-blanc-casse"
                  : "bg-blanc-casse text-ardoise hover:bg-papier-fonce"
              }`}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <label className={`cursor-pointer ${BTN_SECONDAIRE}`}>
          {status === "loading" ? "Analyse…" : `Ajouter ${TYPE_LABEL[type].toLowerCase()}`}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            disabled={status === "loading"}
            onChange={onFile}
          />
        </label>
        <span className="text-xs text-encre-claire">JPG, PNG ou PDF · 15 Mo max</span>
      </div>

      {error && (
        <p className="mt-3 rounded border-l-4 border-avertissement bg-avertissement-bg px-3 py-2 text-xs text-avertissement">
          {error}
        </p>
      )}

      {initial.length > 0 ? (
        <div className="mt-4 space-y-3">
          {initial.map((item) => (
            <PieceCard
              key={item.piece.id}
              dossierId={dossierId}
              item={item}
              onChanged={() => router.refresh()}
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded border border-dashed border-filigrane bg-papier/40 px-4 py-3 text-sm text-ardoise">
          Les contrôles anti-refus portent pour l&apos;instant sur votre saisie.
          Ajoutez le devis puis la facture : Dossimo vérifie qu&apos;ils concordent
          entre eux et avec le dossier, la première cause de refus.
        </p>
      )}
    </section>
  );
}
