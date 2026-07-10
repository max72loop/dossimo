import type { Metadata } from "next";

import {
  LegalDoc,
  LegalRow,
  LegalSection,
} from "@/components/legal/legal-doc";
import { editeur, derniereMajLegale } from "@/lib/legal/editeur";

export const metadata: Metadata = {
  title: "Mentions légales · Dossimo",
  description:
    "Identité de l'éditeur, hébergeur et informations légales du service Dossimo.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalDoc titre="Mentions légales" maj={derniereMajLegale}>
      <LegalSection titre="Éditeur du site">
        <p>
          Le site {editeur.domaine} est édité par&nbsp;:
        </p>
        <div className="mt-2 rounded border border-filigrane bg-blanc-casse px-5 py-2">
          <LegalRow label="Raison sociale">{editeur.raisonSociale}</LegalRow>
          <LegalRow label="Forme juridique">{editeur.formeJuridique}</LegalRow>
          <LegalRow label="Siège social">{editeur.adresse}</LegalRow>
          <LegalRow label="SIREN">{editeur.siren}</LegalRow>
          <LegalRow label="SIRET (siège)">{editeur.siret}</LegalRow>
          {/* Mentions non universelles : une entreprise individuelle de
              prestation de services intellectuels n'est pas immatriculée au
              RCS, et la franchise en base n'ouvre pas de n° de TVA
              intracommunautaire. On les omet plutôt que d'afficher un vide. */}
          {editeur.rcs && <LegalRow label="RCS">{editeur.rcs}</LegalRow>}
          {editeur.tvaIntracom ? (
            <LegalRow label="TVA intracommunautaire">
              {editeur.tvaIntracom}
            </LegalRow>
          ) : (
            <LegalRow label="TVA">{editeur.tva.mention}</LegalRow>
          )}
          <LegalRow label="Directeur de la publication">
            {editeur.directeurPublication}
          </LegalRow>
          <LegalRow label="Contact">
            <a
              href={`mailto:${editeur.emailContact}`}
              className="text-tampon underline-offset-4 hover:underline"
            >
              {editeur.emailContact}
            </a>
          </LegalRow>
        </div>
      </LegalSection>

      <LegalSection titre="Hébergement">
        <div className="rounded border border-filigrane bg-blanc-casse px-5 py-2">
          <LegalRow label="Hébergeur">{editeur.hebergeur.nom}</LegalRow>
          <LegalRow label="Adresse">{editeur.hebergeur.adresse}</LegalRow>
          <LegalRow label="Site">
            <a
              href={editeur.hebergeur.site}
              target="_blank"
              rel="noopener noreferrer"
              className="text-tampon underline-offset-4 hover:underline"
            >
              {editeur.hebergeur.site}
            </a>
          </LegalRow>
        </div>
        <p>
          Les données et documents des dossiers sont stockés via{" "}
          {editeur.baseDeDonnees.nom} ({editeur.baseDeDonnees.role}). Les
          paiements sont traités par {editeur.paiement.nom} (
          {editeur.paiement.role}). Voir la{" "}
          <a
            href="/confidentialite"
            className="text-tampon underline-offset-4 hover:underline"
          >
            politique de confidentialité
          </a>{" "}
          pour le détail des traitements.
        </p>
      </LegalSection>

      <LegalSection titre="Nature du service">
        <p>
          Dossimo est un service indépendant d&rsquo;aide à la préparation de
          dossiers MaPrimeRénov&rsquo; et CEE (Certificats d&rsquo;Économies
          d&rsquo;Énergie). Dossimo <strong>n&rsquo;est pas affilié</strong> à
          l&rsquo;Anah, à France Rénov&rsquo; ni à aucun organisme public.
        </p>
        <p>
          Dossimo <strong>ne dépose jamais</strong> le dossier auprès des
          organismes instructeurs et <strong>ne perçoit jamais</strong> la
          prime&nbsp;: l&rsquo;artisan et son client déposent eux-mêmes leur
          dossier et conservent l&rsquo;intégralité de la prime. Le dépôt sur{" "}
          maprimerenov.gouv.fr est réservé aux mandataires habilités par
          l&rsquo;Anah, un rôle que Dossimo n&rsquo;endosse pas.
        </p>
      </LegalSection>

      <LegalSection titre="Propriété intellectuelle">
        <p>
          L&rsquo;ensemble des éléments du site (marque, logo, textes, interface,
          documents générés hors données saisies par l&rsquo;artisan) est protégé
          par le droit de la propriété intellectuelle et demeure la propriété de
          l&rsquo;éditeur. Toute reproduction ou représentation, totale ou
          partielle, sans autorisation écrite est interdite.
        </p>
        <p>
          Les données saisies par l&rsquo;artisan et les documents finaux
          restituant ces données lui appartiennent&nbsp;; il en dispose
          librement.
        </p>
      </LegalSection>

      <LegalSection titre="Responsabilité">
        <p>
          Dossimo met en œuvre les moyens raisonnables pour assurer
          l&rsquo;exactitude des contrôles de conformité et des documents générés,
          sans pouvoir garantir l&rsquo;acceptation d&rsquo;un dossier par
          l&rsquo;organisme instructeur, qui reste seul décisionnaire. La
          responsabilité de la véracité des informations saisies incombe à
          l&rsquo;artisan.
        </p>
      </LegalSection>

      <LegalSection titre="Droit applicable">
        <p>
          Les présentes mentions sont régies par le droit français. Pour toute
          question, contactez{" "}
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
