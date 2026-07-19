import { notFound } from "next/navigation";
import Link from "next/link";
import { Send, BarChart3, Mails, Database, Compass, Scale, FileText, type LucideIcon } from "lucide-react";

import { getAdminEmail } from "@/lib/auth/is-admin";

export const metadata = { title: "Administration · Dossimo" };

/**
 * Accueil du segment `/admin` : le sommaire des consoles.
 *
 * Il n'existait pas, et aucun lien de l'espace artisan ne pointe ici (par
 * choix : la console n'a pas à être découvrable). Sans sommaire, il fallait
 * retenir chaque URL par cœur, et `/admin` seul renvoyait un 404 — ce qui donne
 * l'impression que l'admin n'existe pas, même connecté avec les droits.
 *
 * La garde est refaite ici : le layout en pose une, mais chaque page doit tenir
 * debout seule (cf. le commentaire du layout).
 */

type Section = {
  href: string;
  titre: string;
  aide: string;
  icone: LucideIcon;
};

/** Le sprint d'abord : c'est la console du moment (plan de lancement v3). */
const SPRINT: Section[] = [
  {
    href: "/admin/sprint",
    titre: "Sprint prospection",
    aide: "Le lot du jour, à envoyer à la main. Premier contact, relance J+5, nurturing mensuel.",
    icone: Send,
  },
  {
    href: "/admin/sprint/pilotage",
    titre: "Pilotage du sprint",
    aide: "Les cinq chiffres par canal, et le croisement avec ce que le site a réellement vu arriver.",
    icone: BarChart3,
  },
  {
    href: "/admin/prospection",
    titre: "Prospection e-mail",
    aide: "La file de validation du système e-mail automatisé, distinct du sprint manuel.",
    icone: Mails,
  },
];

const OUTILS: Section[] = [
  {
    href: "/admin/pilotage",
    titre: "Pilotage terrain",
    aide: "Les dossiers, leurs retours de dépôt et les obligés.",
    icone: Compass,
  },
  {
    href: "/admin/donnees",
    titre: "Nettoyage des données",
    aide: "Supprimer les dossiers de test, voir les volumes par dispositif et par statut.",
    icone: Database,
  },
  {
    href: "/admin/regles",
    titre: "Règles métier",
    aide: "Les contrôles anti-refus. Une modification ici change la production tout de suite.",
    icone: Scale,
  },
  {
    href: "/admin/devis",
    titre: "Modèles de devis",
    aide: "Les gestes, leurs champs et les modèles servant à la génération.",
    icone: FileText,
  },
];

function Carte({ s }: { s: Section }) {
  const Icone = s.icone;
  return (
    <Link
      href={s.href}
      className="group flex gap-3 rounded-2xl bg-blanc-casse p-4 shadow-md transition hover:shadow-lg"
    >
      <Icone className="mt-0.5 h-5 w-5 shrink-0 text-tampon" />
      <div>
        <p className="text-sm font-semibold text-encre group-hover:underline">{s.titre}</p>
        <p className="mt-1 text-xs leading-relaxed text-ardoise">{s.aide}</p>
      </div>
    </Link>
  );
}

export default async function AdminAccueilPage() {
  if (!(await getAdminEmail())) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-encre">Administration</h1>
      <p className="mt-1 text-sm text-ardoise">
        Les consoles internes. Aucune n&apos;est accessible depuis l&apos;espace artisan, et toutes renvoient un 404 sans
        session admin.
      </p>

      <h2 className="mt-8 text-xs font-semibold uppercase tracking-wide text-encre-claire">Sprint de lancement</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {SPRINT.map((s) => (
          <Carte key={s.href} s={s} />
        ))}
      </div>

      <h2 className="mt-8 text-xs font-semibold uppercase tracking-wide text-encre-claire">Produit et données</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {OUTILS.map((s) => (
          <Carte key={s.href} s={s} />
        ))}
      </div>
    </main>
  );
}
