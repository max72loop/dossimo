import Link from "next/link";

import { DossierCeeIsolationForm } from "@/components/dossier/DossierCeeIsolationForm";
import { getCurrentArtisan } from "@/lib/auth/get-artisan";
import type { CeeIsolationInput } from "@/lib/dossier/cee-isolation";

export const metadata = {
  title: "Nouveau dossier CEE isolation — Dossimo",
};

export default async function NouveauDossierPage() {
  const artisan = await getCurrentArtisan();

  // Préremplissage depuis le profil connecté : l'artisan ne resaisit pas son
  // entreprise ni sa qualification RGE à chaque dossier.
  const initialValues: Partial<CeeIsolationInput> = artisan
    ? {
        entreprise: artisan.entreprise,
        siret: artisan.siret ?? "",
        rge_numero: artisan.qualification_rge ?? "",
        signataire_nom: artisan.nom,
        signataire_prenom: artisan.prenom,
        email: artisan.email,
        telephone: artisan.telephone ?? "",
      }
    : {};

  return (
    <main className="mx-auto max-w-3xl px-8 py-12">
      <div className="mb-8">
        <Link
          href="/dossiers"
          className="text-sm text-tampon underline-offset-4 transition hover:underline"
        >
          ← Mes dossiers
        </Link>
        <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-encre">
          Nouveau dossier — CEE isolation
        </h1>
        <p className="mt-3 text-ardoise">
          Une seule saisie. Le pack documentaire et le contrôle anti-refus en
          découlent : les incohérences entre pièces deviennent impossibles.
        </p>
      </div>

      <DossierCeeIsolationForm initialValues={initialValues} />

      <p className="mt-6 text-center text-xs text-encre-claire">
        Dossimo est un service indépendant d&apos;aide à la préparation de
        dossier, non affilié à l&apos;Anah ni à France Rénov&apos;.
      </p>
    </main>
  );
}
