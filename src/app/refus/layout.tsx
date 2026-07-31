import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { MENTION_INDEPENDANCE_WEB } from "@/lib/legal/mentions";

/**
 * Coquille commune du cluster « refus ».
 *
 * Le bandeau d'indépendance est posé ICI et pas dans chaque page : c'est le
 * cluster entier qui parle de décisions de l'Anah et d'obligés CEE, donc celui
 * où une confusion sur le rôle de Dossimo coûterait le plus cher (CLAUDE.md §2).
 * Une page du cluster ne peut pas l'oublier, puisqu'elle ne l'écrit pas.
 *
 * Il est rendu au-dessus du contenu et non en pied : posé en bas, il aurait été
 * lu après la décision de remplir le formulaire, donc trop tard pour informer.
 */
export default function RefusLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-papier">
      <SiteHeader />
      <div className="border-b border-filigrane bg-blanc-casse">
        <p className="mx-auto max-w-4xl px-5 py-3 text-xs leading-relaxed text-ardoise sm:px-8">
          {MENTION_INDEPENDANCE_WEB}
        </p>
      </div>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
