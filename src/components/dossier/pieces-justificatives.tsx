"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

import { BTN_SECONDAIRE } from "@/components/ui/boutons";
import { uploadPiece, deletePiece } from "@/lib/piece/actions";
import type { PieceAvecEcarts } from "@/lib/piece/get";
import type { Comparaison } from "@/lib/piece/compare";
import type { MentionVerifiee } from "@/lib/piece/mentions";
import type { TypePiece } from "@/lib/database.types";

const TYPE_LABEL: Record<TypePiece, string> = {
  devis: "Devis",
  facture: "Facture",
  qualification_rge: "Certificat RGE",
  fiche_technique: "Fiche technique",
  cadre_contribution: "Cadre de contribution",
  attestation_honneur: "Attestation sur l'honneur",
  photo_avant: "Photo avant",
  photo_apres: "Photo après",
  autre: "Autre",
  // Déposées par le bénéficiaire via son lien de dépôt.
  avis_imposition: "Avis d'imposition",
  piece_identite: "Pièce d'identité",
  titre_propriete: "Titre de propriété",
  rib: "RIB",
  attestation_bailleur: "Engagement de bailleur",
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

/** Confiance de lecture en dessous de laquelle une mention « absente » reste un doute. */
const CONFIANCE_MIN = 0.6;

/**
 * Mentions obligatoires relevées sur le document. C'est le contrôle que l'artisan
 * ne sait pas faire seul : une mention manquante fait refuser un dossier dont tous
 * les chiffres sont justes. On cite le verbatim du document plutôt que d'affirmer.
 */
function MentionsTable({ mentions }: { mentions: MentionVerifiee[] }) {
  return (
    <div className="mt-3 space-y-1.5">
      {mentions.map((m, i) => {
        const douteuse = m.statut === "absente" && m.confiance < CONFIANCE_MIN;
        return (
          <div
            key={i}
            className={`rounded px-2.5 py-1.5 text-xs ${
              m.statut === "presente"
                ? "bg-papier/60"
                : douteuse
                  ? "bg-avertissement-bg/60"
                  : "bg-erreur-bg/60"
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="shrink-0 pt-px">
                {m.statut === "presente" && <span className="text-succes">✓</span>}
                {m.statut === "divergente" && (
                  <span className="font-semibold text-erreur">≠</span>
                )}
                {m.statut === "absente" && (
                  <span
                    className={
                      douteuse
                        ? "font-semibold text-avertissement"
                        : "font-semibold text-erreur"
                    }
                  >
                    ✗
                  </span>
                )}
              </span>
              <div className="min-w-0">
                <span className="text-encre">{m.mention}</span>
                {m.statut === "absente" && (
                  <span
                    className={`ml-1.5 font-medium ${douteuse ? "text-avertissement" : "text-erreur"}`}
                  >
                    {douteuse
                      ? "— non lisible sur ce document"
                      : "— absente du document"}
                  </span>
                )}
                {m.statut === "divergente" && (
                  <span className="ml-1.5 font-medium text-erreur">
                    — le document porte autre chose
                  </span>
                )}
                {m.verbatim && m.statut !== "presente" && (
                  <p className="mt-0.5 font-mono text-[11px] text-ardoise">
                    Relevé : « {m.verbatim} »
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
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
  const { piece, comparaisons, mentions } = item;
  const ecarts = comparaisons.filter((c) => c.statut === "ecart").length;
  const echec = piece.extraction_statut !== "ok";

  // Mentions manquantes ou contredites, à confiance de lecture suffisante : ce
  // sont des motifs de refus, pas des suggestions.
  const mentionsKo = (mentions ?? []).filter(
    (m) =>
      m.statut === "divergente" ||
      (m.statut === "absente" && m.confiance >= CONFIANCE_MIN),
  ).length;

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
            <p className="mt-1 flex flex-wrap gap-x-2 text-xs">
              {ecarts > 0 ? (
                <span className="font-medium text-erreur">
                  {ecarts} écart{ecarts > 1 ? "s" : ""} avec la saisie
                </span>
              ) : (
                <span className="text-succes">Cohérent avec la saisie ✓</span>
              )}
              {mentions !== null && (
                <>
                  <span className="text-filigrane">·</span>
                  {mentionsKo > 0 ? (
                    <span className="font-medium text-erreur">
                      {mentionsKo} mention{mentionsKo > 1 ? "s" : ""} obligatoire
                      {mentionsKo > 1 ? "s" : ""} en défaut
                    </span>
                  ) : (
                    <span className="text-succes">
                      {mentions.length} mentions obligatoires présentes ✓
                    </span>
                  )}
                </>
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
      {!echec && mentions !== null && mentions.length > 0 && (
        <>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-encre-claire">
            Mentions obligatoires relevées sur le document
          </p>
          <MentionsTable mentions={mentions} />
        </>
      )}
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
      <h2 className="font-serif text-lg font-semibold text-encre">Ajoutez un document</h2>
      <p className="mt-1.5 text-sm text-ardoise">
        Choisissez simplement s’il s’agit du devis ou de la facture, puis prenez une photo ou ajoutez le PDF. Dossimo vérifie jusqu’à {nbMentions} mentions obligatoires.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="text-xs font-medium text-ardoise">
          Ce document est
          <select value={type} onChange={(event) => setType(event.target.value as TypePiece)} className="ml-2 h-10 rounded border border-filigrane bg-blanc-casse px-3 text-sm text-encre">
            <option value="devis">le devis</option>
            <option value="facture">la facture</option>
          </select>
        </label>
        <label className={`cursor-pointer ${BTN_SECONDAIRE}`}>
          {status === "loading" ? "Lecture du document…" : "Prendre une photo ou choisir le fichier"}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            capture="environment"
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
        <div className="mt-4 flex flex-col gap-3">
          {/* `initial={false}` : les pièces déjà présentes au chargement ne
              s'animent pas. Seuls un ajout et une suppression bougent, et
              `layout` fait glisser les voisines au lieu de les faire sauter. */}
          <AnimatePresence initial={false} mode="popLayout">
            {initial.map((item) => (
              <motion.div
                key={item.piece.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <PieceCard
                  dossierId={dossierId}
                  item={item}
                  onChanged={() => router.refresh()}
                />
              </motion.div>
            ))}
          </AnimatePresence>
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
