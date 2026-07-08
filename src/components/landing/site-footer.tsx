import Link from "next/link";

import { Logo } from "@/components/landing/site-header";

export function SiteFooter() {
  return (
    <footer className="border-t border-filigrane bg-papier">
      <div className="mx-auto max-w-[1280px] px-8 py-14">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-ardoise">
              La conformité de vos dossiers MaPrimeRénov&rsquo; et CEE, sécurisée
              avant dépôt. Sans mandataire.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <h3 className="label text-encre-claire">Produit</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-ardoise">
                <li><a href="#etapes" className="transition-colors hover:text-encre">Méthode</a></li>
                <li><a href="#difference" className="transition-colors hover:text-encre">Vs mandataire</a></li>
                <li><Link href="/dossiers/nouveau" className="transition-colors hover:text-encre">Créer un dossier</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="label text-encre-claire">Dispositifs</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-ardoise">
                <li>MaPrimeRénov&rsquo;</li>
                <li>CEE · Certificats d&rsquo;Économies d&rsquo;Énergie</li>
              </ul>
            </div>
            <div>
              <h3 className="label text-encre-claire">Ressources</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-ardoise">
                <li><a href="#faq" className="transition-colors hover:text-encre">Questions fréquentes</a></li>
                <li><a href="#contact" className="transition-colors hover:text-encre">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-filigrane pt-6">
          <p className="max-w-3xl text-xs leading-relaxed text-encre-claire">
            Dossimo est un service indépendant d&rsquo;aide à la préparation de
            dossier, non affilié à l&rsquo;Anah ni à France Rénov&rsquo;. Dossimo
            ne dépose jamais le dossier et ne perçoit jamais la prime :
            l&rsquo;artisan et son client déposent eux-mêmes et conservent
            l&rsquo;intégralité de la prime.
          </p>
          <p className="mt-4 font-mono text-xs text-encre-claire">
            © {new Date().getFullYear()} Dossimo · Île-de-France.
          </p>
        </div>
      </div>
    </footer>
  );
}
