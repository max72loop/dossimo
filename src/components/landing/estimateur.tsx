"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

import { FOCUS } from "@/components/ui/boutons";
import { CHAMP_INPUT, CHAMP_LABEL } from "@/components/ui/champs";
import { Spinner } from "@/components/ui/spinner";
import { estimerAide } from "@/lib/landing/actions";
import {
  GESTES_ESTIMABLES,
  PROFILS_ORDRE,
  PROFILS_PUBLICS,
  gesteAuM2,
  type ProfilPublic,
  type ResultatEstimation,
} from "@/lib/landing/estimation-refs";
import { formatEuros } from "@/lib/format/montant";

/**
 * Simulateur d'aide de la vitrine.
 *
 * Son rôle n'est pas de remplacer le dossier mais d'**ancrer le prix** : tant
 * que l'artisan n'a pas le montant de la prime en tête, 149 € est un coût sec.
 * Il donne aussi une raison de venir sur le site à quelqu'un qui ne cherchait
 * pas encore un outil de conformité.
 *
 * Deux règles tenues ici :
 *
 * - **Aucun montant ne vient du client.** Tout est calculé par la Server Action
 *   depuis `regles_metier` ; ce composant n'affiche que ce qu'on lui renvoie.
 * - **Une ligne non estimable s'affiche « — » avec sa raison**, jamais 0 €
 *   (DESIGN.md §6). C'est fréquent et voulu : plusieurs couples geste /
 *   dispositif n'ont légitimement pas de barème.
 */
const DISPOSITIF_LABEL = {
  cee: "CEE",
  maprimerenov: "MaPrimeRénov'",
} as const;

export function Estimateur() {
  const [geste, setGeste] = useState<string>(GESTES_ESTIMABLES[0].valeur);
  const [profil, setProfil] = useState<ProfilPublic>("jaune");
  const [surface, setSurface] = useState("95");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [resultat, setResultat] = useState<ResultatEstimation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const auM2 = gesteAuM2(geste);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const res = await estimerAide({
        geste,
        profil,
        // Un geste au forfait n'a pas de surface : ne rien envoyer plutôt
        // qu'une valeur résiduelle laissée dans le champ par un choix précédent.
        surface: auM2 ? surface : undefined,
      });
      if (res.ok) {
        setResultat(res.resultat);
      } else {
        setError(res.error);
        setResultat(null);
      }
    } catch {
      setError("Estimation indisponible. Réessayez dans un instant.");
      setResultat(null);
    } finally {
      setStatus("idle");
    }
  }

  const labelClass = CHAMP_LABEL;
  const controlClass = `mt-1.5 ${CHAMP_INPUT}`;

  return (
    <div className="rounded-2xl bg-blanc-casse p-6 shadow-lg sm:p-7">
      <form onSubmit={handleSubmit} className="grid gap-4" aria-busy={status === "loading"}>
        <div>
          <label htmlFor="est-geste" className={labelClass}>
            Le geste posé
          </label>
          <select
            id="est-geste"
            value={geste}
            onChange={(e) => {
              setGeste(e.target.value);
              // Le résultat affiché ne correspond plus au geste sélectionné :
              // le laisser à l'écran donnerait un montant pour le mauvais geste.
              setResultat(null);
              setError(null);
            }}
            className={controlClass}
          >
            {GESTES_ESTIMABLES.map((g) => (
              <option key={g.valeur} value={g.valeur}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        {auM2 && (
          <div>
            <label htmlFor="est-surface" className={labelClass}>
              Surface à isoler (m²)
            </label>
            <input
              id="est-surface"
              type="number"
              inputMode="numeric"
              min={1}
              max={2000}
              value={surface}
              onChange={(e) => {
                setSurface(e.target.value);
                setResultat(null);
              }}
              className={`${controlClass} tabular-nums`}
            />
          </div>
        )}

        <fieldset>
          <legend className={labelClass}>Revenus du ménage</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {PROFILS_ORDRE.map((cle) => {
              const p = PROFILS_PUBLICS[cle];
              const actif = profil === cle;
              return (
                <button
                  key={cle}
                  type="button"
                  aria-pressed={actif}
                  onClick={() => {
                    setProfil(cle);
                    setResultat(null);
                  }}
                  className={`rounded border px-3 py-2.5 text-left text-sm transition-colors ${FOCUS} ${
                    actif
                      ? "border-tampon bg-info-bg font-semibold text-encre"
                      : "border-filigrane text-ardoise hover:bg-papier-fonce"
                  }`}
                >
                  {p.label}
                  <span className="mt-0.5 block text-xs font-normal text-ardoise">
                    {p.aide}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="flex items-start gap-2 text-[0.813rem] text-erreur">
            <AlertCircle className="mt-px h-4 w-4 shrink-0" strokeWidth={1.5} />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className={`mt-1 inline-flex h-11 items-center justify-center gap-2 rounded bg-accent px-5 text-sm font-medium text-blanc-casse transition-colors hover:bg-accent-hover disabled:opacity-60 ${FOCUS}`}
        >
          {status === "loading" && <Spinner className="h-4 w-4" />}
          Estimer l&rsquo;aide
        </button>
      </form>

      {resultat && (
        <div className="mt-6 border-t border-filigrane pt-6" role="status">
          <ul className="grid gap-3 sm:grid-cols-2">
            {resultat.lignes.map((ligne) => (
              <li key={ligne.dispositif} className="rounded-xl bg-papier/70 px-4 py-3.5">
                <p className="label text-tampon">{DISPOSITIF_LABEL[ligne.dispositif]}</p>
                <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-encre">
                  {/* Non estimable : « — », jamais 0 € (DESIGN.md §6). */}
                  {ligne.montant == null ? "—" : formatEuros(ligne.montant)}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ardoise">{ligne.base}</p>
              </li>
            ))}
          </ul>

          {resultat.total != null && (
            <p className="mt-4 text-sm leading-relaxed text-encre">
              <span className="font-semibold">
                Soit environ {formatEuros(resultat.total)} d&rsquo;aide en jeu
              </span>{" "}
              sur ce chantier, si les deux dispositifs sont mobilisés et cumulables.
            </p>
          )}

          <p className="mt-4 text-xs leading-relaxed text-ardoise">
            Estimation indicative, calculée sur les barèmes en vigueur dans Dossimo.
            Le montant réel dépend du dossier complet, des plafonds de ressources et
            de la fiche applicable. Dossimo n&rsquo;attribue ni ne verse aucune aide.{" "}
            <Link
              href="/cumul-maprimerenov-cee"
              className={`font-semibold text-tampon underline underline-offset-4 ${FOCUS}`}
            >
              Comprendre le cumul
            </Link>
          </p>

          <Link
            href="/demo"
            className={`group mt-5 inline-flex items-center gap-2 text-sm font-semibold text-tampon underline underline-offset-4 ${FOCUS}`}
          >
            Monter ce dossier avec Dossimo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
