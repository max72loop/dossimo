"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createDossierCeeIsolation } from "@/lib/dossier/actions";
import { verifierSiretRge } from "@/lib/dossier/verification-actions";
import { uploadPiece } from "@/lib/piece/actions";
import type { VerificationEntreprise } from "@/lib/verification/types";
import {
  LOGEMENT_TYPES,
  OCCUPATIONS,
  PRECARITES,
  RESIDENCES,
  TYPES_ISOLATION,
  ceeIsolationDefaults,
  ceeIsolationSchema,
  type CeeIsolationInput,
} from "@/lib/dossier/cee-isolation";
import { AssistedFieldsProvider, Section, SelectField, TextField } from "@/components/dossier/fields";
import { OverlayProgression, type EtatEtape } from "@/components/ui/overlay-progression";
import { Spinner } from "@/components/ui/spinner";
import { clearGuestDraft } from "@/lib/dossier/guest-draft";
import { etapesPourSaisie } from "@/lib/dossier/form-steps";

const isolationOptions = Object.fromEntries(
  Object.entries(TYPES_ISOLATION).map(([k, v]) => [k, `${v.label} · ${v.fiche}`]),
) as Record<string, string>;

type Ton = "ok" | "erreur" | "avert" | "neutre";

const TON_CLASS: Record<Ton, string> = {
  ok: "text-succes",
  erreur: "text-erreur",
  avert: "text-avertissement",
  neutre: "text-ardoise",
};

function LigneStatut({ ton, texte }: { ton: Ton; texte: string }) {
  return (
    <p className={`flex items-start gap-2 text-sm ${TON_CLASS[ton]}`}>
      <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      <span>{texte}</span>
    </p>
  );
}

/** Restitue le résultat de vérification SIRET + RGE sous les champs entreprise. */
function VerifPanel({ v }: { v: VerificationEntreprise }) {
  const nom = v.entreprise.denomination;
  const ent: { ton: Ton; texte: string } = (() => {
    switch (v.entreprise.statut) {
      case "actif":
        return { ton: "ok", texte: `${nom ?? "Établissement"} · actif au répertoire SIRENE` };
      case "ferme":
        return { ton: "erreur", texte: `${nom ?? "Établissement"} fermé au répertoire SIRENE` };
      case "introuvable":
        return { ton: "erreur", texte: "SIRET introuvable au répertoire SIRENE" };
      case "indisponible":
        return { ton: "avert", texte: "Annuaire des entreprises indisponible, réessayez" };
      default:
        return { ton: "neutre", texte: "Vérification du SIRET désactivée" };
    }
  })();

  const q = v.rge.retenue;
  const rge: { ton: Ton; texte: string } = (() => {
    switch (v.rge.statut) {
      case "couvert":
        return {
          ton: "ok",
          texte: q
            ? `Qualification RGE confirmée : ${q.qualification || q.domaine}${q.domaine && q.qualification ? ` (${q.domaine})` : ""}`
            : "Qualification RGE confirmée à l'annuaire officiel",
        };
      case "expire":
        return { ton: "erreur", texte: "Qualification RGE expirée à la date du devis" };
      case "domaine_absent":
        return { ton: "erreur", texte: "Aucune qualification RGE pour ce type de geste" };
      case "aucune":
        return { ton: "erreur", texte: "Aucune qualification RGE trouvée pour ce SIRET" };
      case "indisponible":
        return { ton: "avert", texte: "Annuaire RGE indisponible, réessayez" };
      default:
        return { ton: "neutre", texte: "Vérification RGE désactivée" };
    }
  })();

  return (
    <div className="mt-3 space-y-1.5 rounded border border-filigrane bg-papier p-3">
      {v.mode === "demo" && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-tampon">
          Mode démonstration · vérification simulée
        </p>
      )}
      <LigneStatut ton={ent.ton} texte={ent.texte} />
      <LigneStatut ton={rge.ton} texte={rge.texte} />
    </div>
  );
}

/**
 * Progression de la création, du clic jusqu'à l'affichage du dossier.
 *
 * `controle` couvre la navigation vers `/dossiers/[id]` : le rendu serveur de
 * cette page (moteur de règles, assemblage du pack) prend plusieurs secondes.
 * C'est précisément la fenêtre où `isSubmitting` de react-hook-form est déjà
 * retombé à false alors que rien n'a encore bougé à l'écran. Cet état ne
 * revient jamais à `repos` après un succès : il tient jusqu'au démontage du
 * formulaire par la navigation.
 */
type Phase = "repos" | "enregistrement" | "controle";

function etapesDe(phase: Phase): { label: string; etat: EtatEtape }[] {
  return [
    {
      label: "Vérification RGE et enregistrement de la saisie",
      etat: phase === "enregistrement" ? "en_cours" : "fait",
    },
    {
      label: "Contrôle anti-refus et préparation du pack",
      etat: phase === "controle" ? "en_cours" : "attente",
    },
  ];
}

export function DossierCeeIsolationForm({
  initialValues,
  initialStep = 0,
  assisted = false,
  assistedFields = [],
  initialDocument,
  seuilsIsolation = {},
}: {
  initialValues?: Partial<CeeIsolationInput>;
  initialStep?: number;
  assisted?: boolean;
  /** Noms des champs réellement lus sur le document, hors profil artisan. */
  assistedFields?: string[];
  initialDocument?: File;
  /**
   * R minimal par poste d'isolation, venu de `regles_metier` (source de vérité,
   * éditable dans /admin/regles). Vide = seuil inconnu : l'indication est tue.
   * Ne JAMAIS remettre ces valeurs en dur ici, elles divergeraient du moteur.
   */
  seuilsIsolation?: Record<string, number>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [etape, setEtape] = useState(initialStep);
  const [maxEtape, setMaxEtape] = useState(initialStep);
  const [phase, setPhase] = useState<Phase>("repos");
  const [voirInformationsLues, setVoirInformationsLues] = useState(false);
  const enCours = phase !== "repos";
  const availableValues = Object.fromEntries(
    Object.entries(initialValues ?? {})
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [key, String(value)]),
  );
  const documentValues = Object.fromEntries(
    Object.entries(availableValues).filter(([key]) => assistedFields.includes(key)),
  );
  const etapesActives = etapesPourSaisie(assisted, availableValues);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    setFocus,
    setError,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CeeIsolationInput>({
    resolver: zodResolver(ceeIsolationSchema),
    defaultValues: { ...ceeIsolationDefaults, ...initialValues },
    mode: "onBlur",
  });

  const etapeCourante = etapesActives[etape] ?? etapesActives[0];
  const nbInformationsDisponiblesEtape = etapeCourante.champs.filter((champ) => availableValues[champ]).length;
  const nbInformationsLuesEtape = etapeCourante.champs.filter((champ) => documentValues[champ]).length;
  const nbInformationsProfilEtape = nbInformationsDisponiblesEtape - nbInformationsLuesEtape;
  const dernier = etape === etapesActives.length - 1;
  const typeIsolation = useWatch({ control, name: "type_isolation" });
  const rMin = typeIsolation ? seuilsIsolation[typeIsolation] : undefined;
  const dispositif = useWatch({ control, name: "dispositif" });
  const geste = useWatch({ control, name: "geste" });
  const estPac = geste === "pac_air_eau";
  const estCet = geste === "cet";
  const estBois = geste === "bois";

  // Vérification SIRET + RGE contre les annuaires officiels (à la demande).
  const [verif, setVerif] = useState<VerificationEntreprise | null>(null);
  const [verifLoading, setVerifLoading] = useState(false);
  const [verifError, setVerifError] = useState<string | null>(null);

  async function verifierEntrepriseSaisie() {
    setVerifError(null);
    setVerif(null);
    setVerifLoading(true);
    const res = await verifierSiretRge({
      siret: getValues("siret") ?? "",
      geste: getValues("geste") ?? "isolation",
      dateDevis: getValues("date_devis") || null,
    });
    setVerifLoading(false);
    if (!res.ok) {
      setVerifError(res.error);
      return;
    }
    const v = res.verification;
    setVerif(v);
    // Préremplissage depuis les données officielles : le fictif devient
    // impossible à saisir puisque les champs viennent de l'annuaire.
    if (v.entreprise.denomination) {
      setValue("entreprise", v.entreprise.denomination, { shouldValidate: true });
    }
    const q = v.rge.retenue ?? v.rge.qualifications[0];
    if (q) {
      setValue("rge_numero", q.numero, { shouldValidate: true });
      setValue("rge_domaine", q.qualification || q.domaine, { shouldValidate: true });
      if (q.date_debut) setValue("rge_date_debut", q.date_debut, { shouldValidate: true });
      if (q.date_fin) setValue("rge_date_fin", q.date_fin, { shouldValidate: true });
    }
  }

  async function suivant() {
    const ok = await trigger(etapeCourante.champs, { shouldFocus: true });
    if (!ok) {
      // Une valeur préremplie peut elle aussi être invalide. Dans ce cas elle ne
      // doit jamais rester cachée : le champ concerné est révélé, rougi et focalisé.
      setVoirInformationsLues(true);
      window.setTimeout(() => {
        const premierInvalide = etapeCourante.champs.find((champ) =>
          document.querySelector(`[name="${champ}"][aria-invalid="true"]`),
        );
        if (premierInvalide) setFocus(premierInvalide);
      }, 0);
      return;
    }
    const n = Math.min(etape + 1, etapesActives.length - 1);
    setEtape(n);
    setMaxEtape((m) => Math.max(m, n));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function aller(i: number) {
    if (i <= maxEtape) setEtape(i);
  }

  async function onSubmit(values: CeeIsolationInput) {
    if (enCours) return; // Un envoi déjà en vol : ne jamais en créer un second.
    setServerError(null);
    setPhase("enregistrement");
    const result = await createDossierCeeIsolation(values);
    if (result.ok) {
      const parrain =
        result.referral === "applied"
          ? "?parrain=ok"
          : result.referral === "failed"
            ? "?parrain=ko"
            : "";
      // Pas de retour à `repos` : la navigation qui suit est lente, le voile
      // doit rester jusqu'à ce que la page dossier prenne la main.
      setPhase("controle");
      if (initialDocument) {
        const documentData = new FormData();
        documentData.append("file", initialDocument);
        // Best-effort : le dossier existe même si le réseau coupe pendant l'envoi.
        // La page résultat indiquera alors simplement que le devis reste à ajouter.
        await uploadPiece(result.dossierId, "devis", documentData).catch(() => null);
      }
      await clearGuestDraft();
      router.push(`/dossiers/${result.dossierId}${parrain}`);
      return;
    }
    setPhase("repos");
    setServerError(result.error);
    if (result.fieldErrors) {
      for (const [name, messages] of Object.entries(result.fieldErrors)) {
        if (messages?.[0]) {
          setError(name as keyof CeeIsolationInput, { type: "server", message: messages[0] });
        }
      }
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (enCours) {
      // « Entrée » pendant la création rejouerait la soumission.
      if (e.key === "Enter") e.preventDefault();
      return;
    }
    // Sur les étapes intermédiaires, « Entrée » passe à la suivante (pas de submit).
    const cible = e.target as HTMLElement;
    if (e.key === "Enter" && !dernier && cible.tagName !== "TEXTAREA") {
      e.preventDefault();
      void suivant();
    }
  }

  return (
    <AssistedFieldsProvider values={assisted ? availableValues : {}} hideConfirmed={assisted && !voirInformationsLues}>
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={onKeyDown}
      className="pb-16"
      aria-busy={enCours}
      noValidate
    >
      <OverlayProgression
        ouvert={enCours}
        titre="Création du dossier"
        description="Quelques secondes : les pièces sont générées depuis votre saisie unique."
        etapes={etapesDe(phase)}
      />
      {/* Progression */}
      <div className="mb-8">
        {assisted && (
          <p className="mb-4 rounded border-l-4 border-tampon bg-info-bg px-4 py-3 text-sm text-encre">
            <strong>Dossimo vous montre seulement ce qui manque.</strong> Les informations lues sur votre devis ou votre profil sont conservées et masquées pour alléger la saisie.
          </p>
        )}
        {assisted && nbInformationsDisponiblesEtape > 0 && (
          <button type="button" onClick={() => setVoirInformationsLues((visible) => !visible)} className="mb-4 text-sm font-semibold text-tampon underline underline-offset-2">
            {voirInformationsLues
              ? "Masquer les informations déjà disponibles à cette étape"
              : `Voir ou corriger ${nbInformationsDisponiblesEtape === 1 ? "l’information" : `les ${nbInformationsDisponiblesEtape} informations`} disponible${nbInformationsDisponiblesEtape > 1 ? "s" : ""} à cette étape (${nbInformationsLuesEtape} lue${nbInformationsLuesEtape === 1 ? "" : "s"} sur le devis${nbInformationsProfilEtape > 0 ? `, ${nbInformationsProfilEtape} reprise${nbInformationsProfilEtape > 1 ? "s" : ""} du profil` : ""})`}
          </button>
        )}
        <div className="mb-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {etapesActives.map((s, i) => {
            const fait = i < etape;
            const actif = i === etape;
            const accessible = i <= maxEtape || i === etape + 1;
            return (
              <button
                key={s.titre}
                type="button"
                onClick={() => i === etape + 1 ? void suivant() : aller(i)}
                disabled={!accessible || enCours}
                title={s.titre}
                className={`flex w-full min-w-0 items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                  actif
                    ? "bg-encre text-papier"
                    : fait
                      ? "bg-papier-fonce text-encre hover:bg-filigrane"
                      : "border border-filigrane text-encre-claire"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                    actif ? "bg-papier text-encre" : fait ? "bg-succes text-blanc-casse" : "bg-papier-fonce text-ardoise"
                  }`}
                >
                  {fait ? "✓" : i + 1}
                </span>
                <span className="truncate">{s.titre}</span>
              </button>
            );
          })}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-papier-fonce">
          <div
            className="h-full rounded-full bg-tampon transition-all duration-300"
            style={{ width: `${((etape + 1) / etapesActives.length) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-encre-claire">
          Étape {etape + 1} sur {etapesActives.length}
        </p>
      </div>

      {/* Contenu de l'étape (une partie à la fois) */}
      <div key={etape} className="animate-step">
        {etapeCourante.id === "dispositif" && (
          <Section
            title="Dispositif visé"
            description={
              dispositif === "maprimerenov"
                ? "MaPrimeRénov' · dépôt en ligne par le client sur maprimerenov.gouv.fr. Logement achevé depuis plus de 15 ans. En 2026, l'isolation des murs n'est plus éligible au parcours par geste."
                : "CEE · dossier remis à un obligé. Logement achevé depuis plus de 2 ans."
            }
          >
            <SelectField
              label="Dispositif"
              required
              options={{ cee: "CEE (Certificats d'économies d'énergie)", maprimerenov: "MaPrimeRénov'" }}
              error={errors.dispositif}
              register={register("dispositif")}
            />
            <SelectField
              label="Type de geste"
              required
              options={{ isolation: "Isolation", pac_air_eau: "Pompe à chaleur air/eau", cet: "Chauffe-eau thermodynamique", bois: "Appareil de chauffage au bois" }}
              hint="Détermine les caractéristiques techniques demandées."
              error={errors.geste}
              register={register("geste")}
            />
          </Section>
        )}

        {etapeCourante.id === "entreprise" && (
          <Section
            title="Entreprise (artisan RGE)"
            description="Ces informations alimentent le pack et le contrôle de qualification RGE."
          >
            <TextField label="Raison sociale" required error={errors.entreprise} register={register("entreprise")} />
            <TextField label="SIRET" required placeholder="14 chiffres" inputMode="numeric" error={errors.siret} register={register("siret")} />

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={verifierEntrepriseSaisie}
                disabled={verifLoading}
                className="inline-flex h-10 items-center rounded border border-tampon bg-tampon/5 px-4 text-sm font-medium text-tampon transition-colors hover:bg-tampon/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {verifLoading ? "Vérification…" : "Vérifier l'entreprise et la qualification RGE"}
              </button>
              <p className="mt-1.5 text-xs text-encre-claire">
                Contrôle le SIRET (annuaire SIRENE) et la qualification RGE (annuaire ADEME / France Rénov'),
                puis préremplit les champs ci-dessous depuis les données officielles.
              </p>
              {verifError && (
                <p className="mt-2 text-xs text-erreur">{verifError}</p>
              )}
              {verif && <VerifPanel v={verif} />}
            </div>

            <TextField label="N° de qualification RGE" required error={errors.rge_numero} register={register("rge_numero")} />
            <TextField label="Domaine RGE" required placeholder="Ex. Qualibat 7131 – Isolation thermique" error={errors.rge_domaine} register={register("rge_domaine")} />
            <TextField label="RGE valide à partir du" type="date" error={errors.rge_date_debut} register={register("rge_date_debut")} />
            <TextField label="RGE valide jusqu'au" required type="date" error={errors.rge_date_fin} register={register("rge_date_fin")} />
            <TextField label="Nom du signataire" required error={errors.signataire_nom} register={register("signataire_nom")} />
            <TextField label="Prénom du signataire" required error={errors.signataire_prenom} register={register("signataire_prenom")} />
            <TextField label="Email" required type="email" error={errors.email} register={register("email")} />
            <TextField label="Téléphone" error={errors.telephone} register={register("telephone")} />
            <TextField
              label="Code parrain (facultatif)"
              placeholder="Ex. AB12CD34"
              hint="Reçu d'un autre artisan Dossimo : −30 € sur votre premier dossier."
              error={errors.code_parrain}
              register={register("code_parrain")}
            />
          </Section>
        )}

        {etapeCourante.id === "beneficiaire" && (
          <Section
            title="Bénéficiaire (client)"
            description="Le ménage bénéficiaire des travaux et de la prime."
          >
            <TextField label="Nom" required error={errors.client_nom} register={register("client_nom")} />
            <TextField label="Prénom" required error={errors.client_prenom} register={register("client_prenom")} />
            <TextField label="Adresse du chantier" required error={errors.client_adresse} register={register("client_adresse")} />
            <TextField label="Code postal" required placeholder="5 chiffres" inputMode="numeric" error={errors.client_code_postal} register={register("client_code_postal")} />
            <TextField label="Commune" required error={errors.client_commune} register={register("client_commune")} />
            <TextField label="Email du client" type="email" error={errors.client_email} register={register("client_email")} />
            <TextField label="Téléphone du client" error={errors.client_telephone} register={register("client_telephone")} />
            <SelectField label="Statut d'occupation" required options={OCCUPATIONS} error={errors.occupation} register={register("occupation")} />
            <SelectField label="Catégorie de revenus" required options={PRECARITES} hint="Détermine la bonification (Coup de pouce CEE, profil MaPrimeRénov')." error={errors.precarite} register={register("precarite")} />
          </Section>
        )}

        {etapeCourante.id === "logement" && (
          <Section title="Logement">
            <SelectField label="Type de logement" required options={LOGEMENT_TYPES} error={errors.logement_type} register={register("logement_type")} />
            <TextField label="Année de construction" required type="number" inputMode="numeric" hint={dispositif === "maprimerenov" ? "MaPrimeRénov' : achevé depuis plus de 15 ans." : "CEE : achevé depuis plus de 2 ans."} error={errors.logement_annee_construction} register={register("logement_annee_construction")} />
            <SelectField label="Usage" required options={RESIDENCES} error={errors.logement_residence} register={register("logement_residence")} />
            <TextField label="Surface habitable (m²)" type="number" step="0.01" inputMode="decimal" error={errors.logement_surface_habitable} register={register("logement_surface_habitable")} />
          </Section>
        )}

        {etapeCourante.id === "travaux" && estPac && (
          <Section
            title="Pompe à chaleur air/eau"
            description="Caractéristiques techniques de la PAC (fiche BAR-TH-171)."
          >
            <SelectField
              label="Régime de température"
              required
              options={{ basse: "Basse température", moyenne_haute: "Moyenne / haute température" }}
              hint="Conditionne l'ETAS minimale (basse ≈ 126 %, moyenne/haute ≈ 111 %)."
              error={errors.pac_temperature}
              register={register("pac_temperature")}
            />
            <TextField label="ETAS (%)" required type="number" step="1" inputMode="numeric" hint="Efficacité énergétique saisonnière du chauffage." error={errors.pac_etas} register={register("pac_etas")} />
            <TextField label="Puissance (kW)" required type="number" step="0.1" inputMode="decimal" error={errors.pac_puissance_kw} register={register("pac_puissance_kw")} />
            <TextField label="Marque" required error={errors.pac_marque} register={register("pac_marque")} />
            <TextField label="Référence / modèle" error={errors.pac_reference} register={register("pac_reference")} />
            <TextField label="Classe du régulateur" placeholder="Ex. IV à VIII" hint="Un régulateur de classe IV à VIII est requis." error={errors.pac_regulateur_classe} register={register("pac_regulateur_classe")} />
          </Section>
        )}

        {etapeCourante.id === "travaux" && estCet && (
          <Section
            title="Chauffe-eau thermodynamique"
            description="Caractéristiques techniques du CET (fiche BAR-TH-148)."
          >
            <SelectField
              label="Profil de soutirage"
              required
              options={{ M: "Profil M", L: "Profil L", XL: "Profil XL" }}
              hint="Profil de puisage normalisé (EN 16147)."
              error={errors.cet_profil_soutirage}
              register={register("cet_profil_soutirage")}
            />
            <TextField label="COP" required type="number" step="0.01" inputMode="decimal" hint="Coefficient de performance (EN 16147). Minimum indicatif : ≥ 2,5." error={errors.cet_cop} register={register("cet_cop")} />
            <TextField label="Volume du ballon (L)" required type="number" step="1" inputMode="numeric" error={errors.cet_volume_l} register={register("cet_volume_l")} />
            <TextField label="Marque" required error={errors.cet_marque} register={register("cet_marque")} />
            <TextField label="Référence / modèle" error={errors.cet_reference} register={register("cet_reference")} />
          </Section>
        )}

        {etapeCourante.id === "travaux" && estBois && (
          <Section
            title="Appareil de chauffage au bois"
            description="Caractéristiques techniques de l'appareil (fiche BAR-TH-112)."
          >
            <SelectField
              label="Combustible"
              required
              options={{ granules: "Granulés (pellets)", buches: "Bûches" }}
              hint="Conditionne le rendement minimal (granulés ≈ 80 %, bûches ≈ 75 %)."
              error={errors.bois_combustible}
              register={register("bois_combustible")}
            />
            <TextField label="Rendement énergétique (%)" required type="number" step="0.1" inputMode="decimal" hint="Rendement de l'appareil (label Flamme Verte)." error={errors.bois_rendement} register={register("bois_rendement")} />
            <TextField label="Émissions de CO (mg/Nm³)" type="number" step="1" inputMode="numeric" hint="À 13 % d'O₂. Facultatif mais recommandé sur le devis." error={errors.bois_emissions_co} register={register("bois_emissions_co")} />
            <TextField label="Marque" required error={errors.bois_marque} register={register("bois_marque")} />
            <TextField label="Référence / modèle" error={errors.bois_reference} register={register("bois_reference")} />
          </Section>
        )}

        {etapeCourante.id === "travaux" && !estPac && !estCet && !estBois && (
          <Section
            title="Travaux d'isolation"
            description="Caractéristiques techniques du poste isolé."
          >
            <SelectField label="Type d'isolation" required options={isolationOptions} error={errors.type_isolation} register={register("type_isolation")} />
            <TextField label="Surface isolée (m²)" required type="number" step="0.01" inputMode="decimal" error={errors.surface_isolee_m2} register={register("surface_isolee_m2")} />
            <TextField label="Type d'isolant" required placeholder="Ex. laine de verre soufflée" error={errors.isolant_type} register={register("isolant_type")} />
            <TextField
              label="Résistance thermique R (m²·K/W)"
              required
              type="number"
              step="0.01"
              inputMode="decimal"
              hint={rMin ? `R minimal indicatif pour ce poste : ≥ ${rMin}` : undefined}
              error={errors.resistance_thermique_r}
              register={register("resistance_thermique_r")}
            />
            <TextField label="Marque de l'isolant" error={errors.isolant_marque} register={register("isolant_marque")} />
            <TextField label="Référence produit" error={errors.isolant_reference} register={register("isolant_reference")} />
            <TextField label="Épaisseur (mm)" type="number" inputMode="numeric" error={errors.epaisseur_mm} register={register("epaisseur_mm")} />
          </Section>
        )}

        {etapeCourante.id === "dates" && (
          <>
            <Section
              title="Chronologie"
              description="L'ordre des dates conditionne l'éligibilité, cœur du contrôle anti-refus."
            >
              <TextField label="Date de visite technique" type="date" error={errors.date_visite_technique} register={register("date_visite_technique")} />
              <TextField label="Date du devis signé" required type="date" hint="Doit précéder le début des travaux." error={errors.date_devis} register={register("date_devis")} />
              <TextField label="Date de début des travaux" type="date" error={errors.date_debut_travaux} register={register("date_debut_travaux")} />
              <TextField label="Date de fin des travaux" type="date" error={errors.date_fin_travaux} register={register("date_fin_travaux")} />
              <TextField label="Date de la facture" type="date" error={errors.date_facture} register={register("date_facture")} />
            </Section>

            <div className="mt-6">
              <Section title="Montants">
                <TextField label="Montant HT (€)" required type="number" step="0.01" inputMode="decimal" error={errors.montant_ht} register={register("montant_ht")} />
                <TextField label="Montant TTC (€)" required type="number" step="0.01" inputMode="decimal" error={errors.montant_ttc} register={register("montant_ttc")} />
                <TextField label="Prime CEE estimée (€)" type="number" step="0.01" inputMode="decimal" error={errors.montant_prime_estime} register={register("montant_prime_estime")} />
                <TextField label="Aides publiques hors CEE (€), ex. MaPrimeRénov'" type="number" step="0.01" inputMode="decimal" error={errors.montant_aides_publiques} register={register("montant_aides_publiques")} />
              </Section>
            </div>
          </>
        )}
      </div>

      {serverError && (
        <div className="mt-6 rounded border-l-4 border-erreur bg-erreur-bg px-4 py-3 text-sm text-erreur">
          {serverError}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setEtape((e) => Math.max(0, e - 1))}
          disabled={etape === 0 || enCours}
          className="inline-flex h-11 items-center rounded border border-filigrane bg-blanc-casse px-4 text-sm font-medium text-encre transition-colors hover:bg-papier disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Précédent
        </button>

        {dernier ? (
          <button
            type="submit"
            disabled={enCours}
            className="inline-flex h-11 items-center gap-2 rounded bg-terre-cuite px-6 text-sm font-medium text-blanc-casse transition-colors hover:bg-terre-cuite-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enCours && <Spinner />}
            {enCours ? "Création en cours…" : "Créer le dossier"}
          </button>
        ) : (
          <button
            type="button"
            onClick={suivant}
            className="inline-flex h-11 items-center rounded bg-terre-cuite px-6 text-sm font-medium text-blanc-casse transition-colors hover:bg-terre-cuite-hover"
          >
            Suivant →
          </button>
        )}
      </div>
    </form>
    </AssistedFieldsProvider>
  );
}
