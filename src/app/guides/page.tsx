import { ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { getGesteGuides } from "@/lib/seo/gestes-loader";
import { formatGuideDate, guideList, guidesByCategory } from "@/lib/seo/guides";
import { ORGANIZATION_ID, publicMetadata, serializeJsonLd, SITE_URL } from "@/lib/seo/site";

const TITLE = "Guides MaPrimeRénov' & CEE pour artisans RGE";
const DESCRIPTION =
  "Les guides Dossimo pour monter des dossiers MaPrimeRénov' et CEE conformes : devis, mentions obligatoires, contrôles de cohérence et prévention des refus, sources officielles à l'appui.";

/**
 * Socle éditorial du hub. Une page pilier qui n'aligne que des cartes de liens est
 * lue comme un sommaire, pas comme un contenu : Google la classe en « détectée,
 * non indexée » et le jus ne descend jamais vers les guides. Ces sections lui
 * donnent la matière qui manquait, et expliquent la logique commune aux guides
 * plutôt que de résumer chacun d'eux.
 */
const SECTIONS: Array<{ heading: string; paragraphs: string[] }> = [
  {
    heading: "Pourquoi un dossier conforme se joue avant le dépôt",
    paragraphs: [
      "Les refus MaPrimeRénov’ et CEE ne viennent presque jamais de la qualité des travaux. Ils viennent du dossier : une mention absente, une date placée au mauvais moment, une surface qui diffère de deux mètres carrés entre le devis et la facture. L’instructeur ne visite pas le chantier, il reconstitue l’opération à partir du papier, et sa méthode consiste à rapprocher les pièces entre elles.",
      "Cette mécanique a une conséquence pratique : le moment où un dossier se sauve n’est pas le dépôt, c’est le devis. Après signature, chaque correction devient un devis rectificatif, un nouvel envoi et un délai supplémentaire. Certaines erreurs, comme une offre CEE engagée après l’acceptation du devis, ne se corrigent plus du tout. Ces guides sont donc écrits dans cet ordre : ce qu’il faut vérifier avant d’engager, pas ce qu’il faut plaider après un refus.",
    ],
  },
  {
    heading: "Ce que les deux dispositifs ont en commun, et ce qui les sépare",
    paragraphs: [
      "MaPrimeRénov’ et les certificats d’économies d’énergie sont deux dispositifs distincts, portés par des acteurs différents, et cumulables sur un même chantier. Ils partagent une exigence de fond : rendre le geste vérifiable sur pièce. Dans les deux cas, le devis doit décrire la nature exacte des travaux, la quantité, le produit posé et ses performances, et la qualification RGE doit couvrir le domaine concerné.",
      "Ils divergent sur la chronologie, et c’est là que se concentrent les pièges. Le CEE impose que l’offre soit engagée avant l’acceptation du devis, au titre du rôle actif et incitatif, et fixe un délai de trois mois après la facture pour envoyer le dossier. MaPrimeRénov’ raisonne à partir de la demande déposée avant le début des travaux, geste par geste et selon un barème lié au profil de revenus du ménage. Un même chantier cumulant les deux aides doit donc satisfaire deux calendriers en parallèle, ce qui double aussi le nombre de contrôles de cohérence.",
    ],
  },
  {
    heading: "Comment ces guides sont organisés",
    paragraphs: [
      "Trois familles répondent à trois moments du dossier. « Monter le dossier » cartographie ce qu’un pack complet doit contenir et qui fournit quoi, entre l’artisan et le bénéficiaire. « Devis & conformité » descend au niveau de la pièce : mentions obligatoires, description technique, montants comparables, modèles et ordres de grandeur de prix. « Refus & prévention » traite les points qui bloquent un dossier sans rattrapage possible, au premier rang desquels la chronologie CEE et la couverture de la qualification RGE.",
      "S’y ajoutent les pages « Par geste », dérivées directement de notre table de règles métier. Elles ne répondent pas à la question « quelle méthode ? » mais à la question « mon chantier », en reprenant les exigences propres à un geste donné. Chaque guide indique sa date de dernière vérification et renvoie aux sources officielles sur lesquelles il s’appuie : France Rénov’, l’Anah, Service Public et le catalogue des fiches d’opérations standardisées. Quand une règle bouge, c’est la source qui fait foi, pas le guide.",
    ],
  },
  {
    heading: "Le rôle de Dossimo, et ce qu’il ne fait pas",
    paragraphs: [
      "Dossimo produit le pack documentaire complet à partir d’une saisie unique des données du chantier, puis le contrôle avant dépôt et remonte les points qui déclenchent un refus. Comme toutes les pièces sont générées depuis la même saisie, l’incohérence entre le devis et la facture, l’un des premiers motifs de refus, devient structurellement difficile à produire par accident.",
      "Dossimo ne dépose jamais le dossier et ne touche jamais la prime. Ce dépôt est réservé aux mandataires habilités par l’Anah, un rôle que nous refusons d’endosser par choix : c’est ce qui vous permet de garder la main sur votre client et sur votre prime, là où un mandataire prend le dossier en charge. Dossimo est un service indépendant d’aide à la préparation de dossier, non affilié à l’Anah ni à France Rénov’.",
    ],
  },
];

const FAQ: Array<{ question: string; answer: string }> = [
  {
    question: "Quelle est la première cause de refus d’un dossier MaPrimeRénov’ ou CEE ?",
    answer:
      "L’incohérence entre les pièces, et en particulier l’écart entre le devis et la facture. Une surface, une référence produit ou une performance qui diffère d’un document à l’autre suffit à bloquer la prime, même si chaque pièce est correcte prise isolément. L’instructeur ne visite pas le chantier : il rapproche les documents entre eux.",
  },
  {
    question: "Peut-on cumuler MaPrimeRénov’ et une prime CEE sur un même chantier ?",
    answer:
      "Oui, les deux dispositifs sont distincts et se cumulent. Le cumul suppose que la chronologie propre à chaque aide soit respectée, que les gestes soient cumulables entre eux et que le total reste dans les limites de l’écrêtement en vigueur. Il double aussi le nombre de contrôles de cohérence, puisque chaque dispositif rapproche de son côté le devis, la facture et les caractéristiques techniques.",
  },
  {
    question: "À quel moment faut-il vérifier la conformité du dossier ?",
    answer:
      "Avant la signature du devis. Après, chaque correction devient un devis rectificatif et un délai supplémentaire, et certaines erreurs ne se corrigent plus du tout : une offre CEE engagée après l’acceptation du devis fait tomber la prime sans recours possible.",
  },
  {
    question: "Suffit-il d’être RGE pour que le chantier ouvre droit aux aides ?",
    answer:
      "Non. RGE n’est pas un label unique mais un ensemble de qualifications délivrées domaine par domaine. La qualification doit couvrir précisément le geste facturé et être valable à la date qui compte pour le dispositif. En sous-traitance, c’est l’entreprise qui exécute réellement le geste qui doit la détenir.",
  },
  {
    question: "Dossimo dépose-t-il le dossier à ma place ?",
    answer:
      "Non, jamais. Le dépôt est réservé aux mandataires habilités par l’Anah, un rôle que Dossimo refuse d’endosser. Nous produisons le pack documentaire complet et vérifié, que vous et votre client déposez vous-mêmes : vous gardez votre relation client et votre prime.",
  },
  {
    question: "Ces guides sont-ils à jour des règles 2026 ?",
    answer:
      "Chaque guide affiche sa date de dernière vérification éditoriale et renvoie aux sources officielles sur lesquelles il s’appuie. Les règles évoluent par arrêté : en cas d’écart, la source officielle prime toujours sur le guide, et c’est pour cela qu’elles sont listées en bas de chaque page.",
  },
];

export const metadata = publicMetadata({
  path: "/guides",
  title: TITLE,
  description: DESCRIPTION,
});

/**
 * Page pilier des guides. Elle relie tous les guides entre eux (maillage interne)
 * et donne à Google une entrée thématique unique, là où chaque guide vivait jusqu'ici
 * en route plate isolée. Les guides restent à leur URL d'origine : ce hub les fédère,
 * il ne les déplace pas.
 */
export default async function GuidesHubPage() {
  // Pages dérivées de `regles_metier`. Base injoignable : liste vide, le hub
  // reste servi avec le seul éditorial plutôt que de tomber.
  const gestes = await getGesteGuides();
  const groups = guidesByCategory(gestes);
  const toutesLesPages = [...guideList, ...gestes];
  const hubUrl = `${SITE_URL}/guides`;
  // Dates ISO : le tri lexical suffit pour retrouver la vérification la plus récente.
  const derniereVerification = toutesLesPages
    .map((guide) => guide.updated)
    .sort()
    .at(-1)!;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: TITLE,
      description: DESCRIPTION,
      url: hubUrl,
      inLanguage: "fr-FR",
      isPartOf: { "@type": "WebSite", name: "Dossimo", url: SITE_URL },
      publisher: { "@id": ORGANIZATION_ID },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: toutesLesPages.map((guide, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE_URL}/${guide.slug}`,
          name: guide.title,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Guides", item: hubUrl },
      ],
    },
    // Le balisage FAQ doit refléter des réponses réellement affichées : `FAQ`
    // alimente à la fois ce JSON-LD et la section visible plus bas.
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];

  return (
    <div className="flex min-h-full flex-col bg-papier">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <SiteHeader />
      <main className="flex-1">
        <header className="border-b border-filigrane bg-blanc-casse">
          <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
            <nav aria-label="Fil d’Ariane" className="text-sm text-ardoise">
              <Link href="/" className="underline underline-offset-4 hover:text-encre">Accueil</Link>
              <span aria-hidden="true"> / </span>
              <span>Guides</span>
            </nav>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-tampon">
              Ressources Dossimo · artisans RGE
            </p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-encre sm:text-5xl">
              Monter des dossiers MaPrimeRénov’ et CEE qui passent
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-ardoise">
              Des guides pratiques et sourcés pour sécuriser chaque pièce avant le dépôt.
              Nous ne déposons jamais le dossier et ne touchons jamais la prime : ces guides
              vous aident à garder la main sur l’un comme sur l’autre.
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="mb-16 max-w-3xl space-y-12 border-b border-filigrane pb-14">
            {SECTIONS.map((section) => (
              <section key={section.heading} aria-label={section.heading}>
                <h2 className="font-serif text-3xl font-semibold text-encre">{section.heading}</h2>
                <div className="mt-5 space-y-4">
                  {section.paragraphs.map((paragraph, index) => (
                    <p key={index} className="text-lg leading-relaxed text-ardoise">{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {groups.map((group) => (
            <section key={group.category} aria-labelledby={group.category} className="mt-14 first:mt-0">
              <h2
                id={group.category}
                className="font-serif text-3xl font-semibold text-encre"
              >
                {group.category}
              </h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {group.guides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/${guide.slug}`}
                    className="group flex flex-col rounded-2xl bg-blanc-casse p-6 shadow-md transition hover:shadow-lg"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tampon">
                      {guide.eyebrow}
                    </p>
                    <h3 className="mt-3 font-serif text-xl font-semibold text-encre group-hover:text-tampon">
                      {guide.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-ardoise">
                      {guide.description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-encre">
                      Lire le guide
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <section aria-labelledby="faq" className="mt-16 border-t border-filigrane pt-14">
            <h2 id="faq" className="font-serif text-3xl font-semibold text-encre">Questions fréquentes</h2>
            <dl className="mt-8 max-w-3xl space-y-8">
              {FAQ.map((item) => (
                <div key={item.question}>
                  <dt className="font-serif text-xl font-semibold text-encre">{item.question}</dt>
                  <dd className="mt-3 text-lg leading-relaxed text-ardoise">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>

          <p className="mt-14 flex items-center gap-2 border-t border-filigrane pt-8 text-sm text-ardoise">
            <ShieldCheck className="h-5 w-5 shrink-0 text-succes" aria-hidden="true" />
            Guides vérifiés le {formatGuideDate(derniereVerification)} et adossés aux sources
            officielles (France Rénov’, Anah, Service Public, catalogue CEE).
          </p>

          <aside className="mt-14 rounded bg-encre p-7 text-papier sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-papier/70">Contrôle Dossimo</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold">Vérifiez votre propre devis gratuitement.</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-papier/80">
              Ajoutez le PDF ou une photo : Dossimo relève les informations lisibles et vous
              montre le premier point à confirmer avant le dépôt.
            </p>
            <Link
              href="/demo"
              className="mt-7 inline-flex items-center gap-2 rounded bg-accent px-5 py-3 font-medium text-blanc-casse transition hover:bg-accent-hover"
            >
              Analyser mon devis <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
