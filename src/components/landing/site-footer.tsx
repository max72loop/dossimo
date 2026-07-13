import Link from "next/link";

import { Logo } from "@/components/landing/site-header";
import { editeur } from "@/lib/legal/editeur";

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

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            <div>
              <h3 className="label text-encre-claire">Produit</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-ardoise">
                <li><Link href="/#etapes" className="transition-colors hover:text-encre">Méthode</Link></li>
                <li><Link href="/#tarifs" className="transition-colors hover:text-encre">Tarifs</Link></li>
                <li><Link href="/#difference" className="transition-colors hover:text-encre">Vs mandataire</Link></li>
                <li><Link href="/inscription?next=%2Fdossiers%2Fnouveau" className="transition-colors hover:text-encre">Déposer mon devis</Link></li>
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
                <li><Link href="/#faq" className="transition-colors hover:text-encre">Questions fréquentes</Link></li>
                <li><Link href="/#contact" className="transition-colors hover:text-encre">Contact</Link></li>
                <li><a href={`mailto:${editeur.emailContact}`} className="transition-colors hover:text-encre">{editeur.emailContact}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="label text-encre-claire">Légal</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-ardoise">
                <li><Link href="/mentions-legales" className="transition-colors hover:text-encre">Mentions légales</Link></li>
                <li><Link href="/cgv" className="transition-colors hover:text-encre">CGV</Link></li>
                <li><Link href="/confidentialite" className="transition-colors hover:text-encre">Confidentialité</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/*
          Mention légale : en `ardoise` et non `encre-claire`. Ce dernier tombe à
          ~2,3:1 sur le fond papier, sous le seuil AA (4,5:1) — le texte qui engage
          juridiquement était le moins lisible de la page.
        */}
        <div className="mt-12 border-t border-filigrane pt-6">
          <p className="max-w-3xl text-xs leading-relaxed text-ardoise">
            Dossimo est un service indépendant d&rsquo;aide à la préparation de
            dossier, non affilié à l&rsquo;Anah ni à France Rénov&rsquo;. Dossimo
            ne dépose jamais le dossier et ne perçoit jamais la prime :
            l&rsquo;artisan et son client déposent eux-mêmes et conservent
            l&rsquo;intégralité de la prime.
          </p>
          <p className="mt-4 font-mono text-xs text-ardoise">
            © {new Date().getFullYear()} Dossimo.
          </p>
        </div>
      </div>
    </footer>
  );
}
