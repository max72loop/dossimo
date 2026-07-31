import Link from "next/link";

import { guideList } from "@/lib/seo/guides";

/**
 * Sens retour du maillage croisé : du cluster « refus » vers les guides de
 * prévention. Le sens aller est porté par le champ `voirAussi` des guides
 * concernés (docs/cluster-refus.md § 3.5).
 *
 * La liste est DÉRIVÉE de la catégorie, jamais énumérée par slugs : un
 * quatrième guide rangé dans « Refus & prévention » apparaît ici sans qu'on
 * touche à ce fichier, et un guide déplacé en sort de lui-même.
 */
const GUIDES_PREVENTION = guideList.filter((guide) => guide.category === "Refus & prévention");

export function GuidesPrevention() {
  if (GUIDES_PREVENTION.length === 0) return null;

  return (
    <section aria-labelledby="prevenir" className="mt-16 border-t border-filigrane pt-14">
      <h2 id="prevenir" className="font-serif text-3xl font-semibold text-encre">
        Pour que le prochain dossier ne finisse pas ici
      </h2>
      <p className="mt-4 max-w-3xl leading-relaxed text-ardoise">
        Un refus se prévient à la saisie, pas au dépôt. Ces guides détaillent les contrôles à faire
        avant d’envoyer le dossier.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {GUIDES_PREVENTION.map((guide) => (
          <Link
            key={guide.slug}
            href={`/${guide.slug}`}
            className="group rounded-2xl bg-blanc-casse p-5 shadow-md transition hover:shadow-lg"
          >
            <span className="font-semibold text-encre group-hover:text-tampon">{guide.title}</span>
            <span className="mt-2 block text-sm leading-relaxed text-ardoise">
              {guide.description}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
