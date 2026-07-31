"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Mail } from "lucide-react";

import { FOCUS } from "@/components/ui/boutons";
import { CHAMP_ERREUR, CHAMP_HINT, CHAMP_INPUT, CHAMP_LABEL } from "@/components/ui/champs";
import { Spinner } from "@/components/ui/spinner";
import { CONSENTEMENT_CONTACT } from "@/lib/refus/consentements";
import { EMAIL_REPLI } from "@/lib/refus/contact";
import { soumettreDemandeRefus } from "@/lib/refus/actions";

/**
 * Formulaire de diagnostic du cluster « refus ».
 *
 * La validation qui fait foi est celle du serveur (`schema.ts`) : ce composant ne
 * fait que du confort. Les `required` HTML et le bouton désactivé évitent des
 * allers-retours, ils ne garantissent rien.
 *
 * Pas d'upload en lot 1 (docs/cluster-refus.md § 3.4) : le motif « dépôt de
 * fichiers » du système de design est sans objet ici.
 */

const AIDES = [
  { valeur: "maprimerenov", libelle: "MaPrimeRénov’" },
  { valeur: "cee", libelle: "CEE" },
  { valeur: "les_deux", libelle: "Les deux" },
] as const;

/** Le champ non renseigné vaut `null` côté schéma : l'option vide le porte. */
const AIDE_NON_PRECISEE = "";

export function DiagnosticForm({ utm }: { utm?: Record<string, string | undefined> }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [aide, setAide] = useState<string>(AIDE_NON_PRECISEE);
  const [geste, setGeste] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [dateNotification, setDateNotification] = useState("");
  const [motifLibre, setMotifLibre] = useState("");
  const [consentement, setConsentement] = useState(false);
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [repliEmail, setRepliEmail] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    setRepliEmail(false);
    setFieldErrors({});

    try {
      const result = await soumettreDemandeRefus({
        profil: "artisan_rge",
        aide: aide === AIDE_NON_PRECISEE ? null : aide,
        geste,
        email,
        telephone,
        date_notification: dateNotification,
        motif_libre: motifLibre,
        consentement_contact: consentement,
        website,
        utm_source: utm?.utm_source ?? null,
        utm_medium: utm?.utm_medium ?? null,
        utm_campaign: utm?.utm_campaign ?? null,
      });

      if (result.ok) {
        // Page de confirmation dédiée plutôt qu'un état local : elle est
        // partageable, elle survit à un rechargement, et elle est en noindex.
        router.push("/refus/merci");
        return;
      }

      setError(result.error);
      setRepliEmail(result.repliEmail === true);
      setFieldErrors(result.fieldErrors ?? {});
      setStatus("idle");
    } catch {
      // Le serveur peut échouer avant d'avoir pu répondre (réseau, déploiement en
      // cours). L'adresse de repli est proposée dans ce cas aussi : une demande
      // envoyée à la main arrive quand même.
      setError("L’envoi n’a pas abouti. Réessayez dans un instant, ou écrivez-nous directement.");
      setRepliEmail(true);
      setStatus("idle");
    }
  }

  const erreur = (champ: string): string | undefined => fieldErrors[champ]?.[0];
  const inputClass = `mt-1.5 ${CHAMP_INPUT}`;

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" aria-busy={status === "loading"} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="refus-aide" className={CHAMP_LABEL}>
            Quelle aide ? <span className="text-encre-claire">(facultatif)</span>
          </label>
          <select
            id="refus-aide"
            value={aide}
            onChange={(e) => setAide(e.target.value)}
            className={inputClass}
          >
            <option value={AIDE_NON_PRECISEE}>Je ne sais pas</option>
            {AIDES.map((option) => (
              <option key={option.valeur} value={option.valeur}>
                {option.libelle}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="refus-geste" className={CHAMP_LABEL}>
            Quel geste ? <span className="text-encre-claire">(facultatif)</span>
          </label>
          <input
            id="refus-geste"
            type="text"
            value={geste}
            onChange={(e) => setGeste(e.target.value)}
            placeholder="Isolation des combles, PAC air/eau…"
            className={inputClass}
            aria-invalid={erreur("geste") ? true : undefined}
          />
          {erreur("geste") && <p className={CHAMP_ERREUR}>{erreur("geste")}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="refus-motif" className={CHAMP_LABEL}>
          Que dit le refus ? <span className="text-ardoise">(requis)</span>
        </label>
        <textarea
          id="refus-motif"
          value={motifLibre}
          onChange={(e) => setMotifLibre(e.target.value)}
          rows={6}
          maxLength={4000}
          placeholder="Recopiez le motif tel qu’il est écrit, même si la formulation vous paraît obscure. C’est elle qui nous dit sur quoi le dossier a été jugé."
          className={`mt-1.5 w-full rounded border border-filigrane bg-blanc-casse px-3.5 py-3 text-sm leading-relaxed text-encre placeholder:text-encre-claire outline-none transition focus:border-tampon focus:ring-2 focus:ring-tampon/15 aria-[invalid=true]:border-erreur`}
          aria-invalid={erreur("motif_libre") ? true : undefined}
        />
        {erreur("motif_libre") ? (
          <p className={CHAMP_ERREUR}>{erreur("motif_libre")}</p>
        ) : (
          <p className={CHAMP_HINT}>
            Sans upload pour le moment : le texte de la décision suffit à orienter la réponse.
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="refus-email" className={CHAMP_LABEL}>
            Votre e-mail <span className="text-ardoise">(requis)</span>
          </label>
          <input
            id="refus-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@entreprise.fr"
            className={inputClass}
            aria-invalid={erreur("email") ? true : undefined}
          />
          {erreur("email") && <p className={CHAMP_ERREUR}>{erreur("email")}</p>}
        </div>

        <div>
          <label htmlFor="refus-tel" className={CHAMP_LABEL}>
            Téléphone <span className="text-encre-claire">(facultatif)</span>
          </label>
          <input
            id="refus-tel"
            type="tel"
            autoComplete="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="06 12 34 56 78"
            className={inputClass}
            aria-invalid={erreur("telephone") ? true : undefined}
          />
          {erreur("telephone") && <p className={CHAMP_ERREUR}>{erreur("telephone")}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="refus-date" className={CHAMP_LABEL}>
          Date de la notification de refus <span className="text-encre-claire">(facultatif)</span>
        </label>
        <input
          id="refus-date"
          type="date"
          value={dateNotification}
          onChange={(e) => setDateNotification(e.target.value)}
          className={`${inputClass} sm:max-w-xs`}
          aria-invalid={erreur("date_notification") ? true : undefined}
        />
        {erreur("date_notification") ? (
          <p className={CHAMP_ERREUR}>{erreur("date_notification")}</p>
        ) : (
          // Aucun compte à rebours n'est construit sur cette date, et la page ne
          // doit surtout pas laisser croire le contraire (§ 3.2 du chantier).
          <p className={CHAMP_HINT}>
            Utile pour situer votre dossier. Nous n’en tirons aucun décompte : les délais qui vous
            sont opposables sont ceux que porte votre notification.
          </p>
        )}
      </div>

      <div className="rounded border border-filigrane bg-papier/40 p-4">
        <label htmlFor="refus-consentement" className="flex items-start gap-3 text-sm text-ardoise">
          <input
            id="refus-consentement"
            type="checkbox"
            checked={consentement}
            onChange={(e) => setConsentement(e.target.checked)}
            className={`mt-0.5 h-4 w-4 shrink-0 rounded border-filigrane text-accent ${FOCUS}`}
            aria-invalid={erreur("consentement_contact") ? true : undefined}
          />
          <span className="leading-relaxed">{CONSENTEMENT_CONTACT.texte}</span>
        </label>
        {erreur("consentement_contact") && (
          <p className={CHAMP_ERREUR}>{erreur("consentement_contact")}</p>
        )}
      </div>

      {/* Honeypot : hors flux, hors tabulation, hors lecteur d'écran. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="refus-website">Site web</label>
        <input
          id="refus-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {error && (
        <div role="alert" className="rounded border-l-4 border-erreur bg-erreur-bg px-4 py-3">
          <p className="flex items-start gap-2 text-sm text-erreur">
            <AlertCircle className="mt-px h-4 w-4 shrink-0" strokeWidth={1.5} />
            {error}
          </p>
          {repliEmail && (
            <p className="mt-2 flex items-start gap-2 text-sm text-ardoise">
              <Mail className="mt-px h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span>
                Écrivez à{" "}
                <a
                  href={`mailto:${EMAIL_REPLI}`}
                  className="font-medium underline underline-offset-4 hover:text-encre"
                >
                  {EMAIL_REPLI}
                </a>{" "}
                : une demande envoyée à la main est traitée de la même façon.
              </span>
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className={`inline-flex h-11 items-center justify-center gap-2 rounded bg-accent px-5 text-sm font-semibold text-blanc-casse transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`}
      >
        {status === "loading" && <Spinner className="h-4 w-4" />}
        Envoyer ma demande
      </button>

      <p className="text-xs leading-relaxed text-encre-claire">
        Réponse rédigée à la main, sans engagement de votre part. Nous ne déposons pas votre dossier
        et ne touchons pas votre prime.
      </p>
    </form>
  );
}
