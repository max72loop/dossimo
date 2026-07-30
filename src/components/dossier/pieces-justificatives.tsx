"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Camera, Check, FileText, Sparkles, Upload, X } from "lucide-react";

import { BTN_PRINCIPAL, BTN_SECONDAIRE, BTN_SECONDAIRE_SM, FOCUS } from "@/components/ui/boutons";
import { CARTE, CARTE_INTERNE } from "@/components/ui/cartes";
import { Spinner } from "@/components/ui/spinner";
import { useTactile } from "@/components/ui/use-tactile";
import { compresserImage } from "@/lib/depot/compresser-image";
import { uploadPiece, deletePiece } from "@/lib/piece/actions";
import {
  ACCEPT_DOCUMENT,
  ACCEPT_PHOTO,
  devinerType,
  LIBELLE_PIECE,
  TAILLE_MAX_PIECE,
  TYPES_ARTISAN,
  TYPES_LUS,
  type TypeArtisan,
} from "@/lib/piece/catalogue";
import type { PieceAvecEcarts } from "@/lib/piece/get";
import type { Comparaison } from "@/lib/piece/compare";
import type { MentionVerifiee } from "@/lib/piece/mentions";

/**
 * La zone de dépôt de l'artisan. Trois défauts la rendaient plus lente que le
 * classeur qu'elle remplace :
 *
 * 1. Elle n'acceptait QUE le devis et la facture, alors que le serveur en accepte
 *    neuf. Le certificat RGE, la fiche technique, le cadre de contribution, les
 *    photos ne se déposaient que depuis la checklist, tout en bas de la page et
 *    repliée dès qu'elle est complète. Monter un dossier d'un seul geste était
 *    donc impossible depuis l'endroit prévu pour ça.
 * 2. Un fichier à la fois. L'artisan qui a ses six pièces dans un dossier faisait
 *    six allers-retours.
 * 3. Rien ne bougeait pendant l'envoi. Le seul retour était le libellé du bouton
 *    qui passait à « Lecture du document… » ; pendant les longues secondes que
 *    prend la lecture d'un devis (deux passes du modèle), l'écran était identique
 *    à celui d'avant le clic. L'artisan croyait que rien ne partait, et redéposait.
 *
 * Le principe retenu : chaque fichier existe à l'écran DÈS qu'il est choisi, avec
 * son propre état, et il avance tout seul. Rien n'attend un formulaire à valider.
 */

/** Ce qu'on affiche d'un fichier tant qu'il n'est pas rangé dans le dossier. */
type Phase = "attente" | "preparation" | "envoi" | "recue" | "erreur";

interface FichierEnCours {
  /** Identifiant local ; la pièce n'a pas encore d'id en base. */
  cle: string;
  nom: string;
  taille: number;
  /** `null` = Dossimo n'a pas su deviner, l'artisan doit choisir. */
  type: TypeArtisan | null;
  /** Le type a été deviné (et non désigné) : on le signale, il reste corrigeable. */
  devine: boolean;
  phase: Phase;
  message?: string;
  /** Renseigné une fois la pièce en base : la ligne s'efface quand sa carte arrive. */
  pieceId?: string;
}

/** Les mêmes formats que l'attribut `accept`, pour un refus immédiat côté écran. */
const FORMATS_ACCEPTES = new Set(ACCEPT_DOCUMENT.split(","));

let compteur = 0;
function nouvelleCle(): string {
  compteur += 1;
  return `f${compteur}`;
}

function libelleTaille(octets: number): string {
  const mo = octets / (1024 * 1024);
  return mo >= 1 ? `${mo.toFixed(1).replace(".", ",")} Mo` : `${Math.max(1, Math.round(octets / 1024))} Ko`;
}

/* ------------------------------------------------------------------ Résultat */

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
                {c.statut === "ok" && <Check className="h-4 w-4 text-succes" strokeWidth={2.5} aria-hidden="true" />}
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
                {m.statut === "presente" && <Check className="h-4 w-4 text-succes" strokeWidth={2.5} aria-hidden="true" />}
                {m.statut === "divergente" && (
                  <span className="font-semibold text-erreur">≠</span>
                )}
                {m.statut === "absente" && (
                  <X
                    className={`h-4 w-4 ${douteuse ? "text-avertissement" : "text-erreur"}`}
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
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
  const [erreur, setErreur] = useState<string | null>(null);
  const { piece, comparaisons, mentions } = item;
  const ecarts = comparaisons.filter((c) => c.statut === "ecart").length;
  /**
   * Seuls le devis et la facture sont lus. Le test d'avant (`extraction_statut
   * !== "ok"`) traitait donc toute autre pièce comme un échec de lecture, et
   * affichait « Lecture automatique impossible · document illisible » sur une
   * photo de combles parfaitement nette, qu'on n'avait jamais cherché à lire.
   */
  const lue = TYPES_LUS.has(piece.type);
  const echec = lue && piece.extraction_statut === "echec";

  // Mentions manquantes ou contredites, à confiance de lecture suffisante : ce
  // sont des motifs de refus, pas des suggestions.
  const mentionsKo = (mentions ?? []).filter(
    (m) =>
      m.statut === "divergente" ||
      (m.statut === "absente" && m.confiance >= CONFIANCE_MIN),
  ).length;

  async function remove() {
    setBusy(true);
    setErreur(null);
    const res = await deletePiece(dossierId, piece.id);
    // Une suppression avalée en silence laisserait la carte disparaître de
    // l'écran alors que le fichier reste dans le bucket (AGENTS.md).
    if (!res.ok) {
      setBusy(false);
      setErreur("Suppression impossible pour l'instant. Réessayez.");
      return;
    }
    onChanged();
  }

  return (
    <div className={CARTE_INTERNE}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-tampon/10 px-2 py-0.5 text-[11px] font-medium text-tampon">
              {LIBELLE_PIECE[piece.type]}
            </span>
            <span className="truncate text-sm text-encre">{piece.nom_fichier}</span>
          </div>
          {!echec && lue && (
            <p className="mt-1 flex flex-wrap gap-x-2 text-xs">
              {ecarts > 0 ? (
                <span className="font-medium text-erreur">
                  {ecarts} écart{ecarts > 1 ? "s" : ""} avec la saisie
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-succes">
                  Cohérent avec la saisie
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                </span>
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
                    <span className="inline-flex items-center gap-1 text-succes">
                      {mentions.length} mentions obligatoires présentes
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                    </span>
                  )}
                </>
              )}
            </p>
          )}
          {/* Une pièce qu'on ne cherche pas à lire (certificat, photo, cadre) n'a
              ni écart ni mention à afficher : dire « reçue » est tout ce qu'il y a
              d'honnête à en dire. */}
          {!lue && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-succes">
              Reçue et rangée dans le dossier
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
            </p>
          )}
          {echec && (
            <p className="mt-1 text-xs text-avertissement">
              Lecture automatique impossible · {piece.extraction_erreur ?? "document illisible."}
            </p>
          )}
          {erreur && (
            <p role="alert" className="mt-1 text-xs text-erreur">
              {erreur}
            </p>
          )}
        </div>
        <button
          onClick={remove}
          disabled={busy}
          className={`shrink-0 rounded text-xs text-ardoise underline-offset-2 hover:text-erreur hover:underline disabled:opacity-50 ${FOCUS}`}
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

/* -------------------------------------------------------- File des envois */

/** Ce que dit la ligne pendant que le fichier avance. */
const LIBELLE_PHASE: Record<Phase, string> = {
  attente: "En attente",
  preparation: "Préparation…",
  envoi: "Envoi en cours…",
  recue: "Reçue",
  erreur: "Échec",
};

function LigneEnCours({
  fichier,
  onType,
  onRetirer,
}: {
  fichier: FichierEnCours;
  onType: (type: TypeArtisan) => void;
  onRetirer: () => void;
}) {
  const occupe = fichier.phase === "preparation" || fichier.phase === "envoi";
  const lue = fichier.type ? TYPES_LUS.has(fichier.type) : false;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`rounded-xl p-3 ${
        fichier.phase === "erreur"
          ? "bg-erreur-bg/50"
          : fichier.phase === "recue"
            ? "bg-succes-bg/50"
            : "bg-papier/60"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-ardoise" aria-hidden="true">
          {occupe ? (
            <Spinner className="h-4 w-4" />
          ) : fichier.phase === "recue" ? (
            <Check className="h-4 w-4 text-succes" strokeWidth={2.5} />
          ) : fichier.phase === "erreur" ? (
            <X className="h-4 w-4 text-erreur" strokeWidth={2.5} />
          ) : (
            <FileText className="h-4 w-4" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="truncate text-sm text-encre">{fichier.nom}</span>
            <span className="text-[11px] tabular-nums text-encre-claire">
              {libelleTaille(fichier.taille)}
            </span>
          </p>

          {/* Le type reste modifiable tant que le fichier n'est pas parti : c'est
              là, et seulement là, que corriger une devinette coûte un clic. */}
          {fichier.phase === "attente" ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="text-[11px] font-medium text-ardoise">
                <span className="sr-only">{`Type de ${fichier.nom}`}</span>
                <select
                  value={fichier.type ?? ""}
                  onChange={(e) => onType(e.target.value as TypeArtisan)}
                  className={`h-8 rounded border bg-blanc-casse px-2 text-xs text-encre ${
                    fichier.type ? "border-filigrane" : "border-avertissement"
                  } ${FOCUS}`}
                >
                  <option value="" disabled>
                    Quel document ?
                  </option>
                  {TYPES_ARTISAN.map((t) => (
                    <option key={t} value={t}>
                      {LIBELLE_PIECE[t]}
                    </option>
                  ))}
                </select>
              </label>
              {fichier.type && fichier.devine ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-tampon">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  reconnu, corrigez si besoin
                </span>
              ) : null}
              {!fichier.type ? (
                <span className="text-[11px] text-avertissement">
                  À préciser avant l&apos;envoi
                </span>
              ) : null}
            </div>
          ) : (
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs">
              <span className="text-ardoise">
                {fichier.type ? LIBELLE_PIECE[fichier.type] : "Document"}
              </span>
              <span className="text-filigrane">·</span>
              <span
                className={
                  fichier.phase === "erreur"
                    ? "font-medium text-erreur"
                    : fichier.phase === "recue"
                      ? "font-medium text-succes"
                      : "text-ardoise"
                }
              >
                {fichier.message ?? LIBELLE_PHASE[fichier.phase]}
              </span>
            </p>
          )}

          {/* La lecture d'un devis ou d'une facture prend plusieurs secondes : on
              dit ce qui se passe pendant, plutôt que de laisser croire à un gel. */}
          {fichier.phase === "envoi" && lue ? (
            <p className="mt-1 text-[11px] text-encre-claire">
              Dossimo lit le document et vérifie les mentions obligatoires. Quelques
              secondes.
            </p>
          ) : null}

          {/* Barre indéterminée, en CSS et non en `motion` : `reducedMotion="user"`
              fait sauter un transform à sa valeur d'arrivée, ce qui expédierait la
              barre hors de son cadre et laisserait l'artisan sans aucun signe
              d'activité — exactement la personne pour qui elle est là. */}
          {occupe ? (
            <div
              className="mt-2 h-1 w-full overflow-hidden rounded-full bg-papier-fonce"
              aria-hidden="true"
            >
              <div className="h-full w-full rounded-full bg-accent/70 animate-pulse motion-reduce:animate-none" />
            </div>
          ) : null}
        </div>

        {fichier.phase === "attente" || fichier.phase === "erreur" ? (
          <button
            type="button"
            onClick={onRetirer}
            aria-label={`Retirer ${fichier.nom} de la liste`}
            className={`shrink-0 rounded p-1 text-ardoise transition-colors hover:text-erreur ${FOCUS}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </motion.li>
  );
}

/* ------------------------------------------------------------------ Section */

export function PiecesJustificatives({
  dossierId,
  initial,
  nbMentions,
  manquants = [],
}: {
  dossierId: string;
  initial: PieceAvecEcarts[];
  /** Nombre de mentions obligatoires contrôlées sur le devis. */
  nbMentions: number;
  /**
   * Pièces que CE dossier attend encore de l'artisan, dans l'ordre de la
   * checklist. Elles ne sont pas recalculées ici : elles viennent de
   * `checklistDossier`, donc de `regles_metier` (CLAUDE.md §11). Deux listes qui
   * divergeraient finiraient par réclamer une pièce que le dossier n'exige pas.
   */
  manquants?: { type: TypeArtisan; label: string }[];
}) {
  const router = useRouter();
  const tactile = useTactile();
  const [, rafraichir] = useTransition();

  const [file, setFile] = useState<FichierEnCours[]>([]);
  const [survol, setSurvol] = useState(false);
  const [recap, setRecap] = useState<string | null>(null);

  const inputFichiers = useRef<HTMLInputElement>(null);
  const inputPhoto = useRef<HTMLInputElement>(null);
  /** Type imposé au prochain choix de fichiers (raccourci « il manque… »). */
  const typeImpose = useRef<TypeArtisan | null>(null);
  /** Les objets `File` eux-mêmes, hors état React (ils ne se sérialisent pas). */
  const fichiersRef = useRef<Map<string, File>>(new Map());

  const envoiEnCours = file.some(
    (f) => f.phase === "preparation" || f.phase === "envoi",
  );
  const aEnvoyer = file.filter((f) => f.phase === "attente");
  const pretes = aEnvoyer.filter((f) => f.type !== null);

  /**
   * Une ligne « reçue » ne s'efface qu'au moment précis où sa carte, elle,
   * apparaît. C'est un état DÉRIVÉ des pièces rendues par le serveur, pas un
   * minuteur : la pièce n'est jamais nulle part à l'écran, et l'artisan voit son
   * document passer de la file à la liste sans clignotement.
   */
  const rendues = new Set(initial.map((i) => i.piece.id));
  const enFile = file.filter(
    (f) => !(f.pieceId !== undefined && rendues.has(f.pieceId)),
  );

  function ajouter(fichiers: FileList | File[] | null, type?: TypeArtisan) {
    const liste = Array.from(fichiers ?? []);
    if (liste.length === 0) return;
    setRecap(null);

    const nouvelles: FichierEnCours[] = liste.map((f) => {
      const devine = type ? null : devinerType(f.name);
      // Refusé ici plutôt qu'après l'envoi : inutile de faire monter 30 Mo pour
      // s'entendre dire non, ni d'envoyer un .docx que le serveur refusera. Le
      // serveur revérifie tout, signature binaire comprise : lui seul fait foi.
      const refus =
        f.size > TAILLE_MAX_PIECE
          ? `Trop volumineux (${libelleTaille(f.size)}), 15 Mo maximum.`
          : f.type && !FORMATS_ACCEPTES.has(f.type)
            ? "Format non supporté (JPG, PNG, WEBP ou PDF)."
            : null;
      return {
        cle: nouvelleCle(),
        nom: f.name,
        taille: f.size,
        type: type ?? devine,
        devine: !type && devine !== null,
        phase: refus ? "erreur" : "attente",
        message: refus ?? undefined,
      };
    });

    // Les lignes dont la carte est déjà rendue ne sont plus affichées : on en
    // profite pour les sortir de l'état, plutôt que de les y laisser s'empiler.
    setFile((prev) => [
      ...prev.filter((f) => f.pieceId === undefined || !rendues.has(f.pieceId)),
      ...nouvelles,
    ]);
    fichiersRef.current = new Map([
      ...fichiersRef.current,
      ...nouvelles.map((n, i) => [n.cle, liste[i]] as const),
    ]);

    // Type désigné par l'artisan (il a cliqué « Déposer le certificat ») : aucune
    // ambiguïté à lever, le fichier part tout de suite. Un fichier lâché dans la
    // zone générique, lui, attend la confirmation du type deviné.
    if (type) void envoyer(nouvelles.filter((n) => n.phase === "attente"));
  }

  function majFichier(cle: string, patch: Partial<FichierEnCours>) {
    setFile((prev) => prev.map((f) => (f.cle === cle ? { ...f, ...patch } : f)));
  }

  async function envoyer(lot: FichierEnCours[]) {
    const envoyables = lot.filter((f) => f.type !== null);
    if (envoyables.length === 0) return;
    setRecap(null);

    let recues = 0;
    let ecartsTotal = 0;
    let mentionsKoTotal = 0;
    let echecs = 0;

    // En série, pas en parallèle : chaque devis déclenche deux passes du modèle,
    // et six envois simultanés feraient tomber le lot entier sur une limite de
    // débit. L'artisan voit de toute façon les lignes avancer une à une.
    for (const f of envoyables) {
      const brut = fichiersRef.current.get(f.cle);
      if (!brut || !f.type) continue;

      majFichier(f.cle, { phase: "preparation" });
      const pret = await compresserImage(brut);

      majFichier(f.cle, { phase: "envoi" });
      try {
        const fd = new FormData();
        fd.append("file", pret);
        const res = await uploadPiece(dossierId, f.type, fd);

        if (!res.ok) {
          echecs += 1;
          majFichier(f.cle, { phase: "erreur", message: res.error });
          continue;
        }

        recues += 1;
        const ecarts = res.comparaisons.filter((c) => c.statut === "ecart").length;
        const mentionsKo = res.mentions.filter(
          (m) =>
            m.statut === "divergente" ||
            (m.statut === "absente" && m.confiance >= CONFIANCE_MIN),
        ).length;
        ecartsTotal += ecarts;
        mentionsKoTotal += mentionsKo;

        majFichier(f.cle, {
          phase: "recue",
          pieceId: res.pieceId,
          message:
            res.statut === "echec"
              ? "Reçue, lecture impossible"
              : ecarts > 0
                ? `Reçue · ${ecarts} écart${ecarts > 1 ? "s" : ""}`
                : "Reçue",
        });
      } catch {
        echecs += 1;
        majFichier(f.cle, {
          phase: "erreur",
          message: "L'envoi a échoué. Réessayez.",
        });
      } finally {
        fichiersRef.current.delete(f.cle);
      }
    }

    // Un compte rendu qui reste à l'écran : les lignes, elles, s'effacent dès que
    // les vraies cartes arrivent, et l'artisan doit garder trace de ce qui vient
    // de se passer, écarts compris.
    const morceaux: string[] = [];
    if (recues > 0) {
      morceaux.push(`${recues} document${recues > 1 ? "s" : ""} reçu${recues > 1 ? "s" : ""}`);
    }
    if (ecartsTotal > 0) {
      morceaux.push(`${ecartsTotal} écart${ecartsTotal > 1 ? "s" : ""} avec la saisie`);
    }
    if (mentionsKoTotal > 0) {
      morceaux.push(
        `${mentionsKoTotal} mention${mentionsKoTotal > 1 ? "s" : ""} obligatoire${mentionsKoTotal > 1 ? "s" : ""} en défaut`,
      );
    }
    if (echecs > 0) {
      morceaux.push(`${echecs} envoi${echecs > 1 ? "s" : ""} en échec`);
    }
    setRecap(morceaux.length > 0 ? `${morceaux.join(" · ")}.` : null);

    if (recues > 0) rafraichir(() => router.refresh());
  }

  function ouvrirSelecteur(type?: TypeArtisan) {
    typeImpose.current = type ?? null;
    inputFichiers.current?.click();
  }

  function surDepot(e: React.DragEvent) {
    e.preventDefault();
    setSurvol(false);
    ajouter(e.dataTransfer.files);
  }

  const aRecap = recap !== null;

  return (
    <section id="pieces" className={`mb-6 scroll-mt-6 ${CARTE}`}>
      <h2 className="font-serif text-lg font-semibold text-encre">
        Ajoutez vos documents
      </h2>
      <p className="mt-1.5 text-sm text-ardoise">
        Déposez-les tous en une fois : Dossimo reconnaît chaque document, vérifie
        jusqu&apos;à {nbMentions} mentions obligatoires sur le devis et la facture, et
        signale les écarts avec votre saisie.
      </p>

      {/* Ce qu'il reste à fournir, cliquable. C'est le raccourci qui permet de
          monter le dossier d'un trait : l'artisan lit ce qui manque et le dépose
          sans quitter des yeux la liste. Les pièces du client n'y figurent pas,
          elles passent par son lien de dépôt. */}
      {manquants.length > 0 ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ardoise">
            Il vous reste à déposer
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {manquants.map((m) => (
              <button
                key={m.type}
                type="button"
                disabled={envoiEnCours}
                onClick={() => ouvrirSelecteur(m.type)}
                className={BTN_SECONDAIRE_SM}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                {m.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Zone de glisser-déposer. Les `input` restent focalisables (`sr-only`, et
          non `hidden`) et sont pilotés par de vrais boutons : au clavier comme au
          lecteur d'écran, le dépôt reste atteignable. */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={surDepot}
        className={`mt-4 rounded-xl border-2 border-dashed px-5 py-7 text-center transition-colors ${
          survol
            ? "border-tampon bg-info-bg/50"
            : "border-filigrane bg-papier/40"
        }`}
      >
        <Upload className="mx-auto h-6 w-6 text-ardoise" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium text-encre">
          Glissez vos documents ici
        </p>
        <p className="mt-1 text-xs text-encre-claire">
          Devis, facture, certificat RGE, fiche technique, photos… plusieurs à la fois.
        </p>

        <input
          ref={inputFichiers}
          type="file"
          multiple
          accept={ACCEPT_DOCUMENT}
          aria-label="Choisir des documents"
          tabIndex={-1}
          className="sr-only"
          onChange={(e) => {
            ajouter(e.target.files, typeImpose.current ?? undefined);
            typeImpose.current = null;
            e.target.value = "";
          }}
        />
        {/* Second input, `capture` en plus : ouvre l'appareil photo au lieu du
            sélecteur. N'a de sens que sur un écran tactile — posé sans condition,
            il rendait le PDF du téléphone inatteignable. */}
        <input
          ref={inputPhoto}
          type="file"
          multiple
          accept={ACCEPT_PHOTO}
          capture="environment"
          aria-label="Photographier un document"
          tabIndex={-1}
          className="sr-only"
          onChange={(e) => {
            ajouter(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => ouvrirSelecteur()}
            className={BTN_SECONDAIRE}
          >
            <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
            Choisir des fichiers
          </button>
          {tactile ? (
            <button
              type="button"
              onClick={() => inputPhoto.current?.click()}
              className={BTN_SECONDAIRE}
            >
              <Camera className="mr-2 h-4 w-4" aria-hidden="true" />
              Photographier
            </button>
          ) : null}
        </div>
        <p className="mt-3 text-xs text-encre-claire">
          JPG, PNG, WEBP ou PDF · 15 Mo par document
        </p>
      </div>

      {/* La file. Elle existe dès le choix du fichier : c'est elle qui répond à
          « est-ce que quelque chose s'est passé ? ». */}
      {enFile.length > 0 ? (
        <ul className="mt-4 grid gap-2">
          <AnimatePresence initial={false} mode="popLayout">
            {enFile.map((f) => (
              <LigneEnCours
                key={f.cle}
                fichier={f}
                onType={(type) => majFichier(f.cle, { type, devine: false })}
                onRetirer={() => {
                  fichiersRef.current.delete(f.cle);
                  setFile((prev) => prev.filter((x) => x.cle !== f.cle));
                }}
              />
            ))}
          </AnimatePresence>
        </ul>
      ) : null}

      {aEnvoyer.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={envoiEnCours || pretes.length === 0}
            onClick={() => void envoyer(pretes)}
            className={BTN_PRINCIPAL}
          >
            {envoiEnCours ? <Spinner className="mr-2 h-4 w-4" /> : null}
            {`Envoyer ${pretes.length > 1 ? `les ${pretes.length} documents` : "le document"}`}
          </button>
          {pretes.length < aEnvoyer.length ? (
            <span className="text-xs text-avertissement">
              {`Précisez le type de ${aEnvoyer.length - pretes.length} document${aEnvoyer.length - pretes.length > 1 ? "s" : ""} avant l'envoi.`}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Le compte rendu, au plus près de l'action (DESIGN.md §5 : pas de toast).
          L'annonce de l'envoi en cours ne peut pas passer par le même nœud : la
          file remplace son texte, et un lecteur d'écran n'aurait rien entendu du
          « en cours » avant qu'il ne soit déjà remplacé par le bilan. */}
      <p aria-live="polite" className="sr-only">
        {envoiEnCours ? "Envoi des documents en cours." : ""}
      </p>
      {aRecap && !envoiEnCours ? (
        <motion.p
          role="status"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-succes-bg px-3 py-2 text-sm text-encre"
        >
          <Check className="h-4 w-4 shrink-0 text-succes" strokeWidth={2.5} aria-hidden="true" />
          {recap}
        </motion.p>
      ) : null}

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
                  onChanged={() => rafraichir(() => router.refresh())}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-papier/50 px-4 py-3 text-sm text-ardoise">
          Les contrôles anti-refus portent pour l&apos;instant sur votre saisie.
          Ajoutez le devis puis la facture : Dossimo vérifie qu&apos;ils concordent
          entre eux et avec le dossier, la première cause de refus.
        </p>
      )}
    </section>
  );
}
