import { redirect } from "next/navigation";

import { getCurrentArtisan } from "@/lib/auth/get-artisan";

export const metadata = { title: "Mon entreprise · Dossimo" };

function Valeur({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="border-b border-filigrane py-4 last:border-0 sm:grid sm:grid-cols-[12rem_1fr] sm:gap-6">
      <dt className="text-sm font-medium text-ardoise">{label}</dt>
      <dd className="mt-1 text-sm text-encre sm:mt-0">{value || "Non renseigné"}</dd>
    </div>
  );
}

export default async function ProfilArtisanPage() {
  const artisan = await getCurrentArtisan();
  if (!artisan) redirect("/connexion");

  const adresse = [artisan.adresse, artisan.code_postal, artisan.ville].filter(Boolean).join(", ");

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 xl:px-10">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-tampon">Profil artisan</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-encre">{artisan.entreprise}</h1>
      <p className="mt-3 text-ardoise">Ces informations préremplissent vos dossiers et vos factures.</p>

      <dl className="mt-8 rounded border border-filigrane bg-blanc-casse px-5 shadow-sm sm:px-6">
        <Valeur label="SIRET" value={artisan.siret} />
        <Valeur label="Qualification RGE" value={artisan.qualification_rge} />
        <Valeur label="Responsable" value={`${artisan.prenom} ${artisan.nom}`} />
        <Valeur label="E-mail" value={artisan.email} />
        <Valeur label="Téléphone" value={artisan.telephone} />
        <Valeur label="Adresse de facturation" value={adresse || null} />
      </dl>
    </main>
  );
}
