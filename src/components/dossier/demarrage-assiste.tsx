"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, CheckCircle2, FileText, Sparkles, Upload, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

import { DossierCeeIsolationForm } from "@/components/dossier/DossierCeeIsolationForm";
import { CHAMP_INPUT } from "@/components/ui/champs";
import { BTN_SECONDAIRE, FOCUS } from "@/components/ui/boutons";
import { useTactile } from "@/components/ui/use-tactile";
import { analyserDevisInitial } from "@/lib/dossier/document-first-actions";
import { loadGuestDraft } from "@/lib/dossier/guest-draft";
import { readSource } from "@/lib/tracking/source";
import {
  ACCEPT_DOCUMENT,
  ACCEPT_PHOTO,
  TAILLE_MAX_PIECE,
} from "@/lib/piece/catalogue";
import type { CeeIsolationInput, Famille } from "@/lib/dossier/cee-isolation";

const inputClass = `mt-1.5 ${CHAMP_INPUT}`;

const FORMATS_ACCEPTES = new Set(ACCEPT_DOCUMENT.split(","));

function libelleTaille(octets: number): string {
  const mo = octets / (1024 * 1024);
  return mo >= 1
    ? `${mo.toFixed(1).replace(".", ",")} Mo`
    : `${Math.max(1, Math.round(octets / 1024))} Ko`;
}

export function DemarrageAssiste({
  initialValues,
  manual = false,
  seuilsIsolation = {},
}: {
  initialValues: Partial<CeeIsolationInput>;
  manual?: boolean;
  /**
   * R minimal par poste d'isolation, lu dans `regles_metier` côté serveur et
   * traversé jusqu'au formulaire. Ce composant ne fait que le convoyer : il est
   * client, il ne peut pas lire la base, et ces seuils ne doivent pas être
   * réécrits en dur (cf. TYPES_ISOLATION).
   */
  seuilsIsolation?: Record<string, number>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const tactile = useTactile();
  /**
   * Le fichier choisi vit désormais dans l'état, et plus seulement dans l'input.
   * Avant, choisir un devis ne changeait STRICTEMENT rien à l'écran : même
   * libellé, même bouton, aucune trace du fichier. On ne savait pas s'il avait
   * été pris, et le seul moyen de le vérifier était de lancer la lecture.
   */
  const [fichier, setFichier] = useState<File | null>(null);
  const [survol, setSurvol] = useState(false);
  const [geste, setGeste] = useState<Famille>((initialValues.geste as Famille) ?? "isolation");
  const [dispositif, setDispositif] = useState<"cee" | "maprimerenov">(
    initialValues.dispositif ?? "cee",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<CeeIsolationInput> | null>(() =>
    manual ? { ...initialValues, dispositif, geste } : null,
  );
  const [sourceFile, setSourceFile] = useState<File | undefined>();
  const [champsLus, setChampsLus] = useState<string[]>([]);
  const found = champsLus.length;

  useEffect(() => {
    if (manual) return;
    let actif = true;
    loadGuestDraft().then((guest) => {
      if (!actif || !guest) return;
      setChampsLus(guest.champsTrouves);
      setSourceFile(guest.file);
      setDraft({ ...initialValues, ...guest.valeurs });
    });
    return () => { actif = false; };
  }, [initialValues, manual]);

  /** Fichier retenu, ou refus expliqué tout de suite plutôt qu'après l'envoi. */
  function choisir(f: File | undefined) {
    if (!f) return;
    if (f.type && !FORMATS_ACCEPTES.has(f.type)) {
      setFichier(null);
      setError("Format non supporté. Déposez un PDF, un JPG, un PNG ou un WEBP.");
      return;
    }
    if (f.size > TAILLE_MAX_PIECE) {
      setFichier(null);
      setError(`Ce fichier fait ${libelleTaille(f.size)}, la limite est de 15 Mo.`);
      return;
    }
    setError(null);
    setFichier(f);
  }

  async function analyser() {
    const file = fichier;
    if (!file) {
      setError("Ajoutez votre devis en PDF ou prenez-le en photo.");
      return;
    }
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("geste", geste);
    fd.append("dispositif", dispositif);
    // Canal d'acquisition mémorisé à l'arrivée (sessionStorage, first-touch). Il
    // suit déjà l'inscription ; sans lui ici, l'essai serait la seule étape du
    // tunnel qu'on ne saurait pas rattacher à une campagne.
    fd.append("source", readSource() ?? "");
    try {
      const result = await analyserDevisInitial(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setChampsLus(result.champsTrouves);
      setSourceFile(file);
      setDraft({ ...initialValues, ...result.valeurs });
    } catch {
      setError("La lecture a échoué. Vous pouvez réessayer ou continuer sans analyse.");
    } finally {
      setLoading(false);
    }
  }

  if (draft) {
    return (
      <div>
        {found > 0 && <div className="mb-7 rounded-md border border-succes/30 bg-succes-bg p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-succes" />
            <div>
              <p className="font-medium text-encre">
                Dossimo a prérempli {found} information{found > 1 ? "s" : ""}
              </p>
              <p className="mt-1 text-sm text-ardoise">
                Vérifiez uniquement les champs signalés. L’IA recopie le devis ; le contrôle réglementaire reste effectué par les règles Dossimo.
              </p>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="mt-2 text-xs font-medium text-tampon underline underline-offset-2"
              >
                Utiliser un autre document
              </button>
            </div>
          </div>
        </div>}
        <DossierCeeIsolationForm
          initialValues={draft}
          initialStep={0}
          assisted={found > 0}
          assistedFields={champsLus}
          initialDocument={sourceFile}
          seuilsIsolation={seuilsIsolation}
        />
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-tampon/25 bg-blanc-casse p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-bg text-tampon">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-tampon">Le plus simple</p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-encre">Commencez par votre devis</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ardoise">
            Dossimo lit le document, préremplit le client, les montants et les données techniques. Vous confirmez ensuite ce qui manque.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-ardoise">
          Aide visée
          <select value={dispositif} onChange={(e) => setDispositif(e.target.value as typeof dispositif)} className={inputClass}>
            <option value="cee">CEE</option>
            <option value="maprimerenov">MaPrimeRénov&apos;</option>
          </select>
        </label>
        <label className="text-sm font-medium text-ardoise">
          Type de travaux
          <select value={geste} onChange={(e) => setGeste(e.target.value as Famille)} className={inputClass}>
            <option value="isolation">Isolation</option>
            <option value="pac_air_eau">Pompe à chaleur air/eau</option>
            <option value="cet">Chauffe-eau thermodynamique</option>
            <option value="bois">Chauffage au bois</option>
            <option value="solaire_thermique">Chauffe-eau solaire individuel</option>
          </select>
        </label>
      </div>

      {/* Zone de dépôt. Deux inputs plutôt qu'un : `capture` posé sans condition
          forçait l'appareil photo sur mobile, rendant inatteignable le devis en
          PDF déjà rangé dans le téléphone. */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSurvol(false);
          choisir(e.dataTransfer.files?.[0]);
        }}
        className={`mt-5 rounded-lg border-2 border-dashed px-5 py-6 text-center transition ${
          survol
            ? "border-tampon bg-info-bg/50"
            : fichier
              ? "border-succes/40 bg-succes-bg/40"
              : "border-filigrane bg-papier/50"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT_DOCUMENT}
          aria-label="Choisir le devis"
          tabIndex={-1}
          className="sr-only"
          onChange={(e) => choisir(e.target.files?.[0])}
        />
        <input
          ref={photoRef}
          type="file"
          accept={ACCEPT_PHOTO}
          capture="environment"
          aria-label="Photographier le devis"
          tabIndex={-1}
          className="sr-only"
          onChange={(e) => choisir(e.target.files?.[0])}
        />

        {fichier ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-succes text-blanc-casse">
              <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="min-w-0 text-left">
              <span className="block truncate text-sm font-medium text-encre">
                {fichier.name}
              </span>
              <span className="block text-xs tabular-nums text-encre-claire">
                {libelleTaille(fichier.size)} · prêt à être lu
              </span>
            </span>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setFichier(null);
                if (fileRef.current) fileRef.current.value = "";
                if (photoRef.current) photoRef.current.value = "";
              }}
              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-ardoise underline-offset-2 hover:text-encre hover:underline disabled:opacity-50 ${FOCUS}`}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Changer de document
            </button>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-6 w-6 text-ardoise" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-encre">
              Glissez votre devis ici
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={BTN_SECONDAIRE}
              >
                <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                Choisir le fichier
              </button>
              {tactile ? (
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className={BTN_SECONDAIRE}
                >
                  <Camera className="mr-2 h-4 w-4" aria-hidden="true" />
                  Le prendre en photo
                </button>
              ) : null}
            </div>
            <p className="mt-3 text-xs text-encre-claire">
              PDF, JPG, PNG ou WEBP · 15 Mo maximum
            </p>
          </>
        )}
      </div>

      {error && <p role="alert" className="mt-3 rounded border-l-4 border-avertissement bg-avertissement-bg px-4 py-3 text-sm text-avertissement">{error}</p>}

      {/* La lecture prend plusieurs secondes. Sans ce bloc, l'écran était
          rigoureusement identique à celui d'avant le clic, à un mot près sur le
          bouton : de quoi croire que rien ne part et recliquer. */}
      {loading && (
        <div role="status" className="mt-4 rounded-lg bg-info-bg/60 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-encre">
            <Spinner className="h-4 w-4" />
            Dossimo lit votre devis
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ardoise">
            {`Client, montants, dates, caractéristiques techniques : tout ce qui est lisible est recopié dans le formulaire. Quelques secondes, ne fermez pas la page.`}
          </p>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-papier-fonce" aria-hidden="true">
            <div className="h-full w-full rounded-full bg-accent/70 animate-pulse motion-reduce:animate-none" />
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          // Volontairement pas désactivé faute de fichier : cliquer d'abord sur
          // l'action principale est le geste naturel, et un bouton mort sans
          // explication laisse l'artisan chercher ce qui cloche. Il obtient une
          // phrase qui lui dit quoi faire.
          disabled={loading}
          onClick={analyser}
          className={`inline-flex h-12 items-center justify-center gap-2 rounded bg-accent px-6 text-sm font-semibold text-blanc-casse transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`}
        >
          {loading ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Lecture du devis…" : "Lire mon devis et préremplir"}
        </button>
        <a
          href={`/dossiers/nouveau?mode=manuel&dispositif=${dispositif}&geste=${geste}`}
          aria-disabled={loading}
          className={`inline-flex h-12 items-center justify-center rounded border border-filigrane px-5 text-sm font-semibold text-ardoise transition hover:border-tampon hover:text-encre ${loading ? "pointer-events-none opacity-60" : ""}`}
        >
          Continuer sans devis
        </a>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-encre-claire">
        Lecture automatique du devis, vous vérifiez ensuite.
      </p>
    </section>
  );
}
