import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminEmail } from "@/lib/auth/is-admin";
import { chargerInventaire } from "@/lib/admin/inventaire";

import { QuestionDonnees } from "./question-donnees";
import { TableNettoyage } from "./table-nettoyage";

export const metadata = { title: "Données · Admin" };

function formatOctets(o: number): string {
  if (o <= 0) return "0 o";
  const u = ["o", "Ko", "Mo", "Go"];
  const i = Math.min(Math.floor(Math.log(o) / Math.log(1024)), u.length - 1);
  return `${(o / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}

export default async function DonneesPage() {
  if (!(await getAdminEmail())) notFound();

  const { dossiers, resume } = await chargerInventaire();

  return (
    <main className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8">
      <Link href="/admin/regles" className="text-sm text-tampon underline-offset-4 hover:underline">
        ← Règles métier
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-semibold text-encre">Nettoyage des données</h1>
      <p className="mt-2 max-w-2xl text-sm text-ardoise">
        Inventaire de tous les dossiers. Les lignes pré-signalées ressemblent à des saisies de test
        (e-mail de test, champs bidon, dossier vide jamais livré). Rien n&apos;est supprimé
        automatiquement : coche ce que tu veux effacer, puis confirme. La suppression retire aussi
        les fichiers Storage liés.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Dossiers" value={resume.total} />
        <Metric label="Suspects (test ?)" value={resume.suspects} />
        <Metric label="Pièces jointes" value={resume.pieces} />
        <Metric label="Volume Storage" value={formatOctets(resume.tailleTotale)} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Repartition titre="Par dispositif" items={resume.parDispositif} />
        <Repartition titre="Par statut" items={resume.parStatut} />
      </div>

      <QuestionDonnees />

      <TableNettoyage dossiers={dossiers} />
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-papier/50 p-4">
      <p className="text-xs text-ardoise">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold text-encre">{value}</p>
    </div>
  );
}

function Repartition({ titre, items }: { titre: string; items: [string, number][] }) {
  return (
    <section className="rounded-2xl bg-blanc-casse p-5 shadow-lg">
      <h2 className="font-serif text-lg font-semibold text-encre">{titre}</h2>
      {items.length ? (
        <ul className="mt-3 divide-y divide-filigrane">
          {items.map(([nom, n]) => (
            <li key={nom} className="flex justify-between py-2 text-sm">
              <span className="text-encre">{nom}</span>
              <span className="font-mono text-ardoise">{n}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ardoise">Aucune donnée.</p>
      )}
    </section>
  );
}
