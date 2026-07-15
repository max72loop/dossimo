import Link from "next/link";

import { DemarrageAssiste } from "@/components/dossier/demarrage-assiste";
import { getCurrentArtisan } from "@/lib/auth/get-artisan";
import type { CeeIsolationInput } from "@/lib/dossier/cee-isolation";

export const metadata = {
  title: "Nouveau dossier CEE isolation",
};

export default async function NouveauDossierPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; dispositif?: string; geste?: string }>;
}) {
  const { mode, dispositif, geste } = await searchParams;
  const artisan = await getCurrentArtisan();

  // Préremplissage depuis le profil connecté : l'artisan ne resaisit pas son
  // entreprise ni sa qualification RGE à chaque dossier.
  const profileValues: Partial<CeeIsolationInput> = artisan
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
  const initialValues: Partial<CeeIsolationInput> =
    mode === "manuel"
      ? {
          ...profileValues,
          dispositif: dispositif === "maprimerenov" ? "maprimerenov" : "cee",
          geste: ["isolation", "pac_air_eau", "cet", "bois"].includes(geste ?? "")
            ? (geste as CeeIsolationInput["geste"])
            : "isolation",
        }
      : profileValues;

  return (
    <main className="mx-auto max-w-5xl px-8 py-12 xl:px-10">
      <div className="mb-8">
        <Link
          href="/dossiers"
          className="text-sm text-tampon underline-offset-4 transition hover:underline"
        >
          ← Mes dossiers
        </Link>
        <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-encre">
          Nouveau dossier
        </h1>
        <p className="mt-3 text-ardoise">
          Déposez d’abord votre devis : Dossimo prépare la saisie et vous guide sur ce qui manque.
        </p>
      </div>

      <DemarrageAssiste initialValues={initialValues} manual={mode === "manuel"} />

      <p className="mt-6 text-center text-xs text-encre-claire">
        Dossimo est un service indépendant d&apos;aide à la préparation de
        dossier, non affilié à l&apos;Anah ni à France Rénov&apos;.
      </p>
    </main>
  );
}
