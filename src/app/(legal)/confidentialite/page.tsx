import type { Metadata } from "next";

import { LegalDoc, LegalSection } from "@/components/legal/legal-doc";
import { editeur, derniereMajLegale } from "@/lib/legal/editeur";
import { publicMetadata } from "@/lib/seo/site";

export const metadata: Metadata = publicMetadata({
  path: "/confidentialite",
  title: "Politique de confidentialité",
  description: "Comment Dossimo collecte, utilise et protège les données personnelles, conformément au RGPD.",
});

export default function ConfidentialitePage() {
  return (
    <LegalDoc
      titre="Politique de confidentialité"
      maj={derniereMajLegale}
      intro="Dossimo traite des données personnelles dans le respect du Règlement général sur la protection des données (RGPD) et de la loi Informatique et Libertés."
    >
      <LegalSection titre="Responsable de traitement">
        <p>
          Le responsable du traitement est {editeur.raisonSociale} (
          {editeur.nomCommercial}), éditeur du site {editeur.domaine}. Pour toute
          question relative à vos données&nbsp;:{" "}
          <a
            href={`mailto:${editeur.emailRgpd}`}
            className="text-tampon underline-offset-4 hover:underline"
          >
            {editeur.emailRgpd}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection titre="Données collectées">
        <p>Dossimo collecte&nbsp;:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Données de compte de l&rsquo;artisan</strong>&nbsp;: nom,
            prénom, e-mail, téléphone, entreprise, SIRET, qualification RGE,
            ville.
          </li>
          <li>
            <strong>Données des dossiers</strong>&nbsp;: informations du chantier,
            du logement et du bénéficiaire (identité, adresse, revenus le cas
            échéant), montants, dates, caractéristiques techniques, pièces
            justificatives déposées (devis, factures).
          </li>
          <li>
            <strong>Données de prospect (formulaire de contact)</strong>&nbsp;:
            coordonnées transmises volontairement pour être recontacté.
          </li>
          <li>
            <strong>Données de paiement</strong>&nbsp;: traitées directement par
            Stripe. Dossimo ne stocke aucune donnée de carte bancaire.
          </li>
        </ul>
        <p>
          Les données de bénéficiaires sont saisies par l&rsquo;artisan, qui
          s&rsquo;engage à disposer du consentement ou de la base légale
          nécessaire pour les transmettre.
        </p>
      </LegalSection>

      <LegalSection titre="Finalités et bases légales">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Fourniture du service (préparation et contrôle des dossiers)&nbsp;:{" "}
            <em>exécution du contrat</em>.
          </li>
          <li>
            Gestion des comptes, de la facturation et du support&nbsp;:{" "}
            <em>exécution du contrat</em> et <em>obligation légale</em> (comptable).
          </li>
          <li>
            Réponse aux demandes via le formulaire de contact&nbsp;:{" "}
            <em>intérêt légitime</em> / <em>mesures précontractuelles</em>.
          </li>
          <li>
            Amélioration et sécurité du service&nbsp;: <em>intérêt légitime</em>.
          </li>
        </ul>
      </LegalSection>

      <LegalSection titre="Destinataires et sous-traitants">
        <p>
          Les données ne sont jamais vendues. Elles sont accessibles à
          l&rsquo;équipe Dossimo et à des sous-traitants agissant sur
          instruction&nbsp;:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>{editeur.hebergeur.nom}</strong> — hébergement du site.
          </li>
          <li>
            <strong>{editeur.baseDeDonnees.nom}</strong> —{" "}
            {editeur.baseDeDonnees.role.toLowerCase()}.
          </li>
          <li>
            <strong>{editeur.paiement.nom}</strong> —{" "}
            {editeur.paiement.role.toLowerCase()}.
          </li>
          <li>
            <strong>OpenRouter et le fournisseur du modèle d&apos;analyse sélectionné</strong>
            {" "}— lecture ponctuelle des devis, factures et avis d&apos;imposition,
            uniquement pour en extraire les informations nécessaires au contrôle.
          </li>
        </ul>
        <p>
          Certains sous-traitants peuvent héberger des données hors Union
          européenne&nbsp;; le cas échéant, les transferts sont encadrés par les
          clauses contractuelles types de la Commission européenne.
        </p>
      </LegalSection>

      <LegalSection titre="Durée de conservation">
        <p>
          Les données de dossier sont conservées le temps de la relation
          contractuelle, puis archivées pour la durée légale applicable
          (notamment obligations comptables et pièces justificatives des
          dispositifs d&rsquo;aide). Les données de prospect sont conservées au
          maximum trois ans à compter du dernier contact.
        </p>
      </LegalSection>

      <LegalSection titre="Vos droits">
        <p>
          Conformément au RGPD, vous disposez d&rsquo;un droit d&rsquo;accès, de
          rectification, d&rsquo;effacement, de limitation, d&rsquo;opposition et de
          portabilité. Vous pouvez les exercer à tout moment en écrivant à{" "}
          <a
            href={`mailto:${editeur.emailRgpd}`}
            className="text-tampon underline-offset-4 hover:underline"
          >
            {editeur.emailRgpd}
          </a>
          . Vous pouvez également introduire une réclamation auprès de la CNIL
          (www.cnil.fr).
        </p>
      </LegalSection>

      <LegalSection titre="Cookies">
        <p>
          Dossimo utilise uniquement les cookies strictement nécessaires au
          fonctionnement du service (session, authentification, sécurité). Ces
          cookies ne requièrent pas de consentement préalable. Aucun cookie
          publicitaire ni traceur tiers de suivi n&rsquo;est déposé sans votre
          accord.
        </p>
      </LegalSection>

      <LegalSection titre="Sécurité">
        <p>
          Dossimo met en œuvre des mesures techniques et organisationnelles
          appropriées pour protéger les données&nbsp;: chiffrement des échanges,
          contrôle d&rsquo;accès, hébergement sur des infrastructures sécurisées.
        </p>
      </LegalSection>
      <LegalSection titre="Analyse documentaire assistée">
        <p>
          Lorsqu&apos;elle est activée, l&apos;analyse assistée transmet une copie du document
          concerné à notre prestataire d&apos;IA afin d&apos;en relever les seules informations
          utiles au contrôle. Le résultat est toujours confronté à des règles
          déterministes et reste à vérifier par l&apos;artisan avant dépôt. Les pièces
          d&apos;identité et RIB ne sont pas soumis à cette analyse.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
