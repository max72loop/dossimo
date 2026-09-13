import { notFound } from "next/navigation";
import Link from "next/link";

import { getAdminEmail } from "@/lib/auth/is-admin";
import { chargerIndicateurs, type Indicateur } from "@/lib/admin/sommaire";
import { RUBRIQUES, type Section } from "@/components/admin/sections";
import { CONSOLE_MAIN, EnTeteConsole } from "@/components/admin/en-tete-console";

export const metadata = { title: "Administration · Dossimo" };
// Les chiffres sont ceux du jour : jamais servis depuis un cache.
export const dynamic = "force-dynamic";

/**
 * Accueil du segment `/admin` : le sommaire des consoles, avec leurs chiffres.
 *
 * Aucun lien de l'espace artisan ne pointe ici (par choix : la console n'a pas
 * à être découvrable). La liste des consoles vient de `sections.ts`, partagée
 * avec la barre de navigation ; les chiffres de `lib/admin/sommaire.ts`, qui
 * relit les mêmes fonctions que chaque console.
 *
 * La garde est refaite ici : le layout en pose une, mais chaque page doit tenir
 * debout seule (cf. le commentaire du layout).
 */
export default async function AdminAccueilPage() {
  if (!(await getAdminEmail())) notFound();

  const indicateurs = await chargerIndicateurs();

  return (
    <main className={CONSOLE_MAIN}>
      <EnTeteConsole
        titre="Administration"
        aide="Les consoles internes et leurs chiffres du jour. Aucune n'est accessible depuis l'espace artisan, et toutes renvoient un 404 sans session admin."
      />

      {RUBRIQUES.map((rubrique) => (
        <section key={rubrique.titre} className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-encre-claire">{rubrique.titre}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {rubrique.consoles.map((s) => (
              <Carte key={s.href} s={s} indicateurs={indicateurs[s.href]} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

function Carte({ s, indicateurs }: { s: Section; indicateurs?: Indicateur[] }) {
  const Icone = s.icone;
  return (
    <Link
      href={s.href}
      className="group flex gap-3 rounded-2xl bg-blanc-casse p-4 shadow-md transition hover:shadow-lg"
    >
      <Icone className="mt-0.5 h-5 w-5 shrink-0 text-tampon" strokeWidth={1.8} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-encre group-hover:underline">{s.titre}</p>
        <p className="mt-1 text-xs leading-relaxed text-ardoise">{s.aide}</p>
        {indicateurs && indicateurs.length > 0 && (
          <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {indicateurs.map((i) => (
              // `dt` avant `dd` dans le DOM (HTML l'exige), chiffre avant libellé à
              // l'écran : « 12 à relire » se lit mieux que « à relire 12 ».
              <div key={i.libelle} className="flex items-baseline gap-1.5">
                <dt className="order-last text-xs text-ardoise">{i.libelle}</dt>
                <dd
                  className={`font-mono text-base tabular-nums ${
                    i.ton === "alerte" ? "text-avertissement" : "text-encre"
                  }`}
                >
                  {i.valeur}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Link>
  );
}
