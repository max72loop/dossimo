import type { Metadata } from "next";

import { LegalDoc, LegalSection } from "@/components/legal/legal-doc";
import { editeur, derniereMajLegale } from "@/lib/legal/editeur";
import { grillePublique } from "@/lib/landing/grille-publique";

export const metadata: Metadata = {
  title: "Conditions générales de vente · Dossimo",
  description:
    "Conditions générales de vente du service de préparation de dossiers Dossimo.",
};

export default async function CgvPage() {
  // Grille lue en base — la même que celle du checkout. Un montant écrit ici ENGAGE
  // contractuellement : il ne peut pas venir d'une constante qui a divergé du prix
  // réellement facturé. Si la grille est illisible, on renvoie au tarif affiché
  // avant paiement plutôt que d'avancer une fourchette.
  const grille = await grillePublique();

  return (
    <LegalDoc
      titre="Conditions générales de vente"
      maj={derniereMajLegale}
      intro="Les présentes conditions régissent l'utilisation du service Dossimo et la vente des prestations de préparation de dossiers."
    >
      <LegalSection titre="1. Objet">
        <p>
          Dossimo fournit un service en ligne d&rsquo;aide à la préparation et au
          contrôle de conformité de dossiers MaPrimeRénov&rsquo; et CEE, à
          destination des artisans professionnels du bâtiment (le
          «&nbsp;Client&nbsp;»). Le service produit un pack documentaire préparé à
          partir des données saisies par le Client et un rapport de contrôle
          anti-refus. Dossimo ne dépose pas le dossier et ne perçoit pas la prime.
        </p>
      </LegalSection>

      <LegalSection titre="2. Nature professionnelle du Client">
        <p>
          Le service s&rsquo;adresse exclusivement à des professionnels agissant
          dans le cadre de leur activité. En conséquence, le droit de rétractation
          prévu pour les consommateurs (art. L221-18 du Code de la consommation)
          ne s&rsquo;applique pas, sauf dispositions applicables aux
          professionnels employant cinq salariés ou moins pour un contrat hors
          champ de leur activité principale.
        </p>
      </LegalSection>

      <LegalSection titre="3. Prix">
        <p>
          Le premier dossier est offert. Les dossiers suivants sont facturés à un{" "}
          <strong>forfait fixe par dossier</strong>
          {grille ? (
            <>
              , compris entre {grille.minLabel} et {grille.maxLabel}
            </>
          ) : null}
          , déterminé par paliers selon le montant de l&rsquo;aide estimée du
          dossier. Le tarif applicable est affiché avant tout paiement et fait foi.
          Il s&rsquo;agit d&rsquo;un forfait fixe et{" "}
          <strong>jamais d&rsquo;un pourcentage</strong> de la prime, qui revient
          intégralement au Client et à son bénéficiaire.
        </p>
        {grille && grille.paliers.length > 1 && (
          <p>
            Paliers en vigueur à la date de mise à jour des présentes conditions
            : {grille.paliers.join(", ")}.
          </p>
        )}
        <p>
          Les prix sont indiqués en euros. Le régime de TVA applicable est précisé
          sur la facture émise après paiement.
        </p>
      </LegalSection>

      <LegalSection titre="4. Commande et paiement">
        <p>
          La commande est validée par le paiement en ligne, opéré via notre
          prestataire {editeur.paiement.nom}. Dossimo ne stocke pas les données de
          carte bancaire. Le pack documentaire est mis à disposition dans
          l&rsquo;espace du Client une fois le paiement confirmé. Une facture est
          émise pour chaque paiement.
        </p>
      </LegalSection>

      <LegalSection titre="5. Obligations du Client">
        <p>
          Le Client est seul responsable de l&rsquo;exactitude et de la véracité
          des informations qu&rsquo;il saisit (données du chantier, du
          bénéficiaire, montants, dates, qualifications). Dossimo prépare et
          contrôle le dossier sur la base de ces informations&nbsp;; il ne saurait
          être tenu responsable d&rsquo;un refus résultant de données erronées ou
          incomplètes fournies par le Client.
        </p>
      </LegalSection>

      <LegalSection titre="6. Nature de la prestation et garantie">
        <p>
          Dossimo est une obligation de moyens et non de résultat.
          L&rsquo;acceptation d&rsquo;un dossier relève de la seule décision de
          l&rsquo;organisme instructeur (Anah, obligé CEE ou son délégataire).
          Dossimo met en œuvre ses meilleurs moyens pour détecter, avant le dépôt,
          les motifs de refus connus (chronologie, qualification RGE, mentions
          obligatoires, cohérence des pièces, seuils de performance), sans
          garantir l&rsquo;absence de refus.
        </p>
      </LegalSection>

      <LegalSection titre="7. Responsabilité">
        <p>
          La responsabilité de Dossimo, si elle était engagée, serait limitée au
          montant effectivement payé par le Client pour le dossier concerné.
          Dossimo n&rsquo;est pas responsable des conséquences indirectes (perte de
          prime, perte de chantier, préjudice commercial).
        </p>
      </LegalSection>

      <LegalSection titre="8. Propriété des documents">
        <p>
          Les données saisies et les documents finaux restituant ces données
          appartiennent au Client. Les modèles, l&rsquo;interface et la
          technologie de contrôle restent la propriété de l&rsquo;éditeur.
        </p>
      </LegalSection>

      <LegalSection titre="9. Données personnelles">
        <p>
          Le traitement des données personnelles (celles du Client et des
          bénéficiaires des dossiers) est décrit dans la{" "}
          <a
            href="/confidentialite"
            className="text-tampon underline-offset-4 hover:underline"
          >
            politique de confidentialité
          </a>
          , qui fait partie intégrante des présentes conditions.
        </p>
      </LegalSection>

      <LegalSection titre="10. Droit applicable et litiges">
        <p>
          Les présentes conditions sont régies par le droit français. En cas de
          litige, les parties rechercheront une solution amiable avant toute
          action. À défaut, compétence est attribuée aux tribunaux du ressort du
          siège de l&rsquo;éditeur. Pour toute réclamation&nbsp;:{" "}
          <a
            href={`mailto:${editeur.emailContact}`}
            className="text-tampon underline-offset-4 hover:underline"
          >
            {editeur.emailContact}
          </a>
          .
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
