import { notFound } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";

import { getAdminEmail } from "@/lib/auth/is-admin";
import {
  chargerContacts,
  DELAI_RELANCE_JOURS,
  TAILLE_PAGE,
  type FiltreContacts,
} from "@/lib/contacts/liste";
import { ContactsListe } from "@/components/admin/contacts-liste";
import type { CanalEchange, EtatContact } from "@/lib/database.types";

export const metadata = { title: "Contacts · Admin" };
export const dynamic = "force-dynamic";

/**
 * Console de prospection, refondue sur `contacts` / `contact_echanges`
 * (migrations 0057 et 0058).
 *
 * Ce qu'elle remplace : `/admin/sprint`, qui affichait le « lot du jour » d'un
 * bras d'A/B tiré au sort. Cet A/B est abandonné (9 envois réels sur 302
 * contacts assignés, 0 réponse, compte WhatsApp bloqué), donc l'écran n'a plus à
 * demander « quel bras » avant de montrer quoi que ce soit. Il montre le fichier
 * entier et le laisse filtrer.
 *
 * La garde admin est refaite ici : le layout en pose une, mais chaque page doit
 * tenir debout seule.
 */

const ETATS: { cle: EtatContact | "tous"; libelle: string }[] = [
  { cle: "tous", libelle: "Tous" },
  { cle: "jamais_contacte", libelle: "Jamais contactés" },
  { cle: "contacte", libelle: "Contactés" },
  { cle: "en_discussion", libelle: "En discussion" },
  { cle: "client", libelle: "Clients" },
  { cle: "injoignable", libelle: "Injoignables" },
  { cle: "refus", libelle: "Refus" },
];

const JOIGNABLES: { cle: CanalEchange | "tous"; libelle: string }[] = [
  { cle: "tous", libelle: "Toute coordonnée" },
  { cle: "telephone", libelle: "Téléphone" },
  { cle: "whatsapp", libelle: "Mobile (WhatsApp)" },
  { cle: "email", libelle: "Adresse validée" },
];

function pourcent(v: number | null): string {
  // Pas de taux inventé : « — » quand aucun envoi n'est parti sur le canal,
  // comme `prixPack` rend « — » plutôt qu'un prix supposé.
  if (v === null) return "—";
  return `${(v * 100).toFixed(1).replace(".", ",")} %`;
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  if (!(await getAdminEmail())) notFound();

  const sp = await searchParams;
  const filtre: FiltreContacts = {
    q: sp.q,
    etat: (ETATS.find((e) => e.cle === sp.etat)?.cle ?? "tous") as EtatContact | "tous",
    joignable: (JOIGNABLES.find((j) => j.cle === sp.joignable)?.cle ?? "tous") as CanalEchange | "tous",
    aRelancer: sp.relancer === "1",
    nouveaux: sp.nouveaux === "1",
    page: Number.parseInt(sp.page ?? "1", 10) || 1,
  };

  const { contacts, total, page, nbPages, comptes, stats } = await chargerContacts(filtre);

  /** Conserve les filtres courants en changeant une seule clé. */
  const lien = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base: Record<string, string | undefined> = {
      q: sp.q, etat: sp.etat, joignable: sp.joignable,
      relancer: sp.relancer, nouveaux: sp.nouveaux, page: sp.page,
    };
    // Tout changement de filtre ramène en page 1 : rester en page 7 d'une liste
    // qui n'en compte plus que 2 affiche un écran vide qu'on prend pour un bug.
    for (const [k, v] of Object.entries({ ...base, page: undefined, ...patch })) {
      if (v) p.set(k, v);
    }
    const qs = p.toString();
    return `/admin/contacts${qs ? `?${qs}` : ""}`;
  };

  const puce = (actif: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-medium transition ${
      actif
        ? "bg-encre text-blanc-casse"
        : "border border-filigrane bg-blanc-casse text-ardoise hover:border-tampon"
    }`;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-encre">Contacts</h1>
      <p className="mt-1 text-sm text-ardoise">
        Le fichier de prospection et son historique. Un échange enregistré ici met à jour l&apos;état du
        contact tout seul : l&apos;état ne se saisit pas, il se déduit de ce qui s&apos;est passé.
      </p>

      {/* Compteurs par état */}
      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Total", v: comptes.total },
          { l: "Jamais contactés", v: comptes.jamais_contacte },
          { l: "Contactés", v: comptes.contacte },
          { l: "Nouveaux ce mois", v: comptes.nouveaux },
        ].map((k) => (
          <div key={k.l} className="rounded-xl bg-papier/50 p-3">
            <dt className="text-[0.7rem] uppercase tracking-wide text-encre-claire">{k.l}</dt>
            <dd className="mt-1 font-mono text-lg font-semibold text-encre">{k.v}</dd>
          </div>
        ))}
      </dl>

      {/* Performance par canal. C'est ici que se lira « lequel marche », une fois
          que des réponses auront été saisies : aujourd'hui il n'y en a aucune. */}
      <section className="mt-4 overflow-x-auto rounded-xl bg-papier/50 p-3">
        <h2 className="text-[0.7rem] uppercase tracking-wide text-encre-claire">Réponses par canal</h2>
        {stats.length === 0 ? (
          <p className="mt-2 text-xs text-ardoise">Aucun échange enregistré.</p>
        ) : (
          <table className="mt-2 w-full min-w-[30rem] text-xs">
            <thead className="text-left text-encre-claire">
              <tr>
                <th className="pb-1 font-medium">Canal</th>
                <th className="pb-1 text-right font-medium">Touchés</th>
                <th className="pb-1 text-right font-medium">Réponses</th>
                <th className="pb-1 text-right font-medium">Taux</th>
                <th className="pb-1 text-right font-medium">STOP</th>
              </tr>
            </thead>
            <tbody className="font-mono text-encre">
              {stats.map((s) => (
                <tr key={s.canal} className="border-t border-filigrane/60">
                  <td className="py-1 font-sans">{s.canal}</td>
                  <td className="py-1 text-right">{s.touches}</td>
                  <td className="py-1 text-right">{s.repondeurs}</td>
                  <td className="py-1 text-right">{pourcent(s.tauxReponse)}</td>
                  <td className="py-1 text-right">{s.stops}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-2 text-[0.7rem] leading-relaxed text-ardoise">
          Le canal compté pour une réponse est celui par lequel elle est ARRIVÉE, pas celui de la
          sollicitation. Tant qu&apos;aucune réponse n&apos;est saisie, ce tableau reste à zéro même si les
          artisans en envoient : le taux mesure la saisie autant que le canal.
        </p>
      </section>

      {/* Recherche */}
      <form action="/admin/contacts" className="mt-5 flex flex-wrap items-center gap-2">
        {sp.etat && <input type="hidden" name="etat" value={sp.etat} />}
        {sp.joignable && <input type="hidden" name="joignable" value={sp.joignable} />}
        {sp.relancer && <input type="hidden" name="relancer" value={sp.relancer} />}
        {sp.nouveaux && <input type="hidden" name="nouveaux" value={sp.nouveaux} />}
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded border border-filigrane bg-blanc-casse px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-encre-claire" />
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Entreprise, ville, code postal, SIREN, adresse"
            className="min-w-0 flex-1 bg-transparent text-sm text-encre outline-none placeholder:text-encre-claire"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-blanc-casse transition hover:bg-accent-hover"
        >
          Chercher
        </button>
      </form>

      {/* Filtres */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {ETATS.map((e) => (
          <Link key={e.cle} href={lien({ etat: e.cle === "tous" ? undefined : e.cle })} className={puce(filtre.etat === e.cle)}>
            {e.libelle}
          </Link>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {JOIGNABLES.map((j) => (
          <Link
            key={j.cle}
            href={lien({ joignable: j.cle === "tous" ? undefined : j.cle })}
            className={puce(filtre.joignable === j.cle)}
          >
            {j.libelle}
          </Link>
        ))}
        <Link href={lien({ relancer: sp.relancer === "1" ? undefined : "1" })} className={puce(sp.relancer === "1")}>
          À relancer (J+{DELAI_RELANCE_JOURS})
        </Link>
        <Link href={lien({ nouveaux: sp.nouveaux === "1" ? undefined : "1" })} className={puce(sp.nouveaux === "1")}>
          Nouveaux ce mois
        </Link>
      </div>

      <p className="mt-4 text-xs text-ardoise">
        <strong>{total}</strong> contact{total > 1 ? "s" : ""} pour ces filtres
        {nbPages > 1 && ` · page ${page} sur ${nbPages}`}
        {total > TAILLE_PAGE && ` · ${TAILLE_PAGE} par page`}
      </p>

      <div className="mt-4">
        <ContactsListe contacts={contacts} />
      </div>

      {nbPages > 1 && (
        <nav className="mt-6 flex items-center justify-between text-xs">
          {page > 1 ? (
            <Link href={lien({ ...sp, page: String(page - 1) })} className="text-tampon hover:underline">
              ← Page précédente
            </Link>
          ) : (
            <span />
          )}
          {page < nbPages ? (
            <Link href={lien({ ...sp, page: String(page + 1) })} className="text-tampon hover:underline">
              Page suivante →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </main>
  );
}
