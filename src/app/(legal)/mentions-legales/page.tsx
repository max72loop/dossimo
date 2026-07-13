import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalDoc,
  LegalRow,
  LegalSection,
} from "@/components/legal/legal-doc";
import { editeur, derniereMajLegale } from "@/lib/legal/editeur";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Identité de l’éditeur, direction de la publication, hébergement et informations légales du service Dossimo.",
};

const lien = "text-tampon underline-offset-4 hover:underline";

export default function MentionsLegalesPage() {
  return (
    <LegalDoc
      titre="Mentions légales"
      maj={derniereMajLegale}
      intro="Les présentes mentions identifient l’éditeur et les prestataires techniques du site dossimo.fr, conformément aux règles applicables aux services en ligne professionnels."
    >
      <LegalSection titre="1. Éditeur du site">
        <p>
          Le site accessible à l&rsquo;adresse{" "}
          <a
            href={editeur.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={lien}
          >
            {editeur.domaine}
          </a>{" "}
          est édité par&nbsp;:
        </p>
        <div className="mt-2 rounded border border-filigrane bg-blanc-casse px-5 py-2">
          <LegalRow label="Entrepreneur">{editeur.raisonSociale}</LegalRow>
          <LegalRow label="Nom commercial">{editeur.nomCommercial}</LegalRow>
          <LegalRow label="Forme juridique">{editeur.formeJuridique}</LegalRow>
          <LegalRow label="Adresse professionnelle">
            {editeur.adresse}
          </LegalRow>
          <LegalRow label="Immatriculation">
            Registre national des entreprises (RNE)
          </LegalRow>
          <LegalRow label="SIREN">{editeur.rne}</LegalRow>
          <LegalRow label="SIRET (siège)">{editeur.siret}</LegalRow>
          {editeur.rcs ? <LegalRow label="RCS">{editeur.rcs}</LegalRow> : null}
          {editeur.tvaIntracom ? (
            <LegalRow label="TVA intracommunautaire">
              {editeur.tvaIntracom}
            </LegalRow>
          ) : (
            <LegalRow label="TVA">{editeur.tva.mention}</LegalRow>
          )}
          <LegalRow label="Courriel">
            <a
              href={"mailto:" + editeur.emailContact}
              className={lien}
            >
              {editeur.emailContact}
            </a>
          </LegalRow>
          {editeur.telephone ? (
            <LegalRow label="Téléphone">
              <a href={"tel:" + editeur.telephone.replace(/\s/g, "")} className={lien}>
                {editeur.telephone}
              </a>
            </LegalRow>
          ) : null}
        </div>
      </LegalSection>

      <LegalSection titre="2. Direction de la publication">
        <p>
          Le directeur de la publication est {editeur.directeurPublication}, en
          qualité d&rsquo;entrepreneur individuel et responsable de l&rsquo;édition
          du service.
        </p>
      </LegalSection>

      <LegalSection titre="3. Hébergement du site">
        <div className="rounded border border-filigrane bg-blanc-casse px-5 py-2">
          <LegalRow label="Hébergeur">{editeur.hebergeur.nom}</LegalRow>
          <LegalRow label="Adresse">{editeur.hebergeur.adresse}</LegalRow>
          {editeur.hebergeur.telephone ? (
            <LegalRow label="Téléphone">
              {editeur.hebergeur.telephone}
            </LegalRow>
          ) : null}
          <LegalRow label="Contact">
            <a
              href={"mailto:" + editeur.hebergeur.contact}
              className={lien}
            >
              {editeur.hebergeur.contact}
            </a>
          </LegalRow>
          <LegalRow label="Site">
            <a
              href={editeur.hebergeur.site}
              target="_blank"
              rel="noopener noreferrer"
              className={lien}
            >
              {editeur.hebergeur.site}
            </a>
          </LegalRow>
        </div>
      </LegalSection>

      <LegalSection titre="4. Prestataires techniques">
        <p>
          Outre l&rsquo;hébergeur du site, Dossimo fait appel aux prestataires
          techniques suivants pour fournir le service&nbsp;:
        </p>
        <div className="rounded border border-filigrane bg-blanc-casse px-5 py-2">
          <LegalRow label={editeur.baseDeDonnees.nom}>
            {editeur.baseDeDonnees.role} —{" "}
            <a
              href={editeur.baseDeDonnees.site}
              target="_blank"
              rel="noopener noreferrer"
              className={lien}
            >
              {editeur.baseDeDonnees.site}
            </a>
          </LegalRow>
          <LegalRow label={editeur.paiement.nom}>
            {editeur.paiement.role} —{" "}
            <a
              href={editeur.paiement.site}
              target="_blank"
              rel="noopener noreferrer"
              className={lien}
            >
              {editeur.paiement.site}
            </a>
          </LegalRow>
        </div>
        <p>
          Le rôle de ces prestataires, les catégories de données traitées et les
          éventuels transferts hors de l&rsquo;Union européenne sont détaillés
          dans la{" "}
          <Link href="/confidentialite" className={lien}>
            politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection titre="5. Nature et indépendance du service">
        <p>
          Dossimo est un service professionnel d&rsquo;aide à la préparation et
          au contrôle de dossiers MaPrimeRénov&rsquo; et CEE (Certificats
          d&rsquo;Économies d&rsquo;Énergie). Il propose notamment des contrôles
          de cohérence, des estimations indicatives et la génération de documents
          préparatoires à partir des informations transmises par l&rsquo;artisan.
        </p>
        <p>
          Dossimo est un service privé et indépendant. Il{" "}
          <strong>n&rsquo;est affilié</strong> ni à l&rsquo;Anah, ni à France
          Rénov&rsquo;, ni à un obligé CEE, ni à un organisme public. Dossimo
          n&rsquo;agit pas comme mandataire, ne dépose pas les dossiers auprès des
          organismes instructeurs et ne perçoit aucune prime pour le compte de
          l&rsquo;artisan ou du bénéficiaire.
        </p>
        <p>
          Les conditions contractuelles applicables aux prestations payantes sont
          consultables dans les{" "}
          <Link href="/cgv" className={lien}>
            conditions générales de vente
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection titre="6. Propriété intellectuelle">
        <p>
          La marque Dossimo, le logo, la charte graphique, les textes,
          illustrations, interfaces, modèles, logiciels et plus généralement les
          éléments propres au site sont protégés par le droit de la propriété
          intellectuelle. Sauf autorisation écrite ou exception légale, leur
          reproduction, représentation, adaptation ou exploitation, totale ou
          partielle, est interdite.
        </p>
        <p>
          Les marques, dénominations, formulaires et contenus appartenant à des
          tiers restent la propriété de leurs titulaires respectifs. Leur présence
          sur le site ne crée aucune affiliation, approbation ou partenariat.
          Les droits du Client sur ses données et sur les livrables générés sont
          précisés dans les CGV.
        </p>
      </LegalSection>

      <LegalSection titre="7. Informations publiées et responsabilité">
        <p>
          Dossimo s&rsquo;efforce de maintenir les informations et règles de
          contrôle à jour. Les dispositifs d&rsquo;aide, barèmes, formulaires et
          pratiques des organismes instructeurs peuvent toutefois évoluer. Les
          informations du site ont une finalité opérationnelle et informative ;
          elles ne constituent ni une décision administrative, ni une
          certification, ni un conseil juridique ou fiscal.
        </p>
        <p>
          L&rsquo;utilisateur reste responsable de l&rsquo;exactitude des données
          transmises, de la vérification des documents avant dépôt et du respect
          des démarches applicables à son projet. L&rsquo;organisme instructeur
          demeure seul compétent pour accepter ou refuser un dossier et déterminer
          le montant définitif d&rsquo;une aide.
        </p>
      </LegalSection>

      <LegalSection titre="8. Disponibilité et liens externes">
        <p>
          L&rsquo;éditeur peut interrompre temporairement l&rsquo;accès au site
          pour maintenance, sécurité, correction ou mise à jour. Il met en œuvre
          des moyens raisonnables pour assurer la disponibilité du service, sans
          garantir un accès permanent ou exempt de toute anomalie.
        </p>
        <p>
          Le site peut contenir des liens vers des services ou sources externes.
          Dossimo ne contrôle pas leur disponibilité, leur contenu ni leurs
          pratiques et ne saurait être considéré comme leur éditeur. L&rsquo;ajout
          d&rsquo;un lien n&rsquo;implique aucune approbation de la ressource
          concernée.
        </p>
      </LegalSection>

      <LegalSection titre="9. Données personnelles et cookies">
        <p>
          Les modalités de collecte, d&rsquo;utilisation, de conservation et de
          protection des données personnelles, ainsi que les droits des personnes,
          sont détaillées dans la{" "}
          <Link href="/confidentialite" className={lien}>
            politique de confidentialité
          </Link>
          . Toute demande relative aux données personnelles peut être adressée à{" "}
          <a href={"mailto:" + editeur.emailRgpd} className={lien}>
            {editeur.emailRgpd}
          </a>
          .
        </p>
        <p>
          Le site utilise uniquement les cookies techniques nécessaires à
          l&rsquo;authentification, à la sécurité et au fonctionnement du service.
          Aucun cookie publicitaire ou de mesure d&rsquo;audience nécessitant un
          consentement n&rsquo;est actuellement déposé.
        </p>
      </LegalSection>

      <LegalSection titre="10. Contact et signalement">
        <p>
          Pour toute question sur le site, demande de correction ou signalement
          d&rsquo;un contenu ou d&rsquo;une vulnérabilité, écrivez à{" "}
          <a href={"mailto:" + editeur.emailContact} className={lien}>
            {editeur.emailContact}
          </a>
          . Afin de permettre un traitement rapide, la demande doit identifier
          précisément la page, le contenu ou le comportement concerné.
        </p>
      </LegalSection>

      <LegalSection titre="11. Droit applicable">
        <p>
          Le site et les présentes mentions légales sont soumis au droit français.
          Les règles de règlement des litiges relatifs à une prestation Dossimo
          figurent dans les{" "}
          <Link href="/cgv" className={lien}>
            conditions générales de vente
          </Link>
          .
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
