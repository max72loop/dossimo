import type { Metadata } from "next";

import { DepotClient } from "@/components/depot/depot-client";
import { piecesDuBeneficiaire } from "@/lib/depot/actions";
import { marquerVisite, resoudreLien } from "@/lib/depot/lien";
import { piecesAttendues } from "@/lib/depot/pieces-attendues";

/**
 * Page publique de dépôt : la seule de tout le produit qui s'adresse au client de
 * l'artisan, et la seule accessible sans session.
 *
 * Sa garde tient entièrement dans `resoudreLien` : pas de token valide, pas de page.
 * Elle n'affiche que le strict nécessaire — un prénom, un nom d'entreprise, une liste
 * de pièces. Ni montants, ni prime, ni adresse : si le lien fuite, il ne révèle rien
 * que le porteur du lien ne sache déjà.
 */

export const dynamic = "force-dynamic";

// Jamais indexée : une URL qui collecte un avis d'imposition n'a rien à faire dans un
// moteur de recherche.
export const metadata: Metadata = {
  title: "Vos documents",
  robots: { index: false, follow: false, nocache: true },
};

function LienMort() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16 text-center">
      <p className="font-display text-sm font-bold tracking-tight text-encre">
        dossimo
      </p>
      <h1 className="mt-8 font-display text-2xl font-bold text-encre">
        Ce lien n&apos;est plus valide.
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ardoise">
        Il a peut-être expiré, ou été remplacé par un lien plus récent. Demandez-en un
        nouveau à l&apos;entreprise qui suit vos travaux : elle le regénère en un clic.
      </p>
    </main>
  );
}

export default async function DepotPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const lien = await resoudreLien(token);

  // Volontairement muet sur la cause : lien inconnu, expiré ou révoqué se ressemblent,
  // pour ne pas aider à sonder les tokens.
  if (!lien) return <LienMort />;

  const attendues = piecesAttendues(lien.data);
  if (attendues.length === 0) return <LienMort />;

  const [deposees] = await Promise.all([
    piecesDuBeneficiaire(lien.dossierId),
    marquerVisite(lien.lienId).catch(() => {}),
  ]);

  const c = lien.data.caracteristiques;

  return (
    <DepotClient
      token={token}
      prenom={c.beneficiaire.prenom}
      entreprise={lien.data.artisan?.entreprise ?? "L'entreprise"}
      attendues={attendues}
      initiales={deposees}
    />
  );
}
