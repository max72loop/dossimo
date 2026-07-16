import type { Metadata } from "next";
import Link from "next/link";

import { LegalDoc, LegalRow, LegalSection } from "@/components/legal/legal-doc";
import { editeur, derniereMajLegale } from "@/lib/legal/editeur";
import { grillePublique } from "@/lib/landing/grille-publique";
import { publicMetadata } from "@/lib/seo/site";

export const metadata: Metadata = publicMetadata({
  path: "/cgv",
  title: "Conditions générales de vente",
  description: "Conditions générales de vente du service professionnel de préparation et de contrôle de dossiers Dossimo.",
});

const lien = "text-tampon underline-offset-4 hover:underline";

export default async function CgvPage() {
  // La grille affichée vient de la même table que le checkout. Un montant écrit
  // dans les CGV engage l'éditeur : aucune copie locale du tarif n'est admise.
  const grille = await grillePublique();

  return (
    <LegalDoc
      titre="Conditions générales de vente"
      maj={derniereMajLegale}
      intro="Les présentes conditions encadrent la vente aux professionnels du service Dossimo. Elles sont accessibles avant chaque paiement et peuvent être conservées ou imprimées par le Client."
    >
      <LegalSection titre="1. Éditeur et champ d’application">
        <p>
          Les présentes conditions générales de vente (les «&nbsp;CGV&nbsp;»)
          sont proposées par {editeur.raisonSociale}, entrepreneur individuel,
          SIREN {editeur.siren}, dont le siège est situé {editeur.adresse}{" "}
          (ci-après
          «&nbsp;Dossimo&nbsp;»). Les informations complètes de l&rsquo;éditeur
          figurent dans les{" "}
          <Link href="/mentions-legales" className={lien}>
            mentions légales
          </Link>
          .
        </p>
        <p>
          Elles s&rsquo;appliquent exclusivement aux artisans et autres
          professionnels du bâtiment agissant pour les besoins de leur activité
          (le «&nbsp;Client&nbsp;»). Elles prévalent sur tout document
          contradictoire du Client, sauf conditions particulières expressément
          acceptées par écrit par Dossimo.
        </p>
      </LegalSection>

      <LegalSection titre="2. Service proposé">
        <p>
          Dossimo fournit un service en ligne d&rsquo;aide à la préparation et au
          contrôle de conformité de dossiers MaPrimeRénov&rsquo; et CEE. Selon le
          geste traité et les informations disponibles, le service peut comprendre
          une estimation indicative de l&rsquo;aide, un rapport de contrôle, une
          checklist et des documents préparatoires générés à partir des données
          saisies par le Client.
        </p>
        <p>
          Dossimo est un service indépendant. Il n&rsquo;est affilié ni à
          l&rsquo;Anah, ni à France Rénov&rsquo;, ni à un obligé CEE. Dossimo
          n&rsquo;agit pas comme mandataire, ne dépose pas le dossier, ne suit pas
          son instruction au nom du Client et ne perçoit aucune prime.
        </p>
      </LegalSection>

      <LegalSection titre="3. Compte professionnel et commande">
        <p>
          Le Client crée un compte avec des informations exactes, maintient la
          confidentialité de ses accès et informe Dossimo sans délai de toute
          utilisation non autorisée. Il doit disposer des pouvoirs nécessaires
          pour engager l&rsquo;entreprise renseignée dans son compte.
        </p>
        <p>
          Avant paiement, le Client peut vérifier le dossier, le contenu disponible,
          le prix et les éventuelles réductions. La commande devient ferme lorsque
          le Client déclenche le paiement en ayant eu accès aux présentes CGV, puis
          que le paiement est confirmé. Dossimo en accuse réception par le
          déblocage du dossier et la mise à disposition d&rsquo;une facture.
        </p>
      </LegalSection>

      <LegalSection titre="4. Prix et offre de lancement">
        <p>
          Le code promotionnel DOSSIMO50 accorde une réduction de 50 % sur la
          première transaction du Client. Il est utilisable jusqu&rsquo;au 31 juillet
          2026 à 23 h 59, heure de Paris, puis expire automatiquement. Il ne peut
          être échangé contre une somme d&rsquo;argent.
        </p>
        <p>
          Les dossiers sont facturés selon un{" "}
          <strong>forfait fixe par dossier</strong>
          {grille ? (
            <>
              , compris entre {grille.minLabel} et {grille.maxLabel}
            </>
          ) : null}
          . Le palier est déterminé d&rsquo;après le montant de l&rsquo;aide
          estimée par le service au moment de la commande. Le prix net affiché
          avant paiement, après application des réductions et crédits éventuels,
          est le prix contractuel. Dossimo ne prélève jamais de pourcentage sur
          l&rsquo;aide ou la prime.
        </p>
        {grille && grille.paliers.length > 0 ? (
          <div className="rounded border border-filigrane bg-blanc-casse px-5 py-2">
            <LegalRow label="Forfaits en vigueur">
              {grille.paliers.join(" · ")}
            </LegalRow>
            <LegalRow label="Détermination">
              Palier calculé selon l&rsquo;aide estimée du dossier
            </LegalRow>
          </div>
        ) : null}
        <p>
          Les prix sont exprimés en euros. Dossimo bénéficiant actuellement de
          la franchise en base de TVA, les montants affichés sont nets de TVA et
          la facture porte la mention «&nbsp;{editeur.tva.mention}&nbsp;». Toute
          évolution du régime de TVA s&rsquo;appliquera uniquement aux commandes
          postérieures à son entrée en vigueur.
        </p>
      </LegalSection>

      <LegalSection titre="5. Réductions, parrainage et crédits">
        <p>
          Lorsqu&rsquo;un code de parrainage valide est enregistré avant tout
          dossier payé, le filleul bénéficie d&rsquo;une remise de 30&nbsp;€ sur
          son premier dossier payant. Un seul parrainage est admis par filleul ;
          l&rsquo;auto-parrainage et le cumul de plusieurs codes sont exclus.
        </p>
        <p>
          Après le premier dossier payé du filleul, le parrain reçoit un crédit de
          50&nbsp;€, dans la limite de trois récompenses sur une période glissante
          de 90 jours. Chaque crédit est valable douze mois à compter de son
          émission. Les crédits sont utilisables uniquement sur les prestations
          Dossimo, peuvent être cumulés dans la limite du prix du dossier, ne sont
          ni remboursables, ni cessibles, ni convertibles en argent. Les crédits
          arrivant le plus tôt à expiration sont consommés en priorité.
        </p>
        <p>
          Les conditions d&rsquo;une autre offre promotionnelle sont celles
          affichées lors de la commande. Sauf mention contraire, les réductions
          ne sont pas cumulables entre elles.
        </p>
      </LegalSection>

      <LegalSection titre="6. Paiement et facturation">
        <p>
          Le règlement est exigible comptant à la commande, par carte bancaire
          via {editeur.paiement.nom}. Dossimo ne reçoit ni ne conserve les données
          complètes de la carte. Une facture est émise après confirmation du
          paiement et reste accessible dans l&rsquo;espace du Client.
        </p>
        <div className="rounded border border-filigrane bg-blanc-casse px-5 py-2">
          <LegalRow label="Échéance">Paiement comptant à la commande</LegalRow>
          <LegalRow label="Escompte">{editeur.reglement.escompte}</LegalRow>
          <LegalRow label="Retard">{editeur.reglement.penalites}</LegalRow>
          <LegalRow label="Recouvrement">{editeur.reglement.indemnite}</LegalRow>
        </div>
        <p>
          Les pénalités de retard et l&rsquo;indemnité de recouvrement ne trouvent
          à s&rsquo;appliquer qu&rsquo;à une somme devenue exigible et demeurée
          impayée. Les frais de recouvrement supérieurs à l&rsquo;indemnité
          forfaitaire peuvent donner lieu à une indemnisation complémentaire sur
          justificatifs.
        </p>
      </LegalSection>

      <LegalSection titre="7. Livraison et vérification">
        <p>
          Le dossier et ses livrables disponibles sont débloqués dans
          l&rsquo;espace du Client après confirmation du paiement. Certains documents dépendent du type de
          travaux, des données saisies et des modèles réglementaires disponibles ;
          l&rsquo;interface indique les éléments effectivement générables avant la
          commande.
        </p>
        <p>
          Le Client doit contrôler les livrables avant tout dépôt, notamment les
          identités, montants, dates, références techniques et coordonnées. Toute
          anomalie doit être signalée à{" "}
          <a href={"mailto:" + editeur.emailContact} className={lien}>
            {editeur.emailContact}
          </a>{" "}
          en identifiant le dossier concerné.
        </p>
      </LegalSection>

      <LegalSection titre="8. Obligations du Client">
        <p>Le Client s&rsquo;engage à&nbsp;:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>fournir des informations et pièces exactes, complètes et à jour ;</li>
          <li>
            disposer d&rsquo;une base légale pour transmettre les données et
            documents du bénéficiaire ;
          </li>
          <li>
            vérifier les documents générés, respecter la chronologie des travaux
            et accomplir lui-même les formalités auprès des organismes compétents ;
          </li>
          <li>
            ne pas détourner le service, contourner ses protections ou déposer
            des contenus illicites, malveillants ou portant atteinte aux droits de
            tiers.
          </li>
        </ul>
      </LegalSection>

      <LegalSection titre="9. Nature des contrôles et absence de garantie d’acceptation">
        <p>
          Dossimo est tenu d&rsquo;une obligation de moyens. Ses estimations et
          contrôles reposent sur les données communiquées, les règles intégrées au
          service et les informations réglementaires disponibles à la date du
          contrôle. Ils constituent une aide opérationnelle et non une décision
          administrative, une certification, ni un conseil juridique ou fiscal.
        </p>
        <p>
          L&rsquo;organisme instructeur reste seul compétent pour apprécier
          l&rsquo;éligibilité, demander des pièces et accepter ou refuser un
          dossier. Dossimo ne garantit donc ni l&rsquo;obtention, ni le montant,
          ni le délai de versement d&rsquo;une aide.
        </p>
      </LegalSection>

      <LegalSection titre="10. Réclamation et remboursement">
        <p>
          Une commande non payée peut être abandonnée sans frais. Après paiement,
          le service numérique est exécuté sans délai par le déblocage du dossier.
          Le Client professionnel ne bénéficie pas du droit de rétractation réservé
          aux consommateurs pour un contrat conclu à distance.
        </p>
        <p>
          Si, du fait de Dossimo, le dossier payé ne peut pas être débloqué ou si
          la prestation livrée ne correspond pas à la commande, le Client doit
          adresser une réclamation circonstanciée à{" "}
          <a href={"mailto:" + editeur.emailContact} className={lien}>
            {editeur.emailContact}
          </a>
          . Dossimo procédera, selon le cas, à la correction, à une nouvelle mise
          à disposition ou au remboursement de la prestation concernée. Cette
          clause ne prive pas le Client des recours impératifs prévus par la loi.
        </p>
      </LegalSection>

      <LegalSection titre="11. Disponibilité, maintenance et force majeure">
        <p>
          Dossimo peut interrompre temporairement le service pour maintenance,
          sécurité ou mise à jour réglementaire. Il s&rsquo;efforce de limiter la
          durée et l&rsquo;impact de ces interruptions. Aucune partie n&rsquo;est
          responsable d&rsquo;un manquement causé par un événement de force majeure
          au sens de l&rsquo;article 1218 du Code civil. Si l&rsquo;empêchement
          définitif porte sur une prestation déjà payée et non livrée, celle-ci
          est remboursée.
        </p>
      </LegalSection>

      <LegalSection titre="12. Responsabilité">
        <p>
          Chaque partie répond des dommages directs et prévisibles causés par ses
          manquements. Dossimo n&rsquo;est pas responsable d&rsquo;un refus ou
          d&rsquo;une perte d&rsquo;aide imputable à des données erronées, à une
          pièce absente, à une modification du projet après le contrôle, au
          non-respect des formalités par le Client ou à la décision de
          l&rsquo;organisme instructeur.
        </p>
        <p>
          Dans les limites permises par la loi, la responsabilité totale de Dossimo
          au titre d&rsquo;un dossier est plafonnée au montant effectivement payé
          pour ce dossier. Ce plafond ne s&rsquo;applique pas en cas de dommage
          corporel, de faute lourde ou dolosive, ni lorsqu&rsquo;une règle impérative
          interdit une telle limitation.
        </p>
      </LegalSection>

      <LegalSection titre="13. Propriété intellectuelle">
        <p>
          Le Client conserve ses droits sur les données et pièces qu&rsquo;il
          transmet. Il accorde à Dossimo, pour la durée nécessaire à la prestation,
          le droit de les héberger, les reproduire et les traiter aux seules fins
          de fournir le service.
        </p>
        <p>
          Dossimo et ses éléments propres — marque, interface, modèles, textes,
          méthodes et logiciels — restent la propriété de l&rsquo;éditeur ou de
          ses concédants. Le Client peut utiliser et remettre les livrables générés
          pour les besoins des dossiers auxquels ils se rapportent ; aucun droit
          sur la technologie ou les modèles sources ne lui est cédé.
        </p>
      </LegalSection>

      <LegalSection titre="14. Données personnelles">
        <p>
          Les traitements relatifs au compte, à la facturation et au fonctionnement
          du service sont décrits dans la{" "}
          <Link href="/confidentialite" className={lien}>
            politique de confidentialité
          </Link>
          . Pour les données de bénéficiaires que le Client confie à Dossimo afin
          de préparer un dossier, le Client demeure responsable de la licéité de
          leur collecte et de leur transmission.
        </p>
      </LegalSection>

      <LegalSection titre="15. Durée, suspension et fermeture du compte">
        <p>
          Le compte est ouvert pour une durée indéterminée, sans abonnement imposé.
          Le Client peut demander sa fermeture à tout moment, sous réserve des
          obligations légales de conservation. Dossimo peut suspendre un compte en
          cas de risque de sécurité, d&rsquo;usage illicite, de fraude ou de
          manquement grave aux présentes CGV, après information du Client lorsque
          les circonstances le permettent.
        </p>
        <p>
          La fermeture du compte n&rsquo;annule pas les commandes déjà exécutées et
          n&rsquo;entraîne ni remboursement des crédits promotionnels, ni conversion
          de leur solde en argent. Le Client est invité à télécharger ses factures
          et livrables avant la fermeture effective.
        </p>
      </LegalSection>

      <LegalSection titre="16. Modification des CGV">
        <p>
          Les CGV applicables à une commande sont celles présentées au Client au
          moment où il la passe. Dossimo peut modifier les présentes conditions
          pour les commandes futures, notamment afin de faire évoluer le service
          ou de respecter une modification légale. La date de mise à jour figure
          en tête du document. Une modification ne remet pas en cause le prix
          d&rsquo;une commande déjà payée.
        </p>
      </LegalSection>

      <LegalSection titre="17. Droit applicable et règlement des litiges">
        <p>
          Les présentes CGV sont soumises au droit français. Avant toute action,
          les parties s&rsquo;efforcent de résoudre leur différend à l&rsquo;amiable.
          Toute réclamation peut être adressée à{" "}
          <a href={"mailto:" + editeur.emailContact} className={lien}>
            {editeur.emailContact}
          </a>
          .
        </p>
        <p className="rounded border border-encre/20 bg-blanc-casse p-4 font-medium text-encre">
          À défaut d&rsquo;accord amiable, le litige est porté devant la juridiction
          matériellement et territorialement compétente selon les règles de droit
          commun. Si le Client et Dossimo ont tous deux contracté en qualité de
          commerçant, compétence expresse est attribuée aux tribunaux du ressort
          du siège de Dossimo, y compris en cas de pluralité de défendeurs ou
          d&rsquo;appel en garantie.
        </p>
      </LegalSection>

      <LegalSection titre="18. Dispositions finales">
        <p>
          Si une clause est déclarée nulle ou inapplicable, les autres clauses
          restent en vigueur. Le fait de ne pas se prévaloir immédiatement d&rsquo;un
          droit ne vaut pas renonciation. Les titres facilitent la lecture et
          n&rsquo;affectent pas l&rsquo;interprétation des CGV.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
