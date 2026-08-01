"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Camera, CheckCircle2, FileText, PlayCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useTactile } from "@/components/ui/use-tactile";

import { analyserDevisInitial } from "@/lib/dossier/document-first-actions";
import { saveGuestDraft } from "@/lib/dossier/guest-draft";
import type { CeeIsolationInput } from "@/lib/dossier/cee-isolation";
import { ACCEPT_DOCUMENT, ACCEPT_PHOTO } from "@/lib/piece/catalogue";

const POINTS_A_VERIFIER: Array<{ key: keyof CeeIsolationInput; label: string }> = [
  { key: "client_nom", label: "le nom complet du client" },
  { key: "client_adresse", label: "l'adresse du chantier" },
  { key: "date_devis", label: "la date du devis" },
  { key: "rge_numero", label: "le numéro RGE" },
  { key: "montant_ht", label: "le montant HT" },
  { key: "montant_ttc", label: "le montant TTC" },
];

export function DemoGuide() {
  const fichierRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const carteRef = useRef<HTMLDivElement>(null);
  const tactile = useTactile();
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ valeurs: Partial<CeeIsolationInput>; champsTrouves: string[] } | null>(null);
  const [loadingStep, setLoadingStep] = useState("Je lis le devis");

  /**
   * Sur un téléphone, l'appareil photo occupe tout l'écran puis rend la main :
   * l'artisan revient sur une page qu'il n'a pas fait défiler, et la carte se
   * trouve sous la ligne de flottaison. Sans ce recentrage, il ne voit NI
   * l'attente, NI le verdict, et croit que rien ne s'est passé. `nearest` ne
   * bouge rien quand la carte est déjà visible (le cas sur un écran large).
   */
  useEffect(() => {
    if (!loading && !result && !error) return;
    carteRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [loading, result, error]);

  async function analyser(file?: File) {
    if (!file) return setError("Ajoutez votre devis en PDF ou prenez-le en photo.");
    setLoading(true);
    setLoadingStep("Je lis le devis");
    setError(null);
    const rgeTimer = window.setTimeout(() => setLoadingStep("Je vérifie votre RGE"), 1200);
    const resultTimer = window.setTimeout(() => setLoadingStep("Je cherche ce qu’il faut corriger"), 2600);
    const data = new FormData();
    data.append("file", file);
    data.append("geste", "auto");
    data.append("dispositif", "auto");
    try {
      const analyse = await analyserDevisInitial(data);
      if (!analyse.ok) return setError(analyse.error);
      const draft = { valeurs: analyse.valeurs, champsTrouves: analyse.champsTrouves };
      await saveGuestDraft(draft, file);
      setResult(draft);
    } catch {
      setError("La lecture a échoué. Réessayez avec une photo plus nette.");
    } finally {
      window.clearTimeout(rgeTimer);
      window.clearTimeout(resultTimer);
      setLoading(false);
    }
  }

  function selectionner(input: HTMLInputElement) {
    const file = input.files?.[0];
    // Le champ est remis à zéro tout de suite : sans cela, reprendre EXACTEMENT
    // le même fichier après un échec ne déclenche aucun `change`, et l'écran
    // reste figé sur l'erreur précédente.
    input.value = "";
    if (!file) return;
    setFileName(file.name);
    void analyser(file);
  }

  async function essayerExemple() {
    const draft = {
      valeurs: {
        dispositif: "cee" as const,
        geste: "isolation" as const,
        client_nom: "Dupont",
        client_adresse: "12 rue des Tilleuls, 37000 Tours",
        date_devis: "2026-07-10",
        montant_ht: 8400,
        montant_ttc: 8862,
      },
      champsTrouves: ["client_nom", "client_adresse", "date_devis", "montant_ht", "montant_ttc"],
    };
    const pixel = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="), (c) => c.charCodeAt(0));
    await saveGuestDraft(draft, new File([pixel], "devis-exemple.png", { type: "image/png" }));
    setFileName("devis-exemple.png");
    setResult(draft);
  }

  const manquants = result ? POINTS_A_VERIFIER.filter(({ key }) => {
    const value = result.valeurs[key];
    return value === undefined || value === null || value === "";
  }) : [];

  return (
    <div ref={carteRef} className="mt-8 rounded-xl border border-filigrane bg-blanc-casse p-5 shadow-sm sm:p-7">
      {!result ? (
        <>
          {/* L'attente prend la place des boutons au lieu de s'ajouter dessous :
              sur 390 px, un bandeau posé sous deux boutons de 112 px tombe hors
              de l'écran, c'est-à-dire exactement là où personne ne le lit. */}
          {loading ? (
            <div className="flex min-h-28 flex-col items-center justify-center rounded-lg bg-info-bg px-5 py-6 text-center" role="status">
              <p className="flex items-center gap-3 text-sm font-semibold text-tampon">
                <Spinner className="h-5 w-5" />
                {loadingStep}…
              </p>
              {fileName && <p className="mt-2 max-w-full truncate text-xs text-encre-claire">{fileName}</p>}
              <span className="mt-4 block h-1 w-32 animate-pulse rounded-full bg-tampon/40 motion-reduce:animate-none" aria-hidden="true" />
            </div>
          ) : (
            <>
              {error && (
                <p role="alert" className="mb-4 rounded border-l-4 border-erreur bg-erreur-bg px-4 py-3 text-sm text-erreur">
                  {error}
                </p>
              )}
              <div className={`grid gap-3 ${tactile ? "sm:grid-cols-2" : ""}`}>
                {/* `capture` force l'appareil photo : il n'a de sens que sur un
                    écran tactile, et ne doit jamais coiffer l'unique chemin
                    d'envoi, sans quoi la photo déjà rangée dans le téléphone
                    devient inatteignable (DESIGN.md § Dépôt de fichiers). */}
                {tactile && (
                  <button type="button" onClick={() => photoRef.current?.click()} className="flex min-h-28 flex-col items-center justify-center rounded-lg bg-accent px-5 text-center font-semibold text-blanc-casse shadow-sm transition hover:bg-accent-hover">
                    <Camera className="mb-2 h-7 w-7" aria-hidden="true" />Prendre une photo
                  </button>
                )}
                <button type="button" onClick={() => fichierRef.current?.click()} className={`flex min-h-28 flex-col items-center justify-center rounded-lg px-5 text-center font-semibold transition ${tactile ? "border-2 border-filigrane bg-papier/50 text-encre hover:border-tampon" : "bg-accent text-blanc-casse shadow-sm hover:bg-accent-hover"}`}>
                  <FileText className={`mb-2 h-7 w-7 ${tactile ? "text-tampon" : ""}`} aria-hidden="true" />
                  {tactile ? "Choisir un fichier" : "Choisir un PDF ou une photo"}
                  {tactile && <span className="mt-1 block text-xs font-normal text-ardoise">PDF ou photo déjà prise</span>}
                </button>
              </div>
              {fileName && <p className="mt-3 truncate text-center text-xs text-encre-claire">{fileName}</p>}
              <button type="button" onClick={() => void essayerExemple()} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded border border-filigrane px-5 py-2 text-sm font-semibold text-tampon transition hover:bg-info-bg"><PlayCircle className="h-4 w-4 shrink-0" aria-hidden="true" />Essayer avec un exemple</button>
              <Link
                href="/dossiers/nouveau?mode=manuel"
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center px-2 py-2 text-center text-sm font-semibold text-ardoise underline underline-offset-4 transition hover:text-encre"
              >
                Je n’ai pas de devis · commencer manuellement
              </Link>
              <p className="mt-3 text-xs text-encre-claire">Aucun compte et aucune carte bancaire. Un essai gratuit par navigateur.</p>
            </>
          )}
          <input ref={fichierRef} type="file" accept={ACCEPT_DOCUMENT} aria-label="Choisir un devis en PDF ou en photo" tabIndex={-1} className="sr-only" onChange={(event) => selectionner(event.target)} />
          <input ref={photoRef} type="file" accept={ACCEPT_PHOTO} capture="environment" aria-label="Photographier le devis" tabIndex={-1} className="sr-only" onChange={(event) => selectionner(event.target)} />
        </>
      ) : (
        <div>
          <div className="rounded border border-succes/25 bg-succes-bg p-4">
            <p className="flex items-start gap-2 text-sm font-semibold text-succes"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{result.champsTrouves.length} informations lues sur votre devis</p>
            <p className="mt-1 text-xs text-ardoise">Le brouillon est conservé dans ce navigateur pour reprendre après l'inscription.</p>
          </div>
          <div className="mt-3 rounded border border-avertissement/25 bg-avertissement-bg p-4">
            <p className="flex items-start gap-2 text-sm font-semibold text-avertissement"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />À confirmer pour terminer le dossier</p>
            {manquants.length ? <ul className="mt-2 space-y-1 text-sm text-encre">{manquants.slice(0, 3).map((item) => <li key={item.key}>· {item.label}</li>)}</ul> : <p className="mt-2 text-sm text-encre">Les informations essentielles sont lisibles. Dossimo vous demandera seulement les compléments réglementaires.</p>}
          </div>
          {/* `min-h` et non `h` : sur 390 px le libellé passe à deux lignes, et une
              hauteur figée le rognerait dès que le lecteur agrandit ses polices. */}
          <Link href="/inscription?next=%2Fdossiers%2Fnouveau%3Freprise%3Dessai" className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded bg-encre px-5 py-3 text-center text-sm font-semibold text-papier hover:bg-encre/90">Enregistrer et terminer mon dossier<ArrowRight className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden="true" /></Link>
        </div>
      )}
    </div>
  );
}
