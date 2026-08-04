"use client";

import { useState } from "react";
import {
  Ban, Check, Copy, Mail, MessageCircle, MessageSquareReply,
  Phone, Send, StickyNote,
} from "lucide-react";

import { enregistrerEchange, enregistrerReponse, enregistrerStop } from "@/lib/contacts/actions";
import type { CanalEchange, EtatContact } from "@/lib/database.types";
import type { ContactListe } from "@/lib/contacts/liste";

/**
 * La liste de travail de la prospection.
 *
 * Ce que l'ancienne console ne savait pas faire, et qui est tout l'objet de la
 * refonte : enregistrer un APPEL, et enregistrer une réponse EN DISANT PAR QUEL
 * CANAL elle est arrivée. Sans ce second point, aucun écran ne pourra jamais
 * dire qui répond mieux par WhatsApp que par e-mail.
 */

const ETAT_LIBELLE: Record<EtatContact, { texte: string; classe: string }> = {
  jamais_contacte: { texte: "Jamais contacté", classe: "bg-papier text-ardoise" },
  contacte: { texte: "Contacté", classe: "bg-papier text-tampon" },
  en_discussion: { texte: "En discussion", classe: "bg-succes/15 text-succes" },
  client: { texte: "Client", classe: "bg-accent/15 text-accent" },
  refus: { texte: "Refus", classe: "bg-erreur/15 text-erreur" },
  injoignable: { texte: "Injoignable", classe: "bg-avertissement-bg text-avertissement" },
};

const CANAL_LIBELLE: Record<CanalEchange, string> = {
  email: "E-mail",
  whatsapp: "WhatsApp",
  telephone: "Téléphone",
  sms: "SMS",
  courrier: "Courrier",
};

/**
 * Issues proposées après un appel. Volontairement courtes et exclusives : une
 * liste longue ne serait pas remplie, et une issue non saisie vaut mieux qu'une
 * issue fausse.
 */
const ISSUES_APPEL = [
  { valeur: "", libelle: "Issue non précisée" },
  { valeur: "repondeur", libelle: "Répondeur / pas décroché" },
  { valeur: "sans_reponse", libelle: "Parlé, sans suite" },
  { valeur: "interesse", libelle: "Intéressé" },
  { valeur: "faux_numero", libelle: "Faux numéro" },
  { valeur: "refus", libelle: "Refus (utiliser plutôt STOP)" },
];

function jourFr(iso: string | null): string {
  if (!iso) return "jamais";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "Europe/Paris",
  }).format(new Date(iso));
}

function BoutonCopier({ texte }: { texte: string }) {
  const [copie, setCopie] = useState(false);
  return (
    <button
      type="button"
      title="Copier"
      onClick={async () => {
        await navigator.clipboard.writeText(texte);
        setCopie(true);
        setTimeout(() => setCopie(false), 1500);
      }}
      className="inline-flex items-center rounded p-1 text-encre-claire transition hover:text-tampon"
    >
      {copie ? <Check className="h-3.5 w-3.5 text-succes" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

const BOUTON =
  "inline-flex items-center gap-1.5 rounded border border-filigrane bg-blanc-casse px-2.5 py-1.5 text-xs font-medium text-ardoise transition hover:border-tampon hover:text-tampon disabled:cursor-not-allowed disabled:opacity-40";

function Carte({ c }: { c: ContactListe }) {
  const etat = ETAT_LIBELLE[c.etat];
  const titre = c.denomination || c.nom || `SIREN ${c.siren}`;
  const figeParRefus = c.etat === "refus";

  return (
    <li className="rounded-2xl bg-blanc-casse p-4 shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-encre">{titre}</p>
          <p className="mt-0.5 text-xs text-ardoise">
            {[c.city, c.codePostal, `SIREN ${c.siren}`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-full bg-papier px-2.5 py-0.5 text-[0.7rem] font-medium text-tampon">
            {c.metier}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium ${etat.classe}`}>
            {etat.texte}
          </span>
        </div>
      </div>

      {/* Coordonnées : chacune dit si elle est utilisable, et pour quoi. Un
          numéro fixe n'ouvre pas WhatsApp, une adresse non validée le dit. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
        {c.telephone ? (
          <span className="inline-flex items-center gap-1 text-encre">
            <Phone className="h-3.5 w-3.5 text-encre-claire" />
            <a href={`tel:${c.telephone}`} className="font-mono hover:underline">{c.telephone}</a>
            {c.telephoneMobile && <span className="text-[0.65rem] text-encre-claire">mobile</span>}
            <BoutonCopier texte={c.telephone} />
          </span>
        ) : (
          <span className="text-encre-claire">Pas de numéro exploitable</span>
        )}

        {c.emailPrincipal ? (
          <span className="inline-flex min-w-0 items-center gap-1 text-encre">
            <Mail className="h-3.5 w-3.5 shrink-0 text-encre-claire" />
            <a href={`mailto:${c.emailPrincipal}`} className="truncate hover:underline">
              {c.emailPrincipal}
            </a>
            {!c.emailValide && (
              <span className="shrink-0 text-[0.65rem] text-avertissement">non validée</span>
            )}
            <BoutonCopier texte={c.emailPrincipal} />
          </span>
        ) : (
          <span className="text-encre-claire">Pas d&apos;adresse</span>
        )}
      </div>

      {/* Historique en une ligne : ce qu'on a fait, quand, et par quoi. */}
      <p className="mt-2 text-[0.7rem] leading-relaxed text-encre-claire">
        {c.nbSollicitations === 0 ? (
          "Jamais sollicité."
        ) : (
          <>
            {c.nbSollicitations} sollicitation{c.nbSollicitations > 1 ? "s" : ""}
            {c.canauxUtilises.length > 0 && ` (${c.canauxUtilises.map((x) => CANAL_LIBELLE[x]).join(", ")})`}
            {" · dernier "}
            {jourFr(c.dernierContactLe)}
            {c.joursDepuisContact !== null && `, il y a ${c.joursDepuisContact} j`}
            {c.nbAppels > 0 && ` · ${c.nbAppels} appel${c.nbAppels > 1 ? "s" : ""}`}
          </>
        )}
        {c.aRelancer && <span className="ml-1 font-medium text-avertissement">à relancer</span>}
        {c.nbReponses > 0 && (
          <span className="ml-1 font-medium text-succes">
            a répondu {c.canalDeReponse ? `par ${CANAL_LIBELLE[c.canalDeReponse].toLowerCase()}` : ""}{" "}
            le {jourFr(c.reponduLe)}
          </span>
        )}
      </p>

      {figeParRefus ? (
        <p className="mt-3 rounded border border-erreur/30 bg-erreur/5 p-2 text-[0.7rem] text-erreur">
          Opposition enregistrée. Ce contact ne doit plus être sollicité, par aucun canal.
        </p>
      ) : (
        <details className="group mt-3">
          <summary className="cursor-pointer list-none text-xs font-medium text-tampon hover:underline">
            Enregistrer un échange
          </summary>

          <div className="mt-3 space-y-2.5 rounded-xl bg-papier/50 p-3">
            {/* --- Sortant : ce que je viens de faire --- */}
            <form action={enregistrerEchange} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="contact_id" value={c.id} />
              <input type="hidden" name="canal" value="telephone" />
              <input type="hidden" name="sens" value="sortant" />
              <input type="hidden" name="nature" value="appel" />
              <button type="submit" className={BOUTON} disabled={!c.telephone}>
                <Phone className="h-3.5 w-3.5" />
                Appelé
              </button>
              <select
                name="issue"
                defaultValue=""
                className="rounded border border-filigrane bg-blanc-casse px-2 py-1.5 text-xs text-ardoise"
              >
                {ISSUES_APPEL.map((i) => (
                  <option key={i.valeur} value={i.valeur}>{i.libelle}</option>
                ))}
              </select>
              <input
                name="commentaire"
                placeholder="Note (facultatif)"
                className="min-w-0 flex-1 rounded border border-filigrane bg-blanc-casse px-2 py-1.5 text-xs text-encre placeholder:text-encre-claire"
              />
            </form>

            <div className="flex flex-wrap items-center gap-2">
              {(["email", "whatsapp"] as const).map((canal) => (
                <form key={canal} action={enregistrerEchange}>
                  <input type="hidden" name="contact_id" value={c.id} />
                  <input type="hidden" name="canal" value={canal} />
                  <input type="hidden" name="sens" value="sortant" />
                  {/* Premier contact ou relance : on ne demande pas, on déduit de
                      l'historique. Une case de plus à cocher est une case oubliée. */}
                  <input type="hidden" name="nature" value={c.nbSollicitations === 0 ? "premier" : "relance"} />
                  <button
                    type="submit"
                    className={BOUTON}
                    disabled={canal === "whatsapp" ? !c.telephoneMobile : !c.emailPrincipal}
                    title={
                      canal === "whatsapp" && !c.telephoneMobile
                        ? "Pas de mobile : WhatsApp impossible"
                        : undefined
                    }
                  >
                    <Send className="h-3.5 w-3.5" />
                    {CANAL_LIBELLE[canal]} envoyé
                  </button>
                </form>
              ))}

              {c.telephoneMobile && c.telephone && (
                <a
                  href={`https://wa.me/33${c.telephone.slice(1)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={BOUTON}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Ouvrir WhatsApp
                </a>
              )}
            </div>

            {/* --- Entrant : ce qui m'est revenu, et par où ---
                Le canal est demandé explicitement parce qu'il diffère souvent de
                celui de la sollicitation, et que c'est LUI qui a de la valeur. */}
            <form action={enregistrerReponse} className="flex flex-wrap items-center gap-2 border-t border-filigrane pt-2.5">
              <input type="hidden" name="contact_id" value={c.id} />
              <button type="submit" className={BOUTON}>
                <MessageSquareReply className="h-3.5 w-3.5" />
                A répondu par
              </button>
              <select
                name="canal"
                defaultValue={c.dernierCanal ?? "email"}
                className="rounded border border-filigrane bg-blanc-casse px-2 py-1.5 text-xs text-ardoise"
              >
                {(Object.keys(CANAL_LIBELLE) as CanalEchange[]).map((k) => (
                  <option key={k} value={k}>{CANAL_LIBELLE[k]}</option>
                ))}
              </select>
              <label className="inline-flex items-center gap-1.5 text-xs text-ardoise">
                <input type="checkbox" name="interesse" value="1" className="accent-accent" />
                intéressé
              </label>
              <input
                name="commentaire"
                placeholder="Ce qu'il a dit (facultatif)"
                className="min-w-0 flex-1 rounded border border-filigrane bg-blanc-casse px-2 py-1.5 text-xs text-encre placeholder:text-encre-claire"
              />
            </form>

            {/* --- Note libre et refus --- */}
            <div className="flex flex-wrap items-center gap-2 border-t border-filigrane pt-2.5">
              <form action={enregistrerEchange} className="flex min-w-0 flex-1 items-center gap-2">
                <input type="hidden" name="contact_id" value={c.id} />
                <input type="hidden" name="canal" value="telephone" />
                <input type="hidden" name="sens" value="entrant" />
                <input type="hidden" name="nature" value="note" />
                <button type="submit" className={BOUTON}>
                  <StickyNote className="h-3.5 w-3.5" />
                  Note
                </button>
                <input
                  name="commentaire"
                  required
                  placeholder="Note libre"
                  className="min-w-0 flex-1 rounded border border-filigrane bg-blanc-casse px-2 py-1.5 text-xs text-encre placeholder:text-encre-claire"
                />
              </form>

              <form action={enregistrerStop}>
                <input type="hidden" name="contact_id" value={c.id} />
                <input type="hidden" name="canal" value={c.dernierCanal ?? "email"} />
                <button
                  type="submit"
                  title="Refus définitif : opposition enregistrée sur l'adresse, le numéro et le SIREN"
                  className="inline-flex items-center gap-1.5 rounded border border-filigrane bg-blanc-casse px-2.5 py-1.5 text-xs font-medium text-ardoise transition hover:border-erreur hover:text-erreur"
                >
                  <Ban className="h-3.5 w-3.5" />
                  STOP
                </button>
              </form>
            </div>
          </div>
        </details>
      )}
    </li>
  );
}

export function ContactsListe({ contacts }: { contacts: ContactListe[] }) {
  if (contacts.length === 0) {
    return (
      <p className="rounded-2xl bg-papier/50 p-6 text-sm text-ardoise">
        Aucun contact ne correspond à ces filtres. Élargis la recherche, ou retire le filtre
        « à relancer », qui ne retient que les contacts silencieux depuis plus de cinq jours.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {contacts.map((c) => (
        <Carte key={c.id} c={c} />
      ))}
    </ul>
  );
}
