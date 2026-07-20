import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Logo } from "@/components/ui/logo";
import { FOCUS } from "@/components/ui/boutons";
import { desinscrire } from "@/lib/prospection/file";
import { editeur } from "@/lib/legal/editeur";

export const metadata: Metadata = {
  title: "Désinscription",
  robots: { index: false, follow: false },
};

/**
 * Page de désinscription, ouverte sans compte : le jeton du lien EST
 * l'autorisation. Un bouton, une confirmation, rien d'autre à faire.
 *
 * Le clic sur le lien ne désinscrit pas à lui seul : certains antivirus et
 * passerelles de sécurité visitent les liens des messages entrants, et un GET
 * qui désinscrirait aurait désinscrit l'artisan avant même qu'il ait lu le
 * message. L'écriture passe donc par un POST (ce formulaire).
 */
export default async function DesinscriptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ fait?: string }>;
}) {
  const { token } = await params;
  const { fait } = await searchParams;

  async function confirmer() {
    "use server";
    await desinscrire(token, "page de désinscription");
    redirect(`/desinscription/${token}?fait=1`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-papier">
      <header className="border-b border-filigrane bg-blanc-casse">
        <div className="mx-auto flex h-16 max-w-2xl items-center px-5 sm:px-8">
          <Logo />
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16 sm:px-8">
        {fait === "1" ? (
          <div className="border-l-4 border-succes bg-succes-bg px-6 py-8">
            <CheckCircle2 className="h-8 w-8 text-succes" strokeWidth={1.5} />
            <h1 className="mt-4 font-serif text-2xl font-semibold text-encre">
              C&rsquo;est fait, vous ne recevrez plus rien.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ardoise">
              Votre adresse est retirée de notre prospection, définitivement. Elle
              est conservée sur une liste d&rsquo;opposition dont le seul rôle est
              de garantir qu&rsquo;on ne vous réécrira pas, même après un nouvel
              import.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ardoise">
              Une question, une réclamation ?{" "}
              <a
                href={`mailto:${editeur.emailRgpd}`}
                className={`font-semibold text-tampon underline underline-offset-4 ${FOCUS}`}
              >
                {editeur.emailRgpd}
              </a>
            </p>
          </div>
        ) : (
          <>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-encre">
              Ne plus recevoir de message de Dossimo
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ardoise">
              Un clic et c&rsquo;est terminé : votre adresse est retirée de notre
              prospection et inscrite sur notre liste d&rsquo;opposition, pour
              qu&rsquo;un import ultérieur ne puisse pas vous y ramener.
            </p>

            <form action={confirmer} className="mt-8">
              <button
                type="submit"
                className={`inline-flex h-12 items-center rounded-lg bg-encre px-6 text-sm font-semibold text-blanc-casse transition-colors hover:bg-encre/90 ${FOCUS}`}
              >
                Confirmer ma désinscription
              </button>
            </form>

            <p className="mt-8 border-t border-filigrane pt-6 text-xs leading-relaxed text-encre-claire">
              Responsable du traitement : {editeur.raisonSociale}, {editeur.adresse}.
              Vous disposez d&rsquo;un droit d&rsquo;accès, de rectification et
              d&rsquo;effacement à l&rsquo;adresse {editeur.emailRgpd}.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
