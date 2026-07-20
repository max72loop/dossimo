import type { Metadata } from "next";

import { DepotClient } from "@/components/depot/depot-client";
import { piecesDuBeneficiaire } from "@/lib/depot/actions";
import { marquerVisite, resoudreLien } from "@/lib/depot/lien";
import { piecesAttendues } from "@/lib/depot/pieces-attendues";
import { Logo } from "@/components/ui/logo";

/**
 * Page publique de dépôt : la seule de tout le produit qui s'adresse au client de
 * l'artisan, et la seule accessible sans session.
 *
 * Sa garde tient entièrement dans `resoudreLien` : pas de token valide, pas de page.
 * Elle n'affiche que le strict nécessaire : un prénom, un nom d'entreprise, une liste
 * de pièces, de quoi joindre l'artisan. Ni montants, ni prime, ni adresse : si le lien
 * fuite, il ne révèle rien que le porteur du lien ne sache déjà.
 */

export const dynamic = "force-dynamic";

// Jamais indexée : une URL qui collecte un avis d'imposition n'a rien à faire dans un
// moteur de recherche.
export const metadata: Metadata = {
  title: "Vos documents",
  robots: { index: false, follow: false, nocache: true },
};

function Ecran({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16 text-center">
      <Logo
        href={null}
        variant="encre-mono"
        taille="text-[2.5rem] sm:text-[3rem]"
        className="justify-center"
      />
      <h1 className="mt-8 font-display text-2xl font-bold text-encre">{titre}</h1>
      <div className="mt-3 text-base leading-relaxed text-ardoise">{children}</div>
    </main>
  );
}

/**
 * Lien inconnu, expiré ou révoqué : trois causes, un seul message, volontairement
 * muet sur laquelle. La réponse ne doit pas aider à sonder les tokens.
 *
 * On ne peut pas nommer l'entreprise ici : sans dossier résolu, on ne la connaît pas.
 * C'est la seule impasse assumée du parcours.
 */
function LienMort() {
  return (
    <Ecran titre="Ce lien n'est plus valide.">
      <p>
        Il a peut-être expiré, ou été remplacé par un lien plus récent. Demandez-en un
        nouveau à l&apos;entreprise qui suit vos travaux : elle le regénère en un clic.
      </p>
    </Ecran>
  );
}

/**
 * Lien parfaitement valide, mais ce dossier ne réclame aucune pièce au bénéficiaire
 * (cas courant en CEE : ménage « classique » et propriétaire occupant, cf.
 * `piecesCeeIsolation`). L'ancien code servait ici le message « lien plus valide »,
 * qui était donc faux une fois sur deux, et envoyait le client redemander un lien
 * qui aurait affiché exactement la même chose.
 */
function RienADeposer({ entreprise }: { entreprise: string }) {
  return (
    <Ecran titre="Vous n'avez aucun document à envoyer.">
      <p>
        {`${entreprise} n'a besoin d'aucune pièce de votre part pour ce dossier. Vous pouvez fermer cette page.`}
      </p>
    </Ecran>
  );
}

export default async function DepotPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const lien = await resoudreLien(token);

  if (!lien) return <LienMort />;

  const entreprise = lien.data.artisan?.entreprise ?? "L'entreprise";
  const attendues = piecesAttendues(lien.data);
  if (attendues.length === 0) return <RienADeposer entreprise={entreprise} />;

  const [deposees] = await Promise.all([
    piecesDuBeneficiaire(token),
    marquerVisite(lien.lienId).catch(() => {}),
  ]);

  const c = lien.data.caracteristiques;

  return (
    <DepotClient
      token={token}
      prenom={c.beneficiaire.prenom}
      entreprise={entreprise}
      attendues={attendues}
      initiales={deposees}
    />
  );
}